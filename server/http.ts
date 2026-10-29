import type { ServerConfig } from './config.ts'
import { ApiError } from './errors.ts'

export function responseHeaders(request: Request, config: ServerConfig): Headers {
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', Vary: 'Origin' })
  const origin = request.headers.get('origin')
  if (origin) {
    if (origin !== new URL(request.url).origin && !config.allowedOrigins.includes(origin)) throw new ApiError(403, 'origin_not_allowed', 'This app origin is not allowed to use the personal API.')
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    headers.set('Access-Control-Max-Age', '600')
  }
  return headers
}
export function jsonResponse(data: unknown, status = 200, headers = new Headers()) {
  const next = new Headers(headers)
  next.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { status, headers: next })
}
export async function readJson(request: Request, maxBytes = 131072): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'json_required', 'Send this request as JSON.')
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) throw new ApiError(413, 'request_too_large', 'This request is too large.')
  if (!request.body) throw new ApiError(400, 'invalid_json', 'A JSON request body is required.')
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) { await reader.cancel(); throw new ApiError(413, 'request_too_large', 'This request is too large.') }
      chunks.push(value)
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    try { return JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new ApiError(400, 'invalid_json', 'The request body is not valid JSON.') }
  } finally { reader.releaseLock() }
}
