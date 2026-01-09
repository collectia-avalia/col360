'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import Link from 'next/link'

interface UserProfileProps {
  email: string
  initial: string
  fullName?: string
  role?: string
  basePath: string // '/admin' o '/dashboard'
}

export function UserProfile({ email, initial, fullName, role, basePath }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 focus:outline-none"
      >
        <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{fullName || email}</p>
            <p className="text-xs text-slate-400 capitalize">{role || 'Usuario'}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-avalia-blue/10 flex items-center justify-center text-avalia-blue font-bold shadow-sm border border-avalia-blue/20 hover:bg-avalia-blue/20 transition-colors">
          {initial}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Mi Cuenta</p>
            <p className="text-xs text-slate-500 truncate">{email}</p>
          </div>
          
          <div className="p-2">
            <Link 
              href={`${basePath}/profile`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center transition-colors"
            >
              <User className="w-4 h-4 mr-2" /> Editar Perfil
            </Link>
            <form action={logout}>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center transition-colors">
                    <User className="w-4 h-4 mr-2" /> Cerrar Sesión
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
