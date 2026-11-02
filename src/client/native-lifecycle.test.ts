import { afterEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ listeners: new Map<string, (value: unknown) => unknown>(), launch: vi.fn() }))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/app', () => ({ App: {
  addListener: vi.fn(async (event: string, handler: (value: unknown) => unknown) => { mocks.listeners.set(event, handler); return { remove: async () => {} } }),
  getLaunchUrl: mocks.launch, minimizeApp: vi.fn(),
} }))
vi.mock('@capacitor/browser', () => ({ Browser: { close: async () => {}, open: vi.fn() } }))
import { initializeNativeApp } from './native'

afterEach(() => { vi.unstubAllGlobals(); mocks.listeners.clear(); mocks.launch.mockReset() })
describe('Android lifecycle integration', () => {
  it('pauses capture on onPause before the later appStateChange notification', async () => {
    const window = new EventTarget(), paused = vi.fn()
    window.addEventListener('vantagallu:app-background', paused)
    vi.stubGlobal('window', window)
    vi.stubGlobal('document', { documentElement: { dataset: {} } })
    const auth = { exchangeCodeForSession: vi.fn(), setSession: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn() }
    await initializeNativeApp({ auth })
    mocks.listeners.get('pause')!({})
    expect(paused).toHaveBeenCalledOnce()
    expect(auth.stopAutoRefresh).toHaveBeenCalledOnce()
    mocks.listeners.get('appStateChange')!({ isActive: true })
    expect(auth.startAutoRefresh).toHaveBeenCalledOnce()
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })
  it('processes a cold-launch callback only once when appUrlOpen supplies the same URL', async () => {
    vi.stubGlobal('window', new EventTarget())
    vi.stubGlobal('document', { documentElement: { dataset: {} } })
    const url = 'in.tpavan.vantagallu://login-callback/?code=fixture-code'
    const auth = { exchangeCodeForSession: vi.fn(async () => ({ error: null })), setSession: vi.fn(), startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn() }
    mocks.launch.mockImplementation(async () => { mocks.listeners.get('appUrlOpen')!({ url }); return { url } })
    await initializeNativeApp({ auth })
    expect(auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('fixture-code')
  })
})
