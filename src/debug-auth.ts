import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Credenciales faltantes");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAuth() {
  console.log("🔍 Diagnóstico Auth Admin...");
  
  // Intento 1: Listar con paginación explícita (page 1, perPage 1)
  console.log("   Intentando listar 1 usuario...");
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    console.error(`❌ Error Auth: ${error.message} (${error.status})`);
    console.error("   Detalle:", JSON.stringify(error, null, 2));
  } else {
    console.log(`✅ Conexión Admin Exitosa. Usuarios totales: ${data.total}`);
    if (data.users.length > 0) {
      console.log(`   Usuario muestra: ${data.users[0].email} (${data.users[0].role})`);
      
      // Si encontramos un admin, lo borramos aquí mismo
      const user = data.users[0];
      if (user.email?.includes('admin')) {
         console.log("🚀 Eliminando usuario admin detectado...");
         const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
         if (!delErr) console.log("✅ Eliminado.");
         else console.error("❌ Falló eliminación:", delErr.message);
      }
    } else {
      console.log("ℹ️  No hay usuarios en la base de datos.");
    }
  }
}

debugAuth();
