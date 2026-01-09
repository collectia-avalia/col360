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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Radicar Factura</h1>
        <p className="text-gray-500 mt-2">Sube tu factura electrónica para procesar su garantía.</p>
      </div>
      
      <NewInvoiceForm payers={payers || []} />
    </div>
  )
}
