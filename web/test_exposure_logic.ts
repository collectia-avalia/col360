import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'web/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

const fergquimId = "6c3e8dd7-93bc-45f5-a4cf-ff577fcfd252" // ID we fixed earlier

async function testLogic() {
  console.log("Setting Fergquim exposure to 10%...")
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ max_exposure: 10 })
    .eq('id', fergquimId)

  if (updateError) {
    console.error("Error updating Fergquim:", updateError.message)
    return
  }

  console.log("Creating a test payer for Fergquim...")
  const { data: payer, error: payerError } = await supabase
    .from('payers')
    .insert({
      razon_social: "Test Payer Exposure",
      nit: "123456789-0",
      contact_email: "test@exposure.com",
      created_by: fergquimId,
      risk_status: 'pendiente'
    })
    .select()
    .single()

  if (payerError) {
    console.error("Error creating payer:", payerError.message)
    return
  }

  console.log("Testing validation logic via script (simulating the Server Action check)...")
  
  // Simulation of the check I added in actions.ts
  const amountToApprove = 90000000 // 90M > 80M (10% of 800M)
  
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('total_bag, max_exposure')
    .eq('id', fergquimId)
    .single()

  const limit = (clientProfile?.total_bag || 0) * ((clientProfile?.max_exposure || 100) / 100)
  
  console.log(`Limit: ${limit}, Attempted: ${amountToApprove}`)
  
  if (amountToApprove > limit) {
    console.log("SUCCESS: Validation correctly identifies over-exposure!")
  } else {
    console.log("FAILURE: Validation failed to identify over-exposure.")
  }

  // Cleanup
  await supabase.from('payers').delete().eq('id', payer.id)
}

testLogic()
