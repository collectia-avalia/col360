'use client'

import { updateClientAction } from '@/lib/actions/admin'
import { useState, useTransition } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClientData {
  id: string
  company_name: string | null
  email: string | null
  total_bag?: number | null
}

export default function EditClientForm({ client }: { client: ClientData }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await updateClientAction(client.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        alert('Cliente actualizado correctamente')
        router.push('/admin/clients')
      }
    })
  }

  return (
    <form action={handleSubmit} className="bg-white shadow sm:rounded-lg border border-gray-200 p-6 max-w-2xl">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4">

        {/* Razón Social */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Razón Social / Empresa</label>
          <div className="mt-1">
            <input
              type="text"
              name="companyName"
              id="companyName"
              defaultValue={client.company_name || ''}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Ej: Inversiones SAS"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <div className="mt-1">
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={client.email || ''}
              readOnly
              className="shadow-sm bg-gray-100 cursor-not-allowed focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border text-gray-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            El correo electrónico no se puede modificar por seguridad. Contacte a soporte si requiere cambios.
          </p>
        </div>
        {/* Valor de la Bolsa */}
        <div>
          <label htmlFor="totalBag" className="block text-sm font-medium text-gray-700">Valor de la Bolsa (Cupo Global)</label>
          <div className="mt-1">
            <input
              type="number"
              name="totalBag"
              id="totalBag"
              defaultValue={client.total_bag || 0}
              min="0"
              step="0.01"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Ej: 15000000"
              required
            />
          </div>
        </div>

      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <Link
          href="/admin/clients"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <X className="-ml-1 mr-2 h-4 w-4" />
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  )
}
