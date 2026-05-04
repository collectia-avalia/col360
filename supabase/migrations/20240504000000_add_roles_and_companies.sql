-- 1. Actualizar ENUM de roles
-- Nota: En Postgres, ALTER TYPE ADD VALUE no puede ejecutarse dentro de un bloque de transacción (dependiendo de la versión/entorno)
-- Pero Supabase suele permitirlo en migraciones secuenciales.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cartera';

-- 2. Crear tabla de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Agregar company_id a las tablas existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.payers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 4. MIGRACIÓN DE DATOS (Backfill)
-- Crear una empresa para cada usuario actual que no tenga una asignada
DO $$
DECLARE
    profile_record RECORD;
    new_company_id UUID;
BEGIN
    FOR profile_record IN SELECT id, company_name FROM public.profiles WHERE company_id IS NULL LOOP
        -- Crear empresa
        INSERT INTO public.companies (name) 
        VALUES (COALESCE(profile_record.company_name, 'Mi Empresa'))
        RETURNING id INTO new_company_id;

        -- Actualizar perfil
        UPDATE public.profiles SET company_id = new_company_id WHERE id = profile_record.id;

        -- Vincular pagadores creados por este usuario a la empresa
        UPDATE public.payers SET company_id = new_company_id WHERE created_by = profile_record.id;

        -- Vincular facturas creadas por este usuario a la empresa
        UPDATE public.invoices SET company_id = new_company_id WHERE client_id = profile_record.id;
    END LOOP;
END $$;

-- 5. ACTUALIZAR POLÍTICAS RLS

-- PAYERS
DROP POLICY IF EXISTS "Clients can view their own payers" ON public.payers;
CREATE POLICY "Users can view company payers" ON public.payers
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.payers.company_id
        )
    );

DROP POLICY IF EXISTS "Clients can insert their own payers" ON public.payers;
CREATE POLICY "Users can insert company payers" ON public.payers
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.payers.company_id
        ) AND (
            -- Solo superadmin y comercial pueden crear pagadores
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('superadmin', 'comercial')
            )
        )
    );

-- INVOICES
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view company invoices" ON public.invoices
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.invoices.company_id
        )
    );

DROP POLICY IF EXISTS "Clients can insert their own invoices" ON public.invoices;
CREATE POLICY "Users can insert company invoices" ON public.invoices
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE company_id = public.invoices.company_id
        ) AND (
            -- Solo superadmin y cartera pueden cargar facturas
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('superadmin', 'cartera')
            )
        )
    );

-- COMPANIES (Acceso básico)
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );
