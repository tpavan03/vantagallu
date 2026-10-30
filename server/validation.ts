import { z } from 'zod'
import type { CookingCommand, CookingSession, Recipe } from '../src/domain/types.ts'
import { ApiError } from './errors.ts'

const id = z.string().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/)
const uuid = z.string().uuid()
const text = z.string().trim().min(1).max(4000)
const language = z.enum(['en', 'te', 'kn', 'hi'])
const localized = z.object({ en: text, te: text.optional(), kn: text.optional(), hi: text.optional() }).strict()
export const cookingSetupSchema = z.object({
  heatSource: z.enum(['gas', 'induction']),
  inductionMaxWatts: z.number().int().min(100).max(1800),
  availableIngredientIds: z.array(id).max(110),
  unavailableIngredientIds: z.array(id).max(110),
  pantryNotes: z.string().trim().max(2000).optional(),
}).strict().superRefine((setup, context) => {
  const ids = [...setup.availableIngredientIds, ...setup.unavailableIngredientIds]
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['availableIngredientIds'], message: 'Choose each ingredient only once, as available or missing.' })
})
const ingredient = z.object({ id, name: localized, quantity: z.number().positive().max(100000), unit: z.string().trim().min(1).max(40), aliases: z.array(z.string().max(100)).max(30).optional(), optional: z.boolean().optional(), allergens: z.array(z.string().max(80)).max(20).optional(), scaling: z.enum(['linear', 'to-taste', 'method-dependent']).optional() }).strict()
const step = z.object({ id, instruction: localized, description: localized.optional(), ingredientIds: z.array(id).max(60), heat: z.enum(['off', 'low', 'medium', 'high']), inductionWatts: z.number().int().min(0).max(1800).optional(), durationSeconds: z.number().int().min(1).max(172800).optional(), checkpoint: localized.optional() }).strict()
const occurredAt = z.string().datetime({ offset: true }).optional()
const timerAction = z.object({ type: z.enum(['pause_timer', 'resume_timer', 'cancel_timer']), timerId: id, occurredAt }).strict()
export const cookingCommandSchema = z.union([
  z.object({ type: z.literal('set_language'), language }).strict(),
  z.object({ type: z.literal('set_servings'), servings: z.number().min(0.25).max(100) }).strict(),
  z.object({ type: z.literal('set_cookware'), cookware: text }).strict(),
  z.object({ type: z.literal('set_cooking_setup'), setup: cookingSetupSchema }).strict(),
  z.object({ type: z.literal('record_ingredient'), ingredientId: id, quantity: z.number().finite().min(0).max(100000), unit: z.string().trim().min(1).max(40) }).strict(),
  z.object({ type: z.literal('add_custom_ingredient'), ingredient }).strict(),
  z.object({ type: z.literal('complete_step'), stepId: id }).strict(),
  z.object({ type: z.literal('add_adaptation'), text, kind: z.enum(['method', 'substitution', 'order', 'preference', 'quantity']) }).strict(),
  z.object({ type: z.literal('revise_plan'), remainingSteps: z.array(step).min(1).max(60), reason: text }).strict(),
  z.object({ type: z.literal('add_message'), message: z.object({ id, role: z.enum(['user', 'assistant']), text: z.string().trim().min(1).max(12000), channel: z.enum(['chat', 'voice']), createdAt: z.string().datetime({ offset: true }) }).strict() }).strict(),
  z.object({ type: z.literal('start_timer'), timerId: id, label: z.string().trim().min(1).max(160), durationSeconds: z.number().int().min(1).max(172800), stepId: id.optional(), occurredAt }).strict(), timerAction,
  z.object({ type: z.literal('set_status'), status: z.enum(['cooking', 'paused', 'completed']) }).strict(),
])
export const commandRequestSchema = z.object({ commandId: id, expectedRevision: z.number().int().min(0), command: cookingCommandSchema, voiceLeaseId: uuid.optional() }).strict()
export const createSessionSchema = z.object({ recipeId: id, id: uuid.optional(), language: language.optional(), servings: z.number().min(0.25).max(100).optional(), cookware: text.optional(), cookingSetup: cookingSetupSchema.optional(), localSession: z.unknown().optional() }).strict()
export const chatSchema = z.object({ sessionId: uuid, expectedRevision: z.number().int().min(0), message: z.string().trim().min(1).max(6000), requestId: uuid }).strict()
export const leaseSchema = z.object({ sessionId: uuid, deviceId: id, action: z.enum(['acquire', 'renew', 'release', 'takeover']), leaseId: uuid.optional() }).strict()
export const voiceTokenSchema = z.object({ sessionId: uuid, leaseId: uuid, requestId: uuid }).strict()
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError(400, 'invalid_request', 'Check the request fields and try again.', { fields: result.error.issues.map(issue => issue.path.join('.')).slice(0, 8) })
  return result.data
}
export const parseCookingCommand = (value: unknown) => parse(cookingCommandSchema, value) as CookingCommand

