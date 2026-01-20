
-- 1. Usuarios (Simulados - En Supabase local esto se hace via auth.users)
-- Como no podemos insertar directamente en auth.users via SQL estándar sin privilegios especiales,
-- asumimos que el usuario crea una cuenta manualmente o usamos el script de TS para ello.

-- 2. Limpiar datos existentes (Opcional, para desarrollo limpio)
TRUNCATE TABLE public.invoices CASCADE;
TRUNCATE TABLE public.payers CASCADE;

-- 3. Insertar Payers
INSERT INTO public.payers (id, razon_social, nit, contact_email, contact_name, risk_status, approved_quota, created_by, terms_accepted, invitation_status)
VALUES
  (uuid_generate_v4(), 'Tech Solutions SAS', '900100100-1', 'contacto@techsolutions.com', 'Gerente Tech', 'aprobado', 500000000, auth.uid(), true, 'accepted'),
  (uuid_generate_v4(), 'Inversiones del Norte', '900200200-2', 'contacto@inversionesnorte.com', 'Gerente Norte', 'pendiente', 0, auth.uid(), true, 'accepted'),
  (uuid_generate_v4(), 'Comercializadora Global', '900300300-3', 'contacto@comercializadora.com', 'Gerente Global', 'rechazado', 0, auth.uid(), true, 'accepted');

-- 4. Insertar Invoices (Ejemplos)
-- Nota: En un seed real SQL, necesitaríamos capturar los IDs generados arriba.
-- Para simplificar en SQL puro sin variables complejas, se suele usar DO blocks o valores hardcodeados si son datos de prueba fijos.
