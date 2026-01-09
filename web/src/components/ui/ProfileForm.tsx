'use client'

import { useTransition } from 'react'
import { updateProfileAction } from '@/lib/actions/user'
import { Loader2, User, Mail, Building, Lock } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string
    email: string
    fullName: string
    companyName?: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfileAction(formData)
      if (res?.error) {
        alert(res.error)
      } else {
        alert('Perfil actualizado correctamente')
      }
    })
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
      <form action={handleUpdate}>
        <div className="px-4 py-6 sm:p-8">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            
            {/* Información Personal */}
            <div className="sm:col-span-full">
              <h3 className="text-base font-semibold leading-7 text-gray-900">Información Personal</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">Tus datos básicos de identificación.</p>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="fullName" className="block text-sm font-medium leading-6 text-gray-900">
                Nombre Completo
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  defaultValue={user.fullName}
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-avalia-blue sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Correo Electrónico
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  defaultValue={user.email}
                  readOnly
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50 sm:text-sm sm:leading-6 cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Contacta a soporte para cambiar tu email.</p>
            </div>

            {user.companyName !== undefined && (
              <div className="sm:col-span-4">
                <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-gray-900">
                  Nombre de la Empresa
                </label>
                <div className="mt-2 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    defaultValue={user.companyName}
                    readOnly 
                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            )}

            {/* Seguridad / Contraseña */}
            <div className="sm:col-span-full pt-6 border-t border-gray-100">
              <h3 className="text-base font-semibold leading-7 text-gray-900">Seguridad</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">Actualiza tu contraseña. Déjalo en blanco si no deseas cambiarla.</p>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Nueva Contraseña
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-avalia-blue sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                Confirmar Contraseña
              </label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-avalia-blue sm:text-sm sm:leading-6"
                />
              </div>
            </div>

          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-avalia-blue px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center disabled:opacity-50"
          >
            {isPending && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
