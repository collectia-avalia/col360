-- EMERGENCIA: Desbloqueo de permisos de lectura
-- Ejecutar esto en Supabase SQL Editor para solucionar el error 42501

-- 1. Tabla PROFILES
DROP POLICY IF EXISTS "Emergency read access profiles" ON public.profiles;
CREATE POLICY "Emergency read access profiles"
ON public.profiles
FOR SELECT
TO authenticated -- Solo usuarios logueados
USING (true); -- Permitir ver todo

-- 2. Tabla PAYERS
DROP POLICY IF EXISTS "Emergency read access payers" ON public.payers;
CREATE POLICY "Emergency read access payers"
ON public.payers
FOR SELECT
TO authenticated
USING (true);

-- 3. Tabla INVOICES
DROP POLICY IF EXISTS "Emergency read access invoices" ON public.invoices;
CREATE POLICY "Emergency read access invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (true);
