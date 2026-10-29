import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { createApp } from '../app.ts'
import { authenticate } from '../auth.ts'
import { readConfig } from '../config.ts'
import { ApiError } from '../errors.ts'
import type { CommitResult, Repository, VoiceLease } from '../repository.ts'
import type { CommandRequest, CookingSession, Recipe } from '../../src/domain/types.ts'
import { createCookingSession } from '../../src/domain/session.ts'
import { deepseekTurn } from '../providers.ts'

const owner = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222', id = '33333333-3333-4333-8333-333333333333'
const now = new Date('2026-10-30T00:00:00.000Z')
const config = readConfig({ SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-db-secret', VANTAGALLU_ALLOWED_EMAILS: 'owner@example.com', VANTAGALLU_GEMINI_API_KEY: 'test-gemini-secret', VANTAGALLU_DEEPSEEK_API_KEY: 'test-deepseek-secret' })
const recipe: Recipe = { id: 'tomato-fixture', version: 1, title: { en: 'Tomato fixture' }, summary: { en: 'Test-only recipe.' }, region: 'andhra', categories: ['curry'], diet: 'vegan', baseServings: 2, prepMinutes: 5, cookMinutes: 10, equipment: ['Pan'], authorMethod: 'Deterministic test fixture.', ingredients: [{ id: 'tomato', name: { en: 'Tomato' }, quantity: 2, unit: 'piece' }], steps: [{ id: 'add', instruction: { en: 'Add tomatoes.' }, ingredientIds: ['tomato'], heat: 'medium' }, { id: 'simmer', instruction: { en: 'Simmer and check.' }, ingredientIds: [], heat: 'low', durationSeconds: 60 }], sources: [{ name: 'Test fixture', url: 'https://example.com/fixture' }], reviewStatus: 'needs-kitchen-test' }

class MemoryRepository implements Repository {
  state = createCookingSession(recipe, { id, ownerId: owner, now: now.toISOString() })
  events = new Map<string, { command: unknown; revision: number }>()
  reservations = new Set<string>()
  leaseState: VoiceLease | null = null
  quotaExceeded = false
  providerUses = 0
  async getRecipe(recipeId: string, version?: number) { return recipeId === recipe.id && (version === undefined || version === recipe.version) ? structuredClone(recipe) : null }
  async listSessions(userId: string) { return userId === owner ? [structuredClone(this.state)] : [] }
  async getSession(userId: string, sessionId: string) { return userId === owner && sessionId === this.state.id ? structuredClone(this.state) : null }
  async createSession(userId: string, state: CookingSession) { if (userId !== owner) throw new ApiError(404, 'not_found', 'Not found.'); this.state = structuredClone(state); return structuredClone(this.state) }
  async findCommand(userId: string, sessionId: string, commandId: string) { return userId === owner && sessionId === this.state.id ? this.events.get(commandId) ?? null : null }
  async commit(userId: string, sessionId: string, request: CommandRequest, state: CookingSession): Promise<CommitResult> {
    if (userId !== owner || sessionId !== this.state.id) throw new ApiError(404, 'not_found', 'Not found.')
    const existing = this.events.get(request.commandId)
    if (existing) return { session: structuredClone(this.state), replayed: true, commandRevision: existing.revision }
    if (this.state.revision !== request.expectedRevision) throw new ApiError(409, 'revision_conflict', 'State changed.', { session: structuredClone(this.state) })
    this.state = structuredClone(state); this.events.set(request.commandId, { command: structuredClone(request.command), revision: state.revision })
    return { session: structuredClone(this.state), replayed: false, commandRevision: state.revision }
  }
  async lease(userId: string, sessionId: string, deviceId: string, action: string, leaseId?: string) {
    if (!await this.getSession(userId, sessionId)) throw new ApiError(404, 'not_found', 'Not found.')
    if (action === 'renew' || action === 'release') {
      if (this.leaseState?.id !== leaseId || this.leaseState?.deviceId !== deviceId) throw new ApiError(409, 'lease_expired', 'Expired.')
      if (action === 'release') { this.leaseState = null; return null }
      return this.leaseState
    }
    if (action === 'acquire' && this.leaseState) throw new ApiError(409, 'lease_conflict', 'Another call is active.')
    this.leaseState = { id: randomUUID(), deviceId, expiresAt: new Date(now.getTime() + 60000).toISOString(), epoch: (this.leaseState?.epoch ?? 0) + 1 }
    return this.leaseState
  }
  async requireLease(userId: string, sessionId: string, leaseId: string) { if (!await this.getSession(userId, sessionId) || !this.leaseState || this.leaseState.id !== leaseId) throw new ApiError(409, 'lease_expired', 'Expired.'); return this.leaseState }
  async reserveUsage(userId: string, sessionId: string, requestId: string) { if (!await this.getSession(userId, sessionId)) throw new ApiError(404, 'not_found', 'Not found.'); if (this.quotaExceeded) throw new ApiError(429, 'quota_exceeded', 'Limit reached.'); if (this.reservations.has(requestId)) return false; this.reservations.add(requestId); this.providerUses++; return true }
  async getUsage() { return { chatCount: this.providerUses, voiceSeconds: 0, dailyChatLimit: 60, dailyVoiceSeconds: 1200 } }
}
const request = (path: string, body?: unknown, headers: Record<string, string> = {}) => new Request(`https://vantagallu.example${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
const neverFetch: typeof fetch = async () => { throw new Error('Unexpected external request in an isolated test.') }
const app = (repository: MemoryRepository, options: Partial<Parameters<typeof createApp>[0]> = {}) => createApp({ repository, config, now: () => now, fetch: neverFetch, authenticate: async () => ({ id: owner, email: 'owner@example.com' }), ...options })
const sse = (content: string) => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content }, finish_reason: null }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })

describe('private API boundary', () => {
  it('exposes only capability booleans on health and rejects unauthenticated state access', async () => {
    const handler = createApp({ config, fetch: neverFetch })
    const health = await handler(request('/api/health')); expect(health.status).toBe(200)
    const text = await health.text(); expect(text).toContain('"voice":true'); expect(text).not.toContain('test-gemini-secret'); expect(text).not.toContain('test-db-secret')
    expect((await handler(request('/api/sessions'))).status).toBe(401)
  })
  it('verifies the token remotely and admits only confirmed allowlisted emails', async () => {
    const authenticatedRequest = request('/api/sessions', undefined, { Authorization: 'Bearer token-under-test' })
    const principal = await authenticate(authenticatedRequest, config, async () => new Response(JSON.stringify({ id: owner, email: 'OWNER@example.com', email_confirmed_at: now.toISOString() })))
    expect(principal).toEqual({ id: owner, email: 'owner@example.com' })
    await expect(authenticate(authenticatedRequest, config, async () => new Response('{}', { status: 401 }))).rejects.toMatchObject({ status: 401 })
    await expect(authenticate(authenticatedRequest, config, async () => new Response(JSON.stringify({ id: other, email: 'outsider@example.com', email_confirmed_at: now.toISOString() })))).rejects.toMatchObject({ status: 403, code: 'owner_only' })
    await expect(authenticate(authenticatedRequest, config, async () => new Response(JSON.stringify({ id: owner, email: 'owner@example.com' })))).rejects.toMatchObject({ status: 403, code: 'email_not_verified' })
  })
  it('blocks foreign origins, oversized bodies and caller-supplied owner IDs', async () => {
    const handler = app(new MemoryRepository())
    expect((await handler(request('/api/health', undefined, { Origin: 'https://unrelated.example' }))).status).toBe(403)
    expect((await handler(request('/api/sessions', { recipeId: recipe.id, ownerId: other }))).status).toBe(400)
    const huge = new Request('https://vantagallu.example/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(140000) }) })
    expect((await handler(huge)).status).toBe(413)
  })
  it('does not return another owner’s session', async () => {
    const handler = app(new MemoryRepository(), { authenticate: async () => ({ id: other, email: 'owner@example.com' }) })
    expect((await handler(request(`/api/sessions/${id}`))).status).toBe(404)
    expect(await (await handler(request('/api/sessions'))).json()).toEqual({ sessions: [] })
  })
})

describe('canonical command commits', () => {
  it('preserves offline timer timestamps and rejects invalid or future action times', async () => {
    const repository = new MemoryRepository(), syncTime = new Date(now.getTime() + 120000)
    const handler = app(repository, { now: () => syncTime })
    const body = { commandId: 'offline-start', expectedRevision: 0, command: { type: 'start_timer', timerId: 'offline', label: 'Simmer', durationSeconds: 60, occurredAt: now.toISOString() } }
    expect((await handler(request(`/api/sessions/${id}/commands`, body))).status).toBe(200)
    expect(repository.state.timers[0].endAt).toBe(new Date(now.getTime() + 60000).toISOString())
    expect(repository.state.updatedAt).toBe(syncTime.toISOString())
    expect((await (await handler(request(`/api/sessions/${id}/commands`, body))).json()).replayed).toBe(true)
    for (const occurredAt of ['not-a-date', new Date(syncTime.getTime() + 31000).toISOString(), new Date(now.getTime() - 31000).toISOString()]) {
      const response = await handler(request(`/api/sessions/${id}/commands`, { commandId: `invalid-${Math.random()}`, expectedRevision: 1, command: { type: 'pause_timer', timerId: 'offline', occurredAt } }))
      expect(response.status).toBe(400)
    }
    for (const [index, type] of (['pause_timer', 'resume_timer', 'cancel_timer'] as const).entries()) {
      expect((await handler(request(`/api/sessions/${id}/commands`, { commandId: `timer-${type}`, expectedRevision: index + 1, command: { type, timerId: 'offline', occurredAt: new Date(now.getTime() + (index + 1) * 10000).toISOString() } }))).status).toBe(200)
    }
    expect(repository.state.timers[0].status).toBe('cancelled')
  })
  it('deduplicates a retry and rejects reuse of an ID for another action', async () => {
    const repository = new MemoryRepository(), handler = app(repository)
    const command = { commandId: 'add-tomato-once', expectedRevision: 0, command: { type: 'record_ingredient', ingredientId: 'tomato', quantity: 2, unit: 'piece' } }
    expect((await handler(request(`/api/sessions/${id}/commands`, command))).status).toBe(200)
    const replay = await handler(request(`/api/sessions/${id}/commands`, command)); expect((await replay.json()).replayed).toBe(true)
    expect(repository.state.addedIngredients).toHaveLength(1); expect(repository.state.revision).toBe(1)
    expect((await handler(request(`/api/sessions/${id}/commands`, { ...command, command: { ...command.command, quantity: 3 } }))).status).toBe(409)
  })
  it('allows exactly one of two concurrent writes against the same revision', async () => {
    const repository = new MemoryRepository(), handler = app(repository)
    const results = await Promise.all(['one', 'two'].map(commandId => handler(request(`/api/sessions/${id}/commands`, { commandId, expectedRevision: 0, command: { type: 'set_language', language: 'te' } }))))
    expect(results.map(result => result.status).sort()).toEqual([200, 409]); expect(repository.state.revision).toBe(1)
    const conflict = await results.find(result => result.status === 409)!.json(); expect(conflict.session.revision).toBe(1)
  })
  it('rejects invalid recipe references without advancing state', async () => {
    const repository = new MemoryRepository(), handler = app(repository)
    const response = await handler(request(`/api/sessions/${id}/commands`, { commandId: 'bad-ingredient', expectedRevision: 0, command: { type: 'record_ingredient', ingredientId: 'unknown', quantity: 2, unit: 'piece' } }))
    expect(response.status).toBe(400); expect(repository.state.revision).toBe(0)
  })
  it('imports local cooking facts while replacing ownership and resetting revision', async () => {
    const repository = new MemoryRepository(), handler = app(repository), local = structuredClone(repository.state)
    local.ownerId = other; local.revision = 20; local.addedIngredients = [{ ingredientId: 'tomato', quantity: 1, unit: 'piece', addedAt: now.toISOString() }]
    const response = await handler(request('/api/sessions', { recipeId: recipe.id, id, localSession: local })); expect(response.status).toBe(201)
    const { session } = await response.json(); expect(session.ownerId).toBe(owner); expect(session.revision).toBe(0); expect(session.addedIngredients).toHaveLength(1)
    local.currentStepId = 'does-not-exist'; expect((await handler(request('/api/sessions', { recipeId: recipe.id, id, localSession: local }))).status).toBe(400)
  })
  it('pins an imported older recipe to its archive and discards the client recipe snapshot', async () => {
    const repository = new MemoryRepository(), local = structuredClone(repository.state)
    const forged = structuredClone(recipe)
    forged.version = 9; forged.ingredients[0].quantity = 9999
    local.recipeSnapshot = forged
    repository.getRecipe = async (recipeId, version) => recipeId !== recipe.id ? null : structuredClone(version === 1 ? recipe : { ...recipe, version: 2 })
    const response = await app(repository)(request('/api/sessions', { recipeId: recipe.id, id, localSession: local }))
    expect(response.status).toBe(201)
    const { session } = await response.json()
    expect(session.recipeVersion).toBe(1); expect(session.recipeSnapshot).toEqual(recipe)
    expect(session.recipeSnapshot.ingredients[0].quantity).toBe(2)
    expect(local.recipeSnapshot.ingredients[0].quantity).toBe(9999)
  })
})

describe('voice leases and temporary credentials', () => {
  it('requires explicit takeover and fences changes from the replaced connection', async () => {
    const repository = new MemoryRepository(), handler = app(repository)
    const first = await (await handler(request('/api/voice/lease', { sessionId: id, deviceId: 'first-device', action: 'acquire' }))).json()
    expect((await handler(request('/api/voice/lease', { sessionId: id, deviceId: 'second-device', action: 'acquire' }))).status).toBe(409)
    const second = await (await handler(request('/api/voice/lease', { sessionId: id, deviceId: 'second-device', action: 'takeover' }))).json(); expect(second.lease.id).not.toBe(first.lease.id)
    const stale = await handler(request(`/api/sessions/${id}/commands`, { commandId: 'voice-old', expectedRevision: 0, voiceLeaseId: first.lease.id, command: { type: 'set_language', language: 'te' } })); expect(stale.status).toBe(409); expect(repository.state.revision).toBe(0)
  })
  it('mints a constrained single-use token without exposing provider keys', async () => {
    const repository = new MemoryRepository(), lease = await repository.lease(owner, id, 'phone', 'acquire')
    let calls = 0
    const handler = app(repository, { fetch: async (url, init) => {
      calls++; expect(String(url)).toBe('https://generativelanguage.googleapis.com/v1beta/auth_tokens')
      expect(new Headers(init?.headers).get('x-goog-api-key')).toBe(config.geminiKey)
      const payload = JSON.parse(String(init?.body)); expect(payload.uses).toBe(1); expect(payload.bidiGenerateContentSetup.model).toBe('models/gemini-3.8-live'); expect(payload.bidiGenerateContentSetup.systemInstruction.parts[0].text).toContain('CANONICAL STATE:'); expect(payload.bidiGenerateContentSetup.tools[0].functionDeclarations).toHaveLength(2); expect(payload.bidiGenerateContentSetup.generationConfig.maxOutputTokens).toBe(256); expect(payload.liveConnectConstraints).toBeUndefined()
      return new Response(JSON.stringify({ name: 'auth_tokens/temporary-fixture' }))
    } })
    const requestId = randomUUID(), response = await handler(request('/api/voice/token', { sessionId: id, leaseId: lease!.id, requestId })); expect(response.status).toBe(200)
    const text = await response.text(); expect(text).toContain('auth_tokens/temporary-fixture'); expect(text).not.toContain(config.geminiKey); expect(JSON.parse(text).expiresAt).toBe('2026-10-30T00:05:00.000Z')
    expect((await handler(request('/api/voice/token', { sessionId: id, leaseId: lease!.id, requestId }))).status).toBe(409); expect(calls).toBe(1)
  })
  it('rejects missing keys and exhausted quota without making any provider request', async () => {
    const repository = new MemoryRepository(), lease = await repository.lease(owner, id, 'phone', 'acquire')
    const missing = app(repository, { config: { ...config, geminiKey: '' } })
    expect((await missing(request('/api/voice/token', { sessionId: id, leaseId: lease!.id, requestId: randomUUID() }))).status).toBe(503); expect(repository.providerUses).toBe(0)
    repository.quotaExceeded = true
    expect((await app(repository)(request('/api/voice/token', { sessionId: id, leaseId: lease!.id, requestId: randomUUID() }))).status).toBe(429)
  })
})

describe('real-provider adapter protocols using isolated mock transports', () => {
  it('persists a finished chat and replays it without calling the provider twice', async () => {
    const repository = new MemoryRepository(); let calls = 0
    const handler = app(repository, { fetch: async () => { calls++; return sse('Keep the heat low and check the tomatoes. ತೆಲುಗು') } }), requestId = randomUUID()
    const body = { sessionId: id, expectedRevision: 0, message: 'What should I do next?', requestId }
    const response = await handler(request('/api/chat', body)), text = await response.text()
    expect(response.headers.get('Content-Type')).toContain('text/event-stream'); expect(text).toContain('event: done'); expect(text).toContain('ತೆಲುಗು'); expect(repository.state.messages).toHaveLength(2); expect(repository.state.revision).toBe(2)
    const replay = await (await handler(request('/api/chat', body))).text(); expect(replay).toContain('"replayed":true'); expect(calls).toBe(1)
  })
  it('does not save a partial reply or overwrite a concurrent cooking change', async () => {
    const repository = new MemoryRepository()
    const handler = app(repository, { fetch: async () => { repository.state.language = 'te'; repository.state.revision++; return sse('A stale answer.') } })
    const text = await (await handler(request('/api/chat', { sessionId: id, expectedRevision: 0, message: 'Next?', requestId: randomUUID() }))).text()
    expect(text).toContain('event: stale'); expect(repository.state.language).toBe('te'); expect(repository.state.messages.filter(message => message.role === 'assistant')).toHaveLength(0)
    const partialRepo = new MemoryRepository(), partial = app(partialRepo, { fetch: async () => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Incomplete' } }] })}\n\n`) })
    const partialText = await (await partial(request('/api/chat', { sessionId: id, expectedRevision: 0, message: 'Next?', requestId: randomUUID() }))).text(); expect(partialText).toContain('event: error'); expect(partialRepo.state.messages).toHaveLength(1)
  })
  it('commits a model tool change before its final acknowledgement and returns the new state', async () => {
    const repository = new MemoryRepository(); let calls = 0
    const handler = app(repository, { fetch: async (_url, init) => {
      calls++
      const requestBody = JSON.parse(String(init?.body)); expect(requestBody.parallel_tool_calls).toBe(false)
      if (calls === 1) return new Response(`data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call-fixture', function: { name: 'apply_cooking_command', arguments: JSON.stringify({ expectedRevision: 1, command: { type: 'record_ingredient', ingredientId: 'tomato', quantity: 1, unit: 'piece' } }) } }] }, finish_reason: 'tool_calls' }] })}\n\ndata: [DONE]\n\n`)
      const payload = JSON.parse(String(init?.body)); expect(payload.messages.some((message: { role: string; content: string }) => message.role === 'tool' && message.content.includes('"ok":true'))).toBe(true)
      expect(repository.state.addedIngredients).toHaveLength(1)
      return sse('Your one tomato is recorded. Continue gently.')
    } })
    const text = await (await handler(request('/api/chat', { sessionId: id, expectedRevision: 0, message: 'I added one tomato.', requestId: randomUUID() }))).text()
    expect(text.indexOf('event: state')).toBeLessThan(text.indexOf('Your one tomato is recorded.')); expect(text).toContain('event: done'); expect(repository.state.addedIngredients).toHaveLength(1); expect(repository.state.revision).toBe(3)
  })
  it('decodes fragmented multilingual SSE and does not forward hidden reasoning', async () => {
    const raw = `data: ${JSON.stringify({ choices: [{ delta: { content: 'తెలుగు ಕನ್ನಡ', reasoning_content: 'private reasoning' } }] })}\r\n\r\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\r\n\r\ndata: [DONE]\r\n\r\n`
    const bytes = new TextEncoder().encode(raw)
    const transport: typeof fetch = async () => new Response(new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3)); controller.close() } }))
    const deltas = []; for await (const delta of deepseekTurn([{ role: 'user', content: 'Speak briefly.' }], config, new AbortController().signal, transport)) deltas.push(delta)
    expect(JSON.stringify(deltas)).toContain('తెలుగు ಕನ್ನಡ'); expect(JSON.stringify(deltas)).not.toContain('private reasoning')
  })
})
