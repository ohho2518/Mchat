import { test, expect } from '@playwright/test'

const EMAIL    = process.env.TEST_EMAIL    ?? 'e2e-test@mchat.test'
const PASSWORD = process.env.TEST_PASSWORD ?? 'e2eTestPass123'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows login form with MChat branding', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'MChat' })).toBeVisible()
    await expect(page.getByLabel('อีเมล')).toBeVisible()
    await expect(page.getByLabel('รหัสผ่าน')).toBeVisible()
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  })

  test('shows error with wrong password', async ({ page }) => {
    await page.getByLabel('อีเมล').fill(EMAIL)
    await page.getByLabel('รหัสผ่าน').fill('wrongpassword')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error with unknown email', async ({ page }) => {
    await page.getByLabel('อีเมล').fill('nobody@mchat.test')
    await page.getByLabel('รหัสผ่าน').fill('somepass')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
  })

  test('redirects to /chat after successful login', async ({ page }) => {
    await page.getByLabel('อีเมล').fill(EMAIL)
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    await page.waitForURL('**/chat', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/chat/)
  })

  test('can switch to register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'สมัครใช้งาน' }).click()

    await expect(page.getByLabel('ชื่อ')).toBeVisible()
    await expect(page.getByRole('button', { name: 'สมัครและเข้าสู่ระบบ' })).toBeVisible()
  })

  test('shows error when registering with duplicate email', async ({ page }) => {
    await page.getByRole('button', { name: 'สมัครใช้งาน' }).click()

    await page.getByLabel('ชื่อ').fill('ทดสอบ')
    await page.getByLabel('อีเมล').fill(EMAIL)   // already registered
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD)
    await page.getByRole('button', { name: 'สมัครและเข้าสู่ระบบ' }).click()

    await expect(page.getByText('ถูกใช้งานแล้ว')).toBeVisible()
  })
})

test.describe('Auth guard', () => {
  test('redirects unauthenticated user from /chat to /login', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForURL('**/login**', { timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
