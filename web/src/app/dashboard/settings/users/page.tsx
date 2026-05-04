'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react'
import { createCompanyUserAction, deleteCompanyUserAction } from './actions'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)

  if (!profile || profile.role !== 'superadmin') {
    redirect('/dashboard')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-avalia-violet" />
            Gestión de Equipo
          </h1>
          <p className="text-slate-500 mt-2">Administra los accesos de tu empresa y asigna roles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Creación */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-avalia-violet" />
              Nuevo Integrante
            </h3>
            <form action={async (formData) => {
                'use server'
                await createCompanyUserAction(formData)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  name="fullName" 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-avalia-violet/20 focus:border-avalia-violet outline-none transition-all"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-avalia-violet/20 focus:border-avalia-violet outline-none transition-all"
                  placeholder="correo@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Inicial</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-avalia-violet/20 focus:border-avalia-violet outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol en la Empresa</label>
                <select 
                  name="role" 
                  required
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-avalia-violet/20 focus:border-avalia-violet outline-none transition-all bg-white"
                >
                  <option value="comercial">Comercial (Links de Estudio)</option>
                  <option value="cartera">Cartera (Carga de Facturas)</option>
                  <option value="superadmin">Superadmin (Acceso Total)</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-avalia-violet hover:bg-avalia-violet-dark text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm mt-2"
              >
                Crear Usuario
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">Usuarios Activos</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users?.map((u) => (
                <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200">
                      {u.full_name?.substring(0, 1) || u.email?.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{u.full_name || 'Sin nombre'}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3" /> {u.email}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1
                          ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
                            u.role === 'comercial' ? 'bg-blue-100 text-blue-700' : 
                            'bg-green-100 text-green-700'}`}>
                          <Shield className="w-3 h-3" />
                          {u.role === 'superadmin' ? 'Superadmin' : u.role === 'comercial' ? 'Comercial' : 'Cartera'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {u.id !== profile.id && (
                    <form action={async () => {
                        'use server'
                        await deleteCompanyUserAction(u.id)
                    }}>
                        <button 
                            type="submit"
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar usuario"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </form>
                  )}
                </div>
              ))}
              {(!users || users.length === 0) && (
                <div className="p-12 text-center text-slate-400 italic">
                  No hay otros usuarios en tu equipo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
