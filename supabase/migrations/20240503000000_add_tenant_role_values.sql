-- Valores de enum usados por las políticas de 20240504000000. Un valor nuevo de enum
-- no se puede usar en la misma transacción en que se crea (error 55P04), así que van
-- en una migración anterior. En 20240504000000 el ADD VALUE IF NOT EXISTS queda como no-op.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cartera';
