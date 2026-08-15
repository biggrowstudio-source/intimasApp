-- =====================================================================
-- INTIMAS BY LORENA APP — MASTER IDEMPOTENT DB SCHEMA (schema.sql)
-- =====================================================================
-- NOTA IMPORTANTE PARA FUTURAS SESIONES:
-- Este archivo (schema.sql) representa la estructura completa e IDEMPOTENTE
-- del esquema de la base de datos de Intimas App.
-- Las migraciones independientes solo deben usarse si son estrictamente requeridas
-- por herramientas de despliegue; de lo contrario, TODA la estructura del proyecto
-- debe mantenerse actualizada dentro de este archivo ejecutable en Supabase.
-- =====================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$ begin
  create type user_role as enum ('ambassador', 'moderator', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_visibility as enum ('public', 'ambassadors', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type planner_event_type as enum ('personal', 'workshop', 'meeting', 'reminder');
exception when duplicate_object then null; end $$;

do $$ begin
  create type planner_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workshop_status as enum ('available', 'full', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status as enum ('registered', 'attended', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('video', 'template', 'image', 'presentation', 'file');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('system', 'workshop', 'community', 'planner', 'recognition');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_target as enum ('post', 'comment', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'reviewed', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'approved', 'rejected', 'dispatched');
exception when duplicate_object then null; end $$;

-- 3. FUNCIONES IDEMPOTENTES

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns user_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  select role into v_role
  from public.profiles
  where user_id = auth.uid()
  limit 1;
  return v_role;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role user_role;
begin
  select role into v_role
  from public.profiles
  where user_id = auth.uid()
  limit 1;
  return coalesce(v_role in ('admin', 'super_admin'), false);
end;
$$;

-- 4. TABLAS

-- LEVELS
create table if not exists public.levels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  min_points integer not null default 0,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  photo_url text,
  city text,
  birthday date,
  bio text,
  role user_role not null default 'ambassador',
  points integer not null default 0,
  level_id uuid references public.levels(id) on delete set null,
  is_suspended boolean not null default false,
  ambassador_code text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists ambassador_code text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists last_seen_at timestamptz default now();
alter table public.profiles add column if not exists device_platform text default 'web';

-- =====================================================================
-- TABLA DE HISTORIAL DE CONEXIONES (user_sessions)
-- =====================================================================
create table if not exists public.user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_platform text not null default 'web',
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.user_sessions enable row level security;

drop policy if exists "user_sessions_insert" on public.user_sessions;
create policy "user_sessions_insert" on public.user_sessions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_sessions_select" on public.user_sessions;
create policy "user_sessions_select" on public.user_sessions for select to authenticated using (auth.uid() = user_id or public.is_admin());


-- Sincronizar emails existentes de auth.users a public.profiles de forma idempotente
do $$
begin
  update public.profiles p
  set email = u.email
  from auth.users u
  where p.user_id = u.id and (p.email is null or p.email = '');
exception when others then null;
end $$;

-- DOCUMENT CATEGORIES
create table if not exists public.document_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.document_categories (name, slug)
values
  ('Productos', 'productos'),
  ('Catálogos', 'catalogos'),
  ('Bienvenida', 'bienvenida'),
  ('Manuales', 'manuales'),
  ('Documentos Comerciales', 'comerciales'),
  ('Recursos descargables', 'recursos')
on conflict (slug) do update set name = excluded.name;

-- Eliminar categorías no pertenecientes a las 6 oficiales
delete from public.document_categories
where slug not in ('productos', 'catalogos', 'bienvenida', 'manuales', 'comerciales', 'recursos');

-- DOCUMENTS (PRODUCTOS Y DOCUMENTOS)
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  content text,
  category_id uuid references public.document_categories(id) on delete set null,
  file_path text,
  thumbnail text,
  is_featured boolean not null default false,
  link text,
  sku text,
  price numeric(10,2),
  color text,
  size text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents add column if not exists link text;
alter table public.documents add column if not exists sku text;
alter table public.documents add column if not exists price numeric(10,2);
alter table public.documents add column if not exists color text;
alter table public.documents add column if not exists size text;
alter table public.documents add column if not exists collection text;
alter table public.document_categories add column if not exists parent_id uuid references public.document_categories(id) on delete cascade;

-- FAVORITES
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, document_id)
);

-- POSTS
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image text,
  video text,
  mood text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  visibility post_visibility not null default 'ambassadors',
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists mood text;

-- COMMENTS
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- LIKES
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- PLANNER EVENTS
create table if not exists public.planner_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  type planner_event_type not null default 'personal',
  status planner_status not null default 'pending',
  color text,
  priority_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TASKS
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  priority task_priority not null default 'medium',
  due_date timestamptz,
  created_at timestamptz not null default now()
);

-- WORKSHOPS
create table if not exists public.workshops (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text,
  date timestamptz not null,
  location text,
  capacity integer not null default 0,
  status workshop_status not null default 'available',
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- WORKSHOP REGISTRATIONS
create table if not exists public.workshop_registrations (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status registration_status not null default 'registered',
  reason text,
  created_at timestamptz not null default now(),
  unique (workshop_id, user_id)
);

alter table public.workshop_registrations add column if not exists reason text;

-- ORDERS (ÓRDENES DE EMBAJADORAS)
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  ambassador_id uuid not null references auth.users(id) on delete cascade,
  ambassador_name text not null,
  ambassador_code text,
  client_name text not null,
  client_phone text not null,
  client_email text,
  shipping_street text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_zip text,
  shipping_country text not null default 'Colombia',
  status order_status not null default 'pending',
  rejection_reason text,
  notes text,
  total_amount numeric(10,2) not null default 0.00,
  commission_rate numeric(5,2) not null default 25.00,
  commission_amount numeric(10,2) not null default 0.00,
  commission_paid boolean not null default false,
  commission_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists notes text;

-- ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.documents(id) on delete set null,
  product_name text not null,
  product_sku text,
  color text,
  size text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0.00,
  subtotal numeric(10,2) not null default 0.00,
  created_at timestamptz not null default now()
);

-- SETTINGS
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- NOTIFICATIONS (NOTIFICACIONES DE USUARIOS)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('system', 'workshop', 'community', 'planner', 'recognition')),
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. SEED IDEMPOTENTE
insert into public.document_categories (name, slug) values
  ('Bienvenida',              'bienvenida'),
  ('Manuales',                'manuales'),
  ('Productos',               'productos'),
  ('Catálogos',               'catalogos'),
  ('Documentos Comerciales',  'comerciales'),
  ('Recursos descargables',   'recursos')
