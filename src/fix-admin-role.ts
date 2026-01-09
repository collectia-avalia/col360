import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service Role Key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Credenciales faltantes en .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAdminRole() {
  console.log("🔧 Iniciando reparación de rol de Administrador...");
  
  // 1. Buscar el usuario por email
  const targetEmail = "operaciones@collectiabpo.com"; // Tu email real
  
  // Nota: listUsers es la forma admin de buscar
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error(`❌ Error listando usuarios: ${error.message}`);
    return;
  }

  const user = users.find(u => u.email === targetEmail);

  if (!user) {
    console.error(`❌ No se encontró el usuario: ${targetEmail}`);
    return;
  }

  console.log(`✅ Usuario encontrado: ${user.id}`);

  // 2. Actualizar Metadata en Auth (Esto es lo que leerá el Middleware)
  console.log("🔄 Actualizando metadata del usuario en Auth...");
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, role: 'superadmin' } }
  );

  if (updateError) {
    console.error(`❌ Error actualizando metadata: ${updateError.message}`);
    return;
  }
  console.log("✅ Metadata actualizada: role = 'superadmin'");

  // 3. Asegurar consistencia en tabla profiles
  console.log("🔄 Sincronizando tabla public.profiles...");
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'superadmin' })
    .eq('id', user.id);

  if (profileError) {
    console.error(`❌ Error actualizando perfil: ${profileError.message}`);
  } else {
    console.log("✅ Perfil actualizado en BD.");
  }

  console.log("\n🎉 REPARACIÓN COMPLETADA. Por favor cierra sesión y vuelve a entrar.");
}

fixAdminRole().catch(console.error);
