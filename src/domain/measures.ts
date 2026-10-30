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

/** Preserve familiar spoon fractions instead of rounding 5/8 tsp to 0.63 tsp. */
export function formatKitchenQuantity(value: number): string {
  if (Number.isInteger(value)) return String(value)
  const whole = Math.floor(value), remainder = value - whole
  const fractions: [number, string][] = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞']]
  const fraction = fractions.find(([amount]) => Math.abs(amount - remainder) < .000001)
  return fraction ? `${whole || ''}${fraction[1]}` : String(Math.round(value * 100) / 100)
}
