import Papa from 'papaparse'

interface ExportRow {
  date: string
  type: string
  amount: number
  category: string
  description: string
  paymentMethod: string
}

export function exportCsv(rows: ExportRow[], filename = 'transactions.csv') {
  const csv = Papa.unparse(rows)
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
