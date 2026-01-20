'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, CreditCard, RefreshCcw } from 'lucide-react'

type ApiStatus = 'operational' | 'degraded' | 'down'

interface SystemStatusPayload {
  status: ApiStatus
  latencyMs?: number
  range: string
  rangeClientsCount: number
  rangeInvoicesCount: number
  checkedAt: string
}

export function AdminSystemStatus({
  range,
  rangeLabel,
  totalClientsCount,
  totalInvoicesCount,
}: {
  range: string
  rangeLabel: string
  totalClientsCount: number
  totalInvoicesCount: number
}) {
  const [data, setData] = useState<SystemStatusPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const fetchStatus = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/system-status?range=${encodeURIComponent(range)}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = (await res.json()) as SystemStatusPayload
      setData(json)
      setLastUpdatedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setData({
        status: 'down',
        range,
        rangeClientsCount: 0,
        rangeInvoicesCount: 0,
        checkedAt: new Date().toISOString(),
      })
      setLastUpdatedAt(new Date().toISOString())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const id = window.setInterval(fetchStatus, 15000)
    return () => window.clearInterval(id)
  }, [range])

  const statusMeta = useMemo(() => {
    const status = data?.status ?? (error ? 'down' : 'degraded')
    if (status === 'operational') return { label: 'Operativo', dot: 'bg-green-500', text: 'text-green-600' }
    if (status === 'degraded') return { label: 'Degradado', dot: 'bg-yellow-500', text: 'text-yellow-700' }
    return { label: 'Offline', dot: 'bg-red-500', text: 'text-red-600' }
  }, [data, error])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Estado del Sistema</h3>
        <button
          type="button"
          onClick={fetchStatus}
          disabled={isLoading}
          className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
            Empresas Registradas
          </div>
          <span className="font-medium text-gray-900">{totalClientsCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
            Nuevas ({rangeLabel})
          </div>
          <span className="font-medium text-gray-900">{data?.rangeClientsCount ?? 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
            Facturas Procesadas
          </div>
          <span className="font-medium text-gray-900">{totalInvoicesCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
            Creadas ({rangeLabel})
          </div>
          <span className="font-medium text-gray-900">{data?.rangeInvoicesCount ?? 0}</span>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Estado de API</span>
            <span className={`${statusMeta.text} font-medium flex items-center`}>
              <span className={`h-2 w-2 rounded-full mr-1 ${statusMeta.dot}`}></span>
              {statusMeta.label}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{lastUpdatedAt ? `Actualizado ${new Date(lastUpdatedAt).toLocaleTimeString()}` : 'Sin actualizar'}</span>
            <span>{data?.latencyMs !== undefined ? `Latencia: ${data.latencyMs}ms` : ''}</span>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

