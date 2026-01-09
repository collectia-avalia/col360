-- Habilitar extensión UUID si no está habilitada
create extension if not exists "uuid-ossp";

-- 1. ENUMS
create type user_role as enum ('superadmin', 'client', 'payer_guest');
create type risk_status as enum ('pendiente', 'aprobado', 'rechazado');
create type invoice_status as enum ('vigente', 'vencida', 'pagada');

-- 2. TABLA PROFILES (Vinculada a auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  company_name text,
  role user_role default 'client'::user_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, company_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'company_name', 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. TABLA PAYERS (Empresas Deudoras)
create table public.payers (
  id uuid default uuid_generate_v4() primary key,
  razon_social text not null,
  nit text not null,
  contact_email text,
  risk_status risk_status default 'pendiente'::risk_status,
  approved_quota numeric default 0,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint para evitar duplicados por Cliente (Asumiendo gestión privada por cliente)
  unique(nit, created_by)
);

-- RLS para Payers
alter table public.payers enable row level security;

-- Política: Un cliente solo ve y gestiona los pagadores que él creó
create policy "Clients can view their own payers" 
  on public.payers for select 
  using (auth.uid() = created_by);

create policy "Clients can insert their own payers" 
  on public.payers for insert 
  with check (auth.uid() = created_by);

create policy "Clients can update their own payers" 
  on public.payers for update 
  using (auth.uid() = created_by);

-- 4. TABLA INVOICES (Facturas)
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null,
  payer_id uuid references public.payers(id) not null,
  client_id uuid references public.profiles(id) not null,
  amount numeric not null,
  issue_date date not null,
  due_date date not null,
  file_url text,
  status invoice_status default 'vigente'::invoice_status,
  is_guaranteed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Invoices
alter table public.invoices enable row level security;

-- Política: El cliente solo ve sus propias facturas
create policy "Clients can view their own invoices" 
  on public.invoices for select 
  using (auth.uid() = client_id);

create policy "Clients can insert their own invoices" 
  on public.invoices for insert 
  with check (auth.uid() = client_id);

create policy "Clients can update their own invoices" 
  on public.invoices for update 
  using (auth.uid() = client_id);

-- 5. STORAGE BUCKETS
-- Nota: La creación de buckets vía SQL requiere extensiones o permisos especiales.
-- Aquí insertamos en la tabla de storage.buckets si está disponible (Supabase standard)
-- O se instruye ejecutarlo vía Dashboard/API. Script para inserción directa:

insert into storage.buckets (id, name, public)
values 
  ('invoices-docs', 'invoices-docs', false),
  ('legal-docs', 'legal-docs', false)
on conflict (id) do nothing;

-- Políticas de Storage (Ejemplo básico para invoices-docs)
create policy "Clients can upload invoices"
  on storage.objects for insert
  with check (
    bucket_id = 'invoices-docs' and 
    auth.uid()::text = (storage.foldername(name))[1] -- Asumiendo estructura carpeta/archivo
  );

create policy "Clients can view own invoices"
  on storage.objects for select
  using (
    bucket_id = 'invoices-docs' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );
