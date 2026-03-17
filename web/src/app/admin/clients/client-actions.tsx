'use client'

import { Trash2, Edit, Loader2 } from 'lucide-react'
import { deleteClientAction } from '@/lib/actions/admin'
import { useState, useTransition } from 'react'

import Link from 'next/link'

export function ClientActions({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('handleDelete: Proceeding with deletion for', userId)
    setIsDeleting(true)
    startTransition(async () => {
      try {
        const result = await deleteClientAction(userId)
        console.log('handleDelete: Result', result)
        if (result?.error) {
          alert(`Error: ${result.error}`)
          setIsDeleting(false)
          setShowConfirm(false)
        }
      } catch (err) {
        console.error('handleDelete: Exception', err)
        alert('Error inesperado al intentar borrar.')
        setIsDeleting(false)
        setShowConfirm(false)
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="flex items-center justify-center space-x-2 animate-in fade-in zoom-in duration-200">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete(e)
          }}
          disabled={isPending || isDeleting}
          className="text-[10px] bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50 font-bold uppercase tracking-wider shadow-sm"
        >
          {isPending || isDeleting ? 'Borrando...' : 'Confirmar'}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowConfirm(false)
          }}
          disabled={isPending || isDeleting}
          className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center space-x-3">
      <Link 
        href={`/admin/clients/${userId}`}
        className="p-1 text-indigo-600 hover:text-indigo-900 transition-colors hover:bg-indigo-50 rounded"
        title="Editar Cliente"
      >
        <Edit className="h-4 w-4" />
      </Link>
      
      <button 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Delete button clicked, showing confirm UI')
          setShowConfirm(true)
        }} 
        disabled={isPending || isDeleting}
        className="p-1 text-red-600 hover:text-red-900 transition-colors hover:bg-red-50 rounded disabled:opacity-50"
        title="Eliminar Cliente"
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
