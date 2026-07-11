'use client'

import { useState } from 'react'
import { signUpCompanyAction } from '../auth/actions'
import { AvaliaLogo } from '@/components/ui/Logo'
import { Copyright } from '@/components/ui/Copyright'
import { SlideCaptcha } from '@/components/ui/SlideCaptcha'
import Link from 'next/link'
import { Building2, Mail, Lock, Shield } from 'lucide-react'

export default function SignupPage() {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSignup = async (formData: FormData) => {
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await signUpCompanyAction(formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        if (res.autologin) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/login?signup=success'
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado durante el registro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f0f4f8]">
      
      {/* Background Decorativo (Gradientes sutiles) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-avalia-blue/30 blur-3xl filter mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-avalia-violet/30 blur-3xl filter mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-avalia-blue/20 blur-3xl filter mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 my-8">
        
        <div className="flex flex-col items-center mb-6">
          <AvaliaLogo className="h-12 mb-4" dark={true} />
          <h2 className="text-2xl font-bold text-slate-800 text-center">Registrar Empresa</h2>
          <p className="text-slate-500 text-sm text-center mt-1">Date de alta gratis y comienza a gestionar tus créditos comerciales</p>
        </div>

        <form action={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="companyName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Razón Social de la Empresa
            </label>
            <div className="relative">
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                placeholder="Nombre oficial o comercial"
              />
              <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="nit" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              NIT de la Empresa
            </label>
            <div className="relative">
              <input
                id="nit"
                name="nit"
                type="text"
                required
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                placeholder="900.123.456-7"
              />
              <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Correo Electrónico Corporativo
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                placeholder="usuario@empresa.com"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                placeholder="Mínimo 6 caracteres"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="py-1">
            <SlideCaptcha onVerify={() => setIsCaptchaVerified(true)} />
          </div>

          <button
            type="submit"
            disabled={!isCaptchaVerified || isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all transform
              ${isCaptchaVerified && !isSubmitting
                ? 'bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-avalia-blue' 
                : 'bg-slate-300 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Empresa'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="font-semibold text-avalia-blue hover:text-avalia-violet">
              Inicia sesión aquí
            </a>
          </p>
        </div>
        
        <div className="mt-6">
          <Copyright />
        </div>
      </div>
    </div>
  )
}
