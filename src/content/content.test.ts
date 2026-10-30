import { describe, expect, it } from 'vitest'
import { getRecipeById, recipeCatalog, sourceRecipeCatalog } from '../data/recipes'
import { coverageTargets, recipeCoverageManifest } from '../data/coverage'
import { applyPowderMethod, powderMethodIds } from './powder-methods'
import { isSpicePowder } from '../domain/measures'

describe('source-adapted recipe catalogue', () => {
  it('contains real cooking plans with unique IDs and honest provenance', () => {
    expect(recipeCatalog.length).toBeGreaterThanOrEqual(60)
    expect(new Set(recipeCatalog.map(recipe => recipe.id)).size).toBe(recipeCatalog.length)
    expect(new Set(recipeCatalog.map(recipe => recipe.sources[0].url)).size).toBe(recipeCatalog.length)
    for (const recipe of recipeCatalog) {
      expect(recipe.title.en.length, recipe.id).toBeGreaterThan(3)
      expect(recipe.title.te, recipe.id).toMatch(/[\u0c00-\u0c7f]/)
      expect(recipe.reviewStatus).toBe('needs-kitchen-test')
      expect(recipe.authorMethod).toMatch(/not kitchen-tested/)
      const source = new URL(recipe.sources[0].url)
      expect(source.protocol).toBe('https:')
      expect(['vismaifood.com', 'www.vegrecipesofindia.com', 'www.indianhealthyrecipes.com', 'www.cookdtv.com', 'www.sailusfood.com']).toContain(source.hostname)
      expect(source.pathname.split('/').filter(Boolean).length).toBeGreaterThan(0)
      expect(recipe.sources[0].note).toContain('2026-10-30')
      expect(recipe.equipment.length).toBeGreaterThan(1)
      expect(recipe.baseServings).toBeGreaterThan(0)
      expect(recipe.prepMinutes).toBeGreaterThan(0)
      expect(recipe.cookMinutes).toBeGreaterThan(0)
      expect(recipe.ingredients.length).toBeGreaterThan(4)
      expect(recipe.steps.length).toBeGreaterThanOrEqual(4)
      expect(getRecipeById(recipe.id)).toBe(recipe)
    }
    expect(getRecipeById('planned-no-such-recipe')).toBeUndefined()
  })

  it('has valid ingredient references, useful checkpoints and safe adjustable quantities', () => {
    for (const recipe of recipeCatalog) {
      const ids = new Set(recipe.ingredients.map(item => item.id))
      expect(ids.size, recipe.id).toBe(recipe.ingredients.length)
      expect(new Set(recipe.steps.map(step => step.id)).size).toBe(recipe.steps.length)
      for (const item of recipe.ingredients) {
        expect(Number.isFinite(item.quantity), `${recipe.id}/${item.id}`).toBe(true)
        expect(item.quantity, `${recipe.id}/${item.id}`).toBeGreaterThan(0)
        expect(item.unit.length).toBeGreaterThan(0)
        if (/^water\b|\boil\b/i.test(item.name.en)) expect(item.scaling, `${recipe.id}/${item.name.en}`).toBe('method-dependent')
        if (/\bsalt\b/i.test(item.name.en)) expect(item.scaling).toBe('to-taste')
      }
      for (const step of recipe.steps) {
        expect(step.instruction.en.length).toBeGreaterThan(20)
        expect(step.checkpoint?.en.length).toBeGreaterThan(15)
        for (const id of step.ingredientIds) expect(ids.has(id), `${recipe.id}/${step.id}/${id}`).toBe(true)
        if (step.durationSeconds !== undefined) expect(step.durationSeconds).toBeGreaterThan(0)
      }
      for (const swap of recipe.substitutions ?? []) expect(ids.has(swap.ingredientId)).toBe(true)
    }
  })

  it('exposes critical safety and editorial corrections instead of inheriting unsafe source advice', () => {
    const chicken = recipeCatalog.filter(recipe => /chicken/.test(recipe.id))
    expect(chicken.length).toBeGreaterThan(3)
    for (const recipe of chicken) expect(recipe.safetyNotes?.join(' ')).toContain('74°C')
    for (const recipe of recipeCatalog.filter(recipe => recipe.diet === 'egg')) expect(recipe.safetyNotes?.join(' ')).toContain('71°C')
    for (const recipe of recipeCatalog) expect(recipe.safetyNotes?.join(' ')).toContain('within two hours')
    const coconutMilk = getRecipeById('coconut-rice')?.ingredients.find(item => /Diluted coconut milk/.test(item.name.en))
    expect(coconutMilk?.quantity).toBe(1.75)
    expect(coconutMilk?.unit).toBe('cup')
    expect(getRecipeById('mango-pulissery')?.ingredients.some(item => /yogurt/i.test(item.name.en))).toBe(true)
    expect(getRecipeById('chakkara-pongali')?.ingredients.some(item => /camphor/i.test(item.name.en))).toBe(false)
    expect(getRecipeById('sorakaya-pappu')?.safetyNotes?.join(' ')).toContain('Discard bitter bottle gourd')
    expect(getRecipeById('peanut-chutney')?.ingredients.find(item => item.id === 'peanuts')?.allergens).toContain('peanut')
    expect(getRecipeById('peanut-chutney')?.ingredients.find(item => item.id === 'sesame')?.allergens).toContain('sesame')
    expect(getRecipeById('mudda-pappu')?.ingredients.find(item => /asafoetida/i.test(item.name.en))?.unit).toBe('pinch')
  })

  it('uses measured powder methods without rewriting original source versions', () => {
    for (const recipe of recipeCatalog) {
      for (const item of recipe.ingredients.filter(item => isSpicePowder(item.name.en))) {
        expect(['tbsp', 'cup'], `${recipe.id}/${item.id}`).not.toContain(item.unit)
      }
    }
    for (const id of powderMethodIds) {
      const original = sourceRecipeCatalog.find(recipe => recipe.id === id)!
      const before = JSON.stringify(original)
      const adapted = applyPowderMethod(original)
      expect(JSON.stringify(original)).toBe(before)
      expect(adapted.version).toBe(original.version + 1)
      expect(adapted.steps.some(step => /toast whole|roast.*spice|grind.*masala/i.test(step.instruction.en))).toBe(false)
    }
    const curry = getRecipeById('chicken-curry')!
    expect(curry.ingredients.find(item => item.id === 'coriander-powder')).toMatchObject({ quantity: 1, unit: 'tsp' })
    expect(curry.ingredients.find(item => item.id === 'garam-masala')).toMatchObject({ quantity: 1, unit: 'tsp' })
    const salna = getRecipeById('chicken-sherva')!
    expect(salna.ingredients.find(item => item.id === 'chicken-masala')).toMatchObject({ quantity: 1, unit: 'tsp' })
    expect(salna.ingredients.find(item => item.id === 'chicken')).toMatchObject({ quantity: 350, unit: 'g' })
  })
})

