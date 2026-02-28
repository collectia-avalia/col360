-- Migración para añadir NIT y Valor de la Bolsa a los perfiles de empresa
alter table public.profiles add column if not exists nit text;
alter table public.profiles add column if not exists total_bag numeric default 0;

-- Comentario para documentar los nuevos campos
comment on column public.profiles.nit is 'NIT de la empresa cliente';
comment on column public.profiles.total_bag is 'Valor total de la bolsa de crédito asignada por Avalia';

-- Actualizar la función handle_new_user para capturar estos valores desde user_metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, company_name, role, nit, total_bag)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'company_name', 
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    new.raw_user_meta_data->>'nit',
    (new.raw_user_meta_data->>'total_bag')::numeric
  );
  return new;
end;
$$ language plpgsql security definer;
