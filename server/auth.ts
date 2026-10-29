import type { ServerConfig } from './config.ts'
import { requireDatabase } from './config.ts'
import { ApiError, unavailable } from './errors.ts'

export interface Principal { id: string; email: string }
export async function authenticate(request: Request, config: ServerConfig, fetcher: typeof fetch = fetch): Promise<Principal> {
  const authorization = request.headers.get('authorization') ?? ''
  if (!/^Bearer [^\s]+$/i.test(authorization) || authorization.length > 12000) throw new ApiError(401, 'sign_in_required', 'Sign in to use your private cooking sessions.')
  requireDatabase(config)
  if (!config.allowedEmails.length) throw unavailable('Owner access')
  let response: Response
  try {
    response = await fetcher(`${config.supabaseUrl}/auth/v1/user`, { headers: { apikey: config.serviceKey, Authorization: authorization }, signal: AbortSignal.timeout(8000) })
  } catch { throw new ApiError(503, 'auth_unavailable', 'Sign-in verification is temporarily unavailable. Try again.') }
  if (response.status === 401 || response.status === 403) throw new ApiError(401, 'session_expired', 'Your sign-in has expired. Sign in again.')
  if (!response.ok) throw new ApiError(503, 'auth_unavailable', 'Sign-in verification is temporarily unavailable. Try again.')
  const user = await response.json() as { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null }
  if (!user.id || !user.email || !(user.email_confirmed_at || user.confirmed_at)) throw new ApiError(403, 'email_not_verified', 'Confirm your email address before using this private app.')
  const email = user.email.toLowerCase().trim()
  if (!config.allowedEmails.includes(email)) throw new ApiError(403, 'owner_only', 'Vantagallu is currently private to its owner.')
  return { id: user.id, email }
}
