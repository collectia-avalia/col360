import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { performance } from "perf_hooks";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function verifyFull() {
  console.log("🔍 Iniciando Diagnóstico Completo de Conexión Supabase...\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Credenciales faltantes en .env");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const results: Record<string, any> = {
    auth: { status: 'pending', latency: 0 },
    db: { status: 'pending', latency: 0 },
    storage: { status: 'pending', latency: 0 }
  };

  // 1. Auth Check (Configuración)
  console.log("1️⃣  Verificando Auth Service...");
  const startAuth = performance.now();
  try {
    // Intentamos obtener la sesión (aunque sea nula, verifica que el servicio responda)
    const { data: authData, error: authError } = await supabase.auth.getSession();
    const endAuth = performance.now();
    results.auth.latency = Math.round(endAuth - startAuth);
    
    if (authError) {
      console.error(`   ❌ Auth Error: ${authError.message}`);
      results.auth.status = 'error';
      results.auth.error = authError.message;
    } else {
      console.log(`   ✅ Auth Service Responde (${results.auth.latency}ms)`);
      results.auth.status = 'ok';
    }
  } catch (e: any) {
    console.error(`   ❌ Auth Exception: ${e.message}`);
    results.auth.status = 'exception';
  }

  // 2. Database Check (Conexión genérica)
  console.log("\n2️⃣  Verificando Base de Datos (PostgREST)...");
  const startDb = performance.now();
  try {
    // Intentamos una operación que no requiera tablas específicas si es posible,
    // o simplemente verificamos que no de error de conexión.
    // Como no podemos consultar information_schema directamente con el cliente JS sin RPC o permisos,
    // intentaremos una consulta 'health check' simple si es posible, o volveremos a intentar listar una tabla.
    // Sin embargo, sabemos que 'users' no existe. 
    // Probaremos consultar algo que debería fallar por "no encontrado" pero no por "conexión rechazada".
    
    // NOTA: Supabase JS client no tiene un "ping". Usamos una query a una tabla inexistente 'health_check'
    // esperando un 404 (PGRST205) que confirma conectividad, vs un 500 o timeout.
    const { error } = await supabase.from('health_check_dummy_table').select('*').limit(1);
    const endDb = performance.now();
    results.db.latency = Math.round(endDb - startDb);

    // PGRST205 = relation not found (Conectado OK, DB responde)
    // Error de conexión sería diferente (fetch failed, etc)
    if (error && error.code === 'PGRST205') {
      console.log(`   ✅ DB Conectada y Respondiendo (${results.db.latency}ms)`);
      console.log("      (Confirmado por respuesta de error controlado 'Tabla no encontrada')");
      results.db.status = 'ok';
    } else if (error) {
      console.warn(`   ⚠️  DB respondió con error inesperado: ${error.message} (${error.code})`);
      results.db.status = 'warning';
      results.db.details = error;
    } else {
      console.log(`   ✅ DB Conectada y tabla 'health_check_dummy_table' existe?? (${results.db.latency}ms)`);
      results.db.status = 'ok';
    }
  } catch (e: any) {
    console.error(`   ❌ DB Exception: ${e.message}`);
    results.db.status = 'exception';
  }

  // 3. Storage Check
  console.log("\n3️⃣  Verificando Storage Service...");
  const startStorage = performance.now();
  try {
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    const endStorage = performance.now();
    results.storage.latency = Math.round(endStorage - startStorage);

    if (storageError) {
      console.error(`   ❌ Storage Error: ${storageError.message}`);
      results.storage.status = 'error';
    } else {
      console.log(`   ✅ Storage Service Responde (${results.storage.latency}ms)`);
      console.log(`      Buckets encontrados: ${buckets.length}`);
      if (buckets.length > 0) {
        console.log(`      - ${buckets.map(b => b.name).join(', ')}`);
      }
      results.storage.status = 'ok';
    }
  } catch (e: any) {
    console.error(`   ❌ Storage Exception: ${e.message}`);
    results.storage.status = 'exception';
  }

  console.log("\n--------------------------------------------------");
  console.log("📊 RESUMEN FINAL");
  console.log("--------------------------------------------------");
  
  const allOk = Object.values(results).every(r => r.status === 'ok');
  if (allOk) {
    console.log("✅ TODAS LAS PRUEBAS DE CONEXIÓN EXITOSAS");
    console.log("   El sistema está correctamente conectado a Supabase.");
  } else {
    console.log("⚠️  SE ENCONTRARON PROBLEMAS EN ALGUNOS SERVICIOS");
  }
  
  console.table(results);
}

verifyFull().catch(console.error);
