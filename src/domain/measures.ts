/** Dry spice measures only: coconut/flour powders remain bulk ingredients. */
export function isSpicePowder(name: string): boolean {
  if (/\b(?:coconut|milk|flour|sugar|jaggery|peanut|cashew)\b/i.test(name)) return false
  return /powder|garam\s*masala|(?:chicken|meat|fish|curry)\s*masala|turmeric|asafoetida|\bhing\b/i.test(name)
}

/** A display conversion never changes a saved ingredient or guesses its density. */
export function spiceMeasure(name: string, quantity: number, unit: string): { quantity: number; unit: string } {
  if (!isSpicePowder(name)) return { quantity, unit }
  const normalized = unit.trim().toLowerCase()
  const factor = /^(?:tbsp|tablespoons?)$/.test(normalized) ? 3 : /^(?:cups?)$/.test(normalized) ? 48 : /^(?:tsp|teaspoons?)$/.test(normalized) ? 1 : null
  return factor === null ? { quantity, unit } : { quantity: quantity * factor, unit: 'tsp' }
}
