import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const rangeOptions = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '3m', months: 3 },
  { key: '6m', months: 6 },
  { key: '1y', years: 1 },
] as const

type RangeKey = typeof rangeOptions[number]['key']

function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === 'string' && rangeOptions.some((o) => o.key === value)
}

function getRangeStart(range: RangeKey) {
  const now = new Date()
  const start = new Date(now)
  const opt = rangeOptions.find((o) => o.key === range)
  if (opt && 'days' in opt) start.setDate(start.getDate() - opt.days)
  if (opt && 'months' in opt) start.setMonth(start.getMonth() - opt.months)
  if (opt && 'years' in opt) start.setFullYear(start.getFullYear() - opt.years)
  return start
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const range = isRangeKey(url.searchParams.get('range')) ? (url.searchParams.get('range') as RangeKey) : '6m'
  const rangeStart = getRangeStart(range)

  const supabase = createAdminClient()

  const t0 = Date.now()
  try {
    const [{ count: rangeClientsCount }, { count: rangeInvoicesCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').gte('created_at', rangeStart.toISOString()),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).gte('created_at', rangeStart.toISOString()),
    ])

    const latencyMs = Date.now() - t0
    const status = latencyMs > 1200 ? 'degraded' : 'operational'

    return NextResponse.json({
      status,
      latencyMs,
      range,
      rangeClientsCount: rangeClientsCount || 0,
      rangeInvoicesCount: rangeInvoicesCount || 0,
      checkedAt: new Date().toISOString(),
    })
  } catch (e) {
    const latencyMs = Date.now() - t0
    return NextResponse.json(
      {
        status: 'down',
        latencyMs,
        range,
        rangeClientsCount: 0,
        rangeInvoicesCount: 0,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

