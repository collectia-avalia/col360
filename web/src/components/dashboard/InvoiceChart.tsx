'use client'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'

interface InvoiceChartProps {
  data: { 
    name: string; 
    bag?: number; 
    quota?: number;
    total?: number;
  }[]
}

export function InvoiceChart({ data }: InvoiceChartProps) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorQuota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number | undefined) => [
              new Intl.NumberFormat('es-CO', { 
                style: 'currency', 
                currency: 'COP', 
                maximumFractionDigits: 0 
              }).format(value || 0), 
              ''
            ]}
          />
          <Legend verticalAlign="top" height={36}/>
          {data[0]?.bag !== undefined && (
            <Area 
              name="Bolsa Total"
              type="monotone" 
              dataKey="bag" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBag)" 
            />
          )}
          {data[0]?.quota !== undefined && (
            <Area 
              name="Cupos Aprobados"
              type="monotone" 
              dataKey="quota" 
              stroke="#10B981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorQuota)" 
            />
          )}
          {data[0]?.total !== undefined && (
            <Area 
              name="Total Facturado"
              type="monotone" 
              dataKey="total" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBag)" 
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
