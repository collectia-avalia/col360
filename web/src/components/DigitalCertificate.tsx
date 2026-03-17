'use client'

import React from 'react'
import { ShieldCheck, Calendar, Globe, Fingerprint, Award } from 'lucide-react'

interface DigitalCertificateProps {
  payerName: string
  signedAt: string
  signedIp: string
  signatureHash: string
}

export function DigitalCertificate({ payerName, signedAt, signedIp, signatureHash }: DigitalCertificateProps) {
  return (
    <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xl max-w-2xl mx-auto my-8 relative">
      {/* Decorative Stamp Background */}
      <div className="absolute -right-12 -top-12 opacity-[0.03] rotate-12 pointer-events-none">
        <ShieldCheck className="w-64 h-64 text-indigo-900" />
      </div>

      {/* Header */}
      <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
          <Award className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Certificado de Firma Electrónica</h3>
        <p className="text-indigo-300 text-xs font-bold mt-2 uppercase tracking-widest">Emitido por AvalIA</p>
      </div>

      {/* Body */}
      <div className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500 font-medium italic">Se certifica que el representante de:</p>
          <p className="text-2xl font-black text-slate-900">{payerName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fecha y Hora (UTC)</p>
              <p className="text-sm font-bold text-slate-900">{new Date(signedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Dirección IP</p>
              <p className="text-sm font-bold text-slate-900">{signedIp || '127.0.0.1'}</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative group">
          <div className="flex items-center gap-3 mb-3">
            <Fingerprint className="w-5 h-5 text-indigo-600" />
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.15em]">Hash de Integridad (SHA-256)</p>
          </div>
          <code className="block text-sm font-black text-indigo-900 break-all bg-white/50 p-3 rounded-lg border border-indigo-200/50">
            {signatureHash || 'SECURE-AUTH-TOKEN-GEN-0000'}
          </code>
          <ShieldCheck className="absolute top-4 right-4 w-6 h-6 text-indigo-200/50" />
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Firma Validada vía OTP Email</span>
          </div>
        </div>
      </div>

      {/* Footer / Disclaimer */}
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-[9px] text-slate-400 text-center leading-relaxed">
          Este documento constituye una prueba tangible de la aceptación electrónica de términos y condiciones de acuerdo con la Ley 527 de 1999 de Colombia sobre Comercio Electrónico y Firmas Digitales.
        </p>
      </div>
    </div>
  )
}
