-- Pruebas de aislamiento entre empresas y de las restricciones de escritura.
-- Ejecutar con:  npx supabase test db   (usa los datos de supabase/seed.sql)
BEGIN;
SELECT plan(24);

-- Helper: actuar como un usuario autenticado concreto
CREATE OR REPLACE FUNCTION pg_temp.act_as(uid uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
END $$;

CREATE OR REPLACE FUNCTION pg_temp.act_as_anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
END $$;

-- ---------------------------------------------------------------- superadmin A
SELECT pg_temp.act_as('aaaaaaaa-0000-0000-0000-0000000000a1');

SELECT is((SELECT count(*) FROM public.payers)::int, 2, 'SA-A ve solo los 2 pagadores de su empresa');
SELECT is((SELECT count(*) FROM public.payers WHERE company_id = 'bbbbbbbb-0000-0000-0000-000000000001')::int, 0, 'SA-A no ve pagadores de B');
SELECT is((SELECT count(*) FROM public.invoices)::int, 1, 'SA-A ve solo la factura de su empresa');
SELECT is((SELECT count(*) FROM public.payer_documents)::int, 1, 'SA-A ve el RUT pero no la historia de crédito');
SELECT is((SELECT count(*) FROM public.profiles)::int, 3, 'SA-A ve los 3 perfiles de su empresa');
SELECT is((SELECT count(*) FROM public.companies)::int, 1, 'SA-A ve solo su empresa');

SELECT throws_ok(
  $$ UPDATE public.profiles SET role = 'admin' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  '42501', NULL, 'SA-A no puede cambiar su rol');
SELECT throws_ok(
  $$ UPDATE public.profiles SET subscription_status = 'active' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  '42501', NULL, 'SA-A no puede autoactivar la suscripción');
SELECT throws_ok(
  $$ UPDATE public.profiles SET company_id = 'bbbbbbbb-0000-0000-0000-000000000001' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  '42501', NULL, 'SA-A no puede cambiarse de empresa');
SELECT lives_ok(
  $$ UPDATE public.profiles SET full_name = 'Nombre SA A' WHERE id = 'aaaaaaaa-0000-0000-0000-0000000000a1' $$,
  'SA-A sí puede cambiar su nombre');
SELECT throws_ok(
  $$ INSERT INTO public.payers (razon_social, nit, created_by, company_id, risk_status, approved_quota)
     VALUES ('X', '1', 'aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'aprobado', 999999999) $$,
  '42501', NULL, 'SA-A no puede insertar pagadores directamente (solo vía servidor)');
SELECT throws_ok(
  $$ UPDATE public.payers SET approved_quota = 999999999 WHERE id = 'aaaaaaaa-1111-0000-0000-000000000001' $$,
  '42501', NULL, 'SA-A no puede aumentar el cupo de un pagador');
SELECT throws_ok(
  $$ UPDATE public.invoices SET is_guaranteed = true $$,
  '42501', NULL, 'SA-A no puede marcar facturas como garantizadas');
SELECT throws_ok(
  $$ SELECT * FROM public.payer_otps $$,
  '42501', NULL, 'SA-A no puede leer los OTP de firma de sus pagadores');
SELECT throws_ok(
  $$ SELECT * FROM public.signup_otps $$,
  '42501', NULL, 'SA-A no puede leer los OTP de registro');
SELECT throws_ok(
  $$ INSERT INTO public.profiles (id, email, role) VALUES (gen_random_uuid(), 'x@x.co', 'admin') $$,
  '42501', NULL, 'Nadie crea perfiles directamente');

-- ---------------------------------------------------------------- cartera A
SELECT pg_temp.act_as('aaaaaaaa-0000-0000-0000-0000000000a3');
SELECT is((SELECT count(*) FROM public.payers)::int, 2, 'Cartera-A ve los pagadores de toda la empresa (incluido el que creó Comercial)');

-- ---------------------------------------------------------------- superadmin B
SELECT pg_temp.act_as('bbbbbbbb-0000-0000-0000-0000000000b1');
SELECT is((SELECT count(*) FROM public.payers)::int, 1, 'SA-B ve solo su pagador');
SELECT is((SELECT count(*) FROM public.invoices WHERE company_id = 'aaaaaaaa-0000-0000-0000-000000000001')::int, 0, 'SA-B no ve facturas de A');

-- ---------------------------------------------------------------- client freemium (sin empresa)
SELECT pg_temp.act_as('cccccccc-0000-0000-0000-0000000000c1');
SELECT is((SELECT count(*) FROM public.payers)::int, 0, 'Client sin empresa no ve pagadores');
SELECT is((SELECT count(*) FROM public.profiles)::int, 1, 'Client sin empresa solo ve su propio perfil');

-- ---------------------------------------------------------------- admin plataforma
SELECT pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
SELECT is((SELECT count(*) FROM public.payer_documents)::int, 3, 'Admin de plataforma ve todos los documentos, incluida la historia de crédito');

-- ---------------------------------------------------------------- anon
SELECT pg_temp.act_as_anon();
SELECT throws_ok($$ SELECT * FROM public.payers $$, '42501', NULL, 'anon no puede leer pagadores');
SELECT throws_ok($$ SELECT * FROM public.profiles $$, '42501', NULL, 'anon no puede leer perfiles');

SELECT * FROM finish();
ROLLBACK;
