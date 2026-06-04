import { test, expect } from '@playwright/test'

test.describe('Bottom navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
  })

  test('navigates to dashboard via bottom nav', async ({ page }) => {
    await page.getByRole('link', { name: 'รายงาน' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('วันนี้')).toBeVisible({ timeout: 5_000 })
  })

  test('navigates to transactions via bottom nav', async ({ page }) => {
    await page.getByRole('link', { name: 'รายการ' }).click()
    await expect(page).toHaveURL(/\/transactions/)
  })

  test('navigates to settings via bottom nav', async ({ page }) => {
    await page.getByRole('link', { name: 'ตั้งค่า' }).click()
    await expect(page).toHaveURL(/\/settings/)
  })

  test('navigates back to chat via bottom nav', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'บันทึก' }).click()
    await expect(page).toHaveURL(/\/chat/)
  })
})

test.describe('Page routing', () => {
  test('root / redirects to /chat', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/chat/)
  })

  test('/accounts page loads correctly', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page).toHaveURL(/\/accounts/)
    // Either shows account list or empty state
    await expect(
      page.getByText('บัญชีของฉัน').or(page.getByText('ยังไม่มีบัญชี'))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('/debts page loads correctly', async ({ page }) => {
    await page.goto('/debts')
    await expect(page).toHaveURL(/\/debts/)
    await expect(
      page.getByText('เราเป็นหนี้').or(page.getByText('ไม่มีรายการค้างอยู่'))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('/categories page loads correctly', async ({ page }) => {
    await page.goto('/categories')
    await expect(page).toHaveURL(/\/categories/)
    // Default categories exist after seed
    await expect(page.getByText('รายจ่าย')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('shows user profile and management links', async ({ page }) => {
    await expect(page.getByText('จัดการข้อมูล')).toBeVisible()
    await expect(page.getByRole('link', { name: 'บัญชีของฉัน' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'หมวดหมู่' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'หนี้สิน' })).toBeVisible()
  })

  test('logout button redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
    await page.waitForURL('**/login', { timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
