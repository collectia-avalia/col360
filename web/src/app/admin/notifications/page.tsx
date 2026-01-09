import { NotificationHistory } from '@/components/ui/NotificationHistory'

export default function AdminNotificationsPage() {
  // Mock Data extendida para historial
  const notifications = [
    {
        id: '1',
        title: 'Solicitud de Cupo',
        message: 'Nueva solicitud pendiente de revisión para Empresa X.',
        type: 'warning' as const,
        date: 'Hace 10 min',
        read: false,
        href: '/admin/approvals',
        timestamp: '2026-01-09T11:50:00.000Z'
    },
    {
        id: '2',
        title: 'Nuevo Cliente',
        message: 'Se ha registrado "Tech Solutions SAS".',
        type: 'info' as const,
        date: 'Hace 2 horas',
        read: false,
        href: '/admin/clients',
        timestamp: '2026-01-09T10:00:00.000Z'
    },
    {
        id: '5',
        title: 'Mantenimiento Programado',
        message: 'El sistema estará en mantenimiento el domingo a las 3 AM.',
        type: 'info' as const,
        date: 'Ayer',
        read: true,
        href: '#',
        timestamp: '2026-01-08T12:00:00.000Z'
    },
    {
        id: '6',
        title: 'Cupo Aprobado',
        message: 'Se aprobó el cupo para Logística Global Ltda.',
        type: 'success' as const,
        date: 'Hace 2 días',
        read: true,
        href: '/admin/clients/123',
        timestamp: '2026-01-07T12:00:00.000Z'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Bitácora de Notificaciones
        </h2>
        <p className="mt-1 text-sm text-gray-500">
           Historial completo de alertas y eventos del sistema.
        </p>
      </div>

      <NotificationHistory initialNotifications={notifications} />
    </div>
  )
}
