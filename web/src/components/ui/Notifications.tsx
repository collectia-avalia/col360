'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Bell, Check, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success'
  date: string
  read: boolean
  href: string
}

interface NotificationsProps {
  role?: string
}

export function Notifications({ role }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const basePath = role === 'admin' ? '/admin' : '/dashboard'

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

  const baseNotifications = useMemo<Notification[]>(() => {
    if (role === 'admin') {
      return [
        {
          id: '1',
          title: 'Solicitud de Cupo',
          message: 'Nueva solicitud pendiente de revisión.',
          type: 'warning',
          date: 'Hace 10 min',
          read: false,
          href: '/admin/approvals',
        },
        {
          id: '2',
          title: 'Nuevo Cliente',
          message: 'Se ha registrado "Tech Solutions SAS".',
          type: 'info',
          date: 'Hace 2 horas',
          read: false,
          href: '/admin/clients',
        },
      ]
    }

    return [
      {
        id: '3',
        title: 'Factura Procesada',
        message: 'La factura #FV-001 ha sido aprobada.',
        type: 'success',
        date: 'Ayer',
        read: true,
        href: '/dashboard/invoices',
      },
      {
        id: '4',
        title: 'Vencimiento Próximo',
        message: 'Factura #FV-005 vence en 3 días.',
        type: 'warning',
        date: 'Hace 1 hora',
        read: false,
        href: '/dashboard/invoices',
      },
    ]
  }, [role])

  const notifications = useMemo(() => {
    return baseNotifications.map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }))
  }, [baseNotifications, readIds])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setIsOpen(false) // Cerrar al navegar
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
            {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} nuevas
                </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <Link 
                        key={notif.id} 
                        href={notif.href}
                        className={`block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1.5 rounded-full ${
                                notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                                {notif.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                                 notif.type === 'success' ? <Check className="w-3 h-3" /> :
                                 <Info className="w-3 h-3" />}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                    {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-2">{notif.date}</p>
                            </div>
                            {!notif.read && (
                                <div className="h-2 w-2 bg-indigo-500 rounded-full mt-2"></div>
                            )}
                        </div>
                    </Link>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-sm">
                    No tienes notificaciones pendientes.
                </div>
            )}
          </div>
          
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <Link 
                href={`${basePath}/notifications`}
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors block w-full py-1"
            >
                Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
