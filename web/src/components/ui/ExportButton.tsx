'use client'

import { Download } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename?: string
  label?: string
  className?: string
}

export function ExportButton({ data, filename = 'export.csv', label = 'Exportar CSV', className }: ExportButtonProps) {
  
  const handleExport = () => {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar')
        return
    }

    // Obtener headers de las keys del primer objeto
    // Aplanamos objetos simples si es necesario, pero por ahora asumimos estructura plana o manejamos lo básico
    const headers = Object.keys(data[0])
    
    // Convertir a CSV
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => headers.map(fieldName => {
        let value = row[fieldName]
        
        // Manejo básico de objetos anidados (ej: payers.razon_social)
        if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value).replace(/"/g, '""') // Escape quotes
        } else if (typeof value === 'string') {
            value = `"${value.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
        }
        
        return value
      }).join(','))
    ].join('\n')

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
        onClick={handleExport}
        className={className || "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"}
    >
        <Download className="h-4 w-4 mr-2 text-gray-500" />
        {label}
    </button>
  )
}
