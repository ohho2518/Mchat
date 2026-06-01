'use client'
import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import {
  SummaryCard, PeriodSelector,
  IncomeExpenseChart, CashflowLineChart, CategoryPieChart,
} from '@/components/dashboard'
import type { DashboardSummary, DailyCashflow, CategoryExpense } from '@/types/dashboard'
import type { DashboardPeriod } from '@/types/dashboard'

// period → จำนวนวันที่ดึง cashflow
const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  today: 1,
  week:  7,
  month: 30,
  year:  365,
}

// สำหรับ year: group daily data เป็น monthly
function groupByMonth(daily: DailyCashflow[]): DailyCashflow[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const row of daily) {
    const d   = new Date(row.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const cur = map.get(key) ?? { income: 0, expense: 0 }
    cur.income  += row.income
    cur.expense += row.expense
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([date, v]) => ({
    date,
    income:  v.income,
    expense: v.expense,
    balance: v.income - v.expense,
  }))
}

// สรุปยอดจาก cashflow data
function sumCashflow(data: DailyCashflow[]) {
  return data.reduce(
    (acc, row) => ({ income: acc.income + row.income, expense: acc.expense + row.expense }),
    { income: 0, expense: 0 }
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month')
  const [summary,  setSummary]  = useState<DashboardSummary | null>(null)
  const [cashflow, setCashflow] = useState<DailyCashflow[]>([])
  const [catExp,   setCatExp]   = useState<CategoryExpense[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchAll = useCallback(async (p: DashboardPeriod) => {
    setLoading(true)
    setError(null)
    try {
      const days = PERIOD_DAYS[p]
      const [sumRes, cfRes, catRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch(`/api/dashboard/daily-cashflow?days=${days}`),
        fetch(`/api/dashboard/category-expense?period=${p}`),
      ])

      if (sumRes.status === 401 || cfRes.status === 401) {
        setError('กรุณาเข้าสู่ระบบเพื่อดูรายงาน')
        return
      }
      if (!sumRes.ok || !cfRes.ok || !catRes.ok) throw new Error('fetch error')

      const [sumData, cfData, catData] = await Promise.all([
        sumRes.json() as Promise<DashboardSummary>,
        cfRes.json()  as Promise<DailyCashflow[]>,
        catRes.json() as Promise<CategoryExpense[]>,
      ])

      setSummary(sumData)
      setCashflow(p === 'year' ? groupByMonth(cfData) : cfData)
      setCatExp(catData)
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(period) }, [period, fetchAll])

  // summary ที่แสดงขึ้นอยู่กับ period
  const displaySummary = () => {
    if (period === 'today') {
      return {
        income:  summary?.incomeToday  ?? 0,
        expense: summary?.expenseToday ?? 0,
        balance: summary?.balanceToday ?? 0,
      }
    }
    if (period === 'month') {
      return {
        income:  summary?.incomeMonth  ?? 0,
        expense: summary?.expenseMonth ?? 0,
        balance: summary?.balanceMonth ?? 0,
      }
    }
    // week / year: คำนวณจาก cashflow data
    const { income, expense } = sumCashflow(cashflow)
    return { income, expense, balance: income - expense }
  }

  const PERIOD_LABEL: Record<DashboardPeriod, string> = {
    today: 'วันนี้', week: '7 วัน', month: 'เดือนนี้', year: 'ปีนี้',
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-600">{error}</div>
    )
  }

  const ds = displaySummary()

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Period selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="รายรับ"  amount={ds.income}  type="income"  loading={loading} />
        <SummaryCard label="รายจ่าย" amount={ds.expense} type="expense" loading={loading} />
        <SummaryCard label="คงเหลือ" amount={ds.balance} type="balance" loading={loading} />
      </div>

      {/* Income vs Expense Bar */}
      <Card title={`รายรับ vs รายจ่าย (${PERIOD_LABEL[period]})`} noPadding>
        <div className="p-4">
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              กำลังโหลด...
            </div>
          ) : (
            <IncomeExpenseChart data={cashflow} period={period} />
          )}
        </div>
      </Card>

      {/* Cashflow Line */}
      {period !== 'today' && (
        <Card title={`Cashflow สะสม (${PERIOD_LABEL[period]})`} noPadding>
          <div className="p-4">
            {loading ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
                กำลังโหลด...
              </div>
            ) : (
              <CashflowLineChart data={cashflow} period={period} />
            )}
          </div>
        </Card>
      )}

      {/* Category Pie */}
      <Card title={`รายจ่ายตามหมวดหมู่ (${PERIOD_LABEL[period]})`} noPadding>
        <div className="p-4">
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              กำลังโหลด...
            </div>
          ) : (
            <CategoryPieChart data={catExp} />
          )}
        </div>
      </Card>
    </div>
  )
}
