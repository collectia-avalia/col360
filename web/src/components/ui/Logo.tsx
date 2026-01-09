import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  dark?: boolean
}

export function AvaliaLogo({ className = "h-8", dark = false }: LogoProps) {
  // Nota: Si el logo es oscuro, podría necesitar inversión de color o un logo alternativo para fondos oscuros.
  // Asumiremos que el logo proporcionado funciona bien o aplicaremos filtros si es necesario.
  // Si dark=true (fondo claro), usamos el logo tal cual.
  // Si dark=false (fondo oscuro, sidebar), podríamos necesitar un filtro brightness/invert si el logo es negro.
  
  // Asumiendo que "Logo Avalia.png" es el logo principal (probablemente oscuro o colorido).
  // Para el sidebar oscuro, aplicaremos una clase para hacerlo visible si es necesario (ej. brightness-0 invert).
  // Ajusta las clases según la apariencia real del logo.

  return (
    <div className={`relative flex items-center ${className}`} style={{ aspectRatio: '3/1' }}>
      <Image
        src="/logo-avalia.png"
        alt="AvalIA Logo"
        fill
        className={`object-contain ${!dark ? 'brightness-0 invert' : ''}`} 
        priority
      />
    </div>
  )
}
