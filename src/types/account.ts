export type AccountType = 'cash' | 'bank' | 'wallet' | 'business' | 'farm' | 'other'

export interface Account {
  id:             string
  userId:         string
  name:           string
  type:           AccountType
  openingBalance: number
  isActive:       boolean
  createdAt:      string
  updatedAt:      string
}
