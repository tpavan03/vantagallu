import { describe, expect, it } from 'vitest'
import { createApp } from '../app.ts'
import { readConfig } from '../config.ts'
import { ANDROID_ORIGIN } from '../../src/domain/mobile.ts'

describe('installed Android API access', () => {
  const app = createApp({ config: readConfig({}), fetch: async () => { throw new Error('No network in this check.') } })
  it('accepts native preflight while still requiring authentication for personal sessions', async () => {
    const preflight = await app(new Request('https://vantagallu.vercel.app/api/sessions', { method: 'OPTIONS', headers: { Origin: ANDROID_ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } }))
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(ANDROID_ORIGIN)
    const privateRead = await app(new Request('https://vantagallu.vercel.app/api/sessions', { headers: { Origin: ANDROID_ORIGIN } }))
    expect(privateRead.status).toBe(401)
  })
  it('does not grant arbitrary localhost-looking or insecure origins', async () => {
    for (const origin of ['https://localhost.evil.example', 'http://localhost', 'https://unrelated.example']) {
      const response = await app(new Request('https://vantagallu.vercel.app/api/health', { headers: { Origin: origin } }))
      expect(response.status).toBe(403)
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
    }
  })
  it('preserves configured web origins and deduplicates the native origin', () => {
    const config = readConfig({ VANTAGALLU_ALLOWED_ORIGINS: 'https://vantagallu.vercel.app/, https://localhost' })
    expect(config.allowedOrigins).toEqual([ANDROID_ORIGIN, 'https://vantagallu.vercel.app'])
    expect(config.allowedEmails).toEqual([])
  })
})
