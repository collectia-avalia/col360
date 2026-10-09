-- Aplicar DESPUÉS de desplegar el código que usa public.payer_otps.
-- Los OTP de firma ya no viven en public.payers (que el acreedor puede leer).
ALTER TABLE public.payers DROP COLUMN IF EXISTS otp_code;
ALTER TABLE public.payers DROP COLUMN IF EXISTS otp_expires_at;
