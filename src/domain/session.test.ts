import { describe, it, expect } from 'vitest'
import { recipeCatalog } from '../data/recipes'
import { applyCookingCommand, createCookingSession, ingredientAmount, timerRemainingSeconds } from './session'

const recipe = recipeCatalog[0]
const start = '2026-10-30T00:00:00.000Z'
const initial = () => createCookingSession(recipe, { now: start })
describe('confirmed cooking state', () => {
  it('preserves the amounts already added when the target batch gets smaller', () => {
    const ingredient = recipe.ingredients.find(item => item.scaling !== 'to-taste' && item.scaling !== 'method-dependent')!
    let session = applyCookingCommand(initial(), { type: 'record_ingredient', ingredientId: ingredient.id, quantity: ingredient.quantity, unit: ingredient.unit }, recipe, start)
    session = applyCookingCommand(session, { type: 'set_servings', servings: Math.max(0.5, recipe.baseServings / 2) }, recipe, start)
    expect(session.addedIngredients[0].quantity).toBe(ingredient.quantity)
    expect(ingredientAmount(recipe, session, ingredient).overTarget).toBe(true)
    expect(session.adaptations.at(-1)?.kind).toBe('quantity')
  })
  it('does not confuse tablespoons and teaspoons or silently convert unknown units', () => {
    const item = recipe.ingredients[0]
    expect(() => applyCookingCommand(initial(), { type: 'record_ingredient', ingredientId: item.id, quantity: 1, unit: item.unit === 'tsp' ? 'tbsp' : 'unknown' }, recipe, start)).toThrow(/Use/)
  })
  it('revises remaining actions while retaining completed cooking history', () => {
    let session = applyCookingCommand(initial(), { type: 'complete_step', stepId: recipe.steps[0].id }, recipe, start)
    const nextStep = { ...recipe.steps[1], id: 'adapted-next', instruction: { en: 'Continue with the confirmed ingredients already in the pan.' } }
    session = applyCookingCommand(session, { type: 'revise_plan', remainingSteps: [nextStep], reason: 'Tomatoes are already in; adapt the remaining order.' }, recipe, start)
    expect(session.steps[0]).toEqual(recipe.steps[0])
    expect(session.completedStepIds).toEqual([recipe.steps[0].id])
    expect(session.currentStepId).toBe('adapted-next')
    expect(() => applyCookingCommand(session, { type: 'revise_plan', remainingSteps: [recipe.steps[0]], reason: 'Repeat old ID' }, recipe, start)).toThrow(/preserve|distinct/)
  })
  it('does not revive an expired timer after a long pause or page reopen', () => {
    let session = applyCookingCommand(initial(), { type: 'start_timer', timerId: 'timer', label: 'Simmer', durationSeconds: 60 }, recipe, start)
    const later = '2026-10-30T00:05:00.000Z'
    expect(timerRemainingSeconds(session.timers[0], Date.parse(later))).toBe(0)
    session = applyCookingCommand(session, { type: 'pause_timer', timerId: 'timer' }, recipe, later)
    expect(() => applyCookingCommand(session, { type: 'resume_timer', timerId: 'timer' }, recipe, later)).toThrow(/finished|cannot/)
  })
  it('changes language without losing quantities, completed steps or timers', () => {
    let session = applyCookingCommand(initial(), { type: 'complete_step', stepId: recipe.steps[0].id }, recipe, start)
    for (const language of ['te', 'kn', 'hi', 'en'] as const) session = applyCookingCommand(session, { type: 'set_language', language }, recipe, start)
    expect(session.id).toBeTruthy()
    expect(session.completedStepIds).toEqual([recipe.steps[0].id])
    expect(session.currentStepId).toBe(recipe.steps[1].id)
    expect(session.revision).toBe(5)
  })
  it('replays offline timer actions at their original times rather than restarting at reconnect', () => {
    const reconnect = '2026-10-30T01:00:00.000Z'
    let session = applyCookingCommand(initial(), { type: 'start_timer', timerId: 'offline', label: 'Simmer', durationSeconds: 600, occurredAt: start }, recipe, reconnect)
    expect(session.timers[0].endAt).toBe('2026-10-30T00:10:00.000Z')
    session = applyCookingCommand(session, { type: 'pause_timer', timerId: 'offline', occurredAt: '2026-10-30T00:03:00.000Z' }, recipe, reconnect)
    expect(session.timers[0].remainingSeconds).toBe(420)
    session = applyCookingCommand(session, { type: 'resume_timer', timerId: 'offline', occurredAt: '2026-10-30T00:20:00.000Z' }, recipe, reconnect)
    expect(session.timers[0].endAt).toBe('2026-10-30T00:27:00.000Z')
    expect(timerRemainingSeconds(session.timers[0], Date.parse(reconnect))).toBe(0)
    expect(session.updatedAt).toBe(reconnect)
  })
  it('records cookware changes without inventing pressure-cooking timing', () => {
    const before = initial()
    const after = applyCookingCommand(before, { type: 'set_cookware', cookware: 'Pressure cooker' }, recipe, start)
    expect(after.steps).toEqual(before.steps)
    expect(after.adaptations[0].kind).toBe('method')
    expect(before.revision).toBe(0)
    expect(after.revision).toBe(1)
  })
  it('allows an explicitly added ingredient without modifying the original recipe', () => {
    const before = initial()
    let session = applyCookingCommand(before, { type: 'add_custom_ingredient', ingredient: { id: 'extra-carrot', name: { en: 'Carrot' }, quantity: 1, unit: 'piece' } }, recipe, start)
    session = applyCookingCommand(session, { type: 'record_ingredient', ingredientId: 'extra-carrot', quantity: 1, unit: 'piece' }, recipe, start)
    expect(session.extraIngredients).toHaveLength(1)
    expect(before.extraIngredients).toHaveLength(0)
    expect(session.addedIngredients[0].ingredientId).toBe('extra-carrot')
  })
})
