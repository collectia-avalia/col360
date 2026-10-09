-- Rol de plataforma (staff interno de Avalia). Va en una migración propia porque un valor
-- nuevo de enum no se puede usar en la misma transacción en que se crea (error 55P04).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
