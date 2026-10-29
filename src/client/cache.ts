import type { CookingSession, Language, CommandRequest } from '../domain/types'
export interface PendingCommand extends CommandRequest { sessionId: string }
export interface CookingStore { scope: string; sessions: CookingSession[]; currentId: string | null; language: Language; pending: PendingCommand[]; localOnlyIds?: string[]; conflicts?: Record<string, { local: CookingSession; cloud: CookingSession; detectedAt: string }> }
const prefix = 'vantagallu:1:'
export function loadStore(scope: string): CookingStore {
  const empty: CookingStore = { scope, sessions: [], currentId: null, language: 'en', pending: [] }
  try {
    const parsed = JSON.parse(localStorage.getItem(prefix + scope) || 'null')
    if (parsed?.scope === scope && Array.isArray(parsed.sessions) && parsed.sessions.every((s: CookingSession) => typeof s.id === 'string' && Array.isArray(s.steps) && typeof s.recipeId === 'string')) {
      const ownerId = scope.startsWith('user:') ? scope.slice(5) : null
      const sessions = parsed.sessions.filter((session: CookingSession) => session.ownerId === ownerId)
      const ids = new Set(sessions.map((session: CookingSession) => session.id))
      return { ...empty, ...parsed, sessions, currentId: ids.has(parsed.currentId) ? parsed.currentId : null, pending: Array.isArray(parsed.pending) ? parsed.pending.filter((item: PendingCommand) => ids.has(item.sessionId)) : [], localOnlyIds: Array.isArray(parsed.localOnlyIds) ? parsed.localOnlyIds.filter((id: string) => ids.has(id)) : [], conflicts: parsed.conflicts && typeof parsed.conflicts === 'object' ? Object.fromEntries(Object.entries(parsed.conflicts).filter(([id]) => ids.has(id))) : {} }
    }
  } catch { /* a damaged cache should not prevent opening the kitchen */ }
  return empty
}
export function saveStore(store: CookingStore) { localStorage.setItem(prefix + store.scope, JSON.stringify(store)) }
export function clearStore(scope: string) { localStorage.removeItem(prefix + scope) }
export const deviceId = () => {
  let id = localStorage.getItem('vantagallu:device')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('vantagallu:device', id) }
  return id
}
