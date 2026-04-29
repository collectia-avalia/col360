-- Update doc_type constraint to include balance and pyg
DO $$ 
BEGIN 
  ALTER TABLE payer_documents DROP CONSTRAINT IF EXISTS payer_documents_doc_type_check;
  ALTER TABLE payer_documents ADD CONSTRAINT payer_documents_doc_type_check 
  CHECK (doc_type IN ('rut', 'camara_comercio', 'estados_financieros', 'central_auth', 'cedula_rep_legal', 'renta', 'balance', 'pyg'));
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'Error adjusting constraint: %', SQLERRM;
END $$;
