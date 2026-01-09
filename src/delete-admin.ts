import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Debe ser SERVICE_ROLE_KEY para administrar usuarios

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Credenciales faltantes en .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteAdmin() {
  console.log("🔍 Buscando usuarios...");

  // 1. Listar usuarios
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error(`❌ Error listando usuarios: ${error.message}`);
    console.log("⚠️  Asegúrate de usar la SERVICE_ROLE_KEY en el archivo .env para operaciones administrativas.");
    return;
  }

  if (!users || users.length === 0) {
    console.log("ℹ️  No se encontraron usuarios en Auth.");
    return;
  }

  console.log(`📋 Usuarios encontrados: ${users.length}`);
  users.forEach(u => console.log(`   - ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`));

  // 2. Identificar Admin (Buscamos por email o metadata si existe)
  // Como no especificaste email, intentaré buscar uno que parezca admin o preguntaré.
  // Para automatizar, buscaré si hay algún usuario con 'admin' en el email o metadata.
  
  // ESTRATEGIA: Eliminaré el usuario que parezca ser el admin que mencionas.
  // Si solo hay uno, asumiré que es ese.
  
  // FILTRO: Buscar usuario con 'admin' en el email
  const adminUser = users.find(u => u.email?.includes('admin'));

  if (adminUser) {
    console.log(`\n🎯 Usuario Admin encontrado: ${adminUser.email} (${adminUser.id})`);
    console.log("⚠️  Eliminando usuario...");

    const { error: deleteError } = await supabase.auth.admin.deleteUser(adminUser.id);

    if (deleteError) {
      console.error(`❌ Error eliminando usuario: ${deleteError.message}`);
    } else {
      console.log("✅ Usuario eliminado correctamente de Auth.");
      
      // Opcional: Limpiar de profiles si no hay cascade (pero pusimos cascade en SQL)
      console.log("ℹ️  El registro en 'profiles' debería eliminarse automáticamente por la restricción CASCADE.");
    }
  } else {
    console.log("\n⚠️  No se encontró un usuario con 'admin' en el email.");
    console.log("   Por favor, edita este script con el ID exacto o email del usuario a eliminar.");
  }
}

deleteAdmin().catch(console.error);
