import { NotificationHistory } from '@/components/ui/NotificationHistory'

export default function ClientNotificationsPage() {
  const notifications = [
    {
        id: '3',
        title: 'Factura Procesada',
        message: 'La factura #FV-001 ha sido aprobada exitosamente.',
        type: 'success' as const,
        date: 'Ayer',
        read: true,
        href: '/dashboard/invoices',
        timestamp: '2026-01-08T12:00:00.000Z'
    },
    {
        id: '4',
        title: 'Vencimiento Próximo',
        message: 'Factura #FV-005 vence en 3 días. Por favor gestionar el pago.',
        type: 'warning' as const,
        date: 'Hace 1 hora',
        read: false,
        href: '/dashboard/invoices',
        timestamp: '2026-01-09T11:00:00.000Z'
    },
    {
        id: '7',
        title: 'Bienvenido a AvalIA',
        message: 'Tu cuenta ha sido activada correctamente.',
        type: 'info' as const,
        date: 'Hace 1 semana',
        read: true,
        href: '/dashboard/profile',
        timestamp: '2026-01-02T12:00:00.000Z'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Mis Notificaciones
        </h2>
        <p className="mt-1 text-sm text-gray-500">
           Historial de actividad y alertas de tu cuenta.
        </p>
      </div>

      <NotificationHistory initialNotifications={notifications} />
    </div>
  )
}
