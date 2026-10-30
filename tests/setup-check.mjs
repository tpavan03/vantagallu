// Real guest-browser checks, with no model calls or cloud writes.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome' })
const results = []
const artifactDir = '/tmp/vantagallu-layout'
await mkdir(artifactDir, { recursive: true })
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 } })
    const page = await context.newPage()
    await page.route('**/api/health', route => route.fulfill({ json: { configured: { database: false, ownerAccess: false, chat: false, voice: false } } }))
    await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4400/')
    await page.locator('.recipe-row').filter({ hasText: 'Pesarattu' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /Customize ingredients/ }).click()
    await dialog.getByRole('radio', { name: /Induction/ }).check()
    const missing = dialog.locator('.pantry-choice').filter({ hasText: 'Ginger' }).first()
    await missing.click()
    assert.equal(await missing.getAttribute('aria-pressed'), 'false')
    await dialog.getByRole('textbox', { name: 'Other ingredients I have' }).fill('Curd and chicken masala powder')
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id), [])
    await dialog.getByRole('button', { name: /Cook with my setup/ }).click()
    await page.getByRole('heading', { name: 'Pesarattu.' }).waitFor()
    let state = await page.evaluate(() => JSON.parse(localStorage.getItem('vantagallu:1:guest')).sessions[0])
    assert.equal(state.cookingSetup.heatSource, 'induction')
    assert.equal(state.cookingSetup.unavailableIngredientIds.length, 1)
    assert.equal(state.cookingSetup.pantryNotes, 'Curd and chicken masala powder')
    assert.equal(state.addedIngredients.length, 0)
    await page.reload()
    await page.getByRole('button', { name: /Cooking setup.*1 missing/ }).click()
    assert.equal(await dialog.getByRole('radio', { name: /Induction/ }).isChecked(), true)
    await dialog.getByRole('textbox', { name: 'Other ingredients I have' }).waitFor()
    assert.equal(await dialog.getByRole('textbox', { name: 'Other ingredients I have' }).inputValue(), 'Curd and chicken masala powder')
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id), [])
    await page.screenshot({ path: `${artifactDir}/setup-${width}.png` })
    await dialog.getByRole('radio', { name: /Gas stove/ }).check()
    await dialog.getByRole('textbox', { name: 'Other ingredients I have' }).fill('')
    await dialog.getByRole('button', { name: 'Save setup', exact: true }).click()
    state = await page.evaluate(() => JSON.parse(localStorage.getItem('vantagallu:1:guest')).sessions[0])
    assert.equal(state.cookingSetup.heatSource, 'gas')
    assert.equal(state.cookingSetup.pantryNotes || '', '')
    await page.locator('.ingredient-item').filter({ hasText: 'Whole green moong' }).click()
    await page.getByRole('button', { name: /Cooking setup/ }).click()
    assert.equal(await dialog.locator('.pantry-choice').filter({ hasText: 'Whole green moong' }).isDisabled(), true)
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    results.push({ width, previewSetupSaved: true, missingNeverAdded: true, reloadRestores: true, pantryNotesPersistAndClear: true, activeSetupSaved: true, addedIngredientsLocked: true, axeViolations: 0, pageOverflow: false })
    await context.close()
  }
  await writeFile(`${artifactDir}/setup-results.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}
