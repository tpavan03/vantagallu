import { describe, expect, it, vi } from 'vitest'
import { acceptNativeAuthUrl, AUTH_CALLBACK_ERROR, type NativeAuthClient } from './native'
import { ANDROID_AUTH_REDIRECT, PRODUCTION_API_ORIGIN, resolveApiBase } from '../domain/mobile'

const client = () => ({ auth: {
  exchangeCodeForSession: vi.fn(async () => ({ error: null as unknown })),
  setSession: vi.fn(async () => ({ error: null as unknown })),
  startAutoRefresh: vi.fn(), stopAutoRefresh: vi.fn(),
} }) satisfies NativeAuthClient

describe('Android API and sign-in boundary', () => {
  it('uses production APIs for the bundled app and retains same-origin web behavior', () => {
    expect(resolveApiBase(true, 'http://unrelated.example')).toBe(PRODUCTION_API_ORIGIN)
    expect(resolveApiBase(false)).toBe('')
    expect(resolveApiBase(false, 'http://127.0.0.1:4401/')).toBe('http://127.0.0.1:4401')
  })
  it('exchanges a PKCE code only through the exact native callback', async () => {
    const auth = client()
    expect(await acceptNativeAuthUrl(`${ANDROID_AUTH_REDIRECT}?code=fixture-code`, auth)).toBe(true)
    expect(auth.auth.exchangeCodeForSession).toHaveBeenCalledWith('fixture-code')
    expect(auth.auth.setSession).not.toHaveBeenCalled()
  })
  it('rejects unrelated URLs, callback paths and incomplete tokens without auth writes', async () => {
    const auth = client()
    for (const value of ['invalid', 'https://localhost/?code=fixture', 'in.tpavan.vantagallu://other/?code=fixture', 'in.tpavan.vantagallu://login-callback/not-auth?code=fixture', `${ANDROID_AUTH_REDIRECT}#access_token=fixture`]) {
      expect(await acceptNativeAuthUrl(value, auth)).toBe(false)
    }
    expect(auth.auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(auth.auth.setSession).not.toHaveBeenCalled()
  })
  it('passes complete token callbacks to Supabase rather than application data routes', async () => {
    const auth = client()
    expect(await acceptNativeAuthUrl(`${ANDROID_AUTH_REDIRECT}#access_token=fixture-access&refresh_token=fixture-refresh`, auth)).toBe(true)
    expect(auth.auth.setSession).toHaveBeenCalledWith({ access_token: 'fixture-access', refresh_token: 'fixture-refresh' })
  })
  it('never displays callback codes or raw provider failures in errors', async () => {
    const auth = client()
    auth.auth.exchangeCodeForSession.mockResolvedValue({ error: new Error('private-provider-detail') })
    await expect(acceptNativeAuthUrl(`${ANDROID_AUTH_REDIRECT}?code=private-code`, auth)).rejects.toThrow(AUTH_CALLBACK_ERROR)
    await expect(acceptNativeAuthUrl(`${ANDROID_AUTH_REDIRECT}?error=denied&error_description=private-detail`, auth)).rejects.toThrow(AUTH_CALLBACK_ERROR)
  })
})
