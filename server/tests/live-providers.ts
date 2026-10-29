// Explicitly authorized, bounded provider smoke: at most two tiny text completions
// and four tiny Live audio turns. No microphone capture or cooking-state mutation.
import { config as loadEnv } from 'dotenv'
import { appendFileSync } from 'node:fs'
import { readConfig } from '../config.ts'
import { deepseekTurn, mintVoiceToken } from '../providers.ts'
import { recipeCatalog } from '../../src/data/recipes.ts'
import { createCookingSession } from '../../src/domain/session.ts'
import type { Language } from '../../src/domain/types.ts'

loadEnv({ path: '.env.local', quiet: true }); loadEnv({ path: '.env.backend.local', quiet: true })
if (process.env.VANTAGALLU_RUN_LIVE_PROVIDERS !== '1') throw new Error('Explicit VANTAGALLU_RUN_LIVE_PROVIDERS=1 approval is required.')
const config = readConfig(), secrets = [config.geminiKey, config.deepseekKey, config.serviceKey].filter(Boolean)
if (!config.geminiKey || !config.deepseekKey) throw new Error('Personal provider keys are missing.')
const clean = (text: string) => secrets.reduce((out, secret) => out.replaceAll(secret, '[redacted]'), text).replace(/access_token=[^&\s]+/g, 'access_token=[redacted]').slice(0, 500)
let textGenerations = 0, audioGenerations = 0
const report = (value: object) => {
  const line = JSON.stringify(value)
  if (process.env.VANTAGALLU_PROVIDER_SMOKE_RESULTS) appendFileSync(process.env.VANTAGALLU_PROVIDER_SMOKE_RESULTS, `${line}\n`, { mode: 0o600 })
  console.log(line)
}
const boundedFetch: typeof fetch = async (url, init) => {
  if (String(url).includes('api.deepseek.com/chat/completions')) {
    if (textGenerations >= 2) throw new Error('The two-completion smoke budget is exhausted.')
    const body = JSON.parse(String(init?.body)); body.max_tokens = 64
    const response = await fetch(url, { ...init, body: JSON.stringify(body) })
    if (response.ok) textGenerations++
    return response
  }
  if (String(url).endsWith('/auth_tokens') && process.env.VANTAGALLU_PROVIDER_SMOKE_LANGUAGES) {
    const body = JSON.parse(String(init?.body))
    // Audio output consumes tokens too: this caps the entire spoken turn to a few seconds.
    body.bidiGenerateContentSetup.generationConfig.maxOutputTokens = 128
    init = { ...init, body: JSON.stringify(body) }
  }
  const response = await fetch(url, init)
  if (!response.ok) {
    const data = await response.clone().json().catch(() => ({})) as { error?: { status?: string; message?: string } }
    console.log(JSON.stringify({ provisioningStatus: response.status, code: data.error?.status, detail: clean(data.error?.message ?? 'Provider provisioning failed.') }))
  }
  return response
}

