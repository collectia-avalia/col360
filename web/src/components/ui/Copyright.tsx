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
    <div className={`text-center text-xs text-slate-400 ${className}`}>
        &copy; 2026 AvalIA SaaS. Diseño y Desarrollo por Gustavo Vargas - <a href="https://iango.dev" target="_blank" rel="noopener noreferrer" className="hover:text-avalia-blue transition-colors font-medium">iAnGo Desarrollo e Implementaciones con IA</a>
    </div>
  )
}
