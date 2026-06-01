'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/ui'
import { PieChart as PieIcon } from 'lucide-react'
import type { CategoryExpense } from '@/types/dashboard'

const DEFAULT_COLORS = [
  '#DC2626','#EA580C','#CA8A04','#16A34A','#0891B2',
  '#2563EB','#7C3AED','#DB2777','#64748B','#78716C',
]

interface Props {
  data: CategoryExpense[]
}

export function CategoryPieChart({ data }: Props) {
  if (!data.length) {
    return <EmptyState icon={PieIcon} title="ยังไม่มีรายจ่าย" className="py-8" />
  }

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [`฿${Number(v).toLocaleString('th-TH')}`, '']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {data.map((item, i) => (
          <div key={item.categoryId} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span className="flex-1 text-gray-700 truncate">{item.category}</span>
            <span className="text-gray-400 text-xs">{item.percent}%</span>
            <span className="font-medium text-gray-900 text-xs">
              ฿{item.amount.toLocaleString('th-TH')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
