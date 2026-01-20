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

    const headers = Object.keys(data[0])

    const escapeValue = (value: unknown) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }

    const csvLines = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => `"${escapeValue(row[fieldName]).replace(/\"/g, '\"\"')}"`)
          .join(',')
      ),
    ]

    const csvContent = '\uFEFF' + csvLines.join('\r\n')

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
        type="button"
        className={className || "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-colors"}
    >
        <Download className="h-4 w-4 mr-2 text-gray-500" />
        {label}
    </button>
  )
}
