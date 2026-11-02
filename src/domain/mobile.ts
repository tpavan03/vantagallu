/** Public client coordinates. Provider credentials remain on Vercel. */
export const ANDROID_APP_ID = 'in.tpavan.vantagallu'
export const ANDROID_ORIGIN = 'https://localhost'
export const ANDROID_AUTH_REDIRECT = `${ANDROID_APP_ID}://login-callback/`
export const PRODUCTION_API_ORIGIN = 'https://vantagallu.vercel.app'

export function resolveApiBase(native: boolean, configured = ''): string {
  return native ? PRODUCTION_API_ORIGIN : configured.replace(/\/$/, '')
}
