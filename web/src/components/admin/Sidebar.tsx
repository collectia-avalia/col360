'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building, ShieldCheck, LogOut, ChevronRight } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userEmail: string
  userInitial: string
  onNavigate?: () => void
}

const menuItems = [
  {
    title: 'Dashboard Global',
    href: '/admin',
    icon: LayoutDashboard,
    matchExact: true
  },
  {
    title: 'Gestión de Clientes',
    href: '/admin/clients',
    icon: Building,
    matchExact: false
  },
  {
    title: 'Aprobaciones',
    href: '/admin/approvals',
    icon: ShieldCheck,
    matchExact: false
  }
]

import { AvaliaLogo } from '@/components/ui/Logo'

// ...

export function AdminSidebar({ userEmail, userInitial, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="h-full w-full bg-avalia-petrol text-white flex flex-col shadow-xl z-20 transition-all duration-300">
      {/* Branding Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col items-start">
            <AvaliaLogo className="h-8" />
            <span className="mt-3 px-3 py-1 bg-avalia-violet/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
              Modo Administrador
            </span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Principal
        </div>
        {menuItems.map((item) => {
          const isActive = item.matchExact 
            ? pathname === item.href 
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-avalia-blue text-white shadow-lg shadow-avalia-blue/20" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
              onClick={onNavigate}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                <span>{item.title}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-indigo-200" />}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
        <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-avalia-blue flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-avalia-blue/30">
                {userInitial}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                <p className="text-xs text-slate-500 truncate">Sesión activa</p>
            </div>
        </div>
        
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