describe('honest named coverage manifest', () => {
  it('names exactly 300 targets and keeps unavailable dishes out of cookable data', () => {
    expect(recipeCoverageManifest).toHaveLength(300)
    expect(new Set(recipeCoverageManifest.map(entry => entry.id)).size).toBe(300)
    const available = recipeCoverageManifest.filter(entry => entry.status === 'available')
    expect(available).toHaveLength(recipeCatalog.length)
    for (const entry of available) expect(getRecipeById(entry.recipeId!)).toBeDefined()
    for (const entry of recipeCoverageManifest.filter(item => item.status === 'planned')) {
      expect(entry.recipeId).toBeUndefined()
      expect(getRecipeById(entry.id)).toBeUndefined()
      expect(entry.note).toContain('no cooking session can start')
    }
    for (const [group, count] of Object.entries(coverageTargets)) expect(recipeCoverageManifest.filter(entry => entry.group === group)).toHaveLength(count)
  })

  it('represents every requested regional family and major meal category with actual starters', () => {
    for (const region of ['andhra', 'telangana', 'rayalaseema', 'tamil', 'karnataka', 'kerala', 'south-indian']) expect(recipeCatalog.some(recipe => recipe.region === region)).toBe(true)
    for (const diet of ['vegan', 'vegetarian', 'egg', 'non-vegetarian']) expect(recipeCatalog.some(recipe => recipe.diet === diet)).toBe(true)
    for (const id of ['pesarattu', 'idli', 'peanut-chutney', 'allam-pachadi', 'tomato-pappu', 'mudda-pappu', 'chicken-curry', 'telangana-egg-curry', 'fish-pulusu', 'prawn-masala', 'gongura-mutton']) expect(getRecipeById(id)).toBeDefined()
    for (const id of ['plain-dosa', 'coconut-chutney', 'onion-chutney', 'medu-vada', 'gutti-vankaya', 'hyderabadi-chicken-dum-biryani', 'vegetable-dum-biryani', 'chicken-65']) expect(getRecipeById(id)).toBeDefined()
  })
})
