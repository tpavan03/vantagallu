import { expect, it } from 'vitest'
import { recipeCatalog } from '../data/recipes'
import type { CookingSetup } from './types'
import { applyCookingCommand, createCookingSession } from './session'
import { heatGuidance } from './setup'

const recipe = recipeCatalog[0]
const now = '2026-10-30T00:00:00.000Z'
const setup: CookingSetup = { heatSource: 'induction', inductionMaxWatts: 1800, availableIngredientIds: [recipe.ingredients[0].id], unavailableIngredientIds: [recipe.ingredients[1].id] }

it('stores pantry availability without claiming ingredients were added', () => {
  const session = createCookingSession(recipe, { cookingSetup: setup, now })
  expect(session.cookingSetup).toEqual(setup)
  expect(session.cookingSetup).not.toBe(setup)
  expect(session.addedIngredients).toEqual([])
  const item = recipe.ingredients[0]
  const added = applyCookingCommand(session, { type: 'record_ingredient', ingredientId: item.id, quantity: item.quantity, unit: item.unit }, recipe, now)
  const changed = applyCookingCommand(added, { type: 'set_cooking_setup', setup: { ...setup, availableIngredientIds: [], unavailableIngredientIds: [item.id] } }, recipe, now)
  expect(changed.addedIngredients).toEqual(added.addedIngredients)
  expect(added.cookingSetup).toEqual(setup)
})

it('rejects contradictory pantry entries, unknown ingredients and unsupported watt limits', () => {
  for (const invalid of [
    { ...setup, unavailableIngredientIds: setup.availableIngredientIds },
    { ...setup, availableIngredientIds: ['invented-ingredient'] },
    { ...setup, inductionMaxWatts: 2000 },
  ]) expect(() => createCookingSession(recipe, { cookingSetup: invalid, now })).toThrow()
})

it('keeps completed steps and rejects a revised power setting above the selected hob limit', () => {
  const original = createCookingSession(recipe, { cookingSetup: setup, now })
  const completed = applyCookingCommand(original, { type: 'complete_step', stepId: recipe.steps[0].id }, recipe, now)
  const remaining = { ...recipe.steps[1], id: 'pantry-adjusted', heat: 'low' as const, inductionWatts: 400 }
  const revised = applyCookingCommand(completed, { type: 'revise_plan', remainingSteps: [remaining], reason: 'Adapted to the saved pantry and induction hob.' }, recipe, now)
  expect(revised.completedStepIds).toEqual(completed.completedStepIds)
  expect(revised.steps[0]).toEqual(completed.steps[0])
  expect(() => applyCookingCommand(completed, { type: 'revise_plan', remainingSteps: [{ ...remaining, inductionWatts: 2000 }], reason: 'Too much power' }, recipe, now)).toThrow(/watt/)
  expect(() => applyCookingCommand(completed, { type: 'revise_plan', remainingSteps: [{ ...remaining, heat: 'off', inductionWatts: 400 }], reason: 'Contradictory heat' }, recipe, now)).toThrow(/heat-off/)
})

it('gives gas flame guidance and bounded induction starting watts rather than temperature claims', () => {
  const step = { ...recipe.steps[0], heat: 'medium' as const }
  expect(heatGuidance(step).label).toBe('Medium flame')
  expect(heatGuidance(step, setup).label).toBe('900 W · medium')
  expect(heatGuidance({ ...step, inductionWatts: 1700 }, { ...setup, inductionMaxWatts: 1200 }).watts).toBe(1200)
  expect(heatGuidance({ ...step, heat: 'off', inductionWatts: 1500 }, setup).watts).toBe(0)
  expect(heatGuidance(step, setup).detail).toContain('nearest available setting')
})
