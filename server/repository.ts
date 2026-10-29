import type { CommandRequest, CookingSession, Recipe } from '../src/domain/types.ts'
import type { ServerConfig } from './config.ts'
import { requireDatabase } from './config.ts'
import { ApiError } from './errors.ts'
import { getRecipeById } from '../src/data/recipes.ts'

export interface VoiceLease { id: string; deviceId: string; expiresAt: string; epoch: number }
export interface CommitResult { session: CookingSession; replayed: boolean; commandRevision: number }
export interface Usage { chatCount: number; voiceSeconds: number; dailyChatLimit: number; dailyVoiceSeconds: number }
export interface Repository {
  getRecipe(id: string, version?: number): Promise<Recipe | null>
  listSessions(ownerId: string): Promise<CookingSession[]>
  getSession(ownerId: string, sessionId: string): Promise<CookingSession | null>
  createSession(ownerId: string, state: CookingSession): Promise<CookingSession>
  findCommand(ownerId: string, sessionId: string, commandId: string): Promise<{ command: unknown; revision: number } | null>
  commit(ownerId: string, sessionId: string, request: CommandRequest, state: CookingSession, voiceLeaseId?: string): Promise<CommitResult>
  lease(ownerId: string, sessionId: string, deviceId: string, action: string, leaseId?: string): Promise<VoiceLease | null>
  requireLease(ownerId: string, sessionId: string, leaseId: string): Promise<VoiceLease>
  reserveUsage(ownerId: string, sessionId: string, requestId: string, kind: 'chat' | 'voice', amount: number): Promise<boolean>
  getUsage(ownerId: string): Promise<Usage>
}

