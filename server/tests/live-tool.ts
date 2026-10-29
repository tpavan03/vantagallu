// Explicitly authorized single real-provider tool conversation, at most three
// short model rounds; disposable confirmed owner/session, no email or microphone.
import { config as loadEnv } from 'dotenv'
import assert from 'node:assert/strict'
import { appendFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createApp } from '../app.ts'
import { readConfig } from '../config.ts'
import { SupabaseRepository } from '../repository.ts'
import { getRecipeById } from '../../src/data/recipes.ts'
import { createCookingSession } from '../../src/domain/session.ts'

loadEnv({ path: '.env.local', quiet: true }); loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_RUN_LIVE_TOOL !== '1') throw new Error('Explicit VANTAGALLU_RUN_LIVE_TOOL=1 is required.')
const config = readConfig()
if (new URL(config.supabaseUrl).hostname !== 'hdnqsyrhelpbnjezuyww.supabase.co') throw new Error('Personal project guard rejected this configuration.')
if (!config.deepseekKey || !config.serviceKey) throw new Error('Personal provider/database configuration is incomplete.')
const headers = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
const publicKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
assert.ok(publicKey)
let userId: string | undefined, sessionId: string | undefined, providerCalls = 0, followingContextContainsCommittedTomatoes = false
let passed = false, cleaned = false
try {
  const email = `vantagallu-tool-${randomUUID()}@example.invalid`, password = `Test-${randomUUID()}-Aa1!`
  const create = await fetch(`${config.supabaseUrl}/auth/v1/admin/users`, { method: 'POST', headers, body: JSON.stringify({ email, password, email_confirm: true }) })
  assert.equal(create.status, 200)
  userId = (await create.json() as { id: string }).id
  const login = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: publicKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  assert.equal(login.status, 200)
  const token = (await login.json() as { access_token: string }).access_token
  const recipe = getRecipeById('tomato-pappu')!
  const tomato = recipe.ingredients.find(ingredient => ingredient.name.en.startsWith('Tomato'))!
  assert.equal(tomato.unit, 'g')
  const repository = new SupabaseRepository(config)
  const state = createCookingSession(recipe, { ownerId: userId })
  sessionId = state.id
  await repository.createSession(userId, state)
  const fetcher: typeof fetch = async (url, init) => {
    if (String(url).includes('api.deepseek.com/chat/completions')) {
      if (++providerCalls > 3) throw new Error('Live tool smoke exhausted its three-round budget.')
      const body = JSON.parse(String(init?.body))
      body.max_tokens = 700
      if (body.tools) assert.equal(body.parallel_tool_calls, false)
      for (const message of body.messages) {
        if (message.role === 'tool') {
          const result = JSON.parse(message.content)
          if (result.ok && result.session?.addedIngredients?.some((item: { ingredientId: string; quantity: number; unit: string }) => item.ingredientId === tomato.id && item.quantity === 200 && item.unit === 'g')) followingContextContainsCommittedTomatoes = true
        }
      }
      return fetch(url, { ...init, body: JSON.stringify(body) })
    }
    return fetch(url, init)
  }
  const handler = createApp({ config: { ...config, allowedEmails: [email] }, fetch: fetcher })
  const response = await handler(new Request('https://vantagallu.vercel.app/api/chat', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, expectedRevision: 0, requestId: randomUUID(), message: "I've already added the 2 tomatoes, weighed 200 g total. Save what I did, and adapt what I should do next. Give one brief next action; don't assume any other ingredient has been added." }) }))
  assert.equal(response.status, 200)
  const stream = await response.text()
  assert.ok(stream.includes('event: done'), 'Model conversation did not finish with a committed answer.')
  assert.ok(!stream.includes('event: error') && !stream.includes('event: stale'), 'Model conversation returned an error or stale response.')
  assert.ok(stream.indexOf('event: state') >= 0 && stream.indexOf('event: state') < stream.indexOf('event: delta'), 'Reply was shown before a cooking change committed.')
  const saved = await repository.getSession(userId, sessionId)
  assert.equal(saved?.addedIngredients.filter(item => item.ingredientId === tomato.id).reduce((sum, item) => sum + item.quantity, 0), 200)
  assert.ok(followingContextContainsCommittedTomatoes, 'Following model round lacked the confirmed ingredient state.')
  assert.ok(saved?.messages.some(message => message.role === 'assistant'))
  passed = true
} finally {
  const cleanupStatuses: number[] = []
  if (sessionId) cleanupStatuses.push((await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_sessions?id=eq.${sessionId}`, { method: 'DELETE', headers })).status)
  if (userId) cleanupStatuses.push((await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers })).status)
  cleaned = cleanupStatuses.every(status => status >= 200 && status < 300)
  const result = { test: 'actual-deepseek-tool-commit', passed, providerCalls, followingContextContainsCommittedTomatoes, cleanupPassed: cleaned, fabricatedWeightConversion: false }
  const line = JSON.stringify(result)
  appendFileSync('/tmp/vantagallu-research/provider-tool-result.jsonl', `${line}\n`, { mode: 0o600 })
  console.log(line)
  if (!cleaned) process.exitCode = 1
}
