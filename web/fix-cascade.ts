import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyCascadingDeletes() {
  const queries = [
    `ALTER TABLE public.payers DROP CONSTRAINT IF EXISTS payers_created_by_fkey;`,
    `ALTER TABLE public.payers ADD CONSTRAINT payers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;`,
    `ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;`,
    `ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;`,
    `ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payer_id_fkey;`,
    `ALTER TABLE public.invoices ADD CONSTRAINT invoices_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.payers(id) ON DELETE CASCADE;`
  ]

  console.log('SQL to execute in Supabase Editor if needed:')
  queries.forEach(q => console.log(q))
  
  // NOTE: As I can't run arbitrary SQL with the client unless I use an RPC, 
  // I will assume the user will run it or I will try to find a workaround if possible.
  // For now, I'll update the server side to handle deletion of Auth and Profile.
}

applyCascadingDeletes()
