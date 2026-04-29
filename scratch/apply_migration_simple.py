import psycopg2
import sys

conn_str = "postgresql://postgres:Quan_jk_2026*@llejboqtnqlrnphcqtvm.supabase.co:5432/postgres"

sql = """
alter table public.profiles add column if not exists max_exposure numeric default 100;
comment on column public.profiles.max_exposure is 'Porcentaje máximo de la bolsa que se puede asignar a un solo pagador';
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, company_name, role, nit, total_bag, max_exposure)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'company_name', 
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    new.raw_user_meta_data->>'nit',
    coalesce((new.raw_user_meta_data->>'total_bag')::numeric, 0),
    coalesce((new.raw_user_meta_data->>'max_exposure')::numeric, 100)
  );
  return new;
end;
$$ language plpgsql security definer;
"""

try:
    print(f"Trying: {conn_str}")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    print("Success!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
