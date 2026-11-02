import { createClient } from '@supabase/supabase-js'
import { authRedirect, isNativeApp, launchNativeBrowser } from './native'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = url && key ? createClient(url, key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: !isNativeApp() },
}) : null
export async function signIn(email: string) {
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: authRedirect() } })
  if (error) throw new Error(error.message)
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Sign-in is not configured yet.')
  const native = isNativeApp()
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: authRedirect(), skipBrowserRedirect: native,
  } })
  if (error) throw error
  if (native) {
    if (!data.url) throw new Error('Google sign-in could not open. Try again when connected.')
    await launchNativeBrowser(data.url)
  }
}