const date = z.string().datetime({ offset: true })
const localSessionSchema = z.object({
  // Never validate or trust recipe content supplied by the browser. The server
  // replaces this field with the archived authoritative recipe after parsing.
  recipeSnapshot: z.unknown().optional().transform(() => undefined),
  id: uuid, ownerId: uuid.nullable(), recipeId: id, recipeVersion: z.number().int().positive(), title: text, language, servings: z.number().min(0.25).max(100), cookware: z.string().trim().min(1).max(160),
  cookingSetup: cookingSetupSchema.optional(),
  steps: z.array(step).min(1).max(100), currentStepId: id.nullable(), completedStepIds: z.array(id).max(100),
  addedIngredients: z.array(z.object({ ingredientId: id, quantity: z.number().positive().max(100000), unit: z.string().min(1).max(40), addedAt: date }).strict()).max(500),
  extraIngredients: z.array(ingredient).max(50).default([]),
  adaptations: z.array(z.object({ id, text, kind: z.enum(['method', 'substitution', 'order', 'preference', 'quantity']), createdAt: date }).strict()).max(300),
  timers: z.array(z.object({ id, label: z.string().min(1).max(160), durationSeconds: z.number().positive().max(172800), endAt: date.nullable(), remainingSeconds: z.number().min(0).max(172800), status: z.enum(['running', 'paused', 'cancelled']), stepId: id.optional() }).strict()).max(100),
  messages: z.array(z.object({ id, role: z.enum(['user', 'assistant']), text: z.string().min(1).max(12000), channel: z.enum(['chat', 'voice']), createdAt: date }).strict()).max(2000),
  revision: z.number().int().min(0), status: z.enum(['cooking', 'paused', 'completed']), createdAt: date, updatedAt: date,
}).strict()
export const localRecipeReferenceSchema = localSessionSchema.pick({ recipeId: true, recipeVersion: true }).strip()
export function importLocalSession(value: unknown, recipe: Recipe, ownerId: string, now: string): CookingSession {
  const session = parse(localSessionSchema, value) as CookingSession
  const require = (ok: boolean) => { if (!ok) throw new ApiError(400, 'invalid_local_session', 'This local cooking session has inconsistent recipe references. Keep the local copy and start a new cloud session.') }
  const unique = (ids: string[]) => new Set(ids).size === ids.length
  require(session.recipeId === recipe.id && session.recipeVersion === recipe.version)
  const ingredients = [...recipe.ingredients, ...session.extraIngredients], ingredientIds = new Set(ingredients.map(item => item.id)), stepIds = new Set(session.steps.map(item => item.id))
  require(unique(ingredients.map(item => item.id)) && unique(session.steps.map(item => item.id)) && unique(session.completedStepIds))
  require(session.completedStepIds.every(id => stepIds.has(id)) && (session.currentStepId === null || stepIds.has(session.currentStepId) && !session.completedStepIds.includes(session.currentStepId)))
  require(session.steps.every(step => step.ingredientIds.every(id => ingredientIds.has(id))))
  if (session.cookingSetup) {
    require([...session.cookingSetup.availableIngredientIds, ...session.cookingSetup.unavailableIngredientIds].every(id => ingredientIds.has(id)))
  }
  const maxWatts = session.cookingSetup?.inductionMaxWatts ?? 1800
  require(session.steps.every(step => step.inductionWatts === undefined || step.inductionWatts <= maxWatts && (step.heat === 'off' ? step.inductionWatts === 0 : step.inductionWatts >= 100)))
  require(session.addedIngredients.every(item => ingredients.some(ingredient => ingredient.id === item.ingredientId && ingredient.unit === item.unit)))
  require(unique(session.timers.map(timer => timer.id)) && unique(session.messages.map(message => message.id)))
  require(session.timers.every(timer => (!timer.stepId || stepIds.has(timer.stepId)) && (timer.status !== 'running' || timer.endAt !== null) && (timer.status === 'running' || timer.endAt === null) && (!timer.endAt || Date.parse(timer.endAt) <= Date.parse(now) + 172800000)))
  return { ...session, ownerId, revision: 0, updatedAt: now, recipeSnapshot: structuredClone(recipe) }
}
