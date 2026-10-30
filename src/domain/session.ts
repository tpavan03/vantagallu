import { languages } from './types.ts'
import type { CookingCommand, CookingSession, CookingTimer, Language, Recipe, RecipeIngredient, RecipeStep } from './types.ts'

export class DomainError extends Error {
  constructor(message: string) { super(message); this.name = 'DomainError' }
}
function requireThat(ok: unknown, message: string): asserts ok { if (!ok) throw new DomainError(message) }
const validText = (text: unknown, maximum = 2000) => typeof text === 'string' && text.trim().length > 0 && text.length <= maximum
const positive = (n: unknown, maximum: number) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= maximum
const unique = (values: string[]) => new Set(values).size === values.length
export const sessionIngredients = (recipe: Recipe, session: CookingSession): RecipeIngredient[] => [...recipe.ingredients, ...(session.extraIngredients || [])]
export const timerRemainingSeconds = (timer: CookingTimer, now = Date.now()) => timer.status === 'cancelled' ? 0 : timer.status === 'running' && timer.endAt ? Math.max(0, Math.ceil((Date.parse(timer.endAt) - now) / 1000)) : timer.remainingSeconds

export function createCookingSession(recipe: Recipe, options: { id?: string; ownerId?: string | null; language?: Language; servings?: number; cookware?: string; now?: string } = {}): CookingSession {
  const now = options.now || new Date().toISOString()
  const servings = options.servings ?? recipe.baseServings
  requireThat(positive(servings, 100), 'Choose between 1 and 100 servings.')
  return {
    id: options.id || crypto.randomUUID(), ownerId: options.ownerId || null,
    recipeId: recipe.id, recipeVersion: recipe.version, recipeSnapshot: structuredClone(recipe), title: recipe.title.en,
    language: options.language || 'en', servings, cookware: options.cookware || recipe.equipment[0] || 'Pan',
    steps: structuredClone(recipe.steps), currentStepId: recipe.steps[0]?.id || null,
    completedStepIds: [], addedIngredients: [], extraIngredients: [], adaptations: [], timers: [], messages: [],
    revision: 0, status: 'cooking', createdAt: now, updatedAt: now,
  }
}

export function ingredientAmount(recipe: Recipe, session: CookingSession, ingredient: RecipeIngredient) {
  const target = ingredient.quantity * (ingredient.scaling === 'to-taste' || ingredient.scaling === 'method-dependent' ? 1 : session.servings / recipe.baseServings)
  const added = session.addedIngredients.filter(item => item.ingredientId === ingredient.id).reduce((sum, item) => sum + item.quantity, 0)
  return { target, added, remaining: Math.max(0, target - added), overTarget: added > target + 0.0001 }
}

function validateStep(step: RecipeStep, ingredientIds: Set<string>) {
  requireThat(validText(step.id, 80) && validText(step.instruction?.en, 2000), 'Every step needs an ID and an instruction.')
  requireThat(['off', 'low', 'medium', 'high'].includes(step.heat), 'Choose a valid heat setting.')
  requireThat(Array.isArray(step.ingredientIds) && step.ingredientIds.every(id => ingredientIds.has(id)), 'A step refers to an unknown ingredient.')
  if (step.durationSeconds !== undefined) requireThat(positive(step.durationSeconds, 172800), 'Step timing must be between one second and 48 hours.')
  for (const lang of languages) {
    for (const value of [step.instruction[lang], step.description?.[lang], step.checkpoint?.[lang]]) {
      if (value !== undefined) requireThat(validText(value, 3000), 'Step text is too long or empty.')
    }
  }
}

