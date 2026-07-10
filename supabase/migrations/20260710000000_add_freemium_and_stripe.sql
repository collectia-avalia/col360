-- Migración: Fase 1 Freemium & Stripe Integration
-- Agrega soporte para el plan de libre acceso, cobro por estudios a demanda y suscripciones de Stripe

-- Alterar tabla profiles para soportar planes de suscripción corporativos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Alterar tabla payers para soportar pago de estudios comerciales a demanda
ALTER TABLE public.payers
ADD COLUMN IF NOT EXISTS study_payment_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Alterar tabla invoices para soportar estado de garantía comercial
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS is_guaranteed boolean DEFAULT false;

-- Comentarios de documentación de columnas
COMMENT ON COLUMN public.profiles.plan_type IS 'Tipo de plan asignado al inquilino: free, monthly, annual';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Estado de la suscripción del inquilino: active, inactive';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'Fecha y hora en la que expira la suscripción contratada';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'ID de cliente de Stripe asociado a la cuenta facturable';

COMMENT ON COLUMN public.payers.study_payment_status IS 'Estado de pago del estudio financiero del pagador: none, pending, paid';
COMMENT ON COLUMN public.payers.stripe_session_id IS 'ID de sesión de Stripe Checkout correspondiente al cobro del estudio';

COMMENT ON COLUMN public.invoices.is_guaranteed IS 'Indica si la factura radicada cuenta con garantía comercial de Avalia';
