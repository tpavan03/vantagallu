import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loadEnv } from 'vite'
import { recipeCatalog } from '../src/data/recipes'
import { createCookingSession } from '../src/domain/session'

async function startPesarattu(page: Page) {
  await page.goto('/')
  await page.locator('.recipe-row').filter({ hasText: 'Pesarattu' }).click()
  await expect(page.getByRole('dialog').getByText('The method you’re starting with')).toBeVisible()
  await expect(page.getByRole('dialog').getByText(/Kitchen testing pending/)).toBeVisible()
  await page.getByRole('button', { name: 'Cook this recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Pesarattu.' })).toBeVisible()
}

async function guest(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('vantagallu:1:guest') || 'null'))
}

test('the full real catalogue is searchable and planned dishes never masquerade as available', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.result-count')).toHaveText(`${recipeCatalog.length} recipes`)
  await page.getByRole('combobox', { name: 'Filter by region' }).selectOption('telangana')
  await expect(page.locator('.result-count')).toHaveText(`${recipeCatalog.filter(recipe => recipe.region === 'telangana').length} recipes`)
  await page.getByRole('combobox', { name: 'Filter by diet' }).selectOption('veg')
  const vegetarianCount = recipeCatalog.filter(recipe => recipe.region === 'telangana' && ['vegetarian', 'vegan'].includes(recipe.diet)).length
  await expect(page.locator('.result-count')).toHaveText(`${vegetarianCount} ${vegetarianCount === 1 ? 'recipe' : 'recipes'}`)
  await page.getByRole('combobox', { name: 'Filter by region' }).selectOption('all')
  await page.getByRole('combobox', { name: 'Filter by diet' }).selectOption('all')
  await page.getByRole('searchbox').fill('gutti vankaya')
  await expect(page.locator('.recipe-row')).toHaveCount(1)
  await page.getByRole('searchbox').fill('avakaya mango pickle')
  await expect(page.locator('.recipe-row')).toHaveCount(0)
  await page.getByRole('searchbox').fill('చికెన్')
  await expect(page.locator('.recipe-row').first()).toBeVisible()
})

test('source method is visible before cooking and Escape restores focus', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('.recipe-row').filter({ hasText: 'Pesarattu' })
  await card.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/Dassana Amit — whole-moong/)).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Dassana’s Veg Recipes/ })).toHaveAttribute('href', /vegrecipesofindia.com\/moong-dal-dosa/)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(card).toBeFocused()
})

test('confirmed quantities survive resizing, reload and offline hand cooking', async ({ page, context }) => {
  await startPesarattu(page)
  await page.locator('.ingredient-item').filter({ hasText: 'Whole green moong' }).click()
  await page.getByRole('button', { name: /5 people/ }).click()
  await page.getByRole('spinbutton', { name: 'People' }).fill('10')
  await page.getByRole('button', { name: /Update quantity/ }).click()
  const before = await guest(page)
  expect(before.sessions[0].addedIngredients[0].quantity).toBe(.5)
  expect(before.sessions[0].servings).toBe(10)
  await page.locator('.ingredient-item').filter({ hasText: 'Whole green moong' }).click()
  expect((await guest(page)).sessions[0].addedIngredients.map((item: { quantity: number }) => item.quantity)).toEqual([.5, .5])
  await page.reload()
  await expect(page.getByRole('button', { name: /10 people/ })).toBeVisible()
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Next step', exact: false }).click()
  await expect(page.getByRole('heading', { name: /Blend with ginger/ })).toBeVisible()
  expect((await guest(page)).sessions[0].completedStepIds).toEqual(['soak'])
  expect((await guest(page)).pending).toEqual([])
})

