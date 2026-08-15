-- =====================================================================
-- INTIMAS BY LORENA APP — Seed Embajadora de Prueba
-- =====================================================================
-- Archivo: seed.sql
-- Email:    embajadora@test.dev
-- Password: 1234
-- Rol:      ambassador
-- Código:   EMB-TEST01
-- =====================================================================

alter table public.profiles disable row level security;

do $$
declare
  v_user_id uuid;
  v_email   text := 'embajadora@test.dev';
  v_existing uuid;
begin
  -- 1) Verificar si la usuaria ya existe
  select id into v_existing from auth.users where email = v_email;

  if v_existing is not null then
    -- Ya existe → actualizar perfil con rol ambassador y ambassador_code
    insert into public.profiles (user_id, first_name, last_name, role, points, ambassador_code)
    values (v_existing, 'Lorena', 'Embajadora', 'ambassador', 500, 'EMB-TEST01')
    on conflict (user_id) do update
      set role            = excluded.role,
          ambassador_code = coalesce(public.profiles.ambassador_code, excluded.ambassador_code);
    raise notice 'La usuaria % ya existía. Perfil de embajadora actualizado.', v_email;
    return;
  end if;

  -- 2) Generar UUID
  v_user_id := gen_random_uuid();

  -- 3) Insertar en auth.users con password cifrado (1234)
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt('1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Lorena","last_name":"Embajadora"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 4) Insertar la identidad en auth.identities
  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub',             v_user_id::text,
      'email',           v_email,
      'email_verified',  true
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- 5) Insertar en public.profiles
  insert into public.profiles (user_id, first_name, last_name, role, points, ambassador_code)
  values (v_user_id, 'Lorena', 'Embajadora', 'ambassador', 500, 'EMB-TEST01')
  on conflict (user_id) do update
    set role            = excluded.role,
        ambassador_code = excluded.ambassador_code;

  raise notice 'Embajadora de prueba creada: % (id: %, código: EMB-TEST01)', v_email, v_user_id;
end $$;

alter table public.profiles enable row level security;


-- =====================================================================
-- SEED DE PRODUCTOS Y COLECCIONES EN LA BIBLIOTECA
-- =====================================================================

-- 1. Categoría principal Productos
insert into public.document_categories (name, slug)
values ('Productos', 'productos')
on conflict (slug) do nothing;

do $$
declare
  v_prod_cat_id uuid;
  v_bras_cat_id uuid;
  v_panties_cat_id uuid;
  v_contoure_cat_id uuid;
  v_sculptura_cat_id uuid;
  v_silueta_cat_id uuid;
  v_trueshape_cat_id uuid;
  v_curvashape_cat_id uuid;
