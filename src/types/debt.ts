export type DebtType   = 'borrowed_from_other' | 'lent_to_other' | 'receivable' | 'payable'
export type DebtStatus = 'open' | 'partial' | 'paid' | 'cancelled'

export interface Debt {
  id:              string
  userId:          string
  personName:      string | null
  debtType:        DebtType
  amount:          number
  remainingAmount: number
  dueDate:         string | null  // YYYY-MM-DD
  status:          DebtStatus
  description:     string | null
  createdAt:       string
  updatedAt:       string
}
