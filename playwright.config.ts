import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests', testMatch: 'kitchen.spec.ts', fullyParallel: true,
  timeout: 30000, expect: { timeout: 5000 },
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4400', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome', args: ['--disable-http2', '--disable-quic'] }, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
    { name: 'narrow-phone', use: { viewport: { width: 320, height: 780 } } },
  ],
})
