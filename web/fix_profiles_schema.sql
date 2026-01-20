-- Agregar columna full_name a la tabla profiles
alter table public.profiles add column if not exists full_name text;

-- Asegurar que la replicación incluya esta nueva columna (aunque 'full' ya debería cubrirlo)
alter table public.profiles replica identity full;
