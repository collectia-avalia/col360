-- ============================================================================
-- Seed de desarrollo LOCAL (supabase start / supabase db reset). Nunca en producción.
-- Dos empresas (A y B) y un usuario por rol, para probar aislamiento entre tenants.
-- Contraseña de todos los usuarios locales: Avalia-local-123
-- ============================================================================

-- Empresas
INSERT INTO public.companies (id, name, nit) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Empresa A SAS', '900000001-1'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Empresa B SAS', '900000002-2');

-- Usuarios Auth. El trigger handle_new_user crea el perfil con rol y compañía
-- tomados de raw_app_meta_data.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('Avalia-local-123', gen_salt('bf')), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
    || jsonb_strip_nulls(jsonb_build_object('role', u.app_role, 'company_id', u.company_id)),
  jsonb_build_object('company_name', u.company_name),
  now(), now(), '', '', '', ''
FROM (VALUES
  ('00000000-0000-0000-0000-0000000000ad'::uuid, 'admin@avalia.local',      'admin',      NULL,                                   'Avalia'),
  ('aaaaaaaa-0000-0000-0000-0000000000a1'::uuid, 'superadmin-a@avalia.local', 'superadmin', 'aaaaaaaa-0000-0000-0000-000000000001', 'Empresa A SAS'),
  ('aaaaaaaa-0000-0000-0000-0000000000a2'::uuid, 'comercial-a@avalia.local',  'comercial',  'aaaaaaaa-0000-0000-0000-000000000001', 'Empresa A SAS'),
  ('aaaaaaaa-0000-0000-0000-0000000000a3'::uuid, 'cartera-a@avalia.local',    'cartera',    'aaaaaaaa-0000-0000-0000-000000000001', 'Empresa A SAS'),
  ('bbbbbbbb-0000-0000-0000-0000000000b1'::uuid, 'superadmin-b@avalia.local', 'superadmin', 'bbbbbbbb-0000-0000-0000-000000000001', 'Empresa B SAS'),
  ('cccccccc-0000-0000-0000-0000000000c1'::uuid, 'client@avalia.local',       NULL,         NULL,                                   'Freemium SAS')
) AS u(id, email, app_role, company_id, company_name);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
SELECT gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
FROM auth.users WHERE email LIKE '%@avalia.local';

-- Bolsa de cupo de los superadmin
UPDATE public.profiles SET total_bag = 1000000000 WHERE role = 'superadmin';

-- Pagadores
INSERT INTO public.payers (id, razon_social, nit, contact_email, contact_name, risk_status, approved_quota,
                           created_by, company_id, invitation_token, invitation_status, terms_accepted)
VALUES
  ('aaaaaaaa-1111-0000-0000-000000000001', 'Pagador A1 SAS', '800000001-1', 'pagador-a1@avalia.local', 'Contacto A1',
   'aprobado', 100000000, 'aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001',
   'token-local-pagador-a1-000000000000', 'sent', true),
  ('aaaaaaaa-1111-0000-0000-000000000002', 'Pagador A2 SAS', '800000002-2', 'pagador-a2@avalia.local', 'Contacto A2',
   'pendiente', 0, 'aaaaaaaa-0000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001',
   'token-local-pagador-a2-000000000000', 'sent', true),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'Pagador B1 SAS', '800000003-3', 'pagador-b1@avalia.local', 'Contacto B1',
   'aprobado', 50000000, 'bbbbbbbb-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001',
   'token-local-pagador-b1-000000000000', 'sent', true);

-- Facturas
INSERT INTO public.invoices (invoice_number, payer_id, client_id, company_id, amount, issue_date, due_date, status, is_guaranteed)
VALUES
  ('FA-001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001',
   5000000, current_date - 10, current_date + 20, 'vigente', true),
  ('FB-001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000001',
   3000000, current_date - 40, current_date - 10, 'vencida', false);

-- Documentos (la historia de crédito solo debe verla el admin)
INSERT INTO public.payer_documents (payer_id, doc_type, file_path) VALUES
  ('aaaaaaaa-1111-0000-0000-000000000001', 'rut',              'aaaaaaaa-1111-0000-0000-000000000001/rut_1.pdf'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'historia_credito', 'aaaaaaaa-1111-0000-0000-000000000001/historia_credito_1.pdf'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'rut',              'bbbbbbbb-1111-0000-0000-000000000001/rut_1.pdf');
