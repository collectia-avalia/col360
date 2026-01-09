import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EditClientForm from './edit-form'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  
  // Usamos admin client para obtener datos sin restricciones
  const { data: client, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">Error cargando cliente</h3>
        <p className="text-gray-500">{error?.message || 'Cliente no encontrado'}</p>
        <Link href="/admin/clients" className="mt-4 inline-block text-indigo-600 hover:underline">
            Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
        <p className="text-gray-500">Actualiza la información de la empresa y credenciales.</p>
      </div>

      <EditClientForm client={client} />
    </div>
  )
}
