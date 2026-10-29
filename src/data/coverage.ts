import type { Recipe, RecipeRegion } from '../domain/types'
import { recipeCatalog } from './recipes'
import { coverageTargets, plannedDishNames, type CoverageGroup } from '../content/coverage-plan'

export { coverageTargets }
export type RecipeCoverageEntry = {
  id: string
  title: string
  group: CoverageGroup
  status: 'available' | 'planned'
  recipeId?: string
  region?: RecipeRegion
  note: string
}

function groupFor(recipe: Recipe): CoverageGroup {
  if (recipe.categories.includes('breakfast')) return 'breakfast'
  if (recipe.categories.includes('chutney') || recipe.categories.includes('podi')) return 'chutney'
  if (recipe.categories.includes('pickle')) return 'pickle'
  if (recipe.categories.includes('snack')) return 'snack'
  if (recipe.categories.includes('sweet')) return 'sweet'
  if (recipe.categories.includes('rice') || recipe.categories.includes('biryani')) return 'rice'
  if (recipe.categories.includes('seafood')) return 'seafood'
  if (/mutton/.test(recipe.id)) return 'mutton'
  if (recipe.diet === 'egg' || recipe.diet === 'non-vegetarian') return 'chicken-egg'
  if (recipe.categories.includes('dal')) return 'dal'
  return 'vegetable'
}

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')
const available: RecipeCoverageEntry[] = recipeCatalog.map(recipe => ({ id: recipe.id, title: recipe.title.en, group: groupFor(recipe), status: 'available', recipeId: recipe.id, region: recipe.region, note: 'Source-adapted cooking plan available; needs kitchen test. See the recipe for its specific author/method and editorial changes.' }))
const availableTitles = new Set(available.map(entry => normalize(entry.title)))

const planned: RecipeCoverageEntry[] = (Object.keys(coverageTargets) as CoverageGroup[]).flatMap(group => {
  const needed = coverageTargets[group] - available.filter(entry => entry.group === group).length
  const uniqueNames = [...new Set(plannedDishNames[group])].filter(title => !availableTitles.has(normalize(title)))
  if (needed < 0 || uniqueNames.length < needed) throw new Error(`Coverage group ${group} needs a reviewed commissioning list`)
  return uniqueNames.slice(0, needed).map(title => ({ id: `planned-${normalize(title)}`, title, group, status: 'planned', note: 'Named coverage target only. Source/method selection, independently written quantities/instructions, safety review and kitchen testing remain; no cooking session can start from this entry.' }))
})

// Exactly 300 named dishes/variants; planned entries are never part of recipeCatalog.
export const recipeCoverageManifest: RecipeCoverageEntry[] = [...available, ...planned]
