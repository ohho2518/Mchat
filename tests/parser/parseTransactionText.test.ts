// MChat Parser — Test Runner (tsx)
// รัน: npx tsx tests/parser/parseTransactionText.test.ts

import { parseTransactionText } from '../../src/lib/parser/parseTransactionText'
import { seedCategories } from '../../src/data/seedCategories'

// แปลง seedCategories → CategoryKeywordMap format
const categories = seedCategories.map((c) => ({
  categoryName: c.name,
  type: c.type,
  keywords: c.keywords ?? [],
}))

// ─── Test Cases ───────────────────────────────────────────
const tests: Array<{
  input: string
  expectedType: string
  expectedAmount: number | null
  expectedCategory?: string
}> = [
  // 20 กรณีหลัก
  { input: 'จ่ายค่าน้ำมัน 500 วันนี้',         expectedType: 'expense',  expectedAmount: 500,   expectedCategory: 'ค่าน้ำมัน' },
  { input: 'เติมน้ำมัน 1,200 รถกระบะ',         expectedType: 'expense',  expectedAmount: 1200,  expectedCategory: 'ค่าน้ำมัน' },
  { input: 'ขายของ 850 เงินสด',                expectedType: 'income',   expectedAmount: 850,   expectedCategory: 'ขายของ' },
  { input: 'รับโอนจากลูกค้า 3500 งานซ่อมระบบ', expectedType: 'income',   expectedAmount: 3500 },
  { input: 'ซื้อของเข้าร้าน 2450',             expectedType: 'expense',  expectedAmount: 2450 },
  { input: 'ค่าไฟ 1780 เดือนนี้',              expectedType: 'expense',  expectedAmount: 1780,  expectedCategory: 'ค่าไฟ' },
  { input: 'ค่าน้ำ 250',                       expectedType: 'expense',  expectedAmount: 250,   expectedCategory: 'ค่าน้ำ' },
  { input: 'จ่ายค่าแรงช่าง 3000',             expectedType: 'expense',  expectedAmount: 3000,  expectedCategory: 'ค่าแรง' },
  { input: 'ซ่อมรถ 2500',                      expectedType: 'expense',  expectedAmount: 2500,  expectedCategory: 'ค่าซ่อม' },
  { input: 'กินข้าว 80',                       expectedType: 'expense',  expectedAmount: 80,    expectedCategory: 'ค่าอาหาร' },
  { input: 'ขายทุเรียน 12000 วันที่ 25',       expectedType: 'income',   expectedAmount: 12000 },
  { input: 'รับค่างานติดตั้ง 5000',            expectedType: 'income',   expectedAmount: 5000 },
  { input: 'โอนจากบัญชีร้านไปบัญชีสวน 3000',  expectedType: 'transfer', expectedAmount: 3000 },
  { input: 'ถอนเงินสด 5000',                   expectedType: 'transfer', expectedAmount: 5000 },
  { input: 'ฝากเงินเข้าธนาคาร 12000',         expectedType: 'transfer', expectedAmount: 12000 },
  { input: 'ยืมเงินแม่ 5000',                  expectedType: 'debt',     expectedAmount: 5000 },
  { input: 'คืนเงินพี่ 2000',                  expectedType: 'debt',     expectedAmount: 2000 },
  { input: 'ลูกค้าค้างจ่าย 3500',             expectedType: 'debt',     expectedAmount: 3500 },
  { input: 'ซื้ออาหารไก่ 480',                expectedType: 'expense',  expectedAmount: 480 },
  { input: 'รับเงินสวน 9000',                  expectedType: 'income',   expectedAmount: 9000 },
  // 5 edge cases
  { input: 'จ่าย ๕๐๐ วันนี้',                expectedType: 'expense',  expectedAmount: 500 },
  { input: 'ขาย 1,250.50 บาท',               expectedType: 'income',   expectedAmount: 1250.50 },
  { input: 'ค่าน้ำมัน',                       expectedType: 'expense',  expectedAmount: null },
  { input: '500',                              expectedType: 'unknown',  expectedAmount: 500 },
  { input: 'รับเงินยืม 3000',                 expectedType: 'debt',     expectedAmount: 3000 },
]

// ─── Runner ───────────────────────────────────────────────
let pass = 0
let fail = 0

console.log('\n🧪 MChat Parser Test Results\n')
console.log('─'.repeat(72))

tests.forEach((tc, i) => {
  const result = parseTransactionText(tc.input, categories)

  const typeOk   = result.type   === tc.expectedType
  const amountOk = result.amount === tc.expectedAmount

  const catOk    = tc.expectedCategory
    ? result.categoryName === tc.expectedCategory
    : true

  const ok = typeOk && amountOk && catOk
  ok ? pass++ : fail++

  const icon = ok ? '✅' : '❌'
  const num  = String(i + 1).padStart(2, ' ')
  console.log(`${icon} #${num} "${tc.input}"`)

  if (!typeOk) {
    console.log(`      type:     expected="${tc.expectedType}"  got="${result.type}"`)
  }
  if (!amountOk) {
    console.log(`      amount:   expected=${tc.expectedAmount}  got=${result.amount}`)
  }
  if (!catOk) {
    console.log(`      category: expected="${tc.expectedCategory}"  got="${result.categoryName}"`)
  }
  if (!ok) {
    console.log(`      confidence: ${result.confidence.toFixed(2)}`)
  }
})

console.log('─'.repeat(72))
console.log(`\n📊 Results: ${pass}/${tests.length} passed  (${fail} failed)\n`)
process.exit(fail > 0 ? 1 : 0)
