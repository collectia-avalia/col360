import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE URL or KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDependencies() {
  console.log('Checking for client dependencies...')
  
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, company_name').eq('role', 'client')
  if (pError) {
    console.error('Error fetching profiles:', pError)
    return
  }

  for (const profile of profiles) {
    const { count: payerCount, error: payerError } = await supabase
      .from('payers')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profile.id)
    
    const { count: invoiceCount, error: invError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.id)

    console.log(`Client: ${profile.company_name} (${profile.id})`)
    console.log(` - Payers: ${payerCount}`)
    console.log(` - Invoices: ${invoiceCount}`)
  }
}

checkDependencies()
