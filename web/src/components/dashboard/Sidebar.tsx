'use client'

import { logout } from '@/app/auth/actions'
import { PieChart, UserSearch, UploadCloud, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AvaliaLogo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

export function DashboardSidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/payers', label: 'Clientes', icon: UserSearch },
    { href: '/dashboard/invoices', label: 'Facturas', icon: UploadCloud },
    { href: '/dashboard/profile', label: 'Configuración', icon: Settings },
  ]

  return (
      <aside className="h-full w-full bg-avalia-petrol text-white flex flex-col shadow-xl z-20 overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <AvaliaLogo className="h-8 w-auto" />
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-slate-800 text-white font-medium shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-avalia-violet rounded-r-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-avalia-violet" : "group-hover:text-avalia-violet"
                )} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg w-full transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
              <span>Salir</span>
            </button>
          </form>
        </div>
      </aside>
  )
}
