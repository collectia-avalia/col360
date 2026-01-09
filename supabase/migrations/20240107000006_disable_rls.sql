-- SQL PARA DESBLOQUEAR EL ADMIN (Ejecutar en Supabase SQL Editor)

-- 1. Deshabilitar RLS temporalmente para confirmar que es el problema
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payers DISABLE ROW LEVEL SECURITY;

-- 2. Asegurar permisos al rol de servicio
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
