import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'c:/Users/c_pal/Antigravity/AVALIA/web/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  if (error) {
    console.error('Error fetching profiles:', error)
    return
  }

  console.log('Profiles in database:')
  data.forEach((profile) => {
    console.log(`- Email: ${profile.email}, Company: ${profile.company_name}, Role: ${profile.role}, Created At: ${profile.created_at}`)
  })
}

checkProfiles()
