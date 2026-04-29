import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'c:/Users/c_pal/Antigravity/AVALIA/web/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function repairProfile() {
  // Datos del usuario gomolixander@gmail.com capturados de Auth
  const userId = '092c474d-fc7c-4876-a077-4c759cd8f44d' // I need to get the actual ID from check_users output
  
  // Re-run check_users or find the ID from previous output
  // Looking at check_users.ts output from my memory of the previous turn:
  // Wait, I didn't print the ID in check_users.ts. I should have.
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  const targetUser = users.find(u => u.email === 'gomolixander@gmail.com')
  
  if (!targetUser) {
    console.error('User not found in Auth')
    return
  }

  console.log(`Repairing profile for user: ${targetUser.email} (ID: ${targetUser.id})`)
  
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: targetUser.id,
      email: targetUser.email,
      company_name: targetUser.user_metadata?.company_name,
      role: targetUser.user_metadata?.role || 'client',
      nit: targetUser.user_metadata?.nit,
      total_bag: targetUser.user_metadata?.total_bag || 0
    })

  if (insertError) {
    console.error('Error creating profile manually:', insertError)
  } else {
    console.log('Profile created successfully!')
  }
}

repairProfile()
