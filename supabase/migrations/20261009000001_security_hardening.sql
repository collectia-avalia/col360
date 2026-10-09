-- ============================================================================
-- Endurecimiento de seguridad (revisión 2026-10-09)
-- ============================================================================
-- Modelo resultante:
--   * La app escribe SIEMPRE desde el servidor con service_role, después de validar
--     rol y compañía en código (web/src/lib/auth/guards.ts).
--   * El rol `authenticated` (JWT de usuario, usado por páginas y Realtime) solo LEE,
--     y solo filas de su propia compañía. Única escritura permitida: profiles.full_name.
--   * `anon` no tiene acceso a ninguna tabla de negocio.
--   * El rol se lee de public.profiles; nunca de user_metadata (editable por el usuario).
--
-- Escrita de forma defensiva (IF EXISTS / bloques DO) porque producción se ha desviado
-- de las migraciones versionadas. Requiere 20261009000000_add_admin_role.sql antes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Funciones auxiliares para políticas (esquema no expuesto por PostgREST)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.auth_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(private.auth_role() = 'admin', false)
$$;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Tabla de OTP de pagadores (sale de public.payers para que el acreedor,
--    que puede leer sus pagadores, no vea el código de firma del deudor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payer_otps (
  payer_id    uuid PRIMARY KEY REFERENCES public.payers(id) ON DELETE CASCADE,
  otp_hash    text NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  sent_count  integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Los OTP vigentes en texto plano dejan de valer: se piden de nuevo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'payers' AND column_name = 'otp_code') THEN
    EXECUTE 'UPDATE public.payers SET otp_code = NULL, otp_expires_at = NULL WHERE otp_code IS NOT NULL';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. signup_otps: existe en producción (creada a mano), no en migraciones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signup_otps (
  email       text PRIMARY KEY,
  otp_code    text NOT NULL,
  signup_data jsonb NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.signup_otps ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.signup_otps ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.signup_otps ADD COLUMN IF NOT EXISTS window_started_at timestamptz NOT NULL DEFAULT now();

-- Ya no se guardan contraseñas ni OTP en claro: se invalidan los registros pendientes.
DELETE FROM public.signup_otps;

-- Idempotencia del webhook de Wompi para suscripciones
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_payment_reference text;

-- ----------------------------------------------------------------------------
-- 4. Borrar TODAS las políticas existentes de las tablas de negocio y de los
--    buckets. Las permisivas se combinan con OR, así que una sola que sobreviva
--    (Emergency, user_metadata, invitation token, created_by…) reabre el hueco.
-- ----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'payers', 'invoices', 'payer_documents',
                        'companies', 'signup_otps', 'payer_otps')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (coalesce(qual, '') || coalesce(with_check, '')) ~ '(invoices-docs|legal-docs)'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Privilegios: authenticated solo lee; anon nada.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.profiles, public.payers, public.invoices, public.payer_documents,
              public.companies, public.signup_otps, public.payer_otps
  FROM anon, authenticated;

GRANT SELECT ON public.profiles, public.payers, public.invoices, public.payer_documents,
                public.companies
  TO authenticated;

-- Única escritura directa de usuario: su nombre (lib/actions/user.ts)
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles, public.payers, public.invoices, public.payer_documents,
             public.companies, public.signup_otps, public.payer_otps
  TO service_role;

-- Tablas futuras en public no quedan abiertas a anon por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- ----------------------------------------------------------------------------
-- 6. RLS activado en todas las tablas de negocio
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_otps     ENABLE ROW LEVEL SECURITY;  -- sin políticas: solo service_role
ALTER TABLE public.payer_otps      ENABLE ROW LEVEL SECURITY;  -- sin políticas: solo service_role

-- ----------------------------------------------------------------------------
-- 7. Políticas de lectura (y la única de escritura)
--    `(select fn())` hace que Postgres evalúe la función una vez por consulta.
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_select_own_company_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (company_id IS NOT NULL AND company_id = (SELECT private.auth_company_id()))
    OR (SELECT private.is_platform_admin())
  );

CREATE POLICY "profiles_update_own_name" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "companies_select_own_or_admin" ON public.companies
  FOR SELECT TO authenticated
  USING (
    id = (SELECT private.auth_company_id())
    OR (SELECT private.is_platform_admin())
  );

CREATE POLICY "payers_select_company_or_admin" ON public.payers
  FOR SELECT TO authenticated
  USING (
    (company_id IS NOT NULL AND company_id = (SELECT private.auth_company_id()))
    OR (SELECT private.is_platform_admin())
  );

CREATE POLICY "invoices_select_company_or_admin" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    (company_id IS NOT NULL AND company_id = (SELECT private.auth_company_id()))
    OR (SELECT private.is_platform_admin())
  );

-- payer_documents no tiene company_id: se resuelve por el pagador.
-- La historia de crédito (consultada por Avalia en centrales) solo la ve el admin.
CREATE POLICY "payer_documents_select_company_or_admin" ON public.payer_documents
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_platform_admin())
    OR (
      doc_type <> 'historia_credito'
      AND EXISTS (
        SELECT 1 FROM public.payers p
        WHERE p.id = payer_documents.payer_id
          AND p.company_id IS NOT NULL
          AND p.company_id = (SELECT private.auth_company_id())
      )
    )
  );

-- Storage: sin políticas para authenticated en invoices-docs / legal-docs.
-- Subidas y URLs firmadas se hacen desde el servidor (service_role) tras validar
-- pertenencia en BD (ver web/src/app/api/docs/sign/route.ts).

-- ----------------------------------------------------------------------------
-- 8. handle_new_user: el rol nunca sale de user_metadata
-- ----------------------------------------------------------------------------
-- Todos los usuarios se crean con la Admin API (service_role). El rol y la compañía
-- llegan en app_metadata, que el usuario no puede escribir. Aun así la app hace un
-- upsert explícito del perfil después de createUser, porque GoTrue puede escribir
-- app_metadata después del INSERT en auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := coalesce(new.raw_app_meta_data->>'role', 'client');
BEGIN
  IF v_role = 'payer_guest' THEN
    RETURN new;
  END IF;

  IF v_role NOT IN ('admin', 'superadmin', 'comercial', 'cartera', 'client') THEN
    v_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, email, company_name, nit, role, company_id, total_bag, max_exposure)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'nit',
    v_role::public.user_role,
    nullif(new.raw_app_meta_data->>'company_id', '')::uuid,
    0,
    100
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Índices usados por las políticas y por las búsquedas por token
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_company_id_idx        ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS payers_company_id_idx          ON public.payers(company_id);
CREATE INDEX IF NOT EXISTS payers_created_by_idx          ON public.payers(created_by);
CREATE INDEX IF NOT EXISTS invoices_company_id_idx        ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS invoices_payer_id_idx          ON public.invoices(payer_id);
CREATE INDEX IF NOT EXISTS payer_documents_payer_id_idx   ON public.payer_documents(payer_id);
CREATE UNIQUE INDEX IF NOT EXISTS payers_invitation_token_key
  ON public.payers(invitation_token) WHERE invitation_token IS NOT NULL;
