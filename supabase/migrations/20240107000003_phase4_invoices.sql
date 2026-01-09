-- 1. Asegurar permisos RLS en tabla INVOICES
GRANT ALL ON TABLE public.invoices TO authenticated;

DROP POLICY IF EXISTS "Clients can insert their own invoices" ON public.invoices;
CREATE POLICY "Clients can insert their own invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
);

DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;
CREATE POLICY "Clients can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  auth.uid() = client_id
);

-- 2. STORAGE POLICIES (invoices-docs)
-- Asumimos que el bucket 'invoices-docs' ya existe.
-- Estructura sugerida: invoices-docs/{client_id}/{filename}

create policy "Clients can upload invoices"
on storage.objects for insert
with check (
  bucket_id = 'invoices-docs' AND
  auth.role() = 'authenticated'
);

create policy "Clients can view invoices"
on storage.objects for select
using (
  bucket_id = 'invoices-docs' AND
  auth.role() = 'authenticated'
);
