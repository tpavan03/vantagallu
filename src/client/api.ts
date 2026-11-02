import { supabase } from './auth'
import { apiBaseUrl } from './native'
import type { CookingSession } from '../domain/types'

export class ApiError extends Error {
  status: number
  code: string
  session?: CookingSession
  constructor(message: string, status: number, code = '', session?: CookingSession) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.session = session }
}
const base = apiBaseUrl()
export async function apiFetch(path: string, body?: unknown, signal?: AbortSignal): Promise<Response> {
  const auth = await supabase?.auth.getSession()
  const token = auth?.data.session?.access_token
  if (!token) throw new ApiError('Sign in to use saved cloud sessions and AI.', 401)
  const response = await fetch(`${base}/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal,
  })
  if (!response.ok) {
    let payload: { error?: string | { message?: string; code?: string }; message?: string; code?: string; session?: CookingSession } = {}
    try { payload = await response.json() } catch { /* retain HTTP status */ }
    const error = payload.error
    throw new ApiError(typeof error === 'string' ? error : error?.message || payload.message || `Request failed (${response.status}).`, response.status, typeof error === 'object' ? error?.code || '' : payload.code || '', payload.session)
  }
  return response
}
export async function api<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> { return (await apiFetch(path, body, signal)).json() }

export async function streamChat(body: unknown, onEvent: (event: string, data: Record<string, unknown>) => void, signal: AbortSignal) {
  const response = await apiFetch('/chat', body, signal)
  if (!response.body) throw new Error('The chat stream could not be opened.')
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      pending += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')
      let boundary: number
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const block = pending.slice(0, boundary); pending = pending.slice(boundary + 2)
        const event = block.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim() || 'message'
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
        if (data) onEvent(event, JSON.parse(data))
      }
      if (done) break
    }
  } finally { reader.releaseLock() }
}
