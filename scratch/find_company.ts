import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const email = "cartera@fergquimsas.com.co"

async function search() {
  console.log(`Searching for email: ${email}`)
  
  // Search in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (profileError) {
    if (profileError.code === 'PGRST116') {
      console.log('No profile found for this email in "profiles.email".')
    } else {
      console.error('Error searching profiles:', profileError.message)
    }
  } else {
    console.log('Profile found:', JSON.stringify(profile, null, 2))
  }

  // Search in profiles by company_name
  const { data: profileByName, error: profileNameError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('company_name', '%Fergquim%')

  if (profileNameError) {
    console.error('Error searching profiles by company_name:', profileNameError.message)
  } else if (profileByName && profileByName.length > 0) {
    console.log('Found profiles by name "Fergquim":', JSON.stringify(profileByName, null, 2))
  } else {
    console.log('No profiles found by name "Fergquim".')
  }

  // Search in payers
  const { data: payer, error: payerError } = await supabase
    .from('payers')
    .select('*')
    .eq('contact_email', email)

  if (payerError) {
    console.error('Error searching payers:', payerError.message)
  } else if (payer && payer.length > 0) {
    console.log('Payer found by contact_email:', JSON.stringify(payer, null, 2))
  } else {
    console.log('No payer found by contact_email.')
  }

  // Check for company name in payers
  const { data: payerByName, error: payerByNameError } = await supabase
    .from('payers')
    .select('*')
    .ilike('razon_social', '%Fergquim%')

  if (payerByNameError) {
    console.error('Error searching payers by name:', payerByNameError.message)
  } else if (payerByName && payerByName.length > 0) {
    console.log('Found payers by name "Fergquim":', JSON.stringify(payerByName, null, 2))
  } else {
    console.log('No payers found by name "Fergquim".')
  }
}

search()
