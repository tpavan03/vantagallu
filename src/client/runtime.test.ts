import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recipeCatalog } from '../data/recipes'
import { applyCookingCommand, createCookingSession, ingredientAmount } from '../domain/session'
import { loadStore, saveStore, type CookingStore } from './cache'
import { getSessionRecipe, mergeCloudSessions, preserveConflict, stampTimerCommand, startTimerCommand } from './useCookingRuntime'

const recipe = recipeCatalog[0]
const now = '2026-10-30T00:00:00.000Z'
const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const makeStore = (): CookingStore => {
  const session = createCookingSession(recipe, { ownerId: owner, now })
  return { scope: `user:${owner}`, sessions: [session], currentId: session.id, language: 'en', pending: [] }
}

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
})

describe('account and pending-action durability', () => {
  it('never loads another owner’s sessions or pending actions from a scoped cache', () => {
    const store = makeStore()
    const outsider = createCookingSession(recipe, { ownerId: other, now })
    store.sessions.push(outsider); store.currentId = outsider.id
    store.pending.push({ sessionId: outsider.id, commandId: crypto.randomUUID(), expectedRevision: 0, command: { type: 'set_language', language: 'hi' } })
    saveStore(store)
    const loaded = loadStore(store.scope)
    expect(loaded.sessions).toHaveLength(1)
    expect(loaded.sessions[0].ownerId).toBe(owner)
    expect(loaded.currentId).toBeNull()
    expect(loaded.pending).toEqual([])
    expect(loadStore(`user:${other}`).sessions).toEqual([])
  })

  it('keeps the guest kitchen independent when a signed account is saved', () => {
    const guest = createCookingSession(recipe, { now })
    saveStore({ scope: 'guest', sessions: [guest], currentId: guest.id, pending: [], language: 'te' })
    saveStore(makeStore())
    expect(loadStore('guest').sessions[0].ownerId).toBeNull()
    expect(loadStore('guest').sessions[0].id).toBe(guest.id)
    expect(loadStore('guest').language).toBe('te')
  })

  it('hydrates cloud data without overwriting an optimistic offline branch or copying another account', () => {
    const store = makeStore()
    const local = applyCookingCommand(store.sessions[0], { type: 'set_language', language: 'te' }, recipe, now)
    store.sessions = [local]
    const request = { sessionId: local.id, commandId: crypto.randomUUID(), expectedRevision: 0, command: { type: 'set_language' as const, language: 'te' as const } }
    store.pending.push(request)
    const cloud = { ...local, language: 'hi' as const, revision: 3 }
    const outsider = createCookingSession(recipe, { ownerId: other, now })
    const merged = mergeCloudSessions(store, [cloud, outsider], owner)
    expect(merged.sessions).toEqual([local])
    expect(merged.pending[0]).toEqual(request)
    saveStore(merged)
    expect(loadStore(store.scope).pending[0].commandId).toBe(request.commandId)
    expect(loadStore(store.scope).pending[0].expectedRevision).toBe(0)
  })

  it('preserves both conflict copies and the original request identity across reload', () => {
    const store = makeStore()
    const local = store.sessions[0]
    store.pending.push({ sessionId: local.id, commandId: crypto.randomUUID(), expectedRevision: 0, command: { type: 'set_servings', servings: 3 } })
    const cloud = { ...local, revision: 5, servings: 8 }
    const conflict = preserveConflict(store, local.id, cloud)
    saveStore(conflict)
    const reloaded = loadStore(store.scope)
    expect(reloaded.conflicts?.[local.id].local).toEqual(local)
    expect(reloaded.conflicts?.[local.id].cloud).toEqual(cloud)
    expect(reloaded.pending).toEqual(store.pending)
    expect(mergeCloudSessions(reloaded, [cloud], owner).sessions[0]).toEqual(local)
  })
})

