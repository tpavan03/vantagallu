import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { ANDROID_APP_ID, ANDROID_AUTH_REDIRECT, resolveApiBase } from '../domain/mobile'

export const isNativeApp = () => Capacitor.isNativePlatform()
export const apiBaseUrl = () => resolveApiBase(isNativeApp(), import.meta.env.VITE_API_BASE_URL || '')
export const authRedirect = () => isNativeApp() ? ANDROID_AUTH_REDIRECT : window.location.origin
export const AUTH_CALLBACK_ERROR = 'Sign-in could not finish. Open Sign in and try Google again; your cooking session is safe.'

export interface NativeAuthClient {
  auth: {
    exchangeCodeForSession(code: string): PromiseLike<{ error: unknown }>
    setSession(tokens: { access_token: string; refresh_token: string }): PromiseLike<{ error: unknown }>
    startAutoRefresh(): unknown
    stopAutoRefresh(): unknown
  }
}

export async function acceptNativeAuthUrl(value: string, client: NativeAuthClient): Promise<boolean> {
  let url: URL
  try { url = new URL(value) } catch { return false }
  if (url.protocol !== `${ANDROID_APP_ID}:` || url.hostname !== 'login-callback' ||
      url.port || url.username || url.password || !['', '/'].includes(url.pathname)) return false
  const hash = new URLSearchParams(url.hash.slice(1))
  if (url.searchParams.has('error') || hash.has('error')) throw new Error(AUTH_CALLBACK_ERROR)
  const code = url.searchParams.get('code')
  const access = hash.get('access_token'), refresh = hash.get('refresh_token')
  if (!code && !(access && refresh)) return false
  // Supabase verifies the code/session. No callback secrets are logged or sent
  // to application routes, analytics, navigation history or recipe storage.
  const result = code
    ? await client.auth.exchangeCodeForSession(code)
    : await client.auth.setSession({ access_token: access!, refresh_token: refresh! })
  if (result.error) throw new Error(AUTH_CALLBACK_ERROR)
  return true
}

export async function launchNativeBrowser(url: string): Promise<void> {
  await Browser.open({ url })
}

/** Native Android Back closes the existing dialog before minimizing the app. */
export async function nativeBack(canGoBack: boolean): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')
  if (dialog) {
    const cancel = new Event('cancel', { cancelable: true, bubbles: true })
    if (dialog.dispatchEvent(cancel)) dialog.close()
    return
  }
  if (canGoBack) window.history.back()
  else await NativeApp.minimizeApp()
}

export async function initializeNativeApp(client: NativeAuthClient | null): Promise<void> {
  if (!isNativeApp()) return
  document.documentElement.dataset.platform = 'android'
  const handled = new Set<string>()
  const receive = async (url: string) => {
    if (!client || handled.has(url)) return
    handled.add(url)
    if (handled.size > 8) handled.delete(handled.values().next().value!)
    try {
      if (await acceptNativeAuthUrl(url, client)) {
        await Browser.close().catch(() => {}) // Android returns via its activity.
      }
    } catch {
      handled.delete(url)
      window.dispatchEvent(new Event('vantagallu:auth-error'))
    }
  }
  await NativeApp.addListener('appUrlOpen', ({ url }) => { void receive(url) })
  await NativeApp.addListener('backButton', ({ canGoBack }) => { void nativeBack(canGoBack) })
  const pauseCapture = () => {
    void client?.auth.stopAutoRefresh()
    window.dispatchEvent(new Event('vantagallu:app-background'))
  }
  // Android onPause precedes onStop/appStateChange. Stop capture immediately
  // even when another activity is opened and closed before onStop executes.
  await NativeApp.addListener('pause', pauseCapture)
  await NativeApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) void client?.auth.startAutoRefresh()
    else pauseCapture()
  })
  const launch = await NativeApp.getLaunchUrl()
  if (launch?.url) await receive(launch.url)
}
