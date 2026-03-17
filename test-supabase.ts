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

async function testConnection() {
  console.log('Connecting to:', supabaseUrl)
  const { data, error } = await supabase.from('profiles').select('*').limit(5)
  
  if (error) {
    console.error('Error connecting to Supabase:', error.message)
    process.exit(1)
  }
  
  console.log('Successfully connected to Supabase!')
  console.log('Sample profiles:', data)
}

testConnection()