test('cancelling and starting a timer preserves the cancelled timer and uses a new ID', async ({ page }) => {
  await startPesarattu(page)
  await page.getByRole('button', { name: /Start .* timer/ }).click()
  const oldId = (await guest(page)).sessions[0].timers[0].id
  await page.getByRole('button', { name: /Cancel .* timer/ }).click()
  await page.getByRole('button', { name: /Start .* timer/ }).click()
  const timers = (await guest(page)).sessions[0].timers
  expect(timers).toHaveLength(2)
  expect(timers[0].status).toBe('cancelled')
  expect(timers[1].id).not.toBe(oldId)
  expect(timers[1].status).toBe('running')
})

test('phone and desktop views have no overflow or serious accessibility violations', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await startPesarattu(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const violations = (await new AxeBuilder({ page }).analyze()).violations
  expect(violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([])
  await page.getByRole('button', { name: /Adjust as I cook/ }).click()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
})

test('unavailable Google sign-in stays on the app and leaves guest cooking usable', async ({ page }) => {
  await startPesarattu(page)
  const appOrigin = new URL(page.url()).origin
  await page.route('**/auth/v1/health', route => route.abort())
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('button', { name: /Continue with Google/ }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Cloud sign-in is unavailable')
  expect(new URL(page.url()).origin).toBe(appOrigin)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Next step/ }).click()
  await expect(page.getByRole('heading', { name: /Blend with ginger/ })).toBeVisible()
})

test('a late cloud response cannot replace the newly selected account', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Account transport race is independent of viewport.')
  const publicEnv = loadEnv('development', process.cwd(), 'VITE_')
  test.skip(!publicEnv.VITE_SUPABASE_URL, 'Requires the configured public auth client; all network calls remain mocked.')
  const key = `sb-${new URL(publicEnv.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
  const ownerA = '11111111-1111-4111-8111-111111111111'
  const ownerB = '22222222-2222-4222-8222-222222222222'
  const user = (id: string) => ({ id, email: `${id.slice(0, 4)}@example.invalid`, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() })
  const auth = (id: string) => ({ access_token: `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.fixture`, refresh_token: 'local-fixture-only', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: user(id) })
  const first = auth(ownerA), second = auth(ownerB)
  const stateA = createCookingSession(recipeCatalog[0], { ownerId: ownerA })
  const stateB = createCookingSession(recipeCatalog[1], { ownerId: ownerB })
  let firstRequested = false
  await page.route('**/auth/v1/**', route => route.fulfill({ json: user(ownerA) }))
  await page.route('**/api/**', async route => {
    if (new URL(route.request().url()).pathname === '/api/health') return route.fulfill({ json: { configured: { database: true, ownerAccess: true, chat: false, voice: false } } })
    if (route.request().headers().authorization === `Bearer ${first.access_token}`) {
      firstRequested = true
      await new Promise(resolve => setTimeout(resolve, 1200))
      return route.fulfill({ json: { sessions: [stateA] } })
    }
    return route.fulfill({ json: { sessions: [stateB] } })
  })
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key, value: JSON.stringify(first) })
  await page.goto('/')
  await expect.poll(() => firstRequested).toBe(true)
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value)
    const channel = new BroadcastChannel(key)
    channel.postMessage({ event: 'SIGNED_IN', session: JSON.parse(value) })
    channel.close()
  }, { key, value: JSON.stringify(second) })
  await expect(page.getByRole('heading', { name: 'Palli chutney.' })).toBeVisible()
  await page.waitForTimeout(1400)
  await expect(page.getByRole('heading', { name: 'Palli chutney.' })).toBeVisible()
  const scopes = await page.evaluate(({ a, b }) => ({ a: JSON.parse(localStorage.getItem(`vantagallu:1:user:${a}`) || 'null'), b: JSON.parse(localStorage.getItem(`vantagallu:1:user:${b}`) || 'null') }), { a: ownerA, b: ownerB })
  expect(scopes.a.sessions).toEqual([])
  expect(scopes.b.sessions.map((session: { ownerId: string }) => session.ownerId)).toEqual([ownerB])
})
