-- Migración: Ampliar Payers para Estudio de Crédito
alter table public.payers 
add column if not exists legal_representative text,
add column if not exists commercial_address text,
add column if not exists annual_sales numeric default 0,
add column if not exists total_assets numeric default 0,
add column if not exists total_liabilities numeric default 0,
add column if not exists net_utility numeric default 0;

-- Asegurar que el bucket legal-docs exista (Nota: Storage no se puede crear directo por SQL en todas las versiones de Supabase, pero definimos políticas)
-- Se recomienda crear el bucket 'legal-docs' manualmente en el panel de Supabase si no existe.

-- Actualizar políticas de Payers para permitir que el Payer (si tuviera auth) o el Token vea su info.
-- Por ahora la validación se hace a nivel de aplicación con el token.
