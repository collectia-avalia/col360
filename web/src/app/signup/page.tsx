'use client'

import { useState, useRef } from 'react'
import { requestSignupOtpAction, verifySignupOtpAction } from '../auth/actions'
import { AvaliaLogo } from '@/components/ui/Logo'
import { Copyright } from '@/components/ui/Copyright'
import { SlideCaptcha } from '@/components/ui/SlideCaptcha'
import { Building2, Mail, Lock, Shield, User, Phone, MapPin, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Guardar datos temporales para reenvíos
  const [registeredEmail, setRegisteredEmail] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // Paso 1: Solicitar OTP de registro
  const handleRequestOtp = async (formData: FormData) => {
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    
    try {
      const emailVal = formData.get('email') as string
      setRegisteredEmail(emailVal)

      const res = await requestSignupOtpAction(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setStep('otp')
        setSuccessMessage('Hemos enviado un código OTP de 6 dígitos a tu correo.')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al solicitar el código.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Paso 2: Verificar OTP de registro
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const otpCode = formData.get('otpCode') as string

    if (!otpCode || otpCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos válido.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await verifySignupOtpAction(registeredEmail, otpCode)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success) {
        // Redirección nativa y limpia en el cliente
        window.location.href = res.redirect || '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código OTP.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reenviar OTP usando los datos del formulario original
  const handleResendOtp = async () => {
    if (!formRef.current) return
    setError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(formRef.current)
      const res = await requestSignupOtpAction(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccessMessage('Código OTP reenviado con éxito a tu correo.')
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo reenviar el código.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f0f4f8] py-12">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-avalia-blue/30 blur-3xl filter mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-avalia-violet/30 blur-3xl filter mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-avalia-blue/20 blur-3xl filter mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-lg p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 mx-4">
        
        {step === 'form' ? (
          /* VISTA 1: FORMULARIO DE CAPTURA DE DATOS */
          <div>
            <div className="flex flex-col items-center mb-6">
              <AvaliaLogo className="h-12 mb-4" dark={true} />
              <h2 className="text-2xl font-bold text-slate-800 text-center">Registrar Empresa</h2>
              <p className="text-slate-500 text-sm text-center mt-1">Date de alta gratis y comienza a gestionar tus créditos comerciales</p>
            </div>

            <form ref={formRef} action={handleRequestOtp} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Razón Social
                  </label>
                  <div className="relative">
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                      placeholder="Empresa S.A.S"
                    />
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="nit" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    NIT
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nombre de Contacto
                  </label>
                  <div className="relative">
                    <input
                      id="contactName"
                      name="contactName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                      placeholder="Representante legal"
                    />
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Teléfono Celular
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                      placeholder="3001234567"
                    />
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Dirección Comercial
                </label>
                <div className="relative">
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                    placeholder="Calle 100 # 15-20, Bogotá"
                  />
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Correo Corporativo
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                      placeholder="gerente@empresa.com"
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
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-sm placeholder-slate-400"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                {isSubmitting ? 'Enviando código...' : 'Registrar Empresa'}
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
          </div>
        ) : (
          /* VISTA 2: PANTALLA DE VERIFICACIÓN OTP */
          <div>
            <div className="flex flex-col items-center mb-6">
              <KeyRound className="w-12 h-12 text-avalia-blue mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-slate-800 text-center">Verifica tu Correo</h2>
              <p className="text-slate-500 text-sm text-center mt-2 px-4">
                Ingresa el código OTP de 6 dígitos que enviamos a <strong className="text-slate-700">{registeredEmail}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center">
                  {successMessage}
                </div>
              )}

              <div>
                <label htmlFor="otpCode" className="block text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Código de Verificación
                </label>
                <input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  pattern="\d{6}"
                  className="block w-full text-center px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-avalia-blue focus:border-transparent transition-all outline-none text-slate-800 text-3xl font-extrabold tracking-[0.4em] placeholder-slate-200 max-w-[240px] mx-auto uppercase"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all transform bg-avalia-blue hover:bg-avalia-violet hover:scale-[1.01] focus:ring-2 focus:ring-offset-2 focus:ring-avalia-blue
                  ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isSubmitting ? 'Verificando...' : 'Completar Registro'}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <button
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="text-sm font-semibold text-avalia-blue hover:text-avalia-violet disabled:opacity-50"
              >
                Reenviar Código de Verificación
              </button>

              <button
                onClick={() => {
                  setStep('form')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Modificar datos del registro
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Copyright />
        </div>
      </div>
    </div>
  )
}
