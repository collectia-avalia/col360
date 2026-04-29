import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanUserData() {
  const searchName = 'Nicholl'

  console.log(`\n🔍 Buscando usuario con nombre: "${searchName}"...`)

  // 1. Buscar el perfil del usuario
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, company_name, role')
    .ilike('company_name', `%${searchName}%`)

  if (profileError) {
    console.error('Error buscando perfil:', profileError)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log(`No se encontró ningún usuario con nombre "${searchName}".`)
    return
  }

  console.log(`\n✅ Usuario(s) encontrado(s):`)
  profiles.forEach(p => console.log(`  - ID: ${p.id} | Email: ${p.email} | Nombre: ${p.full_name} | Empresa: ${p.company_name} | Rol: ${p.role}`))

  // Trabajar con el primer resultado
  const user = profiles[0]
  console.log(`\n🎯 Procesando usuario: ${user.email} (${user.full_name})`)

  // 2. Eliminar todas las facturas del usuario (client_id = user.id)
  const { data: invoices, error: invoicesFetchError } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount')
    .eq('client_id', user.id)

  if (invoicesFetchError) {
    console.error('Error buscando facturas:', invoicesFetchError)
    return
  }

  console.log(`\n📄 Facturas encontradas: ${invoices?.length || 0}`)
  invoices?.forEach(inv => console.log(`  - ${inv.invoice_number} | $${inv.amount}`))

  if (invoices && invoices.length > 0) {
    const { error: deleteInvoicesError } = await supabase
      .from('invoices')
      .delete()
      .eq('client_id', user.id)

    if (deleteInvoicesError) {
      console.error('Error eliminando facturas:', deleteInvoicesError)
      return
    }
    console.log(`✅ ${invoices.length} factura(s) eliminada(s).`)
  }

  // 3. Buscar todos los payers del usuario
  const { data: payers, error: payersFetchError } = await supabase
    .from('payers')
    .select('id, razon_social, nit, risk_status')
    .eq('created_by', user.id)

  if (payersFetchError) {
    console.error('Error buscando pagadores:', payersFetchError)
    return
  }

  console.log(`\n🏢 Clientes/Pagadores encontrados: ${payers?.length || 0}`)
  payers?.forEach(p => console.log(`  - ${p.razon_social} | NIT: ${p.nit} | Estado: ${p.risk_status}`))

  if (payers && payers.length > 0) {
    // 3a. Eliminar documentos de cada payer (payer_documents no tiene cascade automático)
    for (const payer of payers) {
      const { error: docsError } = await supabase
        .from('payer_documents')
        .delete()
        .eq('payer_id', payer.id)

      if (docsError) {
        console.warn(`  ⚠️ Error eliminando documentos de ${payer.razon_social}:`, docsError.message)
      }
    }

    // 3b. Eliminar todos los payers (cascade eliminará cualquier factura restante)
    const { error: deletePayersError } = await supabase
      .from('payers')
      .delete()
      .eq('created_by', user.id)

    if (deletePayersError) {
      console.error('Error eliminando pagadores:', deletePayersError)
      return
    }
    console.log(`✅ ${payers.length} cliente(s)/pagador(es) eliminado(s).`)
  }

  console.log(`\n🎉 Limpieza completa. El usuario ${user.email} sigue activo pero sin clientes ni facturas.`)
}

cleanUserData().catch(console.error)
