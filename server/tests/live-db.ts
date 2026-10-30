// Explicit opt-in integration check. Creates only disposable users/rows, sends no email,
// and makes no AI-provider requests. Never auto-import this from the unit test suite.
import { config as loadEnv } from 'dotenv'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { recipeCatalog } from '../../src/data/recipes.ts'
import { recipeCoverageManifest } from '../../src/data/coverage.ts'
import { createCookingSession, applyCookingCommand } from '../../src/domain/session.ts'
import { readConfig } from '../config.ts'
import { SupabaseRepository } from '../repository.ts'
import { ApiError } from '../errors.ts'

loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_RUN_LIVE_DB !== '1') throw new Error('Set VANTAGALLU_RUN_LIVE_DB=1 explicitly to run the disposable integration check.')
const config = readConfig()
if (new URL(config.supabaseUrl).hostname !== 'hdnqsyrhelpbnjezuyww.supabase.co') throw new Error('This check is restricted to the confirmed personal Supabase project.')
const publicKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!publicKey || !config.serviceKey) throw new Error('The personal backend/public client configuration is incomplete.')
const createdUsers: string[] = [], createdSessions: string[] = []
const adminHeaders = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
const results: string[] = []
async function authUser() {
  const email = `vantagallu-check-${randomUUID()}@example.invalid`, password = `Test-${randomUUID()}-Aa1!`
  const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ email, password, email_confirm: true }) })
  if (!response.ok) throw new Error(`Disposable user creation failed (${response.status}).`)
  const user = await response.json() as { id: string }
  createdUsers.push(user.id)
  const signIn = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publicKey!, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!signIn.ok) throw new Error(`Disposable sign-in failed (${signIn.status}).`)
  const session = await signIn.json() as { access_token: string }
  return { id: user.id, token: session.access_token }
}
function userRequest(path: string, token: string, method = 'GET', body?: unknown) {
  return fetch(`${config.supabaseUrl}/rest/v1/${path}`, { method, headers: { apikey: publicKey!, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

try {
  const catalogIds = recipeCatalog.map(recipe => recipe.id)
  const availableIds = recipeCoverageManifest.filter(entry => entry.status === 'available').map(entry => entry.recipeId)
  assert.equal(new Set(catalogIds).size, catalogIds.length, 'Canonical recipe IDs must be unique.')
  assert.equal(new Set(availableIds).size, availableIds.length, 'Available manifest IDs must be unique.')
  assert.deepEqual([...catalogIds].sort(), [...availableIds].sort(), 'Seed only the available source-adapted catalogue, never planned entries.')
  const seed = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_recipes?on_conflict=id`, { method: 'POST', headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(recipeCatalog.map(recipe => ({ id: recipe.id, version: recipe.version, data: recipe }))) })
  if (!seed.ok) throw new Error(`Catalog seeding failed (${seed.status}); check schema/version immutability.`)
  results.push(`${recipeCatalog.length} available attributed recipe records seeded`)
  const a = await authUser(), b = await authUser(), repository = new SupabaseRepository(config), recipe = recipeCatalog[0]
  const state = createCookingSession(recipe, { id: randomUUID(), ownerId: a.id }), stateB = createCookingSession(recipe, { id: randomUUID(), ownerId: b.id })
  createdSessions.push(state.id, stateB.id)
  await repository.createSession(a.id, state); await repository.createSession(b.id, stateB)
  assert.equal((await repository.getSession(a.id, state.id))?.recipeId, recipe.id)
  assert.equal(await repository.getSession(b.id, state.id), null)
  const duplicateCreate = await repository.createSession(a.id, state); assert.equal(duplicateCreate.revision, 0)
  results.push('Owner-scoped session create/read/idempotent create')

  const command = { commandId: randomUUID(), expectedRevision: 0, command: { type: 'set_language', language: 'te' } } as const
  const next = applyCookingCommand(state, command.command, recipe, new Date().toISOString())
  const first = await repository.commit(a.id, state.id, command, next)
  const retry = await repository.commit(a.id, state.id, command, next)
  assert.equal(first.session.revision, 1); assert.equal(retry.replayed, true); assert.equal(retry.session.revision, 1)
  const collision = { ...command, command: { type: 'set_language', language: 'hi' } } as const
  await assert.rejects(repository.commit(a.id, state.id, collision, next), (error: unknown) => error instanceof ApiError && error.code === 'command_id_reused')
  results.push('Transactional command replay and changed-payload rejection')

  const contenders = (['kn', 'hi'] as const).map(language => {
    const change = { type: 'set_language', language } as const
    return repository.commit(a.id, state.id, { commandId: randomUUID(), expectedRevision: 1, command: change }, applyCookingCommand(first.session, change, recipe, new Date().toISOString()))
  })
  const concurrency = await Promise.allSettled(contenders)
  assert.equal(concurrency.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(concurrency.filter(result => result.status === 'rejected' && result.reason instanceof ApiError && result.reason.code === 'revision_conflict').length, 1)
  assert.equal((await repository.getSession(a.id, state.id))?.revision, 2)
  results.push('Concurrent CAS commits: one winner, one explicit conflict')

  const lease = await repository.lease(a.id, state.id, 'first-phone', 'acquire')
  await assert.rejects(repository.lease(a.id, state.id, 'second-phone', 'acquire'), (error: unknown) => error instanceof ApiError && error.code === 'lease_conflict')
  const replacement = await repository.lease(a.id, state.id, 'second-phone', 'takeover')
  assert.notEqual(replacement?.id, lease?.id)
  const current = (await repository.getSession(a.id, state.id))!
  const staleVoiceCommand = { commandId: randomUUID(), expectedRevision: current.revision, command: { type: 'set_language', language: 'en' } } as const
  await assert.rejects(repository.commit(a.id, state.id, staleVoiceCommand, applyCookingCommand(current, staleVoiceCommand.command, recipe, new Date().toISOString()), lease!.id), (error: unknown) => error instanceof ApiError && error.code === 'lease_expired')
  assert.equal((await repository.getSession(a.id, state.id))?.revision, 2)
  results.push('Voice takeover and SQL-level fencing of the replaced connection')

  const limited = new SupabaseRepository({ ...config, dailyChatLimit: 1, sessionChatLimit: 1 })
  const usageId = randomUUID()
  assert.equal(await limited.reserveUsage(a.id, state.id, usageId, 'chat', 1), true)
  assert.equal(await limited.reserveUsage(a.id, state.id, usageId, 'chat', 1), false)
  await assert.rejects(limited.reserveUsage(a.id, state.id, randomUUID(), 'chat', 1), (error: unknown) => error instanceof ApiError && error.code === 'quota_exceeded')
  assert.equal((await limited.getUsage(a.id)).chatCount, 1)
  results.push('Durable usage reservation replay and quota enforcement')

  const own = await userRequest(`vantagallu_sessions?id=eq.${state.id}&select=id`, a.token); assert.equal(own.status, 200); assert.equal((await own.json() as unknown[]).length, 1)
  const foreign = await userRequest(`vantagallu_sessions?id=eq.${state.id}&select=id`, b.token); assert.equal(foreign.status, 200); assert.deepEqual(await foreign.json(), [])
  const directWrite = await userRequest('vantagallu_sessions', a.token, 'POST', { id: randomUUID(), user_id: a.id, state, revision: 0 }); assert.ok([401, 403].includes(directWrite.status))
  const directRpc = await userRequest('rpc/vantagallu_create_session', a.token, 'POST', { p_owner_id: a.id, p_state: state }); assert.ok([401, 403, 404].includes(directRpc.status))
  const anonymous = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_sessions?select=id`, { headers: { apikey: publicKey! } }); assert.ok([401, 403].includes(anonymous.status))
  results.push('Live RLS: owner read, foreign/anonymous denial, browser write/RPC denial')
  console.log(JSON.stringify({ passed: results }, null, 2))
} finally {
  let failed = false
  for (const id of createdSessions) {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_sessions?id=eq.${id}`, { method: 'DELETE', headers: adminHeaders })
    if (!response.ok) failed = true
  }
  for (const id of createdUsers) {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders })
    if (!response.ok) failed = true
  }
  if (failed) {
    console.error('Disposable integration cleanup needs attention; do not ignore this failure.')
    process.exitCode = 1
  } else console.log('Disposable Vantagallu rows/users cleaned up; no provider calls or emails sent.')
}
