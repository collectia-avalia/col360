-- Add due diligence fields to payers table
ALTER TABLE payers 
ADD COLUMN IF NOT EXISTS legal_representative_id TEXT, -- ID document number
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS signed_ip TEXT,
ADD COLUMN IF NOT EXISTS due_diligence_progress INTEGER DEFAULT 0;

-- Ensure the doc_type enum or check constraint supports all 6 types
-- Autorización consulta centrales: 'central_auth'
-- RUT: 'rut'
-- Cámara de comercio: 'camara_comercio'
-- Cédula del representante legal: 'cedula_rep_legal'
-- Estados financieros: 'estados_financieros'
-- Declaración de renta: 'renta'

-- We already have a payer_documents table, let's make sure it handles these types
-- If it has a check constraint for doc_type, we might need to update it or rely on application logic
