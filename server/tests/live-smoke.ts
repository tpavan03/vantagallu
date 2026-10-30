// Small, explicitly enabled database/API check. No model-provider calls or email.
import { config as loadEnv } from 'dotenv'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { createApp } from '../app.ts'
import { readConfig } from '../config.ts'

loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_RUN_LIVE_SMOKE !== '1') throw new Error('Explicit VANTAGALLU_RUN_LIVE_SMOKE=1 is required.')
const config = readConfig(), publicKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
assert.equal(new URL(config.supabaseUrl).hostname, 'hdnqsyrhelpbnjezuyww.supabase.co')
assert.ok(config.serviceKey && publicKey)
const headers = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
const users: string[] = [], sessions: string[] = [], checks: string[] = []
let passed = false
async function disposableUser() {
  const email = `vantagallu-smoke-${randomUUID()}@example.invalid`, password = `Smoke-${randomUUID()}-Aa1!`
  const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users`, { method: 'POST', headers, body: JSON.stringify({ email, password, email_confirm: true }) })
  assert.ok(response.ok, 'Disposable confirmed-user creation failed.')
  const user = await response.json() as { id: string }; users.push(user.id)
  const login = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publicKey!, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  assert.ok(login.ok, 'Disposable sign-in failed.')
  return { id: user.id, email, token: (await login.json() as { access_token: string }).access_token }
}
try {
  const a = await disposableUser(), b = await disposableUser()
  const handler = createApp({ config: { ...config, allowedEmails: [a.email, b.email] }, fetch: async (url, init) => {
    if (!String(url).startsWith(`${config.supabaseUrl}/`)) throw new Error('The database-only smoke check blocked an unexpected external request.')
    return fetch(url, init)
  } })
  const call = (path: string, token?: string, body?: unknown) => handler(new Request(`https://vantagallu.vercel.app${path}`, { method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }))
  assert.equal((await call('/api/health')).status, 200)
  assert.equal((await call('/api/sessions')).status, 401)
  checks.push('Health 200 and unauthenticated private API 401')
  const sessionId = randomUUID(); sessions.push(sessionId)
  const create = await call('/api/sessions', a.token, { id: sessionId, recipeId: 'tomato-pappu' })
  assert.equal(create.status, 201)
  const { session } = await create.json()
  assert.equal(session.ownerId, a.id); assert.equal(session.recipeSnapshot.version, session.recipeVersion)
  const commit = await call(`/api/sessions/${sessionId}/commands`, a.token, { commandId: randomUUID(), expectedRevision: 0, command: { type: 'set_language', language: 'te' } })
  assert.equal(commit.status, 200)
  const reload = await call(`/api/sessions/${sessionId}`, a.token)
  const reloaded = (await reload.json()).session
  assert.equal(reload.status, 200); assert.equal(reloaded.revision, 1); assert.equal(reloaded.language, 'te')
  checks.push('Authenticated API creates, commits and reloads real DB state with pinned recipe')
  assert.equal((await call(`/api/sessions/${sessionId}`, b.token)).status, 404)
  assert.deepEqual((await (await call('/api/sessions', b.token)).json()).sessions, [])
  const foreignRead = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_sessions?id=eq.${sessionId}&select=id`, { headers: { apikey: publicKey!, Authorization: `Bearer ${b.token}` } })
  assert.equal(foreignRead.status, 200); assert.deepEqual(await foreignRead.json(), [])
  checks.push('Foreign account denied at API and direct Supabase RLS')
  passed = true
} finally {
  const cleanup: boolean[] = []
  for (const id of sessions) cleanup.push((await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_sessions?id=eq.${id}`, { method: 'DELETE', headers })).ok)
  for (const id of users) cleanup.push((await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers })).ok)
  const cleanupPassed = cleanup.every(Boolean)
  const result = { passed, checks, cleanupPassed, providerCalls: 0, sentEmails: 0 }
  const line = JSON.stringify(result)
  mkdirSync('/tmp/vantagallu-research', { recursive: true, mode: 0o700 })
  appendFileSync('/tmp/vantagallu-research/backend-smoke-results.jsonl', `${line}\n`, { mode: 0o600 })
  console.log(line)
  if (!cleanupPassed) process.exitCode = 1
}
