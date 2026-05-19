'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '../auth/actions'
import { AvaliaLogo } from '@/components/ui/Logo'
import { Copyright } from '@/components/ui/Copyright'
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      router.push('/')
    }
  }, [success, countdown, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    const res = await updatePassword(formData)
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
          <h2 className="text-2xl font-bold text-slate-800 text-center">Restablecer Contraseña</h2>
          <p className="text-slate-500 text-sm text-center mt-1">
            {success 
              ? "¡Contraseña actualizada con éxito!" 
              : "Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta"}
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-12 w-12 animate-pulse" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-sm leading-relaxed">
              Tu contraseña ha sido restablecida. Redirigiéndote al sistema en <strong>{countdown}</strong> segundos...
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] transition-all transform outline-none"
            >
              Acceder Ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-lg border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                  placeholder="Repite la contraseña"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all transform outline-none
                ${isLoading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-avalia-blue'
                }`}
            >
              {isLoading ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
        
        <div className="mt-6">
          <Copyright />
        </div>
      </div>
    </div>
  )
}
