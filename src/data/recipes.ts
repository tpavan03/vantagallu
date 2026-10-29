import type { Recipe, RecipeIngredient, RecipeStep } from '../domain/types'
import { sourceFacts } from '../content/source-facts'
import { starterMethods } from '../content/starter-methods'

const temperatureSource = { name: 'FoodSafety.gov — safe cooking temperatures', url: 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures', note: 'Safety reference, not the recipe author.' }
const handlingSource = { name: 'FoodSafety.gov — four steps to food safety', url: 'https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety', note: 'Safety reference, not the recipe author.' }

const fractions: Record<string, number> = { '¼': .25, '½': .5, '¾': .75, '⅛': .125, '⅓': 1 / 3, '⅔': 2 / 3 }
function amount(value: string | null): number {
  if (!value) return 1
  const first = value.trim().split(/\s*[-–]\s*/)[0].replace(/[”"()]/g, '').replace(/(\d+)\(.*$/, '$1')
  const unicode = [...first].find(character => character in fractions)
  if (unicode) return (Number(first.split(unicode)[0]) || 0) + fractions[unicode]
  if (/^\d+\s+\d+\/\d+$/.test(first)) { const [whole, fraction] = first.split(/\s+/); return Number(whole) + amount(fraction) }
  if (/^\d+\/\d+$/.test(first)) { const [numerator, denominator] = first.split('/').map(Number); return numerator / denominator }
  const parsed = Number.parseFloat(first)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function unit(raw: string, name: string): string {
  const lower = raw.trim().toLowerCase()
  if (lower === 'to taste') return /water|oil/i.test(name) ? 'as needed' : 'to taste'
  if (/^gms?$|^grams?$/.test(lower)) return 'g'
  if (/^kg$|^kilo(?:gram)?$/.test(lower)) return 'kg'
  if (/^cups?$/.test(lower)) return 'cup'
  if (/^tbsps?$/.test(lower)) return 'tbsp'
  if (/^tsps?$/.test(lower)) return 'tsp'
  if (lower === 'spoon') return 'tsp'
  if (/^lit(?:er|re)s?$/.test(lower)) return 'litre'
  if (/^inch(?:es)?$/.test(lower)) return 'inch'
  if (/^spring|^sprig/.test(lower)) return 'sprig'
  if (/^pinches?$/.test(lower)) return 'pinch'
  if (!lower) {
    if (/sprig|strand|curry leaves/i.test(name)) return 'sprig'
    if (/pinch/i.test(name)) return 'pinch'
    if (/bunch|bundle/i.test(name)) return 'bunch'
    if (/inch/i.test(name)) return 'inch'
    return 'piece'
  }
  return lower
}

function normalizeName(raw: string): string {
  return raw.replace(/&amp;/g, '&').replace(/^(?:A |An )/i, '').replace(/Mustrd/g, 'Mustard').replace(/Musard/g, 'Mustard').replace(/galic/g, 'garlic').replace(/Spring Curry/i, 'Curry').replace(/Strands? Curry/i, 'Curry').replace(/Sprigs? Curry/i, 'Curry').replace(/Pinches? /i, '').replace(/\s+/g, ' ').trim()
}

const aliasesFor = (name: string): string[] => {
  const rules: [RegExp, string[]][] = [
    [/toor|tur dal|red gram/i, ['kandi pappu', 'కందిపప్పు', 'pigeon pea dal']],
    [/moong|green gram/i, ['pesara pappu', 'పెసర పప్పు', 'moong dal']],
    [/urad|black gram/i, ['minapappu', 'మినపప్పు', 'urad dal']],
    [/bengal gram|chana dal/i, ['senaga pappu', 'శనగ పప్పు', 'chana dal']],
    [/peanut|groundnut/i, ['palli', 'పల్లీలు', 'groundnuts']],
    [/sorrel|gongura/i, ['gongura', 'గోంగూర']],
    [/ridge.?d? gourd/i, ['beerakaya', 'బీరకాయ']],
    [/bottle.?gourd/i, ['sorakaya', 'సొరకాయ']],
    [/coccinia|tindora|ivy gourd|kundru/i, ['dondakaya', 'దొండకాయ']],
    [/asafoetida|hing|inguva/i, ['hing', 'inguva', 'ఇంగువ']],
    [/curd|yogurt/i, ['perugu', 'పెరుగు', 'yogurt']],
    [/tamarind/i, ['chintapandu', 'చింతపండు']],
    [/curry leaves/i, ['karivepaku', 'కరివేపాకు']],
    [/rice flakes|flattened rice|poha/i, ['atukulu', 'అటుకులు', 'poha']],
    [/semolina|bombay rava/i, ['sooji', 'రవ్వ', 'semolina']],
  ]
  return rules.filter(([pattern]) => pattern.test(name)).flatMap(([, values]) => values)
}

function allergensFor(name: string): string[] {
  const found: string[] = []
  if (/peanut|groundnut/i.test(name)) found.push('peanut')
  if (/sesame/i.test(name)) found.push('sesame')
  if (/cashew|kaju/i.test(name)) found.push('cashew')
  if (/almond|badam/i.test(name)) found.push('almond')
  if (/ghee|milk|curd|yogurt|butter/i.test(name) && !/coconut milk|butterfly/i.test(name)) found.push('milk')
  if (/wheat|semolina|bombay rava|maida/i.test(name)) found.push('wheat')
  if (/egg/i.test(name)) found.push('egg')
  if (/fish/i.test(name)) found.push('fish')
  if (/prawn|shrimp|crab/i.test(name)) found.push('shellfish')
  return found
}

function ingredient(name: string, quantity: number, measuredUnit: string, id: string): RecipeIngredient {
  return {
    id, name: { en: name }, quantity, unit: measuredUnit,
    aliases: aliasesFor(name), allergens: allergensFor(name),
    scaling: /\bwater\b|\boil\b|milk|soda/i.test(name) || measuredUnit === 'as needed' ? 'method-dependent' : /\bsalt\b|chill?i|mirchi|mirapakaya|pepper powder/i.test(name) || measuredUnit === 'to taste' ? 'to-taste' : 'linear',
  }
}

// Explicit corrections to ambiguities/omissions in the linked source. No hidden
// invented precision: editorial quantities and variant changes are documented.
function correctedFacts(index: number): [string, string | null, string][] {
  const rows: [string, string | null, string][] = sourceFacts[index].ingredients.map(([name, qty, measuredUnit]) => [name, qty, measuredUnit])
  const add = (name: string, qty: string | null, measuredUnit: string) => rows.push([name, qty, measuredUnit])
  if (index === 0) add('Cumin seeds (tempering)', '1/4', 'tsp')
  if (index === 1) add('Oil (tempering)', '1', 'tbsp')
  if (index === 4) add('Oil (moulds)', null, 'as needed')
  if (index === 5) rows[9] = ['Small boiled potato', '1', 'piece']
  if (index === 7) add('Water', '5', 'cup')
  if ([9, 18, 48].includes(index)) add('Salt', null, 'to taste')
  if (index === 8) add('Oil (tawa)', null, 'as needed')
  if (index === 10) {
    rows.forEach((row, i) => { row[0] += i < 10 ? ' (batter)' : i < 19 ? ' (red spread)' : ' (potato filling)' })
    add('Water (red chilli soaking)', null, 'as needed')
  }
  if (index === 13) { rows[15] = ['Eggs', '10', 'piece']; rows.splice(16, 1) }
  if (index === 17) { rows[2] = ['Roasted unsalted peanuts', '1/2', 'cup']; add('Water (blending)', null, 'as needed') }
  if (index === 18) { add('Garlic (optional)', '1', 'clove'); add('Water (blending)', null, 'as needed') }
  if (index === 23) add('Water (meat cooking)', '300', 'ml')
  if (index === 25) { rows[5] = ['Ginger', '1', 'inch']; add('Water (gravy)', null, 'as needed') }
  if (index === 29) { rows[5] = ['Salt', null, 'to taste']; rows[8] = ['Raw mango', '1', 'piece']; rows[9] = ['Tomatoes (puréed)', '2', 'piece'] }
  if (index === 30) add('Water', '250', 'ml')
  if (index === 32) add('Water (initial splash)', '2', 'tbsp')
  if (index === 36) add('Ginger garlic paste', '1', 'tsp')
  if (index === 38) rows[1] = ['Diluted coconut milk (editorial cup correction)', '1 3/4', 'cup']
  if (index === 39) rows[13] = ['Raw rice (cook separately before tossing)', '110', 'g']
  if (index === 40) { rows[0] = ['Rice', '1', 'kg']; rows[1] = ['Water (rice cooking)', '2100', 'ml'] }
  if (index === 41) { rows[15] = ['Food-grade dried rose petals (optional)', '1', 'tsp']; add('Water (basmati cooking; adjust to vessel)', '1', 'cup') }
  if (index === 43) { rows[5] = ['Cinnamon stick', '1/4', 'inch']; rows[10] = ['Cooked rice', '185', 'g'] }
  if (index === 46) {
    rows[10] = ['Mustard seeds (tempering)', '1/2', 'tsp']
    add('Cumin seeds (tempering)', '1/2', 'tsp'); add('Urad dal (tempering)', '1/2', 'tsp')
  }
  if (index === 49) { rows.splice(11, 1); rows[15] = ['Mustard seeds', '1/4', 'tsp'] }
  if (index === 50) rows[13] = ['Water (cabbage cooking)', '1/2', 'cup']
  if (index === 51) rows.forEach((row, i) => { row[0] += i < 10 ? ' (spice paste)' : i < 15 ? ' (dal cooking)' : i < 29 ? ' (sambar)' : ' (final tempering)' })
  if (index === 52) { rows[3] = ['Salt (rice and dal)', null, 'to taste']; rows[8] = ['Salt (finish)', null, 'to taste'] }
  if (index === 53) add('Plain yogurt (editorial starting amount)', '1', 'cup')
  if (index === 54) { rows[6] = ['Cardamom pods (optional; powder also listed)', '3', 'piece'] }
  if (index === 55) rows[7] = ['Cardamom pods (seeds crushed)', '3', 'piece']
  if (index === 56) rows.splice(10, 1)
  if (index === 57) rows[1] = ['Ghee', '1', 'tbsp']
  if (index === 58) { rows[0] = ['Rice flour', '250', 'g']; rows[1] = ['Urad dal flour', '50', 'g'] }
  if (index === 59) rows.forEach((row, i) => { row[0] += i < 5 ? ' (dal cooking)' : i < 14 ? ' (tomato masala)' : ' (tempering)' })
  return rows
}

function dietFor(ingredients: RecipeIngredient[]): Recipe['diet'] {
  const names = ingredients.map(item => item.name.en).join(' ')
  if (/chicken|mutton|meat|fish|prawn|shrimp/i.test(names)) return 'non-vegetarian'
  if (/\beggs?\b/i.test(names)) return 'egg'
  if (ingredients.some(item => item.allergens?.includes('milk'))) return 'vegetarian'
  return 'vegan'
}

const standardSafety = [
  'These source-adapted instructions have not been kitchen-tested by Vantagallu. Timers are check-in reminders; use the sensory checks and safe temperatures.',
  'Refrigerate perishable cooked food within two hours, or within one hour above 32°C. Cool in shallow containers; keep the refrigerator at 4°C or colder.',
  'Check ingredient labels and cross-contact for allergies; an ingredient substitution does not automatically make a recipe allergen-free.',
]

function equipmentFor(categories: Recipe['categories'], id: string): string[] {
  if (/idli/.test(id)) return ['Dedicated steamer', 'Idli moulds', 'Blender', 'Large fermentation bowl']
  if (/dosa|pesarattu/.test(id)) return ['Seasoned tawa or suitable nonstick pan', 'Blender', 'Ladle', 'Flat spatula']
  if (id === 'appam') return ['Appam pan with lid', 'Blender', 'Large fermentation bowl']
  if (id === 'dibba-rotti') return ['Small heavy skillet with lid', 'Tawa', 'Heat-safe turning plate']
  if (categories.includes('snack') || categories.includes('fry')) return ['Heavy kadai', 'Slotted spoon', 'Dry tray', ...(id === 'murukulu' ? ['Murukku press'] : [])]
  if (categories.includes('seafood')) return ['Wide heavy pan with lid', 'Blender', 'Food thermometer']
  if (categories.includes('dal') || /pulao|pongal/.test(id)) return ['Pressure cooker or heavy lidded pot', 'Tempering pan', 'Measuring cup']
  return ['Heavy pan with lid', 'Blender or mortar', 'Measuring cup', 'Spatula']
}

function stageIngredients(text: string, ingredients: RecipeIngredient[]): string[] {
  const normalized = text.toLowerCase()
  return ingredients.filter(item => {
    const words = item.name.en.toLowerCase().replace(/\([^)]*\)/g, '').split(/[^a-z]+/).filter(word => word.length > 3 && !['small', 'chopped', 'powder', 'pieces', 'seeds', 'fresh', 'whole', 'cooking', 'paste'].includes(word))
    return words.some(word => normalized.includes(word)) || (normalized.includes('dal') && /gram|dal/i.test(item.name.en)) || (normalized.includes('tempering') && /mustard|cumin|curry leaves|urad|bengal gram/i.test(item.name.en))
  }).map(item => item.id)
}

const correctedVersionIds = new Set(['instant-poha-idli', 'millet-pongal', 'dondakaya-pachadi', 'dosakaya-pachadi', 'kaju-pulao', 'chemadumpa-fry', 'mango-pulissery', 'tomato-pappu', 'mudda-pappu'])
const sourcedRecipes: Recipe[] = starterMethods.map(method => {
  const facts = sourceFacts[method.index]
  const ingredients = correctedFacts(method.index).map(([rawName, qty, rawUnit], i) => {
    const name = normalizeName(rawName)
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${i + 1}`
    return { ...ingredient(name, amount(qty), unit(rawUnit, rawName), id), ...(/optional/i.test(name) ? { optional: true } : {}) }
  })
  const diet = dietFor(ingredients)
  const pressure = /pressure|cooker/.test(method.stages.map(stage => stage[2]).join(' '))
  const safetyNotes = [...standardSafety]
  if (pressure) safetyNotes.push('Use the appliance manufacturer’s minimum liquid, fill limit and pressure guidance. Never force the lid open; wait for full pressure release. Whistle counts do not transfer reliably between cookers.')
  if (diet === 'non-vegetarian') safetyNotes.push('Thaw and marinate under refrigeration. Do not wash raw poultry; prevent splashes and keep raw-meat utensils separate from ready-to-eat food.')
  if (/chicken/.test(method.id)) safetyNotes.push('Measure 74°C in the thickest chicken pieces, away from bone; colour and clear juices are not reliable safety tests.')
  if (/mutton/.test(method.id)) safetyNotes.push('For intact goat or lamb cuts, reach at least 63°C with a three-minute rest; this braise also requires further cooking until fork-tender. Ground meat needs 71°C.')
  if (diet === 'egg') safetyNotes.push('Use fully set whites and yolks; mixed egg dishes should reach 71°C. Refrigerate peeled boiled eggs and cooked curry promptly.')
  if (method.categories.includes('seafood')) safetyNotes.push('Fish needs 63°C or opaque flesh that flakes readily. Prawns must be pearly and opaque throughout. Check fish carefully for bones.')
  if (method.categories.includes('fry') || method.categories.includes('snack')) safetyNotes.push('Keep water away from hot oil; dry ingredients before frying, leave room in the pan, and stop heating if oil smokes. Never use water on an oil fire.')
  if (method.id === 'sorakaya-pappu') safetyNotes.push('Discard bitter bottle gourd entirely. Do not try to remove bitterness by cooking or adding seasoning.')
  if (method.note) safetyNotes.push(method.note)
  const steps: RecipeStep[] = [
    { id: 'prepare', instruction: { en: 'Read the complete plan, check the source method and any adaptations, and measure the ingredients. Keep salt and chilli adjustable.' }, ingredientIds: ingredients.map(item => item.id), heat: 'off', checkpoint: { en: 'Soaking, fermentation and refrigerated marination may be included in prep time. Cookware and water need reassessment when resizing.' } },
    ...method.stages.map(([heat, seconds, instruction, checkpoint], i) => ({ id: `step-${i + 1}`, instruction: { en: instruction }, ingredientIds: stageIngredients(instruction, ingredients), heat, ...(seconds ? { durationSeconds: seconds } : {}), checkpoint: { en: checkpoint } })),
  ]
  const substitutions: NonNullable<Recipe['substitutions']> = []
  const ghee = ingredients.find(item => /ghee/i.test(item.name.en))
  if (ghee) substitutions.push({ ingredientId: ghee.id, alternative: 'Neutral oil', note: 'Changes the aroma. Check the full ingredient list for other dairy; do not assume the resulting dish is dairy-free.' })
  const chilli = ingredients.find(item => /green chill?i|red chill?i|mirchi/i.test(item.name.en))
  if (chilli) substitutions.push({ ingredientId: chilli.id, alternative: 'A smaller amount of a milder chilli', note: 'Start with less, then adjust. Heat varies by variety; added chilli cannot be removed later.' })
  const hing = ingredients.find(item => /asafoetida|hing/i.test(item.name.en))
  if (hing) substitutions.push({ ingredientId: hing.id, alternative: 'Omit the asafoetida', note: 'The aroma changes. Check compounded hing labels for wheat or other carriers.' })
  return {
    id: method.id, version: correctedVersionIds.has(method.id) ? 2 : 1, title: { en: method.title, te: method.te }, summary: { en: method.summary }, region: method.region, categories: method.categories, diet,
    baseServings: method.servings, prepMinutes: method.prep, cookMinutes: method.cook, equipment: equipmentFor(method.categories, method.id),
    authorMethod: `Vismai Food — source-adapted ${method.title.toLowerCase()}; independently written plan, not kitchen-tested${method.note ? '; editorial changes noted below' : ''}.`,
    ingredients, steps, sources: [{ name: 'Vismai Food', url: facts.url, note: 'Specific ingredient list and method inspected on 2026-10-30. Instructions are independently condensed; source-page errors and editorial changes are documented.' }, temperatureSource, handlingSource, ...(method.id === 'sorakaya-pappu' ? [{ name: 'Indian Journal of Medical Research — ICMR bottle gourd safety assessment', url: 'https://ijmr.org.in/assessment-of-effects-on-health-due-to-consumption-of-bitter-bottle-gourd-lagenaria-siceraria-juice/', note: 'Safety reference for discarding bitter bottle gourd, not the recipe author.' }] : [])], reviewStatus: 'needs-kitchen-test', substitutions, safetyNotes,
    aliases: [...new Set([method.title, method.te, ...method.title.split(' ').filter(word => word.length > 4)])],
  }
})

const customIngredient = (id: string, name: string, quantity: number, measuredUnit: string) => ingredient(name, quantity, measuredUnit, id)

const coreRecipes: Recipe[] = [
  {
    id: 'pesarattu', version: 2, title: { en: 'Pesarattu', te: 'పెసరట్టు' }, summary: { en: 'Whole green-moong dosa, ground after soaking and cooked without fermentation.' }, region: 'andhra', categories: ['breakfast'], diet: 'vegan', baseServings: 5, prepMinutes: 370, cookMinutes: 30,
    equipment: ['Seasoned tawa', 'Blender', 'Ladle', 'Flat spatula'], authorMethod: 'Dassana Amit — whole-moong, no-fermentation method; independently condensed and not kitchen-tested by Vantagallu.',
    ingredients: [customIngredient('whole-moong', 'Whole green moong', .5, 'cup'), customIngredient('rice', 'Rice', 2, 'tbsp'), customIngredient('ginger', 'Ginger', 1, 'inch'), customIngredient('green-chilli', 'Green chilli', 1, 'piece'), customIngredient('cumin', 'Cumin seeds', .5, 'tsp'), customIngredient('coriander', 'Chopped coriander', 2, 'tbsp'), customIngredient('salt', 'Salt', 1, 'to taste'), customIngredient('water', 'Water (blending)', .5, 'cup'), { ...customIngredient('onion', 'Finely chopped onion', .25, 'cup'), optional: true }, customIngredient('oil', 'Oil (tawa)', 1, 'as needed')],
    steps: [
      { id: 'soak', instruction: { en: 'Rinse moong and rice; soak four to six hours in ample clean water, then drain.' }, ingredientIds: ['whole-moong', 'rice'], heat: 'off', durationSeconds: 21600, checkpoint: { en: 'Moong is plump. This batter is used without fermentation.' } },
      { id: 'grind', instruction: { en: 'Blend with ginger, chilli, cumin, coriander and salt. Add water gradually to a smooth, spreadable batter.' }, ingredientIds: ['whole-moong', 'rice', 'ginger', 'green-chilli', 'cumin', 'coriander', 'salt', 'water'], heat: 'off', checkpoint: { en: 'The batter coats a ladle; add a spoonful of water if too thick.' } },
      { id: 'spread', instruction: { en: 'Heat a seasoned tawa. Reduce heat, pour a ladle of batter and spread outward; press in optional onion.' }, ingredientIds: ['oil', 'onion'], heat: 'low', checkpoint: { en: 'Use a thin film of oil on cast iron; follow nonstick cookware guidance.' } },
      { id: 'cook', instruction: { en: 'Drizzle a little oil, cook until the base releases, then turn and cook the onion side. Fold and serve.' }, ingredientIds: ['oil', 'onion'], heat: 'medium', durationSeconds: 180, checkpoint: { en: 'Both sides are cooked; no wet batter remains. Batch makes about ten small pesarattu.' } },
    ], sources: [{ name: 'Dassana’s Veg Recipes', author: 'Dassana Amit', url: 'https://www.vegrecipesofindia.com/moong-dal-dosa-pesarattu-a-cripsy-dosa-made-from-moong-dal/', note: 'Specific recipe and quantities inspected 2026-10-30; five portions count two small pesarattu each.' }, handlingSource], reviewStatus: 'needs-kitchen-test', aliases: ['moong dosa', 'green gram dosa', 'pesara attu', 'పెసరట్టు'], safetyNotes: [...standardSafety], substitutions: [{ ingredientId: 'whole-moong', alternative: 'Split yellow moong', note: 'A distinct softer variant; soak two to three hours. Change the plan before starting, because colour and texture differ.' }, { ingredientId: 'rice', alternative: 'Omit rice', note: 'The source allows this; expect less crisp edges. Do not compensate with extra cooking heat.' }],
  },
  {
    id: 'peanut-chutney', version: 1, title: { en: 'Palli chutney', te: 'పల్లీ చట్నీ' }, summary: { en: 'Roasted peanut, chana and sesame chutney without coconut.' }, region: 'south-indian', categories: ['chutney'], diet: 'vegan', baseServings: 4, prepMinutes: 10, cookMinutes: 15,
    equipment: ['Small frying pan', 'Blender', 'Slotted spoon'], authorMethod: 'Dassana Amit — roasted peanut and chana method; independently condensed, not kitchen-tested by Vantagallu.',
    ingredients: [customIngredient('peanuts', 'Raw peanuts', .5, 'cup'), customIngredient('chana', 'Chana dal', 2, 'tbsp'), customIngredient('chilli', 'Green chilli', 2, 'piece'), customIngredient('garlic', 'Garlic cloves', 2, 'piece'), customIngredient('sesame', 'White sesame', 1, 'tbsp'), customIngredient('curry-leaves', 'Curry leaves', 12, 'leaf'), customIngredient('oil', 'Neutral oil', 1, 'tbsp'), customIngredient('salt', 'Salt', .5, 'tsp'), customIngredient('water', 'Water (blending)', .75, 'cup')],
    steps: [
      { id: 'chana', instruction: { en: 'Fry chana dal slowly in oil until golden throughout; remove and reserve.' }, ingredientIds: ['chana', 'oil'], heat: 'low', durationSeconds: 240, checkpoint: { en: 'Dal is cooked and crisp, without a raw hard centre.' } },
      { id: 'peanuts', instruction: { en: 'Roast peanuts in the same pan, stirring, for about four to five minutes.' }, ingredientIds: ['peanuts', 'oil'], heat: 'low', durationSeconds: 300, checkpoint: { en: 'Peanuts taste cooked and nutty, not burnt or rancid.' } },
      { id: 'aromatics', instruction: { en: 'Add chilli, garlic and dry curry leaves; cook briefly. Add sesame near the end and turn off heat.' }, ingredientIds: ['chilli', 'garlic', 'curry-leaves', 'sesame'], heat: 'low', durationSeconds: 60, checkpoint: { en: 'Curry leaves crisp and sesame stays lightly coloured.' } },
      { id: 'blend', instruction: { en: 'Cool, then blend everything with salt and water added in portions. Serve or refrigerate promptly.' }, ingredientIds: ['chana', 'peanuts', 'chilli', 'garlic', 'curry-leaves', 'sesame', 'salt', 'water'], heat: 'off', checkpoint: { en: 'For thicker chutney, start with half a cup water; do not blend hot in a sealed jar.' } },
    ], sources: [{ name: 'Dassana’s Veg Recipes', author: 'Dassana Amit', url: 'https://www.vegrecipesofindia.com/peanut-chutney/', note: 'Inspected 2026-10-30. Two garlic cloves resolves the source ingredient line’s malformed “2 inches garlic cloves”.' }, handlingSource], reviewStatus: 'needs-kitchen-test', aliases: ['groundnut chutney', 'palli pachadi', 'పల్లీ పచ్చడి'], safetyNotes: [...standardSafety, 'Contains peanuts and sesame. A nut allergy requires a different recipe and cross-contact controls, not a casual swap.'], substitutions: [{ ingredientId: 'chana', alternative: 'Roasted chana dal, ¼ cup for this batch', note: 'Add it with sesame rather than frying raw chana. This is the source’s alternate method.' }, { ingredientId: 'garlic', alternative: '½ inch ginger', note: 'Changes the flavour; cook briefly with the chilli.' }],
  },
  {
    id: 'idli', version: 2, title: { en: 'Fermented rice idli', te: 'బియ్యం ఇడ్లీ' }, summary: { en: 'Rice-and-urad idli with separate grinding and overnight fermentation.' }, region: 'south-indian', categories: ['breakfast'], diet: 'vegan', baseServings: 8, prepMinutes: 1020, cookMinutes: 25,
    equipment: ['Dedicated steamer', 'Wet grinder or blender', 'Large fermentation bowl', 'Idli moulds'], authorMethod: 'Dassana Amit — 2 cups rice to ½ cup urad, separately ground; independently condensed and not kitchen-tested by Vantagallu.',
    ingredients: [customIngredient('rice', 'Idli rice or parboiled rice', 2, 'cup'), customIngredient('urad', 'Hulled urad dal', .5, 'cup'), customIngredient('poha', 'Thick poha', .25, 'cup'), customIngredient('fenugreek', 'Fenugreek seeds', .25, 'tsp'), customIngredient('salt', 'Salt', 1, 'tsp'), customIngredient('water', 'Clean water (soaking, grinding and steaming)', 1, 'as needed'), customIngredient('oil', 'Oil (moulds)', 1, 'as needed')],
    steps: [
      { id: 'soak', instruction: { en: 'Rinse rice and poha together, urad and fenugreek separately. Soak both groups four to five hours.' }, ingredientIds: ['rice', 'poha', 'urad', 'fenugreek', 'water'], heat: 'off', durationSeconds: 18000, checkpoint: { en: 'Use ample clean water; grains and dal soften before grinding.' } },
      { id: 'grind', instruction: { en: 'Grind urad fluffy with water added gradually. Grind rice and poha separately, then combine.' }, ingredientIds: ['rice', 'poha', 'urad', 'fenugreek', 'water'], heat: 'off', checkpoint: { en: 'Batter is thick and airy; pause the blender if it becomes hot.' } },
      { id: 'ferment', instruction: { en: 'Salt as appropriate for the climate; ferment loosely covered in a roomy bowl, checking from eight hours.' }, ingredientIds: ['salt'], heat: 'off', durationSeconds: 43200, checkpoint: { en: 'Batter rises with bubbles and a mild sour aroma. Refrigerate once fermented; discard mouldy or discoloured batter.' } },
      { id: 'steam', instruction: { en: 'Gently stir, fill oiled moulds and steam over simmering water for twelve to fifteen minutes.' }, ingredientIds: ['oil', 'water'], heat: 'medium', durationSeconds: 900, checkpoint: { en: 'Use a dedicated steamer. A skewer comes out clean; extend steaming if sticky.' } },
      { id: 'rest', instruction: { en: 'Rest two to three minutes, then lift the idlis with a spoon.' }, ingredientIds: [], heat: 'off', durationSeconds: 180, checkpoint: { en: 'Idlis are springy and fully set; the batch makes roughly twenty-four medium idlis.' } },
    ], sources: [{ name: 'Dassana’s Veg Recipes', author: 'Dassana Amit', url: 'https://www.vegrecipesofindia.com/idli-recipe-how-to-make-soft-idlis/', note: 'Specific rice:urad ratio and method inspected 2026-10-30. Eight portions at approximately three medium idlis each is an editorial yield estimate.' }, handlingSource], reviewStatus: 'needs-kitchen-test', aliases: ['idly', 'ఇడ్లి', 'ఇడ్లీ'], safetyNotes: [...standardSafety, 'Use cookware designed for steaming. Do not modify a pressure-cooker valve or open it while pressurized.'], substitutions: [{ ingredientId: 'poha', alternative: 'Omit poha', note: 'The source permits omission; expect a slightly different softness. Do not replace it with more water automatically.' }],
  },
]

export const recipeCatalog: Recipe[] = [...coreRecipes, ...sourcedRecipes]
export const recipes = recipeCatalog
export const getRecipeById = (id: string): Recipe | undefined => recipeCatalog.find(recipe => recipe.id === id)
