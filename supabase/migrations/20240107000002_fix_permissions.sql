-- Asegurar permisos básicos para usuarios autenticados
GRANT ALL ON TABLE public.payers TO authenticated;
GRANT ALL ON TABLE public.payer_documents TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;

-- Eliminar política anterior de inserción si existe (para evitar duplicados o conflictos)
DROP POLICY IF EXISTS "Clients can insert their own payers" ON public.payers;

-- Crear política de inserción corregida
CREATE POLICY "Clients can insert their own payers"
ON public.payers
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Asegurar que también pueden ver lo que insertan (necesario para el .select() que hace el cliente tras insertar)
DROP POLICY IF EXISTS "Clients can view their own payers" ON public.payers;

CREATE POLICY "Clients can view their own payers"
ON public.payers
FOR SELECT
USING (
  auth.uid() = created_by
);

-- Habilitar RLS explícitamente por si acaso
ALTER TABLE public.payers ENABLE ROW LEVEL SECURITY;
