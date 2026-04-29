import psycopg2
import sys

# Try multiple connection strings
connections = [
    "postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    "postgresql://postgres.llejboqtnqlrnphcqtvm:Quan_jk_2026*@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:Quan_jk_2026*@db.llejboqtnqlrnphcqtvm.supabase.co:5432/postgres",
]

sql = """
-- Migration to add max_exposure to profiles
alter table public.profiles add column if not exists max_exposure numeric default 100;

-- Comment for the new column
comment on column public.profiles.max_exposure is 'Porcentaje máximo de la bolsa que se puede asignar a un solo pagador';

-- Update handle_new_user to include max_exposure
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

def run_migration():
    for conn_str in connections:
        print(f"Trying connection: {conn_str.split('@')[1]}")
        try:
            conn = psycopg2.connect(conn_str)
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            print("Migration applied successfully!")
            cur.close()
            conn.close()
            return
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    run_migration()