describe('confirmed ingredient and timer semantics', () => {
  it('uses the original recipe snapshot quantities and units after a catalogue revision', () => {
    const original = structuredClone(recipe)
    original.version = 1
    original.ingredients[0].quantity = 2
    original.ingredients[0].unit = 'original-unit'
    const session = createCookingSession(original, { now })
    session.recipeSnapshot = original
    const updated = structuredClone(original)
    updated.version = 2; updated.ingredients[0].quantity = 500; updated.ingredients[0].unit = 'new-unit'
    const selected = getSessionRecipe(session, [updated])!
    expect(selected.version).toBe(1)
    expect(selected.ingredients[0].unit).toBe('original-unit')
    expect(ingredientAmount(selected, session, selected.ingredients[0]).target).toBe(2)
    const confirmed = applyCookingCommand(session, { type: 'record_ingredient', ingredientId: selected.ingredients[0].id, quantity: 2, unit: selected.ingredients[0].unit }, selected, now)
    expect(confirmed.addedIngredients[0].unit).toBe('original-unit')
    expect(confirmed.addedIngredients[0].quantity).toBe(2)
  })

  it('stamps the original timer action once and preserves its logical time across cache/replay', () => {
    const session = createCookingSession(recipe, { ownerId: owner, now })
    const original = stampTimerCommand(startTimerCommand(session), now)
    expect(original).toMatchObject({ type: 'start_timer', occurredAt: now })
    const store = makeStore()
    store.pending.push({ sessionId: store.sessions[0].id, commandId: crypto.randomUUID(), expectedRevision: 0, command: original })
    saveStore(store)
    const reloaded = loadStore(store.scope).pending[0].command
    expect(stampTimerCommand(reloaded, '2026-10-30T00:05:00.000Z')).toEqual(original)
    for (const type of ['pause_timer', 'resume_timer', 'cancel_timer'] as const) expect(stampTimerCommand({ type, timerId: 'test-timer' }, now)).toMatchObject({ type, occurredAt: now })
    expect(stampTimerCommand({ type: 'set_servings', servings: 2 }, now)).not.toHaveProperty('occurredAt')
  })

  it('starts a fresh timer identity instead of resurrecting a cancelled timer', () => {
    let session = createCookingSession(recipe, { now })
    const first = startTimerCommand(session)
    expect(first.type).toBe('start_timer')
    session = applyCookingCommand(session, first, recipe, now)
    const original = session.timers[0]
    session = applyCookingCommand(session, { type: 'cancel_timer', timerId: original.id }, recipe, now)
    const restart = startTimerCommand(session, original)
    session = applyCookingCommand(session, restart, recipe, now)
    expect(session.timers).toHaveLength(2)
    expect(session.timers[0].status).toBe('cancelled')
    expect(session.timers[1].id).not.toBe(original.id)
    expect(session.timers[1].label).toBe(original.label)
    expect(session.timers[1].durationSeconds).toBe(original.durationSeconds)
    expect(() => applyCookingCommand(session, { type: 'resume_timer', timerId: original.id }, recipe, now)).toThrow(/cannot be resumed/)
  })

  it('tracks only the unadded remainder after resizing, preserving the actual cooking history', () => {
    const item = recipe.ingredients.find(ingredient => ingredient.scaling === 'linear')!
    let session = createCookingSession(recipe, { now })
    session = applyCookingCommand(session, { type: 'record_ingredient', ingredientId: item.id, quantity: item.quantity / 2, unit: item.unit }, recipe, now)
    session = applyCookingCommand(session, { type: 'set_servings', servings: recipe.baseServings * 2 }, recipe, now)
    const remaining = ingredientAmount(recipe, session, item).remaining
    session = applyCookingCommand(session, { type: 'record_ingredient', ingredientId: item.id, quantity: remaining, unit: item.unit }, recipe, now)
    expect(session.addedIngredients[0].quantity).toBe(item.quantity / 2)
    expect(ingredientAmount(recipe, session, item).added).toBeCloseTo(item.quantity * 2)
    expect(ingredientAmount(recipe, session, item).remaining).toBe(0)
  })
})
