-- Add rejection_reason to payers table
ALTER TABLE public.payers 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
