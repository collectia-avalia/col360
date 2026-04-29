import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = "6c3e8dd7-93bc-45f5-a4cf-ff577fcfd252"

async function checkData() {
  console.log(`Checking data for user: ${userId}`)
  
  const { data: payers, error: payersError } = await supabase
    .from('payers')
    .select('*')
    .eq('created_by', userId)

  if (payersError) {
    console.error('Error checking payers:', payersError.message)
  } else {
    console.log(`Found ${payers.length} payers:`, JSON.stringify(payers, null, 2))
  }

  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', userId)

  if (invoicesError) {
    console.error('Error checking invoices:', invoicesError.message)
  } else {
    console.log(`Found ${invoices.length} invoices:`, JSON.stringify(invoices, null, 2))
  }
}

checkData()
