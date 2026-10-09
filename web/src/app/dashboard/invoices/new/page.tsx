import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import NewInvoiceForm from './form'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  // Sin empresa no hay pagadores; el uuid nulo no coincide con ninguna fila
  const companyId = profile?.company_id ?? '00000000-0000-0000-0000-000000000000'

  // Pagadores de la empresa (no solo los creados por este usuario: cartera
  // radica facturas de pagadores que creó comercial)
  const { data: payers } = await supabase
    .from('payers')
    .select('id, razon_social, nit')
    .eq('company_id', companyId)
    .order('razon_social')

  // Todas las facturas no pagadas de la empresa
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('payer_id, due_date, status, legal_declarations')
    .eq('company_id', companyId)
    .neq('status', 'pagada')

  const formatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const todayBogotaStr = formatter.format(new Date())

  // Determinar qué pagadores están en mora (facturas vencidas no anuladas)
  const payersInMora = new Set<string>()
  unpaidInvoices?.forEach(inv => {
    const isAnulada = inv.legal_declarations && (inv.legal_declarations as any).anulada === true
    if (isAnulada) return

    if (inv.due_date < todayBogotaStr) {
      payersInMora.add(inv.payer_id)
    }
  })

  const payersWithMora = (payers || []).map(p => ({
    id: p.id,
    razon_social: p.razon_social,
    nit: p.nit,
    inMora: payersInMora.has(p.id)
  }))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Radicar Factura</h1>
        <p className="text-gray-500 mt-2">Sube tu factura electrónica para procesar su garantía.</p>
      </div>
      
      <NewInvoiceForm payers={payersWithMora} />
    </div>
  )
}
