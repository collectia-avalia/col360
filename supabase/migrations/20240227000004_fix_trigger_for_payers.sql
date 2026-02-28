-- ============================================================================
-- Migración: Corregir trigger handle_new_user para separar pagadores de perfiles
-- ============================================================================
-- PROBLEMA: El trigger anterior intentaba crear un perfil en public.profiles
-- para TODOS los usuarios, incluyendo pagadores (payer_guest).
-- Los pagadores tienen su propia tabla (payers) y no necesitan perfil.
-- Esto causaba "Database error creating new user" al invitar clientes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Los pagadores (payer_guest) NO necesitan perfil en profiles.
  -- Sus datos van a la tabla payers, que se maneja desde la aplicacion.
  IF new.raw_user_meta_data->>'role' = 'payer_guest' THEN
    RETURN new;
  END IF;

  -- Para usuarios administrativos (client, superadmin), crear perfil normalmente
  INSERT INTO public.profiles (id, email, company_name, role, nit, total_bag)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'company_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    new.raw_user_meta_data->>'nit',
    COALESCE((new.raw_user_meta_data->>'total_bag')::numeric, 0)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
