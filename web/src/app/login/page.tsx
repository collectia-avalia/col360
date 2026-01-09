'use client'

import { useState } from 'react'
import { login } from '../auth/actions'
import { AvaliaLogo } from '@/components/ui/Logo'
import { Copyright } from '@/components/ui/Copyright'
import { SlideCaptcha } from '@/components/ui/SlideCaptcha'

export default function LoginPage() {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (formData: FormData) => {
    const res = await login(formData)
    if (res?.error) {
        setError(res.error)
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
          <h2 className="text-2xl font-bold text-slate-800 text-center">Bienvenido de nuevo</h2>
          <p className="text-slate-500 text-sm text-center mt-1">Ingresa tus credenciales para acceder al sistema SaaS</p>
        </div>

        <form action={handleLogin} className="space-y-6">
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
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full px-4 py-3 rounded-lg border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                placeholder="nombre@empresa.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-4 py-3 rounded-lg border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-avalia-blue focus:ring-avalia-blue border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-600">
                Recordarme
              </label>
            </div>
            <a href="#" className="font-medium text-avalia-blue hover:text-avalia-violet">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="py-2">
            <SlideCaptcha onVerify={() => setIsCaptchaVerified(true)} />
          </div>

          <button
            type="submit"
            disabled={!isCaptchaVerified}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all transform
              ${isCaptchaVerified 
                ? 'bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-avalia-blue' 
                : 'bg-slate-300 cursor-not-allowed'
              }`}
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div className="mt-6">
            <Copyright />
        </div>
      </div>
    </div>
  )
}
