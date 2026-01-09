-- Habilitar acceso de lectura total para Superadmins basado en Metadata del JWT

-- 1. Tabla PROFILES
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);

-- 2. Tabla PAYERS
DROP POLICY IF EXISTS "Superadmins can view all payers" ON public.payers;
CREATE POLICY "Superadmins can view all payers"
ON public.payers
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);

-- 3. Tabla INVOICES
DROP POLICY IF EXISTS "Superadmins can view all invoices" ON public.invoices;
CREATE POLICY "Superadmins can view all invoices"
ON public.invoices
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);

-- 4. Tabla PAYER_DOCUMENTS
DROP POLICY IF EXISTS "Superadmins can view all payer documents" ON public.payer_documents;
CREATE POLICY "Superadmins can view all payer documents"
ON public.payer_documents
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'
);
