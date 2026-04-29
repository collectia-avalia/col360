import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config() // fallback to root .env

// Try to load from web/.env if not in root .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const email = "cartera@fergquimsas.com.co"

async function checkAuth() {
  console.log(`Checking auth.users for: ${email}`)
  
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error listing users:', error.message)
    return
  }

  const user = data.users.find(u => u.email === email)
  if (user) {
    console.log('User found in auth.users:', JSON.stringify(user, null, 2))
  } else {
    console.log('User NOT found in auth.users.')
    // Search by name in metadata if possible
    const userByName = data.users.find(u => {
        const metadata = u.user_metadata || {}
        return (metadata.company_name && metadata.company_name.includes('Fergquim')) ||
               (metadata.full_name && metadata.full_name.includes('Fergquim'))
    })
    if (userByName) {
        console.log('User found by name in metadata:', JSON.stringify(userByName, null, 2))
    }
  }
}

checkAuth()
