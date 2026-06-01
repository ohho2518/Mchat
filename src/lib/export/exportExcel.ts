import * as XLSX from 'xlsx'

interface ExportRow {
  วันที่: string
  ประเภท: string
  จำนวนเงิน: number
  หมวดหมู่: string
  รายละเอียด: string
  วิธีชำระ: string
}

export function exportExcel(rows: ExportRow[], filename = 'transactions.xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'รายการ')
  XLSX.writeFile(wb, filename)
}
