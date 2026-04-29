import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = "7d242277-2d40-4c95-a5ba-39807d908fce"
const email = "dazzleagency.ac@gmail.com"
const companyName = "Dazzle Agencia Creativa"
const role = "payer_guest"

async function createProfile() {
  console.log(`Creating profile for ${email}...`)
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        email: email,
        company_name: companyName,
        role: role
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
