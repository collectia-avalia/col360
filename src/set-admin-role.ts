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

async function setAdminRole() {
  console.log("🔍 Buscando perfiles en public.profiles...");

  // 1. Listar perfiles existentes
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role');

  if (error) {
    console.error(`❌ Error consultando perfiles: ${error.message}`);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("ℹ️  No se encontraron perfiles. Asegúrate de haber creado los usuarios en Auth primero.");
    return;
  }

  console.log("📋 Perfiles encontrados:");
  profiles.forEach(p => console.log(`   - ${p.email} [${p.role}]`));

  // 2. Identificar al candidato para Admin
  // Buscamos alguien con 'admin' en el correo, o tomamos el primero si hay pocos.
  // EDITABLE: Cambia este string por el email exacto si es necesario.
  const targetEmail = "admin"; 
  
  const adminCandidate = profiles.find(p => p.email.includes(targetEmail));

  if (adminCandidate) {
    console.log(`\n🎯 Promoviendo a SUPERADMIN: ${adminCandidate.email}`);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'superadmin' })
      .eq('id', adminCandidate.id);

    if (updateError) {
      console.error(`❌ Error actualizando rol: ${updateError.message}`);
    } else {
      console.log("✅ Rol actualizado correctamente.");
    }
  } else {
    console.log(`\n⚠️  No se encontró un usuario que contenga '${targetEmail}' en su correo.`);
    console.log("   Edita src/set-admin-role.ts línea 38 para especificar el email exacto.");
  }
}

setAdminRole().catch(console.error);
