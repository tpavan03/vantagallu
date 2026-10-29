import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { config } from 'dotenv'
config({ path: ['.env.local', '.env.backend.local'], quiet: true })
const { handleRequest } = await import('../server/app.ts')
const server = createServer(async (incoming, outgoing) => {
  const abort = new AbortController()
  incoming.on('aborted', () => abort.abort())
  outgoing.on('close', () => { if (!outgoing.writableEnded) abort.abort() })
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(incoming.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    const method = incoming.method || 'GET'
    const init: RequestInit & { duplex?: 'half' } = { method, headers, signal: abort.signal }
    if (!['GET', 'HEAD'].includes(method)) { init.body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>; init.duplex = 'half' }
    const response = await handleRequest(new Request(`http://${incoming.headers.host || '127.0.0.1:4401'}${incoming.url}`, init))
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    if (!response.body) outgoing.end()
    else {
      const reader = response.body.getReader()
      try {
        while (!abort.signal.aborted) { const { value, done } = await reader.read(); if (done) break; outgoing.write(value) }
      } finally { if (abort.signal.aborted) await reader.cancel(); reader.releaseLock(); outgoing.end() }
    }
  } catch { if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'application/json' }); outgoing.end(JSON.stringify({ error: { message: 'The local API could not complete this request.' } })) }
})
server.listen(4401, '127.0.0.1', () => console.log('Vantagallu API listening on http://127.0.0.1:4401'))