export function applyCookingCommand(original: CookingSession, command: CookingCommand, recipe: Recipe, nowISO: string): CookingSession {
  requireThat(original.recipeId === recipe.id && original.recipeVersion === recipe.version, 'This recipe version does not belong to the cooking session.')
  const now = Date.parse(nowISO)
  requireThat(Number.isFinite(now), 'A valid timestamp is required.')
  requireThat(command && typeof command.type === 'string', 'A cooking action is required.')
  let actionTime = now
  if ('occurredAt' in command && command.occurredAt !== undefined) {
    actionTime = Date.parse(command.occurredAt)
    requireThat(Number.isFinite(actionTime) && actionTime <= now + 30000 && actionTime >= Date.parse(original.createdAt) - 30000, 'The timer action time does not match this cooking session. Review the saved timer before syncing.')
  }
  const session = structuredClone(original)
  session.recipeSnapshot ||= structuredClone(recipe)
  session.extraIngredients ||= []
  const allIngredients = sessionIngredients(recipe, session)
  const ingredientIds = new Set(allIngredients.map(item => item.id))
  const adaptation = (text: string, kind: CookingSession['adaptations'][number]['kind']) => {
    requireThat(session.adaptations.length < 300, 'Start a new cooking session before adding more changes.')
    session.adaptations.push({ id: `change-${session.revision + 1}-${session.adaptations.length}`, text: text.trim(), kind, createdAt: nowISO })
  }
  switch (command.type) {
    case 'set_language':
      requireThat(languages.includes(command.language), 'Choose English, Telugu, Kannada or Hindi.')
      session.language = command.language
      break
    case 'set_servings':
      requireThat(positive(command.servings, 100), 'Choose between 1 and 100 servings.')
      if (command.servings !== session.servings && session.addedIngredients.length) adaptation(`Changed target from ${session.servings} to ${command.servings} servings. Ingredients already added remain unchanged; adjust the remaining preparation.`, 'quantity')
      session.servings = command.servings
      break
    case 'set_cookware':
      requireThat(validText(command.cookware, 160), 'Choose your cookware.')
      if (command.cookware !== session.cookware) adaptation(`Using ${command.cookware.trim()} instead of ${session.cookware}. Recheck heat, water and remaining timing for this method.`, 'method')
      session.cookware = command.cookware.trim()
      break
    case 'add_custom_ingredient': {
      const item = command.ingredient
      requireThat(item && validText(item.id, 80) && !ingredientIds.has(item.id), 'Choose a new, unique ingredient ID.')
      requireThat(validText(item.name?.en, 100) && validText(item.unit, 40) && positive(item.quantity, 100000), 'Enter an ingredient, a positive quantity and a unit.')
      requireThat(session.extraIngredients.length < 50, 'This session already has many additional ingredients.')
      session.extraIngredients.push(structuredClone(item))
      adaptation(`Added ${item.name.en} to this version.`, 'substitution')
      break
    }
    case 'record_ingredient': {
      const item = allIngredients.find(item => item.id === command.ingredientId)
      requireThat(item, 'Select a known ingredient, or add a new ingredient first.')
      requireThat(positive(command.quantity, 100000), 'Enter the amount you actually added.')
      requireThat(command.unit === item.unit, `Use ${item.unit} for this ingredient so quantities stay consistent.`)
      requireThat(session.addedIngredients.length < 500, 'This session has reached its ingredient update limit.')
      session.addedIngredients.push({ ingredientId: item.id, quantity: command.quantity, unit: item.unit, addedAt: nowISO })
      break
    }
    case 'complete_step': {
      requireThat(command.stepId === session.currentStepId, 'The current step changed. Check the latest instruction before continuing.')
      requireThat(session.steps.some(step => step.id === command.stepId), 'This cooking step is unavailable.')
      if (!session.completedStepIds.includes(command.stepId)) session.completedStepIds.push(command.stepId)
      session.currentStepId = session.steps.find(step => !session.completedStepIds.includes(step.id))?.id || null
      if (!session.currentStepId) session.status = 'completed'
      break
    }
    case 'add_adaptation':
      requireThat(validText(command.text), 'Describe the change in a short sentence.')
      requireThat(['method', 'substitution', 'order', 'preference', 'quantity'].includes(command.kind), 'Choose a valid change type.')
      adaptation(command.text, command.kind)
      break
    case 'revise_plan': {
      requireThat(Array.isArray(command.remainingSteps) && command.remainingSteps.length > 0 && command.remainingSteps.length <= 50, 'Provide between 1 and 50 remaining steps.')
      requireThat(validText(command.reason), 'Explain why the remaining plan is changing.')
      const completed = session.steps.filter(step => session.completedStepIds.includes(step.id))
      for (const step of command.remainingSteps) validateStep(step, ingredientIds)
      requireThat(unique([...completed, ...command.remainingSteps].map(step => step.id)), 'The remaining plan must use distinct step IDs and preserve completed steps.')
      session.steps = [...completed, ...structuredClone(command.remainingSteps)]
      session.currentStepId = command.remainingSteps[0].id
      session.status = 'cooking'
      adaptation(command.reason, 'order')
      break
    }
    case 'add_message': {
      const message = command.message
      requireThat(message && validText(message.id, 100) && validText(message.text, 12000), 'A message needs an ID and text under 12,000 characters.')
      requireThat(['user', 'assistant'].includes(message.role) && ['chat', 'voice'].includes(message.channel), 'Choose a valid message role and channel.')
      requireThat(!session.messages.some(existing => existing.id === message.id), 'This message has already been saved.')
      requireThat(session.messages.length < 2000, 'Start a new cooking session to continue this long conversation.')
      session.messages.push({ ...message, createdAt: nowISO })
      break
    }
    case 'start_timer': {
      requireThat(validText(command.timerId, 100) && !session.timers.some(item => item.id === command.timerId), 'Choose a new timer ID.')
      requireThat(validText(command.label, 160) && positive(command.durationSeconds, 172800), 'Enter a timer name and duration between one second and 48 hours.')
      requireThat(!command.stepId || session.steps.some(step => step.id === command.stepId), 'The timer refers to an unknown cooking step.')
      requireThat(session.timers.filter(timer => timer.status !== 'cancelled').length < 10, 'Keep no more than 10 cooking timers active.')
      session.timers.push({ id: command.timerId, label: command.label, durationSeconds: command.durationSeconds, remainingSeconds: command.durationSeconds, status: 'running', endAt: new Date(actionTime + command.durationSeconds * 1000).toISOString(), stepId: command.stepId })
      break
    }
    case 'pause_timer':
    case 'resume_timer':
    case 'cancel_timer': {
      const timer = session.timers.find(item => item.id === command.timerId)
      requireThat(timer, 'This timer is unavailable.')
      if (command.type === 'cancel_timer') { timer.status = 'cancelled'; timer.endAt = null; timer.remainingSeconds = 0 }
      else if (command.type === 'pause_timer') {
        requireThat(timer.status === 'running', 'This timer is not running.')
        timer.remainingSeconds = timerRemainingSeconds(timer, actionTime)
        timer.endAt = null; timer.status = 'paused'
      } else {
        requireThat(timer.status === 'paused' && timer.remainingSeconds > 0, 'This timer has finished or cannot be resumed. Start a new timer if needed.')
        timer.endAt = new Date(actionTime + timer.remainingSeconds * 1000).toISOString(); timer.status = 'running'
      }
      break
    }
    case 'set_status':
      requireThat(['cooking', 'paused', 'completed'].includes(command.status), 'Choose a valid cooking-session status.')
      session.status = command.status
      break
    default: throw new DomainError('This cooking action is not supported.')
  }
  session.revision = original.revision + 1
  session.updatedAt = nowISO
  return session
}
