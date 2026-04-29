import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'c:/Users/c_pal/Antigravity/AVALIA/web/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function repairAllMissingProfiles() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return

  const { data: profiles, error: profError } = await supabase.from('profiles').select('id')
  if (profError) return

  const profileIds = new Set(profiles.map(p => p.id))

  for (const user of users) {
    if (!profileIds.has(user.id)) {
      console.log(`User missing profile: ${user.email} (Role: ${user.user_metadata?.role})`)
      
      // Skip if role is payer_guest and we have the exception in trigger
      if (user.user_metadata?.role === 'payer_guest') {
        console.log(`Skipping payer_guest user: ${user.email}`)
        continue
      }

      console.log(`Repairing profile for user: ${user.email}`)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          company_name: user.user_metadata?.company_name,
          role: user.user_metadata?.role || 'client',
          nit: user.user_metadata?.nit,
          total_bag: user.user_metadata?.total_bag || 0
        })

      if (insertError) {
        console.error(`Error repairing ${user.email}:`, insertError)
      } else {
        console.log(`Profile for ${user.email} fixed!`)
      }
    }
  }
}

repairAllMissingProfiles()
