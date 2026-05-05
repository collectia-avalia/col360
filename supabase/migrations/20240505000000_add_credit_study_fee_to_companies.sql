-- Add credit_study_fee to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS credit_study_fee NUMERIC DEFAULT 0;

-- Add credit_study_fee to profiles table (for superadmin sync)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_study_fee NUMERIC DEFAULT 0;
