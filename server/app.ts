import { createHash, randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { createCookingSession, applyCookingCommand, DomainError } from '../src/domain/session.ts'
import type { CommandRequest } from '../src/domain/types.ts'
import { authenticate as verifyPrincipal, type Principal } from './auth.ts'
import { readConfig, type ServerConfig } from './config.ts'
import { ApiError, unavailable } from './errors.ts'
import { jsonResponse, readJson, responseHeaders } from './http.ts'
import { SupabaseRepository, type Repository, type CommitResult } from './repository.ts'
import { chatSchema, commandRequestSchema, createSessionSchema, importLocalSession, leaseSchema, localRecipeReferenceSchema, parse, parseCookingCommand, voiceTokenSchema } from './validation.ts'
import { chatMessages, deepseekTurn, mintVoiceToken, type ProviderMessage, type ToolCall } from './providers.ts'

export interface AppOptions {
  config?: ServerConfig | (() => ServerConfig)
  fetch?: typeof fetch
  repository?: Repository
  authenticate?: (request: Request, config: ServerConfig) => Promise<Principal>
  now?: () => Date
}
const canonical = (value: unknown): string => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : `{${Object.keys(value as object).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requireSession(repository: Repository, ownerId: string, id: string) {
  const state = await repository.getSession(ownerId, id)
  if (!state) throw new ApiError(404, 'not_found', 'This cooking session could not be found.')
  return state
}
async function requireRecipe(repository: Repository, recipeId: string, version?: number) {
  const recipe = await repository.getRecipe(recipeId, version)
  if (!recipe || version !== undefined && recipe.version !== version) throw new ApiError(404, 'recipe_unavailable', 'This recipe version is not available on the server. Your saved session is unchanged.')
  return recipe
}
export async function commitCookingCommand(repository: Repository, ownerId: string, id: string, request: CommandRequest, now: string, voiceLeaseId?: string): Promise<CommitResult> {
  const session = await requireSession(repository, ownerId, id)
  if (voiceLeaseId) await repository.requireLease(ownerId, id, voiceLeaseId)
  const existing = await repository.findCommand(ownerId, id, request.commandId)
  if (existing) {
    if (!isDeepStrictEqual(existing.command, request.command)) throw new ApiError(409, 'command_id_reused', 'This command ID was already used for a different action.')
    return { session, replayed: true, commandRevision: existing.revision }
  }
  if (session.revision !== request.expectedRevision) throw new ApiError(409, 'revision_conflict', 'The cooking session changed. Review the latest state and try again.', { session })
  const recipe = await requireRecipe(repository, session.recipeId, session.recipeVersion)
  const next = applyCookingCommand(session, request.command, recipe, now)
  return repository.commit(ownerId, id, request, next, voiceLeaseId)
}

async function chatResponse(request: Request, body: ReturnType<typeof chatSchema.parse>, config: ServerConfig, repository: Repository, principal: Principal, headers: Headers, fetcher: typeof fetch, now: () => Date) {
  if (!config.deepseekKey) throw unavailable('Text conversation')
  let state = await requireSession(repository, principal.id, body.sessionId)
  const existingUser = state.messages.find(message => message.id === `chat-${body.requestId}-user`)
  if (existingUser && existingUser.text !== body.message) throw new ApiError(409, 'command_id_reused', 'This request ID was already used for another message.')
  const existingReply = state.messages.find(message => message.id === `chat-${body.requestId}-assistant`)
  if (existingReply) {
    const payload = `event: meta\ndata: ${JSON.stringify({ sessionId: state.id, revision: state.revision, replayed: true })}\n\nevent: delta\ndata: ${JSON.stringify({ text: existingReply.text, revision: state.revision })}\n\nevent: done\ndata: ${JSON.stringify({ session: state, revision: state.revision, replayed: true })}\n\n`
    const next = new Headers(headers); next.set('Content-Type', 'text/event-stream; charset=utf-8')
    return new Response(payload, { headers: next })
  }
  if (!existingUser && state.revision !== body.expectedRevision) throw new ApiError(409, 'revision_conflict', 'The cooking session changed. Review the latest state before sending this message.', { session: state })
  const recipe = await requireRecipe(repository, state.recipeId, state.recipeVersion)
  if (!await repository.reserveUsage(principal.id, state.id, body.requestId, 'chat', 1)) throw new ApiError(409, 'request_in_progress', 'This message was already submitted. Refresh the session to check its result before sending a new request.')
  if (!existingUser) state = (await commitCookingCommand(repository, principal.id, state.id, { commandId: `chat-${body.requestId}-user`, expectedRevision: state.revision, command: { type: 'add_message', message: { id: `chat-${body.requestId}-user`, role: 'user', text: body.message, channel: 'chat', createdAt: now().toISOString() } } }, now().toISOString())).session
  const messages: ProviderMessage[] = chatMessages(recipe, state)
  const abort = new AbortController(), signal = AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(55000)])
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null, ended = false
  const encoder = new TextEncoder()
  const send = (event: string, data: unknown) => { if (!ended && !signal.aborted) controllerRef?.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) }
  const assertFresh = async () => {
    const current = await requireSession(repository, principal.id, state.id)
    if (current.revision !== state.revision) throw new ApiError(409, 'stale_response', 'The cooking state changed while this answer was being prepared.', { session: current })
  }
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
      void (async () => {
        try {
          send('meta', { sessionId: state.id, revision: state.revision })
          let answer = ''
          for (let round = 0; round < 3; round++) {
            await assertFresh()
            const toolsEnabled = round < 2
            let roundText = '', calls: ToolCall[] = [], checkedAt = 0
            for await (const delta of deepseekTurn(messages, config, signal, fetcher, toolsEnabled)) {
              if (Date.now() - checkedAt > 800) { await assertFresh(); checkedAt = Date.now() }
              if (delta.type === 'tools') calls = delta.calls
              else { roundText += delta.text; if (!toolsEnabled) send('delta', { text: delta.text, revision: state.revision }) }
            }
            if (!calls.length) {
              answer = roundText.trim()
              if (toolsEnabled && answer) send('delta', { text: answer, revision: state.revision })
              break
            }
            messages.push({ role: 'assistant', content: null, tool_calls: calls.map(call => ({ id: call.id, type: 'function', function: { name: call.name, arguments: call.arguments } })) })
            for (const call of calls) {
              await assertFresh()
              let result: unknown
              if (call.name === 'get_cooking_state') result = { session: state }
              else if (call.name === 'apply_cooking_command') {
                let argumentsValue: unknown
                try { argumentsValue = JSON.parse(call.arguments) } catch { throw new ApiError(502, 'invalid_tool_request', 'The AI proposed an unreadable cooking change. Nothing from that change was saved.') }
                const args = argumentsValue as Record<string, unknown>
                const command = parseCookingCommand(args?.command)
                if (command.type === 'add_message') throw new ApiError(400, 'invalid_tool_request', 'Conversation messages cannot be authored through this cooking tool.')
                const fingerprint = createHash('sha256').update(canonical(command)).digest('hex').slice(0, 24)
                const expectedRevision = typeof args.expectedRevision === 'number' ? args.expectedRevision : -1
                try {
                  const committed = await commitCookingCommand(repository, principal.id, state.id, { commandId: `tool-${body.requestId}-${fingerprint}`, expectedRevision, command }, now().toISOString())
                  state = committed.session; result = { ok: true, ...committed }; send('state', { session: state, revision: state.revision })
                } catch (error) {
                  if (error instanceof ApiError && error.code === 'revision_conflict') throw error
                  result = { ok: false, code: error instanceof ApiError ? error.code : 'invalid_action', message: error instanceof Error ? error.message : 'This action was not committed.', session: state }
                }
              } else result = { ok: false, code: 'unknown_tool', message: 'This tool is not available.' }
              messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
            }
          }
          if (!answer) throw new ApiError(502, 'empty_provider_response', 'The AI did not finish a useful answer. Your confirmed cooking changes are saved.')
          await assertFresh()
          const saved = await commitCookingCommand(repository, principal.id, state.id, { commandId: `chat-${body.requestId}-assistant`, expectedRevision: state.revision, command: { type: 'add_message', message: { id: `chat-${body.requestId}-assistant`, role: 'assistant', text: answer, channel: 'chat', createdAt: now().toISOString() } } }, now().toISOString())
          state = saved.session
          send('done', { session: state, revision: state.revision })
        } catch (error) {
          if (!signal.aborted) {
            if (error instanceof ApiError && ['stale_response', 'revision_conflict'].includes(error.code)) send('stale', { ...error.details, message: 'The cooking session changed. Review its latest state before asking again.' })
            else send('error', { code: error instanceof ApiError ? error.code : 'generation_failed', message: error instanceof ApiError || error instanceof DomainError ? error.message : 'The AI response could not finish. Your confirmed cooking state is saved.' })
          }
        } finally { ended = true; abort.abort(); try { controller.close() } catch { /* client already disconnected */ } }
      })()
    },
    cancel() { ended = true; abort.abort() },
  })
  const next = new Headers(headers)
  next.set('Content-Type', 'text/event-stream; charset=utf-8'); next.set('X-Accel-Buffering', 'no'); next.set('Connection', 'keep-alive')
  return new Response(stream, { headers: next })
}

export function createApp(options: AppOptions = {}) {
  const fetcher = options.fetch ?? fetch, now = options.now ?? (() => new Date())
  return async function handle(request: Request): Promise<Response> {
    const config = typeof options.config === 'function' ? options.config() : options.config ?? readConfig()
    let headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' })
    try {
      headers = responseHeaders(request, config)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
      const path = new URL(request.url).pathname.replace(/\/$/, '')
      if (path === '/api/health' && request.method === 'GET') return jsonResponse({ status: 'ok', service: 'vantagallu', configured: { database: Boolean(config.supabaseUrl && config.serviceKey), ownerAccess: config.allowedEmails.length > 0, chat: Boolean(config.deepseekKey), voice: Boolean(config.geminiKey) }, models: { chat: config.deepseekModel, voice: config.geminiModel } }, 200, headers)
      const principal = await (options.authenticate ? options.authenticate(request, config) : verifyPrincipal(request, config, fetcher))
      const repository = options.repository ?? new SupabaseRepository(config, fetcher)
      if (path === '/api/sessions' && request.method === 'GET') return jsonResponse({ sessions: await repository.listSessions(principal.id) }, 200, headers)
      if (path === '/api/sessions' && request.method === 'POST') {
        const body = parse(createSessionSchema, await readJson(request))
        const localVersion = body.localSession ? parse(localRecipeReferenceSchema, body.localSession).recipeVersion : undefined
        const recipe = await requireRecipe(repository, body.recipeId, localVersion)
        const state = body.localSession ? importLocalSession(body.localSession, recipe, principal.id, now().toISOString()) : createCookingSession(recipe, { id: body.id ?? randomUUID(), ownerId: principal.id, language: body.language, servings: body.servings, cookware: body.cookware, cookingSetup: body.cookingSetup, now: now().toISOString() })
        if (body.id && body.id !== state.id) throw new ApiError(400, 'invalid_local_session', 'The imported session ID must match the new session ID.')
        return jsonResponse({ session: await repository.createSession(principal.id, state) }, 201, headers)
      }
      const match = path.match(/^\/api\/sessions\/([^/]+)(\/commands)?$/)
      if (match) {
        const id = match[1]
        if (!sessionIdPattern.test(id)) throw new ApiError(400, 'invalid_session_id', 'Choose a valid cooking session.')
        if (!match[2] && request.method === 'GET') return jsonResponse({ session: await requireSession(repository, principal.id, id) }, 200, headers)
        if (match[2] && request.method === 'POST') {
          const body = parse(commandRequestSchema, await readJson(request))
          if (body.command.type === 'add_message' && body.command.message.channel === 'voice' && !body.voiceLeaseId) throw new ApiError(409, 'lease_required', 'Reconnect voice before saving its transcript.')
          if (body.command.type === 'add_message' && body.command.message.role === 'assistant' && body.command.message.channel === 'chat') throw new ApiError(403, 'server_message_only', 'Text assistant replies are saved by the chat endpoint.')
          return jsonResponse(await commitCookingCommand(repository, principal.id, id, body, now().toISOString(), body.voiceLeaseId), 200, headers)
        }
      }
      if (path === '/api/chat' && request.method === 'POST') return await chatResponse(request, parse(chatSchema, await readJson(request)), config, repository, principal, headers, fetcher, now)
      if (path === '/api/voice/lease' && request.method === 'POST') {
        const body = parse(leaseSchema, await readJson(request))
        return jsonResponse({ lease: await repository.lease(principal.id, body.sessionId, body.deviceId, body.action, body.leaseId) }, 200, headers)
      }
      if (path === '/api/voice/token' && request.method === 'POST') {
        if (!config.geminiKey) throw unavailable('Live voice')
        const body = parse(voiceTokenSchema, await readJson(request)), state = await requireSession(repository, principal.id, body.sessionId)
        await repository.requireLease(principal.id, state.id, body.leaseId)
        const recipe = await requireRecipe(repository, state.recipeId, state.recipeVersion)
        if (!await repository.reserveUsage(principal.id, state.id, body.requestId, 'voice', config.voiceTokenSeconds)) throw new ApiError(409, 'request_already_used', 'This voice credential request was already used. Reconnect with a new request after checking the current call.')
        const token = await mintVoiceToken(recipe, state, config, now(), AbortSignal.any([request.signal, AbortSignal.timeout(15000)]), fetcher)
        await repository.requireLease(principal.id, state.id, body.leaseId)
        return jsonResponse(token, 200, headers)
      }
      if (path === '/api/usage' && request.method === 'GET') return jsonResponse(await repository.getUsage(principal.id), 200, headers)
      throw new ApiError(404, 'not_found', 'This API route is unavailable.')
    } catch (error) {
      const failure = error instanceof ApiError ? error : error instanceof DomainError ? new ApiError(400, 'invalid_action', error.message) : new ApiError(500, 'internal_error', 'This request could not be completed. Your previously saved session is unchanged.')
      return jsonResponse({ error: { code: failure.code, message: failure.message }, ...failure.details }, failure.status, headers)
    }
  }
}

export const handleRequest = createApp()
