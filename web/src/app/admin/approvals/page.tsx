import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { FileText } from 'lucide-react'

type PayerRow = {
  id: string
  razon_social: string
  nit: string
  created_at: string
  risk_status: string
  profiles?: {
    email?: string | null
    company_name?: string | null
  } | null
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createAdminClient()
  const statusFilter = (searchParams['status'] as string) || 'pendiente'

  // Consultamos pagadores
  // Nota: Intentamos traer datos del perfil del creador.
  // Si la relación FK no es detectada automáticamente hacia 'profiles', esto podría no traer datos.
  // En ese caso, mostraríamos solo el ID o el email si pudiéramos acceder a auth.users (que no podemos desde aquí fácilmente).
  // Asumiremos que profiles existe y trataremos de hacer el join.
  const { data: payers } = await supabase
    .from('payers')
    .select(`
      *,
      profiles:created_by (
        email,
        company_name
      )
    `)
    .eq('risk_status', statusFilter)
    .order('created_at', { ascending: false })

  const tabs = [
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobado', label: 'Aprobados' },
    { id: 'rechazado', label: 'Rechazados' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Aprobaciones de Riesgo</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona las solicitudes de cupo de los clientes.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/approvals?status=${tab.id}`}
              className={`
                whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${statusFilter === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagador
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Solicitante (Cliente)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Solicitud
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Gestionar</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(payers as PayerRow[] | null)?.map((payer) => (
              <tr key={payer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        <FileText className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{payer.razon_social}</div>
                      <div className="text-xs text-gray-500">NIT: {payer.nit}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payer.profiles?.company_name || 'Sin Nombre'}
                  </div>
                  <div className="text-xs text-gray-500">{payer.profiles?.email || '...'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payer.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payer.risk_status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link 
                    href={`/admin/approvals/${payer.id}`} 
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Auditar/Decidir
                  </Link>
                </td>
              </tr>
            ))}
            {(!payers || payers.length === 0) && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No hay solicitudes en estado &quot;{statusFilter}&quot;.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pendiente: 'bg-yellow-100 text-yellow-800',
        aprobado: 'bg-green-100 text-green-800',
        rechazado: 'bg-red-100 text-red-800',
    }
    const label = {
        pendiente: 'Pendiente',
        aprobado: 'Aprobado',
        rechazado: 'Rechazado',
    }
    const currentStyle = styles[status as keyof typeof styles] || styles.pendiente
    const currentLabel = label[status as keyof typeof label] || status

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${currentStyle}`}>
            {currentLabel}
        </span>
    )
}
