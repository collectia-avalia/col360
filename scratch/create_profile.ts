import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = "6c3e8dd7-93bc-45f5-a4cf-ff577fcfd252"
const email = "cartera@fergquimsas.com.co"
const companyName = "FERGQUIM S.A.S"
const nit = "860039686"
const totalBag = 800000000
const role = "client"

async function createProfile() {
  console.log(`Creating profile for ${email}...`)
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        email: email,
        company_name: companyName,
        role: role,
        nit: nit,
        total_bag: totalBag
      }
    ])
    .select()

  if (error) {
    console.error('Error creating profile:', error.message)
  } else {
    console.log('Profile created successfully:', JSON.stringify(data, null, 2))
  }
}

createProfile()
