'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'

interface SlideCaptchaProps {
  onVerify: () => void
  text?: string
}

export function SlideCaptcha({ onVerify, text = "Desliza para verificar" }: SlideCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [position, setPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderWidth = 50 // Ancho del botón deslizante

  const handleMouseDown = () => {
    if (isVerified) return
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      
      // Calcular nueva posición relativa al contenedor
      let newX = clientX - containerRect.left - (sliderWidth / 2)
      
      // Límites
      const maxPos = containerRect.width - sliderWidth
      newX = Math.max(0, Math.min(newX, maxPos))
      
      setPosition(newX)
      
      // Verificar si llegó al final (con un pequeño margen de tolerancia)
      if (newX >= maxPos - 5) {
        setIsVerified(true)
        setIsDragging(false)
        setPosition(maxPos)
        onVerify()
      }
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)
      if (!isVerified) {
        // Regresar al inicio con animación si no completó
        setPosition(0)
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleMouseMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, isVerified, onVerify, sliderWidth])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-12 rounded-lg bg-gray-100 border border-gray-200 select-none overflow-hidden transition-colors ${isVerified ? 'bg-green-50 border-green-200' : ''}`}
    >
      {/* Texto de fondo */}
      <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium transition-opacity duration-300 ${isVerified ? 'text-green-600' : 'text-gray-400'} ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
        {isVerified ? "Verificado Correctamente" : text}
      </div>

      {/* Progreso Verde (Fondo detrás del slider) */}
      <div 
        className="absolute top-0 left-0 h-full bg-green-100 transition-all duration-0 ease-linear"
        style={{ width: isVerified ? '100%' : `${position + sliderWidth}px`, transition: isDragging ? 'none' : 'width 0.3s ease' }}
      />

      {/* Botón Deslizante */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ transform: `translateX(${position}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}
        className={`absolute top-0 left-0 w-[50px] h-full flex items-center justify-center rounded-lg shadow-sm cursor-grab active:cursor-grabbing z-10 border transition-colors
          ${isVerified 
            ? 'bg-green-500 border-green-600 text-white' 
            : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600'
          }`}
      >
        {isVerified ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </div>
    </div>
  )
}
