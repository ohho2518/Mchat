// MChat — Dashboard Types

export type DashboardPeriod = 'today' | 'week' | 'month' | 'year'

export interface DashboardSummary {
  incomeToday: number
  expenseToday: number
  balanceToday: number
  incomeMonth: number
  expenseMonth: number
  balanceMonth: number
}

export interface DailyCashflow {
  date: string       // YYYY-MM-DD
  income: number
  expense: number
  balance: number
}

export interface CategoryExpense {
  categoryId: string
  category: string
  amount: number
  percent: number
  color?: string
}
