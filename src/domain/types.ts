export const languages = ['en', 'te', 'kn', 'hi'] as const
export type Language = typeof languages[number]
export type LocalizedText = { en: string } & Partial<Record<Language, string>>
export type RecipeRegion = 'andhra' | 'telangana' | 'rayalaseema' | 'tamil' | 'karnataka' | 'kerala' | 'south-indian'
export type RecipeCategory = 'breakfast' | 'chutney' | 'podi' | 'dal' | 'curry' | 'fry' | 'rice' | 'biryani' | 'seafood' | 'pickle' | 'snack' | 'sweet'
export type Diet = 'vegetarian' | 'vegan' | 'egg' | 'non-vegetarian'
export type Heat = 'off' | 'low' | 'medium' | 'high'
export interface CookingSetup {
  heatSource: 'gas' | 'induction'
  inductionMaxWatts: number
  availableIngredientIds: string[]
  unavailableIngredientIds: string[]
  pantryNotes?: string
}
export interface RecipeIngredient {
  id: string
  name: LocalizedText
  quantity: number
  unit: string
  aliases?: string[]
  optional?: boolean
  allergens?: string[]
  scaling?: 'linear' | 'to-taste' | 'method-dependent'
}
export interface RecipeStep {
  id: string
  instruction: LocalizedText
  description?: LocalizedText
  ingredientIds: string[]
  heat: Heat
  inductionWatts?: number
  durationSeconds?: number
  checkpoint?: LocalizedText
}
export interface RecipeSource {
  name: string
  url: string
  author?: string
  note?: string
}
export interface Recipe {
  id: string
  version: number
  title: LocalizedText
  summary: LocalizedText
  region: RecipeRegion
  categories: RecipeCategory[]
  diet: Diet
  baseServings: number
  prepMinutes: number
  cookMinutes: number
  equipment: string[]
  authorMethod: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  sources: RecipeSource[]
  reviewStatus: 'source-checked' | 'needs-kitchen-test'
  substitutions?: { ingredientId: string; alternative: string; note: string }[]
  safetyNotes?: string[]
  aliases?: string[]
}
export interface AddedIngredient { ingredientId: string; quantity: number; unit: string; addedAt: string }
export interface CookingTimer { id: string; label: string; durationSeconds: number; endAt: string | null; remainingSeconds: number; status: 'running' | 'paused' | 'cancelled'; stepId?: string }
export interface CookingMessage { id: string; role: 'user' | 'assistant'; text: string; channel: 'chat' | 'voice'; createdAt: string }
export interface Adaptation { id: string; text: string; createdAt: string; kind: 'method' | 'substitution' | 'order' | 'preference' | 'quantity' }
export interface CookingSession {
  id: string
  ownerId: string | null
  recipeId: string
  recipeVersion: number
  recipeSnapshot?: Recipe
  title: string
  language: Language
  servings: number
  cookware: string
  cookingSetup?: CookingSetup
  steps: RecipeStep[]
  currentStepId: string | null
  completedStepIds: string[]
  addedIngredients: AddedIngredient[]
  extraIngredients: RecipeIngredient[]
  adaptations: Adaptation[]
  timers: CookingTimer[]
  messages: CookingMessage[]
  revision: number
  status: 'cooking' | 'paused' | 'completed'
  createdAt: string
  updatedAt: string
}
export type CookingCommand =
  | { type: 'set_language'; language: Language }
  | { type: 'set_servings'; servings: number }
  | { type: 'set_cookware'; cookware: string }
  | { type: 'set_cooking_setup'; setup: CookingSetup }
  | { type: 'record_ingredient'; ingredientId: string; quantity: number; unit: string }
  | { type: 'add_custom_ingredient'; ingredient: RecipeIngredient }
  | { type: 'complete_step'; stepId: string }
  | { type: 'add_adaptation'; text: string; kind: Adaptation['kind'] }
  | { type: 'revise_plan'; remainingSteps: RecipeStep[]; reason: string }
  | { type: 'add_message'; message: CookingMessage }
  | { type: 'start_timer'; timerId: string; label: string; durationSeconds: number; stepId?: string; occurredAt?: string }
  | { type: 'pause_timer' | 'resume_timer' | 'cancel_timer'; timerId: string; occurredAt?: string }
  | { type: 'set_status'; status: CookingSession['status'] }
export interface CommandRequest { commandId: string; expectedRevision: number; command: CookingCommand }
export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'reconnecting' | 'error'
export type SaveStatus = 'local' | 'saving' | 'saved' | 'offline' | 'error'
export const localize = (text: LocalizedText, language: Language = 'en') => text[language] || text.en
