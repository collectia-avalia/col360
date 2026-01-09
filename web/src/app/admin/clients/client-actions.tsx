'use client'

import { Trash2, Edit, Loader2 } from 'lucide-react'
import { deleteClientAction } from '@/lib/actions/admin'
import { useState, useTransition } from 'react'

import Link from 'next/link'

export function ClientActions({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción borrará todos sus datos y es irreversible.')) {
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteClientAction(userId)
      setIsDeleting(false)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  return (
    <div className="flex items-center justify-end space-x-3">
      <Link 
        href={`/admin/clients/${userId}`}
        className="text-indigo-600 hover:text-indigo-900 transition-colors"
        title="Editar Cliente"
      >
        <Edit className="h-4 w-4" />
      </Link>
      
      <button 
        onClick={handleDelete} 
        disabled={isPending || isDeleting}
        className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
        title="Eliminar Cliente"
      >
        {isPending || isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
