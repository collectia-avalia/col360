-- 20240317000001_fix_cascading_deletes.sql

-- 1. Payers: created_by (referencia a profiles.id)
ALTER TABLE public.payers 
DROP CONSTRAINT IF EXISTS payers_created_by_fkey,
ADD CONSTRAINT payers_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 2. Invoices: client_id (referencia a profiles.id)
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_client_id_fkey,
ADD CONSTRAINT invoices_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 3. Invoices: payer_id (referencia a payers.id)
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_payer_id_fkey,
ADD CONSTRAINT invoices_payer_id_fkey 
  FOREIGN KEY (payer_id) 
  REFERENCES public.payers(id) 
  ON DELETE CASCADE;
