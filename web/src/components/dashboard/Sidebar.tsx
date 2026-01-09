'use client'

import { logout } from '@/app/auth/actions'
import { PieChart, UserSearch, UploadCloud, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import Link from 'next/link'
import { AvaliaLogo } from '@/components/ui/Logo'

export function DashboardSidebar() {
  return (
      <aside className="h-full w-full bg-avalia-petrol text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <AvaliaLogo className="h-8" />
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:text-avalia-violet transition-colors" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/payers"
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <UserSearch className="w-5 h-5 group-hover:text-avalia-violet transition-colors" />
            <span>Clientes</span>
          </Link>
          
          <Link
            href="/dashboard/invoices"
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <UploadCloud className="w-5 h-5 group-hover:text-avalia-violet transition-colors" />
            <span>Facturas</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <Settings className="w-5 h-5 group-hover:text-avalia-violet transition-colors" />
            <span>Configuración</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Salir</span>
            </button>
          </form>
        </div>
      </aside>
  )
}
