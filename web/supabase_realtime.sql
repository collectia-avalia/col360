-- 1. Habilitar el tracking de cambios para la tabla profiles
alter table public.profiles replica identity full;

-- 2. Agregar la tabla a la publicación de Supabase Realtime
-- Nota: 'supabase_realtime' es la publicación por defecto que Supabase escucha.
alter publication supabase_realtime add table public.profiles;

-- 3. (Opcional) Verificar que se agregó correctamente
select * from pg_publication_tables where pubname = 'supabase_realtime';