export class SupabaseRepository implements Repository {
  private readonly config: ServerConfig
  private readonly fetcher: typeof fetch
  constructor(config: ServerConfig, fetcher: typeof fetch = fetch) { this.config = config; this.fetcher = fetcher; requireDatabase(config) }
  private async rest(path: string, body?: unknown): Promise<unknown> {
    let response: Response
    try {
      response = await this.fetcher(`${this.config.supabaseUrl}/rest/v1/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { apikey: this.config.serviceKey, Authorization: `Bearer ${this.config.serviceKey}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000) })
    } catch { throw new ApiError(503, 'storage_unavailable', 'Cooking-session storage is unavailable. Your local session remains on this device.') }
    if (!response.ok) {
      if (response.status === 404) throw new ApiError(503, 'storage_not_initialized', 'The Vantagallu database migration has not been applied.')
      throw new ApiError(503, 'storage_unavailable', 'Cooking-session storage could not complete this request. Try again.')
    }
    return response.status === 204 ? null : response.json()
  }
  private query(table: string, fields: string, filters: Record<string, string>, extra: Record<string, string> = {}) {
    return `${table}?${new URLSearchParams({ select: fields, ...filters, ...extra })}`
  }
  private async rpc(name: string, body: unknown): Promise<Record<string, unknown>> {
    const data = await this.rest(`rpc/vantagallu_${name}`, body) as Record<string, unknown>
    if (data?.ok === false) {
      const code = String(data.code ?? 'storage_error')
      const status = code === 'not_found' ? 404 : code === 'quota_exceeded' ? 429 : 409
      const messages: Record<string, string> = { not_found: 'This cooking session could not be found.', revision_conflict: 'The cooking session changed. Review the latest state and try again.', command_id_reused: 'This command ID was already used for a different action.', lease_conflict: 'Another voice connection is active. Choose Take over to replace it.', lease_expired: 'The voice connection expired. Reconnect before making another voice change.', quota_exceeded: 'The configured personal AI usage limit has been reached.' }
      throw new ApiError(status, code, messages[code] ?? 'The request could not be committed.', { ...(data.session ? { session: data.session } : {}), ...(data.lease ? { lease: data.lease } : {}) })
    }
    return data
  }
  async getRecipe(id: string, version?: number) {
    const bundled = getRecipeById(id)
    if (bundled && (version === undefined || bundled.version === version)) return structuredClone(bundled)
    const rows = await this.rest(this.query(version === undefined ? 'vantagallu_recipes' : 'vantagallu_recipe_versions', 'data', { id: `eq.${id}`, ...(version === undefined ? {} : { version: `eq.${version}` }) }, { limit: '1' })) as Array<{ data: Recipe }>
    return rows[0]?.data ?? null
  }
  async listSessions(ownerId: string) {
    const rows = await this.rest(this.query('vantagallu_sessions', 'state', { user_id: `eq.${ownerId}` }, { order: 'updated_at.desc', limit: '50' })) as Array<{ state: CookingSession }>
    return rows.map(row => row.state)
  }
  async getSession(ownerId: string, sessionId: string) {
    const rows = await this.rest(this.query('vantagallu_sessions', 'state', { user_id: `eq.${ownerId}`, id: `eq.${sessionId}` }, { limit: '1' })) as Array<{ state: CookingSession }>
    return rows[0]?.state ?? null
  }
  async createSession(ownerId: string, state: CookingSession) {
    const data = await this.rpc('create_session', { p_owner_id: ownerId, p_state: state })
    return data.session as CookingSession
  }
  async findCommand(ownerId: string, sessionId: string, commandId: string) {
    const rows = await this.rest(this.query('vantagallu_events', 'command,result_revision', { user_id: `eq.${ownerId}`, session_id: `eq.${sessionId}`, command_id: `eq.${commandId}` }, { limit: '1' })) as Array<{ command: unknown; result_revision: number }>
    return rows[0] ? { command: rows[0].command, revision: rows[0].result_revision } : null
  }
  async commit(ownerId: string, sessionId: string, request: CommandRequest, state: CookingSession, voiceLeaseId?: string) {
    const data = await this.rpc('commit_command', { p_owner_id: ownerId, p_session_id: sessionId, p_command_id: request.commandId, p_expected_revision: request.expectedRevision, p_command: request.command, p_state: state, p_voice_lease_id: voiceLeaseId ?? null })
    return { session: data.session as CookingSession, replayed: Boolean(data.replayed), commandRevision: Number(data.commandRevision) }
  }
  async lease(ownerId: string, sessionId: string, deviceId: string, action: string, leaseId?: string) {
    const data = await this.rpc('voice_lease', { p_owner_id: ownerId, p_session_id: sessionId, p_device_id: deviceId, p_action: action, p_lease_id: leaseId ?? null })
    return (data.lease ?? null) as VoiceLease | null
  }
  async requireLease(ownerId: string, sessionId: string, leaseId: string) {
    const rows = await this.rest(this.query('vantagallu_voice_leases', 'lease_id,device_id,expires_at,epoch', { user_id: `eq.${ownerId}`, session_id: `eq.${sessionId}`, lease_id: `eq.${leaseId}`, expires_at: `gt.${new Date().toISOString()}` }, { limit: '1' })) as Array<{ lease_id: string; device_id: string; expires_at: string; epoch: number }>
    if (!rows[0]) throw new ApiError(409, 'lease_expired', 'The voice connection expired. Reconnect before continuing.')
    return { id: rows[0].lease_id, deviceId: rows[0].device_id, expiresAt: rows[0].expires_at, epoch: rows[0].epoch }
  }
  async reserveUsage(ownerId: string, sessionId: string, requestId: string, kind: 'chat' | 'voice', amount: number) {
    const data = await this.rpc('reserve_usage', { p_owner_id: ownerId, p_session_id: sessionId, p_request_id: requestId, p_kind: kind, p_amount: amount, p_daily_chat_limit: this.config.dailyChatLimit, p_session_chat_limit: this.config.sessionChatLimit, p_daily_voice_seconds: this.config.dailyVoiceSeconds, p_session_voice_seconds: this.config.sessionVoiceSeconds })
    return Boolean(data.reserved)
  }
  async getUsage(ownerId: string) {
    const rows = await this.rest(this.query('vantagallu_usage_daily', 'chat_count,voice_seconds', { user_id: `eq.${ownerId}`, day: `eq.${new Date().toISOString().slice(0, 10)}` }, { limit: '1' })) as Array<{ chat_count: number; voice_seconds: number }>
    return { chatCount: rows[0]?.chat_count ?? 0, voiceSeconds: rows[0]?.voice_seconds ?? 0, dailyChatLimit: this.config.dailyChatLimit, dailyVoiceSeconds: this.config.dailyVoiceSeconds }
  }
}
