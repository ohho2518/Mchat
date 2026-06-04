import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const AUTH_FILE = 'tests/e2e/.auth/user.json'

// Test credentials — override via env vars in CI
const EMAIL    = process.env.TEST_EMAIL    ?? 'e2e-test@mchat.test'
const PASSWORD = process.env.TEST_PASSWORD ?? 'e2eTestPass123'
const NAME     = 'ผู้ทดสอบ E2E'

setup('create test user and save auth state', async ({ page }) => {
  // Ensure .auth dir exists
  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Register test user (ignore 409 conflict if already exists)
  const res = await page.request.post('/api/auth/register', {
    data: { name: NAME, email: EMAIL, password: PASSWORD },
  })
  expect([201, 409]).toContain(res.status())

  // Login via UI to capture cookies/session
  // Input has no `id` prop — use attribute selectors instead of getByLabel
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL('**/chat', { timeout: 10_000 })
  await expect(page).toHaveURL(/\/chat/)

  await page.context().storageState({ path: AUTH_FILE })
})