on conflict (slug) do update set name = excluded.name;

insert into public.settings (key, value) values
  ('commission_rate', '{"rate": 25}'::jsonb)
on conflict (key) do nothing;

-- 6. RLS Y POLÍTICAS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- POLÍTICAS DE ORDERS
drop policy if exists "Los usuarios ven sus propias ordenes o los admins ven todas" on public.orders;
drop policy if exists "Embajadoras crean sus propias ordenes" on public.orders;
drop policy if exists "Actualizar ordenes propias en revision o por admins" on public.orders;
drop policy if exists "Admins actualizan cualquier orden" on public.orders;
drop policy if exists "Eliminar ordenes propias en revision o por admins" on public.orders;
drop policy if exists "orders_select_policy" on public.orders;
drop policy if exists "orders_insert_policy" on public.orders;
drop policy if exists "orders_update_policy" on public.orders;
drop policy if exists "orders_delete_policy" on public.orders;

create policy "orders_select_policy" on public.orders for select to authenticated using (auth.uid() = ambassador_id or public.is_admin());
create policy "orders_insert_policy" on public.orders for insert to authenticated with check (auth.uid() = ambassador_id or public.is_admin());
create policy "orders_update_policy" on public.orders for update to authenticated using (auth.uid() = ambassador_id or public.is_admin());
create policy "orders_delete_policy" on public.orders for delete to authenticated using (auth.uid() = ambassador_id or public.is_admin());

-- POLÍTICAS DE ORDER_ITEMS
drop policy if exists "Ver items de ordenes visibles" on public.order_items;
drop policy if exists "Crear items de orden propia" on public.order_items;
drop policy if exists "Actualizar items de orden propia" on public.order_items;
drop policy if exists "Eliminar items de orden propia" on public.order_items;
drop policy if exists "order_items_select_policy" on public.order_items;
drop policy if exists "order_items_insert_policy" on public.order_items;
drop policy if exists "order_items_update_policy" on public.order_items;
drop policy if exists "order_items_delete_policy" on public.order_items;

create policy "order_items_select_policy" on public.order_items for select to authenticated using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and (o.ambassador_id = auth.uid() or public.is_admin())
  )
);
create policy "order_items_insert_policy" on public.order_items for insert to authenticated with check (true);
create policy "order_items_update_policy" on public.order_items for update to authenticated using (true);
create policy "order_items_delete_policy" on public.order_items for delete to authenticated using (true);

-- POLÍTICAS DE NOTIFICATIONS
alter table public.notifications enable row level security;
drop policy if exists "Los usuarios pueden ver sus propias notificaciones" on public.notifications;
create policy "Los usuarios pueden ver sus propias notificaciones" on public.notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Los usuarios pueden marcar como leidas sus notificaciones" on public.notifications;
create policy "Los usuarios pueden marcar como leidas sus notificaciones" on public.notifications for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Cualquier usuario puede insertar notificaciones" on public.notifications;
create policy "Cualquier usuario puede insertar notificaciones" on public.notifications for insert to authenticated with check (true);

-- Triggers de updated_at para orders
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- Habilitar tiempo real para notificaciones, perfiles, publicaciones, comentarios, órdenes, talleres y documentos
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workshops'
  ) then
    alter publication supabase_realtime add table public.workshops;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table public.documents;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'home_content'
  ) then
    alter publication supabase_realtime add table public.home_content;
  end if;
