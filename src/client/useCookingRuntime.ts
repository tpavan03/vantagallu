import { useEffect, useRef, useState } from 'react'
import type { KitchenAppProps } from '../components/KitchenApp'
import type { CookingCommand, CookingSession, CookingTimer, Recipe, SaveStatus, VoiceStatus } from '../domain/types'
import { applyCookingCommand, createCookingSession, ingredientAmount, sessionIngredients } from '../domain/session'
import { api, ApiError, streamChat } from './api'
import { signIn, signInWithGoogle, supabase } from './auth'
import { apiBaseUrl, AUTH_CALLBACK_ERROR } from './native'
import { loadStore, saveStore, type CookingStore, type PendingCommand } from './cache'
import { createVoiceController } from './voice'

type Owner = { id: string; email?: string }
type Capabilities = { database: boolean; ownerAccess: boolean; chat: boolean; voice: boolean }
const disabled: Capabilities = { database: false, ownerAccess: false, chat: false, voice: false }
const intentKey = 'vantagallu:sign-in-intent'
const apiBase = apiBaseUrl()
const messageOf = (error: unknown) => error instanceof Error ? error.message : typeof error === 'string' ? error : 'This action could not finish. Your confirmed cooking session is preserved.'
const activeSession = (store: CookingStore) => store.sessions.find(session => session.id === store.currentId) || null
const bounded = <T,>(promise: PromiseLike<T>, milliseconds = 15000): Promise<T> => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('The connection timed out. Your session stays on this device; try again when connected.')), milliseconds)
  Promise.resolve(promise).then(value => { clearTimeout(timeout); resolve(value) }, error => { clearTimeout(timeout); reject(error) })
})

export function getSessionRecipe(session: CookingSession, recipes: Recipe[]): Recipe | undefined {
  const snapshot = session.recipeSnapshot
  if (snapshot?.id === session.recipeId && snapshot.version === session.recipeVersion) return snapshot
  return recipes.find(recipe => recipe.id === session.recipeId && recipe.version === session.recipeVersion)
}

