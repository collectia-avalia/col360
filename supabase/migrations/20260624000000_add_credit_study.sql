-- Migración: Añadir soporte para estudios de crédito y confidencialidad de historia de crédito
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS credit_study_result jsonb;
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS score_sarc integer;

-- Ajustar restricción de tipo de documento para incluir historia_credito
DO $$ 
BEGIN 
  ALTER TABLE public.payer_documents DROP CONSTRAINT IF EXISTS payer_documents_doc_type_check;
  ALTER TABLE public.payer_documents ADD CONSTRAINT payer_documents_doc_type_check 
  CHECK (doc_type IN ('rut', 'camara_comercio', 'estados_financieros', 'central_auth', 'cedula_rep_legal', 'renta', 'historia_credito'));
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'Error adjusting constraint: %', SQLERRM;
END $$;
