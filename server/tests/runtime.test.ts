import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it('boots the production entry with native Node ESM resolution', () => {
  // A bundler accepts extensionless imports that fail when Vercel emits separate
  // ESM files. Run outside Vite/Vitest's module loader to exercise that boundary.
  const entry = new URL('../../api/index.ts', import.meta.url).href
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    const { default: app } = await import(${JSON.stringify(entry)});
    const health = await app.fetch(new Request('https://vantagallu.vercel.app/api/health'));
    assert.equal(health.status, 200);
    assert.equal((await health.json()).service, 'vantagallu');
    const privateRoute = await app.fetch(new Request('https://vantagallu.vercel.app/api/sessions'));
    assert.equal(privateRoute.status, 401);
  `], { cwd: fileURLToPath(new URL('../..', import.meta.url)), encoding: 'utf8', timeout: 10000 })
  expect(result.error).toBeUndefined()
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
}, 15000)
