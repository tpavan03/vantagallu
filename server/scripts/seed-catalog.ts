// Explicit, repeatable catalog deployment to the confirmed personal project only.
// Historical versions remain immutable through migration 002's archive trigger.
import { config as loadEnv } from 'dotenv'
import assert from 'node:assert/strict'
import { recipeCatalog } from '../../src/data/recipes.ts'
import { recipeCoverageManifest } from '../../src/data/coverage.ts'
import { readConfig } from '../config.ts'

loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_SEED_CATALOG !== '1') throw new Error('Explicit VANTAGALLU_SEED_CATALOG=1 is required.')
const config = readConfig()
if (new URL(config.supabaseUrl).hostname !== 'hdnqsyrhelpbnjezuyww.supabase.co') throw new Error('Catalog seeding is restricted to the confirmed personal project.')
if (!config.serviceKey) throw new Error('Personal service configuration is missing.')
const catalogIds = recipeCatalog.map(recipe => recipe.id)
const availableIds = recipeCoverageManifest.filter(entry => entry.status === 'available').map(entry => entry.recipeId)
assert.equal(new Set(catalogIds).size, catalogIds.length, 'Canonical recipe IDs must be unique.')
assert.equal(new Set(availableIds).size, availableIds.length, 'Available manifest IDs must be unique.')
assert.deepEqual([...catalogIds].sort(), [...availableIds].sort(), 'Seed only the complete available catalogue; planned dishes must remain excluded.')
const headers = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
type StoredRecipe = { id: string; version: number; data: unknown }
async function readRows(table: 'vantagallu_recipes' | 'vantagallu_recipe_versions'): Promise<StoredRecipe[]> {
  const rows: StoredRecipe[] = []
  for (let start = 0; ; start += 500) {
    const result = await fetch(`${config.supabaseUrl}/rest/v1/${table}?select=id,version,data&order=id,version`, { headers: { ...headers, Range: `${start}-${start + 499}` }, signal: AbortSignal.timeout(15000) })
    if (!result.ok) throw new Error(`Catalog verification failed for ${table} (${result.status}).`)
    const page = await result.json() as StoredRecipe[]
    rows.push(...page)
    if (page.length < 500) return rows
  }
}
const versionsBefore = await readRows('vantagallu_recipe_versions')
// JSON is the persistence contract: optional undefined properties are absent on
// the wire, so compare the actual serialized recipe rather than JS-only keys.
const seedRows: StoredRecipe[] = recipeCatalog.map(recipe => ({ id: recipe.id, version: recipe.version, data: JSON.parse(JSON.stringify(recipe)) }))
const response = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_recipes?on_conflict=id`, {
  method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(seedRows), signal: AbortSignal.timeout(20000),
})
if (!response.ok) throw new Error(`Catalog seed failed (${response.status}); no same-version source replacement is allowed.`)
const rows = await readRows('vantagallu_recipes')
for (const recipe of seedRows) {
  const row = rows.find(row => row.id === recipe.id)
  assert.equal(row?.version, recipe.version, `Version mismatch: ${recipe.id}`)
  assert.deepEqual(row?.data, recipe.data, `Content mismatch: ${recipe.id}`)
}
const versionsAfter = await readRows('vantagallu_recipe_versions')
const archived = new Map(versionsAfter.map(row => [`${row.id}:${row.version}`, row]))
for (const previous of versionsBefore) assert.deepEqual(archived.get(`${previous.id}:${previous.version}`), previous, `Historical version changed: ${previous.id}:${previous.version}`)
for (const recipe of seedRows) assert.deepEqual(archived.get(`${recipe.id}:${recipe.version}`)?.data, recipe.data, `Current version was not archived: ${recipe.id}:${recipe.version}`)
console.log(JSON.stringify({ verified: recipeCatalog.length, databaseCurrentCount: rows.length, upgraded: recipeCatalog.filter(recipe => recipe.version > 1).length, archivedVersionsBefore: versionsBefore.length, archivedVersionsAfter: versionsAfter.length, historicalVersionsPreserved: true, providerCalls: 0 }))
