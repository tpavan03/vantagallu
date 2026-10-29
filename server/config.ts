import { unavailable } from './errors.ts'

export interface ServerConfig {
  supabaseUrl: string
  serviceKey: string
  allowedEmails: string[]
  allowedOrigins: string[]
  geminiKey: string
  deepseekKey: string
  geminiModel: string
  deepseekModel: string
  dailyChatLimit: number
  sessionChatLimit: number
  dailyVoiceSeconds: number
  sessionVoiceSeconds: number
  voiceTokenSeconds: number
}
const bounded = (value: string | undefined, fallback: number, max: number) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? Math.min(number, max) : fallback
}
export function readConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  return {
    supabaseUrl: (env.SUPABASE_URL ?? '').replace(/\/$/, ''), serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    allowedEmails: (env.VANTAGALLU_ALLOWED_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean),
    allowedOrigins: (env.VANTAGALLU_ALLOWED_ORIGINS ?? '').split(',').map(origin => origin.trim().replace(/\/$/, '')).filter(Boolean),
    geminiKey: env.VANTAGALLU_GEMINI_API_KEY ?? '', deepseekKey: env.VANTAGALLU_DEEPSEEK_API_KEY ?? '',
    geminiModel: env.VANTAGALLU_GEMINI_MODEL ?? 'gemini-3.8-live', deepseekModel: env.VANTAGALLU_DEEPSEEK_MODEL ?? 'deepseek-flash',
    dailyChatLimit: bounded(env.VANTAGALLU_DAILY_CHAT_LIMIT, 60, 500), sessionChatLimit: bounded(env.VANTAGALLU_SESSION_CHAT_LIMIT, 40, 200),
    dailyVoiceSeconds: bounded(env.VANTAGALLU_DAILY_VOICE_SECONDS, 1200, 7200), sessionVoiceSeconds: bounded(env.VANTAGALLU_SESSION_VOICE_SECONDS, 900, 3600),
    voiceTokenSeconds: bounded(env.VANTAGALLU_VOICE_TOKEN_SECONDS, 300, 600),
  }
}
export function requireDatabase(config: ServerConfig) {
  if (!config.supabaseUrl || !config.serviceKey) throw unavailable('Cooking-session storage')
  let url: URL
  try { url = new URL(config.supabaseUrl) } catch { throw unavailable('Cooking-session storage') }
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') throw unavailable('Cooking-session storage')
}
