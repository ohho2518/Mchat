'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '@/components/ui'
import { BarChart2 } from 'lucide-react'
import type { DailyCashflow } from '@/types/dashboard'
import type { DashboardPeriod } from '@/types/dashboard'

const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function xLabel(dateStr: string, period: DashboardPeriod): string {
  const d = new Date(dateStr)
  if (period === 'year')  return THAI_MONTHS_SHORT[d.getMonth()]
  if (period === 'week')  return `${d.getDate()}/${d.getMonth() + 1}`
  if (period === 'today') return `${d.getHours()}:00`
  return `${d.getDate()}`
}

function tickInterval(period: DashboardPeriod, dataLen: number): number {
  if (period === 'year')  return 0             // แสดงทุก month
  if (period === 'month') return Math.ceil(dataLen / 8)  // ~8 labels
  return 0
}

function formatTHB(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

interface Props {
  data: DailyCashflow[]
  period: DashboardPeriod
}

export function IncomeExpenseChart({ data, period }: Props) {
  if (!data.length) {
    return <EmptyState icon={BarChart2} title="ยังไม่มีข้อมูล" className="py-8" />
  }

  const chartData = data.map((d) => ({
    ...d,
    label: xLabel(d.date, period),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
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
          formatter={(v) => [`฿${Number(v).toLocaleString('th-TH')}`, '']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="income"  name="รายรับ"  fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar dataKey="expense" name="รายจ่าย" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
