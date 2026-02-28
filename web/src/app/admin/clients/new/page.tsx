'use client'

import { createClientAction } from '../actions'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Building, Mail, Lock, FileText, Wallet } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
          Creando Empresa...
        </>
      ) : (
        'Registrar Empresa'
      )}
    </button>
  )
}

export default function NewClientPage() {
  const [serverError, setServerError] = useState<{
    companyName?: string[]
    nit?: string[]
    email?: string[]
    password?: string[]
    totalBag?: string[]
    root?: string[]
  } | null>(null)

  async function clientAction(formData: FormData) {
    setServerError(null)
    const result = await createClientAction(formData)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/clients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al listado
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Registrar Nueva Empresa</h1>
        <p className="text-sm text-gray-500">Crea una cuenta para que un cliente acceda al sistema.</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form action={clientAction} className="space-y-6">
            {/* Razón Social */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Razón Social (Nombre de la Empresa)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="Ej: Constructora Global S.A.S"
                />
              </div>
              {serverError?.companyName && (
                <p className="mt-1 text-sm text-red-600">{serverError.companyName[0]}</p>
              )}
            </div>

            {/* NIT */}
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-gray-700">
                NIT / Identificación Tributaria
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="nit"
                  id="nit"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="Ej: 900.123.456-7"
                />
              </div>
              {serverError?.nit && (
                <p className="mt-1 text-sm text-red-600">{serverError.nit[0]}</p>
              )}
            </div>

            {/* Valor de la Bolsa */}
            <div>
              <label htmlFor="totalBag" className="block text-sm font-medium text-gray-700">
                Valor de la Bolsa (Cupo Global)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="number"
                  name="totalBag"
                  id="totalBag"
                  required
                  min="0"
                  step="0.01"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="Ej: 15000000"
                />
              </div>
              {serverError?.totalBag && (
                <p className="mt-1 text-sm text-red-600">{serverError.totalBag[0]}</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Credenciales de Acceso</h3>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico (Usuario)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                {serverError?.email && (
                  <p className="mt-1 text-sm text-red-600">{serverError.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña Temporal
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="password"
                    id="password"
                    required
                    defaultValue="Avalia2025."
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Puedes asignar una por defecto o escribir una personalizada.</p>
                {serverError?.password && (
                  <p className="mt-1 text-sm text-red-600">{serverError.password}</p>
                )}
              </div>
            </div>

            {serverError?.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error al registrar</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{serverError.root[0]}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
