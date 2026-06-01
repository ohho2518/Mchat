'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { EmptyState } from '@/components/ui'
import { TrendingUp } from 'lucide-react'
import type { DailyCashflow } from '@/types/dashboard'
import type { DashboardPeriod } from '@/types/dashboard'

const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function xLabel(dateStr: string, period: DashboardPeriod): string {
  const d = new Date(dateStr)
  if (period === 'year')  return THAI_MONTHS_SHORT[d.getMonth()]
  if (period === 'week')  return `${d.getDate()}/${d.getMonth() + 1}`
  return `${d.getDate()}`
}

function tickInterval(period: DashboardPeriod, len: number): number {
  if (period === 'year')  return 0
  if (period === 'month') return Math.ceil(len / 8)
  return 0
}

function formatTHB(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

interface Props {
  data: DailyCashflow[]
  period: DashboardPeriod
}

export function CashflowLineChart({ data, period }: Props) {
  if (!data.length) {
    return <EmptyState icon={TrendingUp} title="ยังไม่มีข้อมูล" className="py-8" />
  }

  // คำนวณ cumulative balance
  let cumulative = 0
  const chartData = data.map((d) => {
    cumulative += d.income - d.expense
    return { ...d, label: xLabel(d.date, period), cumulative }
  })

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          interval={tickInterval(period, data.length)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatTHB}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(v) => [`฿${Number(v).toLocaleString('th-TH')}`, 'คงเหลือสะสม']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <ReferenceLine y={0} stroke="#e5e7eb" />
        <Line
          type="monotone"
          dataKey="cumulative"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
