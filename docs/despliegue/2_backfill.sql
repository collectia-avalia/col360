-- PASO 6 · Backfill (después de migrar y desplegar).
-- Copia rol y empresa de profiles a app_metadata (no editable por el usuario) y
-- elimina de user_metadata los campos que antes se usaban para decidir permisos.
update auth.users u
set raw_app_meta_data  = coalesce(u.raw_app_meta_data, '{}'::jsonb)
                         || jsonb_strip_nulls(jsonb_build_object('role', p.role, 'company_id', p.company_id)),
    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                         - 'role' - 'company_id' - 'total_bag' - 'max_exposure'
from public.profiles p
where p.id = u.id;

-- Comprobación: debe devolver 0
select count(*) as usuarios_con_rol_en_user_metadata
from auth.users where raw_user_meta_data ? 'role';
