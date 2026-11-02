// Explicitly opt-in, signed-out DEBUG emulator verification. No provider calls.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { _android, expect } from '@playwright/test'

assert.equal(process.env.VANTAGALLU_ANDROID_SMOKE, '1', 'Enable VANTAGALLU_ANDROID_SMOKE=1 for the isolated emulator check.')
const serial = process.env.ANDROID_SERIAL || 'emulator-5554'
assert.match(serial, /^emulator-\d+$/, 'This synthetic-data check is restricted to an emulator.')
const adb = process.env.ADB || (process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools/adb') : 'adb')
const pkg = 'in.tpavan.vantagallu.debug'
const out = '/tmp/vantagallu-android-review'
mkdirSync(out, { recursive: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const shell = (...args) => execFileSync(adb, ['-s', serial, 'shell', ...args], { encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] })
let device
async function attach() {
  shell('am', 'start', '-n', `${pkg}/in.tpavan.vantagallu.MainActivity`)
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const devices = await _android.devices()
      device = devices.find(candidate => candidate.serial() === serial)
      assert.ok(device, 'Emulator is not available to Playwright Android.')
      const view = await device.webView({ pkg, timeout: 1000 })
      return await view.page()
    } catch {
      await device?.close().catch(() => {})
      device = undefined
      await pause(500)
    }
  }
  throw new Error('Debug Android WebView did not become available.')
}
const readGuest = page => page.evaluate(() => {
  const store = JSON.parse(localStorage.getItem('vantagallu:1:guest') || 'null')
  const session = store?.sessions.find(item => item.id === store.currentId)
  return session ? { id: session.id, step: session.currentStepId, added: session.addedIngredients, completed: session.completedStepIds } : null
})

try {
  let page = await attach()
  const signedIn = await page.evaluate(() => Object.keys(localStorage).some(key => {
    if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) return false
    try { return !!JSON.parse(localStorage.getItem(key) || 'null')?.access_token } catch { return false }
  }))
  assert.equal(signedIn, false, 'Refusing to exercise a signed-in debug account.')
  assert.equal(await page.evaluate(() => window.Capacitor.getPlatform()), 'android')
  assert.equal(new URL(page.url()).origin, 'https://localhost')
  assert.equal(await page.evaluate(() => isSecureContext), true)
  const api = await page.evaluate(async () => {
    const response = await fetch('https://vantagallu.vercel.app/api/health')
    return { status: response.status, data: await response.json() }
  })
  assert.equal(api.status, 200, 'Native-origin production API health failed.')
  assert.equal(api.data.configured.voice, true)

  // A rerun can open the recipe library without clearing saved debug history.
  if (await page.getByRole('searchbox').count() === 0) {
    await page.getByRole('button', { name: 'Vantagallu recipe library', exact: true }).click()
  }
  await page.locator('.recipe-row').filter({ hasText: 'Pesarattu' }).click()
  await expect(page.getByRole('dialog').getByText('The method you’re starting with')).toBeVisible()
  await page.getByRole('button', { name: 'Cook this recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Pesarattu.' })).toBeVisible()
  await page.locator('.ingredient-item').filter({ hasText: 'Whole green moong' }).click()
  const started = await readGuest(page)
  assert.equal(started.added[0].quantity, .5)
  await page.getByRole('button', { name: /Open voice view/ }).click()
  await expect(page.getByRole('dialog').getByRole('img', { name: 'COOKer' })).toBeVisible()
  await page.screenshot({ path: `${out}/native-cooker.png` })
  shell('input', 'keyevent', '4')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  assert.equal((await readGuest(page)).id, started.id, 'Android Back changed the cooking session.')

  shell('pm', 'grant', pkg, 'android.permission.RECORD_AUDIO')
  const media = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const tracks = stream.getAudioTracks()
    const live = tracks.length === 1 && tracks[0].readyState === 'live'
    stream.getTracks().forEach(track => track.stop())
    return { live, stopped: tracks.every(track => track.readyState === 'ended') }
  })
  assert.deepEqual(media, { live: true, stopped: true })
  assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true)

  await page.context().setOffline(true)
  await page.getByRole('button', { name: /Next step/ }).click()
  const saved = await readGuest(page)
  assert.equal(saved.id, started.id)
  assert.ok(saved.completed.length > 0)
  await page.context().setOffline(false)
  await page.evaluate(() => window.addEventListener('vantagallu:app-background', () => localStorage.setItem('native-smoke-background', 'true')))
  shell('input', 'keyevent', '3')
  await pause(500)
  shell('am', 'start', '-n', `${pkg}/in.tpavan.vantagallu.MainActivity`)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('native-smoke-background'))).toBe('true')
  await page.screenshot({ path: `${out}/native-cooking.png` })
  await device.close()
  device = undefined
  shell('am', 'force-stop', pkg)
  page = await attach()
  await expect(page.getByRole('heading', { name: 'Pesarattu.' })).toBeVisible()
  assert.deepEqual(await readGuest(page), saved, 'Force-stop/reopen did not preserve the confirmed cooking state.')
  await page.evaluate(() => localStorage.removeItem('native-smoke-background'))
  const result = { nativeAndroid: true, bundledLocalUi: true, productionApiCors: true,
    confirmedQuantityPreserved: true, hardwareBackClosesDialog: true,
    microphoneCaptureAndRelease: true, offlineCooking: true,
    backgroundEvent: true, processRestartPersistence: true, providerCalls: 0 }
  writeFileSync(`${out}/result.json`, JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
} finally {
  await device?.close().catch(() => {})
}
