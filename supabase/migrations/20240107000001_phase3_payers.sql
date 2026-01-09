-- 1. Actualizar tabla PAYERS con nuevos campos
alter table public.payers 
add column if not exists contact_name text,
add column if not exists contact_phone text,
add column if not exists payment_terms text, -- 'Contado', '30 dias', etc.
add column if not exists estimated_monthly_volume numeric default 0;

-- 2. Crear tabla PAYER_DOCUMENTS
create table if not exists public.payer_documents (
  id uuid default uuid_generate_v4() primary key,
  payer_id uuid references public.payers(id) on delete cascade not null,
  doc_type text not null, -- 'camara_comercio', 'rut', 'estados_financieros', 'renta'
  file_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Documents
alter table public.payer_documents enable row level security;

create policy "Clients can view own payer documents"
  on public.payer_documents for select
  using (
    exists (
      select 1 from public.payers
      where payers.id = payer_documents.payer_id
      and payers.created_by = auth.uid()
    )
  );

create policy "Clients can insert own payer documents"
  on public.payer_documents for insert
  with check (
    exists (
      select 1 from public.payers
      where payers.id = payer_documents.payer_id
      and payers.created_by = auth.uid()
    )
  );

-- 3. STORAGE POLICIES (legal-docs)
-- Asumimos que el bucket 'legal-docs' ya fue creado en Fase 0 o manualmente.
-- Si no, el usuario debe crearlo.

-- Permitir subir archivos a legal-docs si el usuario está autenticado
-- Estructura sugerida: legal-docs/{nit}/{tipo_doc}.pdf
create policy "Clients can upload legal docs"
on storage.objects for insert
with check (
  bucket_id = 'legal-docs' AND
  auth.role() = 'authenticated'
);

-- Permitir ver sus propios documentos (simplificado)
create policy "Clients can view legal docs"
on storage.objects for select
using (
  bucket_id = 'legal-docs' AND
  auth.role() = 'authenticated'
);