export function mergeCloudSessions(store: CookingStore, cloud: CookingSession[], ownerId: string): CookingStore {
  const localIds = new Set([...(store.localOnlyIds || []), ...store.pending.map(command => command.sessionId), ...Object.keys(store.conflicts || {})])
  const sessions = new Map(store.sessions.filter(session => session.ownerId === ownerId).map(session => [session.id, session]))
  for (const session of cloud) if (session.ownerId === ownerId && !localIds.has(session.id)) sessions.set(session.id, session)
  const currentId = store.currentId && sessions.has(store.currentId) ? store.currentId : [...sessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id || null
  return { ...store, sessions: [...sessions.values()], currentId }
}

export function startTimerCommand(session: CookingSession, timer?: CookingTimer): CookingCommand {
  const step = session.steps.find(item => item.id === session.currentStepId)
  return { type: 'start_timer', timerId: crypto.randomUUID(), label: timer?.label || (step ? `Step ${session.steps.indexOf(step) + 1}` : 'Cooking timer'), durationSeconds: timer?.durationSeconds || step?.durationSeconds || 300, ...(timer?.stepId || step?.id ? { stepId: timer?.stepId || step?.id } : {}) }
}

export function stampTimerCommand(command: CookingCommand, occurredAt = new Date().toISOString()): CookingCommand {
  if (['start_timer', 'pause_timer', 'resume_timer', 'cancel_timer'].includes(command.type) && !('occurredAt' in command)) {
    const stamped = { ...command, occurredAt }
    return stamped
  }
  return command
}

export function preserveConflict(store: CookingStore, sessionId: string, cloud: CookingSession): CookingStore {
  const local = store.sessions.find(session => session.id === sessionId)
  return local ? { ...store, conflicts: { ...store.conflicts, [sessionId]: { local, cloud, detectedAt: new Date().toISOString() } } } : store
}

export function useCookingRuntime(recipes: Recipe[]): KitchenAppProps {
  const [store, setStore] = useState<CookingStore>(() => loadStore('guest'))
  const storeRef = useRef(store)
  const [owner, setOwner] = useState<Owner | null>(null)
  const ownerRef = useRef<Owner | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const onlineRef = useRef(online)
  const [saveStatus, setSaveStatusDirect] = useState<SaveStatus>('local')
  const storageFailed = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(Boolean(supabase))
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<Capabilities>(disabled)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [streamingReply, setStreamingReply] = useState('')
  const [chatPending, setChatPending] = useState(false)
  const epoch = useRef(0)
  const alive = useRef(true)
  const hydrating = useRef(false)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const chatAbort = useRef<AbortController | null>(null)
  const voice = useRef<ReturnType<typeof createVoiceController> | null>(null)
  const recipesRef = useRef(recipes); recipesRef.current = recipes

  function setSaveStatus(next: SaveStatus) { setSaveStatusDirect(storageFailed.current ? 'error' : next) }

  function updateStore(next: CookingStore) {
    if (!alive.current) return
    storeRef.current = next; setStore(next)
    try { saveStore(next); storageFailed.current = false } catch { storageFailed.current = true; setSaveStatus('error'); setError('Device storage is unavailable or full. Keep this page open; the current session is only in memory.') }
  }
  function putSession(session: CookingSession, token: number, select = false) {
    if (!alive.current || token !== epoch.current || session.ownerId !== (ownerRef.current?.id || null)) return
    const current = storeRef.current
    const previous = current.sessions.find(item => item.id === session.id)
    if (previous && session.revision < previous.revision && !current.pending.some(item => item.sessionId === session.id)) return
    updateStore({ ...current, sessions: [session, ...current.sessions.filter(item => item.id !== session.id)], ...(select ? { currentId: session.id } : {}), ...(current.currentId === session.id || select ? { language: session.language } : {}) })
    if (storeRef.current.currentId === session.id) voice.current?.updateContext(session)
  }
  function stopMedia(dispose = false) {
    chatAbort.current?.abort(); chatAbort.current = null
    if (dispose) { voice.current?.dispose(); voice.current = null } else voice.current?.stop()
    if (alive.current) { setLiveTranscript(''); setStreamingReply(''); setVoiceStatus('idle') }
  }
  async function runSafely(task: (token: number) => Promise<void>) {
    const token = epoch.current
    const run = queue.current.then(async () => {
      if (!alive.current || token !== epoch.current) return
      try { await task(token) } catch (failure) {
        if (alive.current && token === epoch.current) { setError(messageOf(failure)); setSaveStatus(ownerRef.current ? 'error' : 'local') }
        throw failure
      }
    })
    queue.current = run.catch(() => {})
    await run
  }
  const request = <T,>(path: string, body?: unknown) => bounded(api<T>(path, body, AbortSignal.timeout(14000)))

  async function syncPending(token: number) {
    if (!ownerRef.current || !onlineRef.current || token !== epoch.current) return
    const pending = [...storeRef.current.pending]
    for (const id of [...(storeRef.current.localOnlyIds || [])]) {
      if (token !== epoch.current) return
      const local = storeRef.current.sessions.find(session => session.id === id)
      if (!local) continue
      const imported = await request<{ session: CookingSession }>('/sessions', { recipeId: local.recipeId, id: local.id, localSession: local })
      if (token !== epoch.current) return
      updateStore({ ...storeRef.current, localOnlyIds: storeRef.current.localOnlyIds?.filter(item => item !== id) })
      // Import resets revision to zero; the entire confirmed local snapshot was imported.
      const current = storeRef.current
      updateStore({ ...current, sessions: [imported.session, ...current.sessions.filter(item => item.id !== id)] })
    }
    const latest = new Map<string, CookingSession>()
    for (const item of pending) {
      if (token !== epoch.current) return
      if (storeRef.current.conflicts?.[item.sessionId]) continue
      try {
        const result = await request<{ session: CookingSession }>(`/sessions/${item.sessionId}/commands`, { commandId: item.commandId, expectedRevision: item.expectedRevision, command: item.command })
        if (token !== epoch.current) return
        latest.set(item.sessionId, result.session)
        updateStore({ ...storeRef.current, pending: storeRef.current.pending.filter(command => command.commandId !== item.commandId) })
      } catch (failure) {
        if (token !== epoch.current) return
        if (failure instanceof ApiError && failure.status === 409 && failure.session) updateStore(preserveConflict(storeRef.current, item.sessionId, failure.session))
        throw failure instanceof ApiError && failure.status === 409 ? new Error('The cloud session changed. Your pending actions are kept on this device and syncing is paused for that session. Open Saved sessions to review; do not repeat the actions blindly.') : failure
      }
    }
    for (const [id, session] of latest) if (!storeRef.current.pending.some(item => item.sessionId === id)) putSession(session, token)
    if (token === epoch.current) setSaveStatus(Object.keys(storeRef.current.conflicts || {}).length ? 'error' : storeRef.current.pending.length ? 'offline' : 'saved')
  }

  async function commit(command: CookingCommand, token: number) {
    const current = activeSession(storeRef.current)
    if (!current) throw new Error('Choose a recipe to start cooking.')
    if (storeRef.current.conflicts?.[current.id]) throw new Error('This session has pending actions that conflict with cloud changes. Both copies are preserved locally. Review its saved state before making more changes.')
    const recipe = getSessionRecipe(current, recipesRef.current)
    if (!recipe) throw new Error('The recipe version for this session is unavailable.')
    const now = new Date().toISOString()
    // Validate first without changing UI; signed online state is committed only after success.
    const optimistic = applyCookingCommand(current, command, recipe, now)
    if (!ownerRef.current || !onlineRef.current || storeRef.current.localOnlyIds?.includes(current.id)) {
      const pending: PendingCommand = { sessionId: current.id, commandId: crypto.randomUUID(), expectedRevision: current.revision, command }
      updateStore({ ...storeRef.current, sessions: [optimistic, ...storeRef.current.sessions.filter(item => item.id !== current.id)], language: optimistic.language, pending: ownerRef.current && !storeRef.current.localOnlyIds?.includes(current.id) ? [...storeRef.current.pending, pending] : storeRef.current.pending })
      setSaveStatus(ownerRef.current ? 'offline' : 'local'); return
    }
    await syncPending(token)
    if (token !== epoch.current) return
    const latest = activeSession(storeRef.current)
    if (!latest || latest.id !== current.id) return
    setSaveStatus('saving')
    const envelope: PendingCommand = { sessionId: current.id, commandId: crypto.randomUUID(), expectedRevision: latest.revision, command }
    // Persist the request identity before transport: a lost response must not turn
    // an uncertain mutation into a new command when this device retries.
    updateStore({ ...storeRef.current, pending: [...storeRef.current.pending, envelope] })
    try {
      const result = await request<{ session: CookingSession }>(`/sessions/${current.id}/commands`, { commandId: envelope.commandId, expectedRevision: envelope.expectedRevision, command: envelope.command })
      if (token !== epoch.current) return
      updateStore({ ...storeRef.current, pending: storeRef.current.pending.filter(item => item.commandId !== envelope.commandId) })
      putSession(result.session, token)
      if (token === epoch.current) setSaveStatus('saved')
    } catch (failure) {
      if (token === epoch.current && failure instanceof ApiError) {
        // A definite client rejection did not commit this command. Server/network
        // failures remain pending, with their original idempotency identity.
        if (failure.status === 409 && failure.session) {
          updateStore(preserveConflict(storeRef.current, current.id, failure.session))
          putSession(failure.session, token)
          throw new Error('The cloud session changed. Your attempted action and local copy are preserved for review; syncing this session is paused. Do not repeat the action blindly.')
        }
        if (failure.status >= 400 && failure.status < 500) updateStore({ ...storeRef.current, pending: storeRef.current.pending.filter(item => item.commandId !== envelope.commandId) })
      }
      throw failure
    }
  }
  function command(commandValue: CookingCommand) {
    stopMedia()
    const stamped = stampTimerCommand(commandValue)
    return runSafely(async token => { if (hydrating.current) throw new Error('Your cloud sessions are still loading. Try the action again in a moment.'); await commit(stamped, token) })
  }

  async function refreshCapabilities() {
    try {
      const response = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(7000) })
      if (!response.ok) throw new Error('Health unavailable')
      const data = await response.json() as { configured?: Capabilities }
      if (alive.current) setCapabilities(data.configured || disabled)
    } catch { if (alive.current) setCapabilities(disabled) }
  }

  useEffect(() => {
    alive.current = true
    let stopped = false
    let activatedOwner: string | null | undefined
    const activate = async (nextOwner: Owner | null) => {
      if (stopped || activatedOwner === (nextOwner?.id || null)) { if (!nextOwner) setAuthPending(false); return }
      activatedOwner = nextOwner?.id || null
      stopMedia(true); const token = ++epoch.current
      ownerRef.current = nextOwner; setOwner(nextOwner); setError(null); setVoiceError(null); setChatPending(false)
      const scoped = loadStore(nextOwner ? `user:${nextOwner.id}` : 'guest')
      updateStore(scoped); setSaveStatus(nextOwner ? 'saving' : 'local')
      if (!nextOwner) { hydrating.current = false; setAuthPending(false); return }
      hydrating.current = true; setAuthPending(true)
      try {
        if (!navigator.onLine) { setSaveStatus('offline'); return }
        const remote = await request<{ sessions: CookingSession[] }>('/sessions')
        if (stopped || token !== epoch.current) return
        updateStore(mergeCloudSessions(storeRef.current, remote.sessions, nextOwner.id))
        let intent: { sessionId?: string; createdAt?: number } | null = null
        try { intent = JSON.parse(localStorage.getItem(intentKey) || 'null') } catch { /* invalid intent is ignored */ }
        if (intent?.sessionId && intent.createdAt && Date.now() - intent.createdAt < 86400000) {
          const guest = loadStore('guest')
          const local = guest.sessions.find(session => session.id === intent?.sessionId && session.ownerId === null)
          if (local) {
            const existing = remote.sessions.find(session => session.id === local.id)
            const imported = existing ? { session: existing } : await request<{ session: CookingSession }>('/sessions', { recipeId: local.recipeId, id: local.id, localSession: local })
            if (stopped || token !== epoch.current) return
            putSession(imported.session, token, true)
          }
          localStorage.removeItem(intentKey)
        }
        await syncPending(token)
      } catch (failure) { if (!stopped && token === epoch.current) { setError(messageOf(failure)); setSaveStatus('error') } }
      finally { if (!stopped && token === epoch.current) { hydrating.current = false; setAuthPending(false) } }
    }
    const subscription = supabase?.auth.onAuthStateChange((_event, authSession) => { void activate(authSession?.user ? { id: authSession.user.id, email: authSession.user.email } : null) })
    if (supabase) void bounded(supabase.auth.getSession(), 8000).then(({ data, error: authError }) => { if (authError) throw authError; return activate(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null) }).catch(failure => { if (!stopped) { setError(messageOf(failure)); setAuthPending(false) } })
    else setAuthPending(false)
    const networkChanged = () => {
      const connected = navigator.onLine; onlineRef.current = connected; setOnline(connected)
      if (!connected) { stopMedia(); if (ownerRef.current) setSaveStatus('offline') }
      else { void refreshCapabilities(); void runSafely(syncPending).catch(() => {}) }
    }
    window.addEventListener('online', networkChanged); window.addEventListener('offline', networkChanged)
    const onNativeBackground = () => stopMedia()
    const onNativeAuthError = () => { setError(AUTH_CALLBACK_ERROR); setAuthPending(false) }
    window.addEventListener('vantagallu:app-background', onNativeBackground)
    window.addEventListener('vantagallu:auth-error', onNativeAuthError)
    void refreshCapabilities()
    // This mutable counter intentionally invalidates every outstanding account request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { stopped = true; alive.current = false; epoch.current++; stopMedia(true); subscription?.data.subscription.unsubscribe(); window.removeEventListener('online', networkChanged); window.removeEventListener('offline', networkChanged); window.removeEventListener('vantagallu:app-background', onNativeBackground); window.removeEventListener('vantagallu:auth-error', onNativeAuthError) }
    // Account lifecycle owns these refs; callbacks always read the latest store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const session = activeSession(store)
  const aiReady = Boolean(owner && online && capabilities.database && capabilities.ownerAccess && !authPending && !store.pending.length && !Object.keys(store.conflicts || {}).length && !store.localOnlyIds?.length)
  return {
    recipes, session, sessions: store.sessions, user: owner ? { email: owner.email || 'Signed-in owner' } : null, online, saveStatus, voiceStatus, voiceError, liveTranscript, streamingReply, chatPending, error, language: session?.language || store.language, authPending, authMessage,
    voiceAvailable: aiReady && capabilities.voice, chatAvailable: aiReady && capabilities.chat, authAvailable: Boolean(supabase),
    onStartRecipe: (recipeId, cookingSetup) => { stopMedia(true); return runSafely(async token => {
      const recipe = recipesRef.current.find(item => item.id === recipeId)
      if (!recipe) throw new Error('Choose an available recipe from the library.')
      if (hydrating.current) throw new Error('Wait for your account sessions to load before starting a new recipe.')
      const old = activeSession(storeRef.current)
      if (old?.status === 'cooking' && !storeRef.current.conflicts?.[old.id]) await commit({ type: 'set_status', status: 'paused' }, token)
      if (token !== epoch.current) return
      const local = createCookingSession(recipe, { ownerId: ownerRef.current?.id, language: storeRef.current.language, cookingSetup })
      if (ownerRef.current && onlineRef.current) {
        const result = await request<{ session: CookingSession }>('/sessions', { recipeId, id: local.id, language: local.language, ...(cookingSetup ? { cookingSetup } : {}) })
        if (token !== epoch.current) return
        putSession(result.session, token, true); setSaveStatus('saved')
      } else {
        updateStore({ ...storeRef.current, sessions: [local, ...storeRef.current.sessions], currentId: local.id, ...(ownerRef.current ? { localOnlyIds: [...(storeRef.current.localOnlyIds || []), local.id] } : {}) })
        setSaveStatus(ownerRef.current ? 'offline' : 'local')
      }
    }) },
    onResumeSession: id => { stopMedia(true); return runSafely(async token => {
      const target = storeRef.current.sessions.find(item => item.id === id)
      if (!target) throw new Error('This saved session is unavailable in the current account.')
      const old = activeSession(storeRef.current)
      if (old && old.id !== id && old.status === 'cooking' && !storeRef.current.conflicts?.[old.id]) await commit({ type: 'set_status', status: 'paused' }, token)
      if (token !== epoch.current) return
      const conflict = storeRef.current.conflicts?.[id]
      if (conflict) {
        putSession(conflict.cloud, token, true)
        setError('Showing the cloud copy for review. Your local copy and pending actions are preserved separately; this conflicted session is paused until the changes can be reconciled.')
        return
      }
      if (ownerRef.current && onlineRef.current && !storeRef.current.pending.some(item => item.sessionId === id) && !storeRef.current.localOnlyIds?.includes(id)) {
        const result = await request<{ session: CookingSession }>(`/sessions/${id}`)
        putSession(result.session, token, true)
      } else updateStore({ ...storeRef.current, currentId: id, language: target.language })
      const current = activeSession(storeRef.current)
      if (current?.status === 'paused' && !storeRef.current.conflicts?.[id]) await commit({ type: 'set_status', status: 'cooking' }, token)
    }) },
    onLanguageChange: language => { if (activeSession(storeRef.current)) return command({ type: 'set_language', language }); updateStore({ ...storeRef.current, language }); return Promise.resolve() },
    onCommand: command,
    onConfirmIngredient: item => { const current = activeSession(storeRef.current); if (!current) return Promise.resolve(); const recipe = getSessionRecipe(current, recipesRef.current); if (!recipe) { setError('The original recipe version for this session is unavailable. Reconnect to load its saved method before recording ingredients.'); return Promise.resolve() } const canonical = sessionIngredients(recipe, current).find(ingredient => ingredient.id === item.id); if (!canonical) { setError('This ingredient is not part of the saved recipe version.'); return Promise.resolve() } const remaining = ingredientAmount(recipe, current, canonical).remaining; return remaining > 0 ? command({ type: 'record_ingredient', ingredientId: canonical.id, quantity: remaining, unit: canonical.unit }) : Promise.resolve() },
    onAdvance: () => { const current = activeSession(storeRef.current); return current?.currentStepId ? command({ type: 'complete_step', stepId: current.currentStepId }) : Promise.resolve() },
    onSetServings: servings => command({ type: 'set_servings', servings }),
    onSetCookware: cookware => command({ type: 'set_cookware', cookware }),
    onTimerAction: (action, timer) => { const current = activeSession(storeRef.current); if (!current) return Promise.resolve(); if (action === 'start') return command(startTimerCommand(current, timer)); return timer ? command({ type: `${action}_timer`, timerId: timer.id }) : Promise.resolve() },
    onSendMessage: text => { stopMedia(); return runSafely(async token => {
      const current = activeSession(storeRef.current)
      if (!current || !ownerRef.current || !onlineRef.current || !capabilities.chat) throw new Error('Text conversation needs a signed-in owner, a connection and a configured text provider. Hand-cooking remains available.')
      await syncPending(token)
      if (token !== epoch.current) return
      if (storeRef.current.conflicts?.[current.id]) throw new Error('Resolve this session’s pending cloud conflict before asking AI to change its plan.')
      const controller = new AbortController(); chatAbort.current = controller
      setChatPending(true); setStreamingReply(''); setError(null)
      let done = false
      try {
        await streamChat({ sessionId: current.id, expectedRevision: activeSession(storeRef.current)?.revision, message: text.trim(), requestId: crypto.randomUUID() }, (event, data) => {
          if (token !== epoch.current || controller.signal.aborted) return
          if (event === 'delta') setStreamingReply(previous => previous + String(data.text || ''))
          if ((event === 'done' || event === 'state') && data.session) putSession(data.session as CookingSession, token)
          if (event === 'done') { done = true; setStreamingReply(''); setSaveStatus('saved') }
          if (event === 'stale') { if (data.session) putSession(data.session as CookingSession, token); throw new Error(String(data.message || 'The cooking state changed. Review it before asking again.')) }
          if (event === 'error') throw new Error(String(data.message || 'The AI response could not finish. Your confirmed cooking state is preserved.'))
        }, controller.signal)
        if (!done && !controller.signal.aborted) throw new Error('The response ended before it was saved. Your confirmed cooking state is preserved.')
      } finally {
        if (token === epoch.current) {
          setChatPending(false); setStreamingReply(''); chatAbort.current = null
          if (!done && onlineRef.current) {
            try { const result = await request<{ session: CookingSession }>(`/sessions/${current.id}`); putSession(result.session, token) } catch { /* original provider/connection error remains visible */ }
          }
        }
      }
    }) },
    onVoiceToggle: async () => {
      if (voiceStatus !== 'idle' && voiceStatus !== 'error') { voice.current?.stop(); setVoiceStatus('idle'); return }
        if (!aiReady || !capabilities.voice) { setVoiceError('Live voice needs an online signed-in owner and a configured voice provider.'); return }
      const token = epoch.current
      try {
        setVoiceError(null)
        if (!voice.current) voice.current = createVoiceController({ getSession: () => activeSession(storeRef.current), onSession: next => { if (token === epoch.current) putSession(next, token) }, onStatus: next => { if (token === epoch.current) setVoiceStatus(next) }, onTranscript: text => { if (token === epoch.current) setLiveTranscript(text) }, onError: failure => { if (token === epoch.current) setVoiceError(failure || null) } })
        await voice.current.start()
      } catch (failure) { if (token === epoch.current) { setVoiceError(messageOf(failure)); setVoiceStatus('error') } }
    },
    onSignIn: async email => {
      if (!supabase) { setError('Cloud sign-in is not configured. You can cook and save on this device.'); return }
      setAuthPending(true); setAuthMessage(null); setError(null)
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(7000) }).catch(() => { throw new Error('Cloud sign-in is unavailable. You can keep cooking on this device and try again later.') })
        if (!response.ok) throw new Error('Cloud sign-in is unavailable. You can keep cooking on this device and try again later.')
        const current = activeSession(storeRef.current)
        if (!ownerRef.current && current) localStorage.setItem(intentKey, JSON.stringify({ sessionId: current.id, createdAt: Date.now() }))
        if (email) { await bounded(signIn(email)); setAuthMessage('Sign-in link requested. Check your email; opening it will connect this device’s current cooking session to your account.') }
        else await bounded(signInWithGoogle())
      } catch (failure) { setError(messageOf(failure)) } finally { setAuthPending(false) }
    },
    onSignOut: async () => {
      stopMedia(true)
      if (!supabase) return
      setAuthPending(true)
      try { const result = await bounded(supabase.auth.signOut()); if (result.error) throw result.error }
      catch (failure) { setError(messageOf(failure)) }
      finally { setAuthPending(false) }
    },
    onDismissError: () => { setError(null); setVoiceError(null) },
  }
}
