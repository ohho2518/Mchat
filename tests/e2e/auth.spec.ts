import { test, expect, type Page } from '@playwright/test'

const EMAIL    = process.env.TEST_EMAIL    ?? 'e2e-test@mchat.test'
const PASSWORD = process.env.TEST_PASSWORD ?? 'e2eTestPass123'

// Input component has no `id` prop on the login page, so getByLabel won't resolve.
// Use attribute/placeholder selectors instead.
function emailInput(page: Page)    { return page.locator('input[type="email"]') }
function passwordInput(page: Page) { return page.locator('input[type="password"]') }
function submitBtn(page: Page)     { return page.locator('button[type="submit"]') }
function nameInput(page: Page)     { return page.getByPlaceholder('ชื่อของคุณ') }

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows login form with MChat branding', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'MChat' })).toBeVisible()
    await expect(emailInput(page)).toBeVisible()
    await expect(passwordInput(page)).toBeVisible()
    await expect(submitBtn(page)).toBeVisible()
  })

  test('shows error with wrong password', async ({ page }) => {
    await emailInput(page).fill(EMAIL)
    await passwordInput(page).fill('wrongpassword')
    await submitBtn(page).click()

    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error with unknown email', async ({ page }) => {
    await emailInput(page).fill('nobody@mchat.test')
    await passwordInput(page).fill('somepass')
    await submitBtn(page).click()

    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
  })

  test('redirects to /chat after successful login', async ({ page }) => {
    await emailInput(page).fill(EMAIL)
    await passwordInput(page).fill(PASSWORD)
    await submitBtn(page).click()

    await page.waitForURL('**/chat', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/chat/)
  })

  test('can switch to register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'สมัครใช้งาน' }).click()

    await expect(nameInput(page)).toBeVisible()
    await expect(submitBtn(page)).toContainText('สมัครและเข้าสู่ระบบ')
  })

  test('shows error when registering with duplicate email', async ({ page }) => {
    await page.getByRole('button', { name: 'สมัครใช้งาน' }).click()

    await nameInput(page).fill('ทดสอบ')
    await emailInput(page).fill(EMAIL)   // already registered by global-setup
    await passwordInput(page).fill(PASSWORD)
    await submitBtn(page).click()

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
