import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const userId = "6c3e8dd7-93bc-45f5-a4cf-ff577fcfd252"

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.log('Profile NOT found for ID:', userId, error.message)
  } else {
    console.log('Profile FOUND for ID:', JSON.stringify(data, null, 2))
  }
}

checkProfile()
