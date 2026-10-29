import type { ServerConfig } from './config.ts'
import type { CookingSession, Recipe } from '../src/domain/types.ts'
import { ApiError, unavailable } from './errors.ts'
import { cookingPrompt, cookingTools } from './prompt.ts'

export interface ProviderMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string | null; tool_call_id?: string; tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[] }
export interface ToolCall { id: string; name: string; arguments: string }
export type ProviderDelta = { type: 'text'; text: string } | { type: 'tools'; calls: ToolCall[] }

async function providerResponse(url: string, init: RequestInit, fetcher: typeof fetch) {
  let response: Response
  try { response = await fetcher(url, init) } catch {
    if (init.signal?.aborted) throw new ApiError(408, 'generation_interrupted', 'The response was interrupted. Your saved cooking state is unchanged.')
    throw new ApiError(502, 'provider_unavailable', 'The AI provider could not be reached. Your saved cooking state is available.')
  }
  if (!response.ok) throw new ApiError(response.status === 429 ? 429 : 502, response.status === 429 ? 'provider_rate_limit' : 'provider_unavailable', response.status === 429 ? 'The AI provider has reached its current limit. Try again later.' : 'The AI provider rejected this request. Check the personal provider configuration.')
  return response
}

export async function* deepseekTurn(messages: ProviderMessage[], config: ServerConfig, signal: AbortSignal, fetcher: typeof fetch = fetch, toolsEnabled = true): AsyncGenerator<ProviderDelta> {
  if (!config.deepseekKey) throw unavailable('Text conversation')
  const response = await providerResponse('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${config.deepseekKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.deepseekModel, messages, stream: true, max_tokens: 1400, thinking: { type: 'disabled' }, ...(toolsEnabled ? { tools: cookingTools.map(tool => ({ type: 'function', function: tool })), tool_choice: 'auto', parallel_tool_calls: false } : { tool_choice: 'none' }) }), signal }, fetcher)
  if (!response.body) throw new ApiError(502, 'empty_provider_response', 'The AI provider returned no response.')
  const reader = response.body.getReader(), decoder = new TextDecoder(), calls = new Map<number, ToolCall>()
  let buffer = '', finished = false, sawFinish = false, generated = 0
  try {
    while (!finished) {
      const { done, value } = await reader.read()
      if (done) break
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')
      if (buffer.length > 262144) throw new ApiError(502, 'invalid_provider_response', 'The AI provider returned an oversized response.')
      let boundary: number
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2)
        const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
        if (!data) continue
        if (data.trim() === '[DONE]') { finished = true; break }
        let event: { choices?: { finish_reason?: string | null; delta?: { content?: string; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[]; error?: unknown }
        try { event = JSON.parse(data) } catch { throw new ApiError(502, 'invalid_provider_response', 'The AI provider returned an unreadable response.') }
        if (event.error) throw new ApiError(502, 'provider_unavailable', 'The AI provider could not finish this response.')
        const finishReason = event.choices?.[0]?.finish_reason
        if (finishReason === 'stop' || finishReason === 'tool_calls') sawFinish = true
        else if (finishReason) throw new ApiError(502, 'generation_interrupted', 'The AI response stopped before it was complete. The partial reply was not saved.')
        const delta = event.choices?.[0]?.delta
        if (delta?.content) { generated += delta.content.length; if (generated > 24000) throw new ApiError(502, 'response_too_long', 'The AI response exceeded the configured limit.'); yield { type: 'text', text: delta.content } }
        for (const call of delta?.tool_calls ?? []) {
          const index = call.index ?? 0, current = calls.get(index) ?? { id: '', name: '', arguments: '' }
          current.id += call.id ?? ''; current.name += call.function?.name ?? ''; current.arguments += call.function?.arguments ?? ''
          if (current.arguments.length > 65536 || calls.size > 8) throw new ApiError(502, 'invalid_provider_response', 'The AI provider proposed too many changes at once.')
          calls.set(index, current)
        }
      }
    }
    if (!finished && !sawFinish) throw new ApiError(502, 'generation_interrupted', 'The AI stream ended before its response was complete. The partial reply was not saved.')
    if (calls.size) yield { type: 'tools', calls: [...calls.values()] }
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock() }
}

export function chatMessages(recipe: Recipe, session: CookingSession): ProviderMessage[] {
  return [{ role: 'system', content: cookingPrompt(recipe, session) }, ...session.messages.slice(-24).map(message => ({ role: message.role, content: message.text }))]
}

export async function mintVoiceToken(recipe: Recipe, session: CookingSession, config: ServerConfig, now: Date, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  if (!config.geminiKey) throw unavailable('Live voice')
  const expiresAt = new Date(now.getTime() + config.voiceTokenSeconds * 1000).toISOString(), newSessionExpireTime = new Date(now.getTime() + 60000).toISOString()
  // REST uses the serialized Bidi setup, not the SDK's liveConnectConstraints name.
  const setup = { model: `models/${config.geminiModel.replace(/^models\//, '')}`, generationConfig: { responseModalities: ['AUDIO'], maxOutputTokens: 256 }, systemInstruction: { parts: [{ text: cookingPrompt(recipe, session) }] }, inputAudioTranscription: {}, outputAudioTranscription: {}, sessionResumption: {}, tools: [{ functionDeclarations: cookingTools.map(({ parameters, ...tool }) => ({ ...tool, parametersJsonSchema: parameters })) }] }
  const response = await providerResponse('https://generativelanguage.googleapis.com/v1beta/auth_tokens', { method: 'POST', headers: { 'x-goog-api-key': config.geminiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ uses: 1, expireTime: expiresAt, newSessionExpireTime, bidiGenerateContentSetup: setup }), signal }, fetcher)
  const data = await response.json() as { name?: string }
  if (!data.name || !data.name.startsWith('auth_tokens/')) throw new ApiError(502, 'invalid_provider_response', 'The voice provider did not return a temporary credential.')
  // Only the ephemeral credential is returned; persistent provider credentials never leave the server.
  return { token: data.name, model: config.geminiModel, expiresAt, newSessionExpireTime, revision: session.revision, config: { responseModalities: ['AUDIO'] } }
}
