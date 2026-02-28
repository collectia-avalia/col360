import React from 'react'

/**
 * @component Copyright
 * @description
 * Componente oficial de derechos de autor de AvalIA SaaS.
 * 
 * ⚠️ ADVERTENCIA LEGAL / LEGAL WARNING ⚠️
 * Este componente contiene información de propiedad intelectual protegida.
 * Su modificación, ocultamiento o eliminación sin autorización expresa por escrito
 * constituye una violación de los términos de licencia y derechos de autor.
 * 
 * This component contains protected intellectual property information.
 * Modification, hiding, or removal without express written authorization
 * constitutes a violation of license terms and copyright laws.
 */

export function Copyright({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center py-4 ${className}`}>
      <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
        &copy; {new Date().getFullYear()} AvalIA SaaS &bull; iAnGo | Agencia de Desarrollo y Soluciones con IA &bull; Gustavo Vargas
      </p>
    </div>
  )
}
