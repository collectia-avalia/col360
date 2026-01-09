-- Make NIT nullable for Invite flow
ALTER TABLE public.payers ALTER COLUMN nit DROP NOT NULL;

-- Add Invitation Status
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'pending_info'; -- 'pending_info', 'completed'
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS invitation_token text;

-- Add Legal Compliance fields for Payer (Authorized by Client initially or Payer later)
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS central_auth_accepted boolean DEFAULT false;

-- Add Legal fields to Invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS legal_declarations jsonb DEFAULT '{}'::jsonb;
