'use client'

import { useState } from 'react'
import { sendPasswordResetEmail } from '../auth/actions'
import { AvaliaLogo } from '@/components/ui/Logo'
import { Copyright } from '@/components/ui/Copyright'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)

    const res = await sendPasswordResetEmail(formData)
    setIsLoading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess(true)
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
      <div className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
        
        <div className="flex flex-col items-center mb-8">
          <AvaliaLogo className="h-12 mb-4" dark={true} />
          <h2 className="text-2xl font-bold text-slate-800 text-center">¿Olvidaste tu contraseña?</h2>
          <p className="text-slate-500 text-sm text-center mt-1">
            {success 
              ? "Revisa tu correo electrónico para continuar" 
              : "Ingresa tu correo y te enviaremos un enlace para restablecerla"}
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-sm leading-relaxed">
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada y spam.
            </div>
            
            <Link
              href="/login"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] transition-all transform outline-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                  placeholder="nombre@empresa.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all transform outline-none
                ${isLoading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-avalia-blue'
                }`}
            >
              {isLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center mt-4">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-avalia-blue hover:text-avalia-violet">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
        
        <div className="mt-6">
          <Copyright />
        </div>
      </div>
    </div>
  )
}
