'use client'

import { useState } from 'react'
import { Search, Filter, Info, AlertTriangle, Check } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success'
  date: string
  read: boolean
  href: string
  timestamp: string
}

interface NotificationHistoryProps {
  initialNotifications: Notification[]
}

export function NotificationHistory({ initialNotifications }: NotificationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'info' | 'warning' | 'success'>('all')
  
  const filteredNotifications = initialNotifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || n.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-avalia-blue sm:text-sm sm:leading-6"
                    placeholder="Buscar notificaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select 
                    className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-avalia-blue sm:text-sm sm:leading-6"
                    value={filterType}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === 'all' || value === 'info' || value === 'warning' || value === 'success') {
                        setFilterType(value)
                      }
                    }}
                >
                    <option value="all">Todos los tipos</option>
                    <option value="info">Información</option>
                    <option value="warning">Alertas</option>
                    <option value="success">Éxitos</option>
                </select>
            </div>
        </div>
      </div>
      
      <ul role="list" className="divide-y divide-gray-100">
        {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
            <li key={notification.id} className="relative flex gap-x-4 px-4 py-5 hover:bg-gray-50 sm:px-6 transition-colors">
                <div className={`flex-none rounded-full p-2 h-10 w-10 flex items-center justify-center ${
                    notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    notification.type === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                }`}>
                    {notification.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                     notification.type === 'success' ? <Check className="h-5 w-5" /> :
                     <Info className="h-5 w-5" />}
                </div>
                <div className="flex-auto min-w-0">
                    <div className="flex items-baseline justify-between gap-x-4">
                        <p className="text-sm font-semibold leading-6 text-gray-900">
                            <Link href={notification.href} className="hover:underline focus:outline-none">
                                <span className="absolute inset-x-0 -top-px bottom-0" />
                                {notification.title}
                            </Link>
                        </p>
                        <p className="flex-none text-xs text-gray-500">
                            <time dateTime={notification.timestamp}>
                                {notification.date}
                            </time>
                        </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">{notification.message}</p>
                </div>
            </li>
            ))
        ) : (
            <li className="px-4 py-12 text-center text-sm text-gray-500">
                No se encontraron notificaciones que coincidan con tu búsqueda.
            </li>
        )}
      </ul>
    </div>
  )
}
