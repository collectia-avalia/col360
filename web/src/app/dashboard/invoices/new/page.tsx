import { createClient } from '@/lib/supabase/server'
import NewInvoiceForm from './form'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener pagadores del usuario para el select
  const { data: payers } = await supabase
    .from('payers')
    .select('id, razon_social, nit')
    .eq('created_by', user?.id)
    .order('razon_social')

  // Obtener todas las facturas no pagadas del cliente
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('payer_id, due_date, status, legal_declarations')
    .eq('client_id', user?.id)
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
