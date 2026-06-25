const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno desde el directorio web
dotenv.config({ path: path.resolve(__dirname, 'web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in web/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.resolve(__dirname, 'supabase/migrations/20260624000000_add_credit_study.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found at: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Aplicando migración SQL en Supabase...');

  // Intentar ejecutar mediante RPC exec_sql
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log('\n========================================================================');
      console.log('ADVERTENCIA: La función RPC "exec_sql" no existe en Supabase.');
      console.log('Por favor, copia y ejecuta el siguiente SQL manualmente en el SQL Editor');
      console.log('de tu dashboard de Supabase (https://supabase.com):');
      console.log('========================================================================\n');
      console.log(sql);
      console.log('\n========================================================================\n');
    } else {
      console.error('Error aplicando migración:', error);
    }
  } else {
    console.log('Migración ejecutada con éxito en la base de datos remota:', data);
  }
}

applyMigration();
