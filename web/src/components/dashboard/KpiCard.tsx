import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  color?: 'blue' | 'green' | 'red' | 'purple'
}

export function KpiCard({ title, value, icon: Icon, trend, color = 'blue' }: KpiCardProps) {
  const colorStyles = {
    blue: 'bg-avalia-blue/10 text-avalia-blue',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-avalia-violet/10 text-avalia-violet',
  }

  return (
    <div className="bg-white overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`flex-shrink-0 rounded-lg p-3 ${colorStyles[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
             <dl>
               <dt className="text-sm font-medium text-gray-500 truncate mb-1">{title}</dt>
               <dd>
                 <div className="text-2xl font-bold text-gray-900 leading-none truncate" title={String(value)}>
                     {value}
                 </div>
               </dd>
             </dl>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
          <div className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {trend.positive ? '+' : ''}{trend.value}%
            <span className="text-gray-500 ml-2 font-normal">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}