begin
  select id into v_prod_cat_id from public.document_categories where slug = 'productos';

  -- 2. Insertar subcategorías de colecciones vinculadas a Productos
  insert into public.document_categories (name, slug, parent_id) values
    ('Bras Collection', 'bras-collection', v_prod_cat_id),
    ('Panties Collection', 'panties-collection', v_prod_cat_id),
    ('Contouré Collection', 'contoure-collection', v_prod_cat_id),
    ('Sculptura Collection', 'sculptura-collection', v_prod_cat_id),
    ('Silueta Collection', 'silueta-collection', v_prod_cat_id),
    ('True Shape Collection', 'true-shape-collection', v_prod_cat_id),
    ('Curva Shape Collection', 'curva-shape-collection', v_prod_cat_id)
  on conflict (slug) do update set parent_id = excluded.parent_id;

  select id into v_bras_cat_id from public.document_categories where slug = 'bras-collection';
  select id into v_panties_cat_id from public.document_categories where slug = 'panties-collection';
  select id into v_contoure_cat_id from public.document_categories where slug = 'contoure-collection';
  select id into v_sculptura_cat_id from public.document_categories where slug = 'sculptura-collection';
  select id into v_silueta_cat_id from public.document_categories where slug = 'silueta-collection';
  select id into v_trueshape_cat_id from public.document_categories where slug = 'true-shape-collection';
  select id into v_curvashape_cat_id from public.document_categories where slug = 'curva-shape-collection';

  -- 3. Crear tabla temporal de productos a poblar
  create temp table tmp_products (
    title text,
    sku text,
    price numeric(10,2),
    color text,
    size text,
    collection text,
    category_id uuid,
    is_featured boolean
  ) on commit drop;

  insert into tmp_products (title, sku, price, color, size, collection, category_id, is_featured) values
    -- BRAS COLLECTION
    ('Dolce Siluetta Bra', 'IL10002DSB', 78.00, 'BLACK, WHITE, ALMOND', '32B, 32C, 32D, 34B, 34C, 34D, 36B, 36C, 38B', 'Bras Collection', v_bras_cat_id, true),
    ('Contouré Harmonie Bra', 'IL10041CHB', 82.00, 'BLACK, CHANTILLY', '34B, 34C, 34D, 36B, 36C, 36D, 38B, 38C, 40B', 'Bras Collection', v_bras_cat_id, true),
    ('Noche Romanza Bra', 'IL486NRB', 76.00, 'ROMANCE', '34B, 34C, 34D, 36B, 36C, 36D, 38B, 38C, 40B', 'Bras Collection', v_bras_cat_id, false),
    ('Contouré Forme Bra', 'IL653CFB', 86.00, 'BLUE SEA, BLACK, WHITE, CHANTILLY, ALMOND, RED CANDY', '34B, 34C, 34D, 36B, 36C, 36D, 38B, 38C, 38D, 40B, 40C', 'Bras Collection', v_bras_cat_id, true),

    -- PANTIES COLLECTION
    ('Panty Contouré Forme Cachetero', 'IL10175CFC', 38.00, 'RED CANDY, BLACK, WHITE', 'M, L, XL', 'Panties Collection', v_panties_cat_id, false),
    ('Noche Romanza Panty', 'IL10182NRP', 36.00, 'ROMANCE', 'M, L, XL', 'Panties Collection', v_panties_cat_id, false),
    ('Dolce Siluetta Panty', 'IL896DSP', 34.00, 'BLACK, CHANTILLY', 'M, L, XL', 'Panties Collection', v_panties_cat_id, false),
    ('Contouré Lift Panty', 'IL601CLP', 38.00, 'BLACK, WHITE, CHANTILLY, ALMOND, BLUE SEA', 'M, L, XL', 'Panties Collection', v_panties_cat_id, false),
    ('Contouré Coqueta Cachetero', 'IL826CCC', 36.00, 'BLUE SEA', 'S, M, L, XL', 'Panties Collection', v_panties_cat_id, false),

    -- CONTOÚRE COLLECTION
    ('Contouré Bodysuit', 'IL399', 154.00, 'BLACK, PINK', 'XS, S, M, L, XL', 'Contouré Collection', v_contoure_cat_id, true),
    ('Contouré Open Back Bodysuit', 'IL398', 132.00, 'BLACK, PINK', 'XS, S, M, L, XL', 'Contouré Collection', v_contoure_cat_id, false),
    ('Contouré Capri Shapewear', 'IL048', 154.00, 'BLACK, PINK', 'XS, S, M, L, XL', 'Contouré Collection', v_contoure_cat_id, false),
    ('Contouré Butt-Lifting Capri Short', 'IL049', 108.00, 'BLACK, PINK', 'XS, S, M, L, XL', 'Contouré Collection', v_contoure_cat_id, false),
    ('Contouré Butt-Lifting Bodysuit', 'IL050', 134.00, 'BLACK, PINK', 'S, M, L, XL', 'Contouré Collection', v_contoure_cat_id, false),
    ('Contouré II Waist Cincher', 'IL304CIIWC', 94.00, 'BLACK, BEIGE', 'XS, S, M, L, XL, 2XL', 'Contouré Collection', v_contoure_cat_id, false),

    -- SCULPTURA COLLECTION
    ('Sculptura Neo Cinturilla', 'IL502', 48.00, 'BLACK', 'XS, S, M, L, XL', 'Sculptura Collection', v_sculptura_cat_id, false),
    ('Sculptura Neo Vest', 'IL507', 54.00, 'BLACK', 'XS, S, M, L, XL', 'Sculptura Collection', v_sculptura_cat_id, false),
    ('Sculptura Neo Vest Manga', 'IL527', 58.00, 'BLACK', 'XS, S, M, L, XL', 'Sculptura Collection', v_sculptura_cat_id, false),
    ('Sculptura Leggings Faja', 'IL519', 82.00, 'BLACK', 'S, M, L, XL, 2XL, 3XL', 'Sculptura Collection', v_sculptura_cat_id, false),
    ('Sculptura Neo Leggings', 'IL503-2', 88.00, 'BLACK', 'S, M, L, XL, 2XL, 3XL', 'Sculptura Collection', v_sculptura_cat_id, false),

    -- SILUETA COLLECTION
    ('Silueta Bra', 'IL818', 68.00, 'PINK', 'XS, S, M, L, XL', 'Silueta Collection', v_silueta_cat_id, false),
    ('Silueta Short', 'IL053', 94.00, 'PINK', 'XS, S, M, L', 'Silueta Collection', v_silueta_cat_id, false),
    ('Silueta Front Close Short', 'IL808', 98.00, 'PINK', 'XS, S, M, L, XL', 'Silueta Collection', v_silueta_cat_id, false),
    ('Silueta Bodysuit', 'IL813', 120.00, 'PINK', 'XS, S, M, L, XL', 'Silueta Collection', v_silueta_cat_id, false),

    -- TRUE SHAPE COLLECTION
    ('True Shape Sculpt Short', 'IL026-1TSSS', 75.00, 'BLACK, MOKA', 'XS, S, M, L, XL', 'True Shape Collection', v_trueshape_cat_id, false),
    ('True Shape Sculpt Panty - Short', 'IL16009-1TSSP', 72.00, 'BLACK, MOKA', 'S, M, L, XL, 2XL, 3XL', 'True Shape Collection', v_trueshape_cat_id, false),
    ('True Shape Sculpt Faja', 'IL024-1TSSF', 144.00, 'BLACK, MOKA', 'XS, S, M, L, XL', 'True Shape Collection', v_trueshape_cat_id, false),
    ('True Shape Sculpt Panty Faja', 'IL12023TSSPF', 120.00, 'BLACK, MOKA', 'S, M, L, XL, 2XL, 3XL', 'True Shape Collection', v_trueshape_cat_id, false),
    ('True Shape Sculpt Bra', 'IL011TSSB', 62.00, 'BLACK, MOKA', 'XS, S, M, L, XL', 'True Shape Collection', v_trueshape_cat_id, false),

    -- CURVA SHAPE COLLECTION
    ('Curva Seamless Lift Capri', 'IL10102CSL', 72.00, 'BLACK, BEIGE', 'S, M, L, XL', 'Curva Shape Collection', v_curvashape_cat_id, false);

  -- Insertar productos nuevos
  insert into public.documents (title, sku, price, color, size, collection, category_id, is_featured)
  select title, sku, price, color, size, collection, category_id, is_featured
  from tmp_products
  where not exists (
    select 1 from public.documents d where d.sku = tmp_products.sku or d.title = tmp_products.title
  );

  -- Actualizar datos si ya existían previamente
  update public.documents d
  set
    price = tp.price,
    color = tp.color,
    size = tp.size,
    collection = tp.collection,
    category_id = tp.category_id
  from tmp_products tp
  where d.sku = tp.sku or d.title = tp.title;

end $$;
