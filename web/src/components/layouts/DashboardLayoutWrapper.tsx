'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'
import { UserProfile } from '@/components/ui/UserProfile'
import { Notifications } from '@/components/ui/Notifications'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  email: string
  initial: string
  fullName: string
  companyName: string
}

export function DashboardLayoutWrapper({ children, email, initial, fullName, companyName }: DashboardLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <div className="h-full relative">
            <DashboardSidebar />
            <button 
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 md:hidden text-white/70 hover:text-white"
             >
                <X className="w-6 h-6" />
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">
                  Bienvenido, {companyName}
                </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <Notifications role="client" />
              <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
              <UserProfile 
                email={email} 
                initial={initial} 
                fullName={fullName}
                role="Cliente"
                basePath="/dashboard"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}