end $$;

-- =====================================================================
-- BUCKET DE ALMACENAMIENTO DE AVATARES (avatars - Máximo 3MB)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Políticas de RLS para avatars
drop policy if exists "Avatars son públicamente visibles" on storage.objects;
create policy "Avatars son públicamente visibles"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Usuarios pueden subir o actualizar su avatar" on storage.objects;
create policy "Usuarios pueden subir o actualizar su avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

drop policy if exists "Usuarios pueden modificar sus avatares" on storage.objects;
create policy "Usuarios pueden modificar sus avatares"
  on storage.objects for update
  using (bucket_id = 'avatars');

-- =====================================================================
-- BUCKET DE ALMACENAMIENTO DE DOCUMENTOS Y BIBLIOTECA (documents - Máximo 50MB)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', true, 52428800)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

-- Políticas de RLS para documents
drop policy if exists "Documentos son públicamente visibles" on storage.objects;
create policy "Documentos son públicamente visibles"
  on storage.objects for select
  using (bucket_id = 'documents');

drop policy if exists "Usuarios autenticados pueden subir documentos" on storage.objects;
create policy "Usuarios autenticados pueden subir documentos"
  on storage.objects for insert
  with check (bucket_id = 'documents');

drop policy if exists "Usuarios autenticados pueden actualizar sus documentos" on storage.objects;
create policy "Usuarios autenticados pueden actualizar sus documentos"
  on storage.objects for update
  using (bucket_id = 'documents');

drop policy if exists "Usuarios autenticados pueden eliminar sus documentos" on storage.objects;
create policy "Usuarios autenticados pueden eliminar sus documentos"
  on storage.objects for delete
  using (bucket_id = 'documents');

-- =====================================================================
-- BUCKET DE ALMACENAMIENTO DE RECURSOS GENEROSOS (resources - Máximo 50MB)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('resources', 'resources', true, 52428800)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

drop policy if exists "Recursos son públicamente visibles" on storage.objects;
create policy "Recursos son públicamente visibles"
  on storage.objects for select
  using (bucket_id = 'resources');

drop policy if exists "Usuarios autenticados pueden subir recursos" on storage.objects;
create policy "Usuarios autenticados pueden subir recursos"
  on storage.objects for insert
  with check (bucket_id = 'resources');

drop policy if exists "Usuarios autenticados pueden actualizar recursos" on storage.objects;
create policy "Usuarios autenticados pueden actualizar recursos"
  on storage.objects for update
  using (bucket_id = 'resources');

drop policy if exists "Usuarios autenticados pueden eliminar recursos" on storage.objects;
create policy "Usuarios autenticados pueden eliminar recursos"
  on storage.objects for delete
  using (bucket_id = 'resources');

-- =====================================================================
-- BUCKET DE ALMACENAMIENTO DE BANNERS Y HOME (home - Público 52MB)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('home', 'home', true, 52428800)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800;

drop policy if exists "Imágenes del home son públicamente visibles" on storage.objects;
create policy "Imágenes del home son públicamente visibles"
  on storage.objects for select
  using (bucket_id = 'home');

drop policy if exists "Usuarios autenticados pueden subir imágenes al home" on storage.objects;
create policy "Usuarios autenticados pueden subir imágenes al home"
  on storage.objects for insert
  with check (bucket_id = 'home');

drop policy if exists "Usuarios autenticados pueden actualizar imágenes del home" on storage.objects;
create policy "Usuarios autenticados pueden actualizar imágenes del home"
  on storage.objects for update
  using (bucket_id = 'home');

drop policy if exists "Usuarios autenticados pueden eliminar imágenes del home" on storage.objects;
create policy "Usuarios autenticados pueden eliminar imágenes del home"
  on storage.objects for delete
  using (bucket_id = 'home');

-- =====================================================================
-- TABLA DE CONTENIDO DEL HOME (home_content)
-- =====================================================================
create table if not exists public.home_content (
  id uuid primary key default uuid_generate_v4(),
  slot text not null,
  variant text not null default 'default',
  title text,
  subtitle text,
  description text,
  image_url text,
  cta_label text,
  cta_route text,
  bg_class text default 'bg-secondary-100',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_content enable row level security;

drop policy if exists "home_content_select_policy" on public.home_content;
create policy "home_content_select_policy" on public.home_content for select to authenticated using (true);

drop policy if exists "home_content_insert_policy" on public.home_content;
create policy "home_content_insert_policy" on public.home_content for insert to authenticated with check (true);

drop policy if exists "home_content_update_policy" on public.home_content;
create policy "home_content_update_policy" on public.home_content for update to authenticated using (true);

drop policy if exists "home_content_delete_policy" on public.home_content;
create policy "home_content_delete_policy" on public.home_content for delete to authenticated using (true);





