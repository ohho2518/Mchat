import { test, expect } from '@playwright/test'

// All tests use saved auth state (set in playwright.config.ts → project "app")

test.describe('Chat page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
  })

  test('shows chat input and welcome message', async ({ page }) => {
    await expect(page.getByPlaceholder(/จ่ายค่าน้ำมัน/)).toBeVisible()
    await expect(page.getByText('สวัสดีครับ')).toBeVisible()
  })

  test('parses Thai expense text and shows transaction card', async ({ page }) => {
    const input = page.getByPlaceholder(/จ่ายค่าน้ำมัน/)

    await input.fill('จ่ายค่าน้ำมัน 500 วันนี้')
    await input.press('Enter')

    // Card should appear with parsed amount
    await expect(page.getByText('฿500')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('รายจ่าย')).toBeVisible()
    await expect(page.getByRole('button', { name: 'ยืนยัน' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'ยกเลิก' })).toBeVisible()
  })

  test('confirms transaction and shows success message', async ({ page }) => {
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).fill('ซื้อของ 200 บาท')
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).press('Enter')

    await expect(page.getByText('฿200')).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    await expect(page.getByText('บันทึกรายการแล้ว')).toBeVisible({ timeout: 8_000 })
    // Input should be cleared and ready for next entry
    await expect(page.getByPlaceholder(/จ่ายค่าน้ำมัน/)).toHaveValue('')
  })

  test('rejects transaction and shows cancelled message', async ({ page }) => {
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).fill('กินข้าว 80')
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).press('Enter')

    await expect(page.getByText('฿80')).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: 'ยกเลิก' }).click()

    await expect(page.getByText('ยกเลิกรายการ')).toBeVisible()
  })

  test('shows low-confidence warning for vague input', async ({ page }) => {
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).fill('500')
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).press('Enter')

    await expect(page.getByText('กรุณาตรวจสอบก่อนบันทึก')).toBeVisible({ timeout: 8_000 })
  })

  test('shows warning and disables confirm when amount is missing', async ({ page }) => {
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).fill('ค่าน้ำมัน')
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).press('Enter')

    await expect(page.getByText('ไม่พบยอดเงิน')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: 'ยืนยัน' })).toBeDisabled()
  })

  test('parses income transaction correctly', async ({ page }) => {
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).fill('ขายของ 850 เงินสด')
    await page.getByPlaceholder(/จ่ายค่าน้ำมัน/).press('Enter')

    await expect(page.getByText('฿850')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('รายรับ')).toBeVisible()
  })

  test('can enter multiple transactions in sequence', async ({ page }) => {
    const input = page.getByPlaceholder(/จ่ายค่าน้ำมัน/)

    // First transaction
    await input.fill('ค่าไฟ 780')
    await input.press('Enter')
    await expect(page.getByText('฿780')).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: 'ยืนยัน' }).click()
    await expect(page.getByText('บันทึกรายการแล้ว')).toBeVisible({ timeout: 5_000 })

    // Second transaction
    await input.fill('ขายสินค้า 1200')
    await input.press('Enter')
    await expect(page.getByText('฿1,200')).toBeVisible({ timeout: 8_000 })
  })
})
