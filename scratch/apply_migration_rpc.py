import requests
import json

url = "https://llejboqtnqlrnphcqtvm.supabase.co/rest/v1/rpc/exec_sql"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZWpib3F0bnFscm5waGNxdHZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc5MzY4NywiZXhwIjoyMDgzMzY5Njg3fQ.P3uVENPDgxYYIkT6-N1VSb5aVc-c02YXKL51wYDwOHQ"

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

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

payload = {"sql": sql}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
