'use client'

import { createPayerAction } from '../actions'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, UploadCloud, Mail, AlertCircle } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
          Procesando Solicitud...
        </>
      ) : (
        'Enviar Invitación al Cliente'
      )}
    </button>
  )
}

export default function NewPayerPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createPayerAction(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/dashboard/payers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a Clientes
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Invitar Nuevo Cliente</h1>
        <p className="text-gray-500 mt-2">Envía una invitación para que tu cliente complete su información y documentación.</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                <Mail className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Datos de Contacto</h2>
                <p className="text-sm text-gray-500">A este correo llegará el enlace único de registro.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">Razón Social (Empresa)</label>
              <input type="text" name="razonSocial" id="razonSocial" required 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm py-2.5 border px-3"
                placeholder="Ej: Constructora Global S.A.S"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Correo Electrónico del Cliente</label>
              <input type="email" name="contactEmail" id="contactEmail" required 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm py-2.5 border px-3"
                placeholder="gerencia@cliente.com"
              />
            </div>
          </div>
        </div>

        {/* Sección Legal */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Autorización Inicial</h3>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input id="auth_contact" name="auth_contact" type="checkbox" required className="focus:ring-[#7c3aed] h-4 w-4 text-[#7c3aed] border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="auth_contact" className="font-medium text-gray-700">Confirmo relación comercial</label>
                    <p className="text-gray-500 mt-1">
                        Certifico que tengo una relación comercial vigente con esta empresa y estoy autorizado para iniciar este proceso de estudio de crédito.
                    </p>
                </div>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
        )}

        <div className="pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
