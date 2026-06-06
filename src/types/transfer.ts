import type { Account } from './account'

export interface Transfer {
  id:            string
  userId:        string
  fromAccountId: string
  toAccountId:   string
  transactionId: string
  amount:        number
  transferDate:  string   // YYYY-MM-DD
  description:   string | null
  createdAt:     string
  fromAccount:   Pick<Account, 'id' | 'name' | 'type'>
  toAccount:     Pick<Account, 'id' | 'name' | 'type'>
}
