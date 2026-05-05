import { createAdminClient } from './src/lib/supabase/admin'

async function debugPayers() {
  const supabase = createAdminClient()
  
  const { data: payers, error } = await supabase
    .from('payers')
    .select('id, risk_status, approved_quota, company_id, companies(name, credit_study_fee)')
  
  if (error) {
    console.error('Error fetching payers:', error)
    return
  }

  console.log(`Total payers: ${payers?.length}`)
  const approved = payers?.filter(p => p.risk_status === 'aprobado')
  console.log(`Approved payers: ${approved?.length}`)
  
  approved?.forEach(p => {
    console.log(`Payer ID: ${p.id}, Quota: ${p.approved_quota}, Status: ${p.risk_status}, Company: ${p.companies?.name || 'NONE'}`)
  })
}

debugPayers()
