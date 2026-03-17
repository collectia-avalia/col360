const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from web directory if possible
dotenv.config({ path: path.resolve(__dirname, 'web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const sql = `
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS legal_representative_id TEXT;
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS otp_code TEXT;
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS signed_ip TEXT;
    ALTER TABLE payers ADD COLUMN IF NOT EXISTS due_diligence_progress INTEGER DEFAULT 0;

    -- Update doc_type constraint
    DO $$ 
    BEGIN 
      ALTER TABLE payer_documents DROP CONSTRAINT IF EXISTS payer_documents_doc_type_check;
      ALTER TABLE payer_documents ADD CONSTRAINT payer_documents_doc_type_check 
      CHECK (doc_type IN ('rut', 'camara_comercio', 'estados_financieros', 'central_auth', 'cedula_rep_legal', 'renta'));
    EXCEPTION WHEN OTHERS THEN 
      RAISE NOTICE 'Error adjusting constraint: %', SQLERRM;
    END $$;
  `;

  // Since we don't have a direct 'exec_sql' RPC by default unless we created it,
  // we can use the 'query' approach if available or just assume it might fail if RPC missing.
  // Better yet, let's use a simpler approach if possible or just create the RPC first.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log('RPC exec_sql does not exist. Please run the SQL manually in Supabase dashboard:');
      console.log(sql);
    } else {
      console.error('Error applying migration:', error);
    }
  } else {
    console.log('Migration applied successfully:', data);
  }
}

applyMigration();
