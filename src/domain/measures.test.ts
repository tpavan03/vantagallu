import { expect, it } from 'vitest'
import { spiceMeasure } from './measures'

it('expresses ground-spice volume in teaspoons without changing the saved amount', () => {
  const saved = { name: 'Coriander powder', quantity: .25, unit: 'cup' }
  expect(spiceMeasure(saved.name, saved.quantity, saved.unit)).toEqual({ quantity: 12, unit: 'tsp' })
  expect(saved).toEqual({ name: 'Coriander powder', quantity: .25, unit: 'cup' })
  expect(spiceMeasure('Garam masala', .25, 'tbsp')).toEqual({ quantity: .75, unit: 'tsp' })
  expect(spiceMeasure('Chicken masala powder', 1, 'tsp')).toEqual({ quantity: 1, unit: 'tsp' })
})

it('keeps fresh ingredients, bulk additions and unconvertible measures truthful', () => {
  expect(spiceMeasure('Fresh coriander', 1, 'cup')).toEqual({ quantity: 1, unit: 'cup' })
  expect(spiceMeasure('Dried coconut powder', .25, 'cup')).toEqual({ quantity: .25, unit: 'cup' })
  expect(spiceMeasure('Chilli powder', 10, 'g')).toEqual({ quantity: 10, unit: 'g' })
  expect(spiceMeasure('Garam masala - a pinch', 1, 'to taste')).toEqual({ quantity: 1, unit: 'to taste' })
})
