-- 1. Agregar campos de información del negocio a la tabla de pagadores
ALTER TABLE public.payers 
ADD COLUMN IF NOT EXISTS business_activity text,
ADD COLUMN IF NOT EXISTS product_service text,
ADD COLUMN IF NOT EXISTS monthly_purchase_value text,
ADD COLUMN IF NOT EXISTS payment_term text;

-- 2. Agregar columna updated_at a payer_documents
ALTER TABLE public.payer_documents 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 3. Asegurar que existe una restricción única para permitir UPSERT en documentos
-- Primero limpiamos posibles duplicados accidentales para que la restricción no falle
DELETE FROM public.payer_documents a 
USING public.payer_documents b 
WHERE a.id < b.id 
AND a.payer_id = b.payer_id 
AND a.doc_type = b.doc_type;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payer_documents_payer_id_doc_type_key'
    ) THEN
        ALTER TABLE public.payer_documents 
        ADD CONSTRAINT payer_documents_payer_id_doc_type_key UNIQUE (payer_id, doc_type);
    END IF;
END $$;

-- 3. Re-asegurar los tipos de documentos permitidos
ALTER TABLE public.payer_documents 
DROP CONSTRAINT IF EXISTS payer_documents_doc_type_check;

ALTER TABLE public.payer_documents 
ADD CONSTRAINT payer_documents_doc_type_check 
CHECK (doc_type IN (
    'rut', 
    'camara_comercio', 
    'estados_financieros', 
    'central_auth', 
    'cedula_rep_legal', 
    'renta'
));
