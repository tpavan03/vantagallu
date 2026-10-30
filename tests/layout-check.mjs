// Focused layout regression: a long ingredient list must not bury cooking controls.
// Run with the web dev server on 4400: node tests/layout-check.mjs
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome', args: ['--disable-http2', '--disable-quic'] })
const results = []
const artifactDir = '/tmp/vantagallu-layout'
await mkdir(artifactDir, { recursive: true })
try {
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [320, 780]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.route('**/api/health', route => route.fulfill({ json: { configured: { database: false, ownerAccess: false, chat: false, voice: false } } }))
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4400/')
    await page.locator('.recipe-row').filter({ hasText: 'Hyderabadi chicken dum biryani' }).click()
    await page.getByRole('button', { name: 'Cook this recipe' }).click()
    await page.getByRole('heading', { name: 'Hyderabadi chicken dum biryani.' }).waitFor()
    const list = page.getByRole('region', { name: 'Recipe ingredients' })
    const next = page.getByRole('button', { name: /Next step/ })
    const bounds = await next.boundingBox()
    assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= height, `Next step outside ${width}×${height} viewport`)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Page overflows horizontally')
    await list.focus()
    const before = await list.evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft, height: el.clientHeight, scrollHeight: el.scrollHeight, width: el.clientWidth, scrollWidth: el.scrollWidth }))
    if (width > 780) {
      assert.ok(before.scrollHeight > before.height, 'Long desktop ingredient list must scroll internally')
      assert.ok(before.height <= 400, 'Ingredient list exceeds its own height boundary')
      await list.press('End')
      await page.waitForFunction(() => document.querySelector('.ingredients').scrollTop > 0)
    } else {
      assert.ok(before.scrollWidth > before.width, 'Mobile ingredient rail must remain horizontal')
      assert.ok(before.height <= 180, 'Mobile ingredient rail should stay compact')
      await list.press('ArrowRight')
      await page.waitForFunction(() => document.querySelector('.ingredients').scrollLeft > 0)
    }
    const violations = (await new AxeBuilder({ page }).analyze()).violations
    assert.deepEqual(violations.map(item => item.id), [], `Accessibility findings at ${width}×${height}`)
    await page.screenshot({ path: `${artifactDir}/kitchen-${width}.png`, fullPage: false })
    await next.click()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vantagallu:1:guest')).sessions[0])
    assert.equal(saved.completedStepIds.length, 1, 'Visible Next step must remain actionable')
    results.push({ width, height, nextReachable: true, ingredientsKeyboardScrollable: true, pageOverflow: false, axeViolations: 0, nextCommitsProgress: true })
    await context.close()
  }
  await writeFile(`${artifactDir}/results.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}