const phrases: Record<Language, string> = { en: 'The onions are ready.', te: 'ఉల్లిపాయలు సిద్ధంగా ఉన్నాయి.', kn: 'ಈರುಳ್ಳಿ ಸಿದ್ಧವಾಗಿದೆ.', hi: 'प्याज़ तैयार हैं।' }
const languageNames: Record<Language, string> = { en: 'English', te: 'Telugu', kn: 'Kannada', hi: 'Hindi' }
async function liveTurn(language: Language) {
  const session = createCookingSession(recipeCatalog[0], { language })
  const token = await mintVoiceToken(recipeCatalog[0], session, config, new Date(), AbortSignal.timeout(20000), boundedFetch)
  secrets.push(token.token)
  if (audioGenerations >= 4) throw new Error('The four-turn Live smoke budget is exhausted.')
  return new Promise<{ language: Language; setupComplete: boolean; audioBytes: number; transcript: string; model: string }>((resolve, reject) => {
    let settled = false, setupComplete = false, audioBytes = 0, transcript = ''
    const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`)
    socket.binaryType = 'arraybuffer'
    const finish = (error?: Error) => {
      if (settled) return
      settled = true; clearTimeout(timeout)
      socket.close()
      if (error) reject(error)
      else resolve({ language, setupComplete, audioBytes, transcript: transcript.trim(), model: token.model })
    }
    const timeout = setTimeout(() => finish(new Error(`Live ${language}: timed out before a complete short audio turn.`)), 35000)
    socket.addEventListener('open', () => socket.send(JSON.stringify({ setup: { model: `models/${token.model.replace(/^models\//, '')}`, generationConfig: { responseModalities: ['AUDIO'] }, sessionResumption: {} } })))
    socket.addEventListener('message', event => {
      let message: Record<string, unknown>
      try { message = JSON.parse(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as ArrayBuffer)) } catch { finish(new Error('Live returned an unreadable frame.')); return }
      if (message.error) { finish(new Error(`Live ${language} returned an error frame.`)); return }
      if (message.setupComplete || message.setup_complete) {
        setupComplete = true; audioGenerations++
        socket.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: `Connection test only. In ${languageNames[language]}, say exactly this quoted test sentence and nothing else: ${phrases[language]} Do not change cooking state or call a tool. Under twenty words.` }] }], turnComplete: true } }))
      }
      if (message.toolCall || message.tool_call) { finish(new Error(`Live ${language} unexpectedly requested a cooking tool during a connection-only test.`)); return }
      const content = (message.serverContent ?? message.server_content) as { modelTurn?: { parts?: { inlineData?: { data?: string } }[] }; model_turn?: { parts?: { inline_data?: { data?: string } }[] }; outputTranscription?: { text?: string }; output_transcription?: { text?: string }; turnComplete?: boolean; turn_complete?: boolean } | undefined
      for (const part of content?.modelTurn?.parts ?? []) if (part.inlineData?.data) audioBytes += Buffer.from(part.inlineData.data, 'base64').byteLength
      for (const part of content?.model_turn?.parts ?? []) if (part.inline_data?.data) audioBytes += Buffer.from(part.inline_data.data, 'base64').byteLength
      transcript += content?.outputTranscription?.text ?? content?.output_transcription?.text ?? ''
      if (content?.turnComplete || content?.turn_complete) finish(!audioBytes || !transcript.trim() ? new Error(`Live ${language} completed without both audio and output transcription.`) : undefined)
    })
    socket.addEventListener('error', () => finish(new Error(`Live ${language} WebSocket connection failed.`)))
    socket.addEventListener('close', event => { if (!settled) finish(new Error(`Live ${language} closed early (${event.code}): ${clean(event.reason)}`)) })
  })
}

try {
  for (const language of process.env.VANTAGALLU_PROVIDER_SMOKE_PHASE === 'voice' ? [] : ['en', 'te'] as const) {
    let answer = ''
    for await (const delta of deepseekTurn([{ role: 'system', content: `Connection test only. Reply in ${languageNames[language]}, at most twelve words. Do not call tools.` }, { role: 'user', content: `Say exactly: ${phrases[language]}` }], config, AbortSignal.timeout(30000), boundedFetch, false)) if (delta.type === 'text') answer += delta.text
    if (!answer.trim()) throw new Error('DeepSeek returned no completed text.')
    report({ provider: 'DeepSeek', model: config.deepseekModel, language, completed: true, reply: clean(answer.trim()) })
  }
  const languages = process.env.VANTAGALLU_PROVIDER_SMOKE_LANGUAGES?.split(',') ?? ['en', 'te', 'kn', 'hi']
  if (languages.length > 4 || languages.some(language => !['en', 'te', 'kn', 'hi'].includes(language)) || new Set(languages).size !== languages.length) throw new Error('Invalid smoke language subset.')
  for (const language of languages as Language[]) report({ provider: 'Gemini Live', ...await liveTurn(language) })
  report({ textGenerations, audioGenerations, microphoneTested: false, note: 'Synthetic text-to-audio transport test only; no real-device microphone or pronunciation claim.' })
} catch (error) {
  report({ failed: true, textGenerations, audioGenerations, message: clean(error instanceof Error ? error.message : 'Provider smoke failed.') })
  process.exitCode = 1
}
