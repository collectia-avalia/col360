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

async function checkUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log('Users in Auth:')
  users.forEach((user) => {
    console.log(`- Email: ${user.email}, Metadata: ${JSON.stringify(user.user_metadata)}, Created At: ${user.created_at}`)
  })
}

checkUsers()
