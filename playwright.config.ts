import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,       // run sequentially — shared DB state
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace:   'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'th-TH',
  },

  projects: [
    // 1. Global setup — register test user & save auth state
    {
      name: 'setup',
      testMatch: '**/global-setup.ts',
    },
    // 2. Auth tests — no pre-existing login state
    {
      name: 'auth',
      testMatch: '**/auth.spec.ts',
      dependencies: ['setup'],
    },
    // 3. App tests — use saved auth state
    {
      name: 'app',
      testMatch: '**/{chat,navigation}.spec.ts',
      dependencies: ['setup'],
      use: {
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],

  // Start Next.js dev server automatically
  webServer: {
    command: 'npm run dev',
    url:     'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
