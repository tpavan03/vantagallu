// Explicit, repeatable catalog deployment to the confirmed personal project only.
// Historical versions remain immutable through migration 002's archive trigger.
import { config as loadEnv } from 'dotenv'
import assert from 'node:assert/strict'
import { recipeCatalog } from '../../src/data/recipes.ts'
import { readConfig } from '../config.ts'

loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_SEED_CATALOG !== '1') throw new Error('Explicit VANTAGALLU_SEED_CATALOG=1 is required.')
const config = readConfig()
if (new URL(config.supabaseUrl).hostname !== 'hdnqsyrhelpbnjezuyww.supabase.co') throw new Error('Catalog seeding is restricted to the confirmed personal project.')
if (!config.serviceKey) throw new Error('Personal service configuration is missing.')
assert.equal(recipeCatalog.length, 64)
const headers = { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' }
const response = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_recipes?on_conflict=id`, {
  method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(recipeCatalog.map(recipe => ({ id: recipe.id, version: recipe.version, data: recipe }))), signal: AbortSignal.timeout(20000),
})
if (!response.ok) throw new Error(`Catalog seed failed (${response.status}); no same-version source replacement is allowed.`)
const readback = await fetch(`${config.supabaseUrl}/rest/v1/vantagallu_recipes?select=id,version,data`, { headers, signal: AbortSignal.timeout(15000) })
if (!readback.ok) throw new Error(`Catalog read-back failed (${readback.status}).`)
const rows = await readback.json() as { id: string; version: number; data: unknown }[]
for (const recipe of recipeCatalog) {
  const row = rows.find(row => row.id === recipe.id)
  assert.equal(row?.version, recipe.version, `Version mismatch: ${recipe.id}`)
  assert.deepEqual(row?.data, recipe, `Content mismatch: ${recipe.id}`)
}
console.log(JSON.stringify({ verified: recipeCatalog.length, upgraded: recipeCatalog.filter(recipe => recipe.version > 1).length, historicalVersionsPreserved: true, providerCalls: 0 }))
