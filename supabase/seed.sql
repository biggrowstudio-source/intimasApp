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
