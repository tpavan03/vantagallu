import type { CookingSetup, RecipeStep } from './types.ts'

/** Suggested starting power, not a temperature measurement or appliance command. */
export function heatGuidance(step: RecipeStep, setup?: CookingSetup): { label: string; detail: string; watts: number | null } {
  if (setup?.heatSource !== 'induction') return {
    label: step.heat === 'off' ? 'Heat off' : `${step.heat[0].toUpperCase()}${step.heat.slice(1)} flame`,
    detail: step.heat === 'off' ? 'No burner heat for this step.' : 'Adjust the flame to the recipe’s cooking cues and your pan.',
    watts: null,
  }
  const maximum = Math.min(1800, Math.max(100, setup.inductionMaxWatts))
  const starting = { off: 0, low: 400, medium: 900, high: 1500 }[step.heat]
  const suggested = step.inductionWatts ?? Math.round((starting * maximum / 1800) / 50) * 50
  const watts = step.heat === 'off' ? 0 : Math.min(maximum, Math.max(100, suggested))
  return {
    label: `${watts} W · ${step.heat}`,
    detail: watts === 0 ? 'Induction off for this step.' : `Start at ${watts} W on your ${maximum} W hob. Use the nearest available setting; adjust for the pan and cooking cues.`,
    watts,
  }
}

export const setupAdaptationRequest = 'Use my saved cooking setup and ingredient availability to adapt this recipe now. Preserve confirmed additions and completed steps. Replace or omit missing ingredients only when the dish can still work; ask me if an essential ingredient needs a choice. Save the revised remaining steps with the cooking tool, including suitable induction watt settings if selected. Explain the changes briefly. Do not claim the plan was saved until the tool succeeds.'
