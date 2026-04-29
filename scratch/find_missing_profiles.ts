import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findMissingProfiles() {
  console.log('Fetching all users from auth.users...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('Error listing users:', authError.message)
    return
  }

  console.log('Fetching all profiles...')
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')

  if (profileError) {
    console.error('Error listing profiles:', profileError.message)
    return
  }

  const profileIds = new Set(profileData.map(p => p.id))
  const missing = authData.users.filter(u => !profileIds.has(u.id))

  if (missing.length > 0) {
    console.log(`Found ${missing.length} users with missing profiles:`)
    missing.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata: ${JSON.stringify(u.user_metadata)}`)
    })
  } else {
    console.log('No users with missing profiles found.')
  }
}

findMissingProfiles()
