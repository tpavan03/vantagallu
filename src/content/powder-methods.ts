import type { Recipe, RecipeIngredient, RecipeStep, Heat } from '../domain/types.ts'
import { spiceMeasure } from '../domain/measures.ts'

// Explicit household methods, not a mechanical seeds-to-powder conversion.
// Original published recipes stay untouched; the catalogue applies one version
// increment to each changed cooking plan so saved sessions retain their method.
type Ingredient = [string, string, number, string, boolean?]
type Stage = [string, Heat, string, string, string[], number?]
type Method = { publisher: string; author?: string; url: string; title?: Recipe['title']; summary: string; method: string; servings: number; prep: number; cook: number; ingredients: Ingredient[]; stages: Stage[]; note: string; equipment?: string[]; diet?: Recipe['diet']; region?: Recipe['region'] }
const makeIngredient = ([id, name, quantity, unit, optional]: Ingredient): RecipeIngredient => ({
  id, name: { en: name }, quantity, unit, ...(optional ? { optional: true } : {}),
  scaling: /\bwater\b|\boil\b|stock|milk/i.test(name) || unit === 'as needed' ? 'method-dependent' : /salt|chilli|pepper|masala/i.test(name) || unit === 'to taste' ? 'to-taste' : 'linear',
  allergens: [/cashew/i.test(name) && 'cashew', /sesame/i.test(name) && 'sesame', /peanut/i.test(name) && 'peanut', /yogurt|curd|ghee/i.test(name) && 'milk', /egg/i.test(name) && 'egg', /fish/i.test(name) && 'fish'].filter(Boolean) as string[],
})
const makeStep = ([id, heat, instruction, checkpoint, ingredientIds, durationSeconds]: Stage): RecipeStep => ({ id, heat, instruction: { en: instruction }, checkpoint: { en: checkpoint }, ingredientIds, ...(durationSeconds ? { durationSeconds } : {}) })
const powderNote = 'Checked 2026-10-30. Ready-powder household method, independently summarized; teaspoon measures are level measuring spoons. Begin with the lower published spice range and adjust only after tasting safely. This is not the previous freshly ground source variant.'

const methods: Record<string, Method> = {
  'chicken-curry': {
    publisher: 'Swasthi’s Recipes', author: 'Swasthi Shreekanth', url: 'https://www.indianhealthyrecipes.com/chicken-curry/',
    title: { en: 'Chicken curry · everyday powders', te: 'చికెన్ కూర' },
    summary: 'Everyday onion-tomato chicken curry with measured coriander and ready garam masala powders.',
    method: 'Swasthi Shreekanth — simple ready-powder home curry; optional whole aromatics omitted. Independently summarized and not kitchen-tested by Vantagallu.',
    servings: 3, prep: 15, cook: 35, equipment: ['Heavy kadai with lid', 'Measuring spoons', 'Food thermometer'],
    ingredients: [['chicken', 'Chicken', 500, 'g'], ['oil', 'Oil', 2, 'tbsp'], ['onion', 'Finely chopped onion', 1, 'cup'], ['green-chilli', 'Green chilli', 1, 'piece'], ['ginger-garlic', 'Ginger garlic paste', 1, 'tbsp'], ['tomato', 'Chopped tomato', .5, 'cup'], ['turmeric', 'Turmeric powder', .25, 'tsp'], ['salt', 'Salt (starting amount; adjust)', .5, 'tsp'], ['red-chilli', 'Red chilli powder', 1, 'tsp'], ['yogurt', 'Plain yogurt', .25, 'cup'], ['garam-masala', 'Garam masala powder', 1, 'tsp'], ['coriander-powder', 'Coriander powder', 1, 'tsp'], ['coriander-leaves', 'Chopped coriander leaves', 2, 'tbsp'], ['water', 'Hot water (add gradually)', .5, 'cup'], ['curry-leaves', 'Curry leaves', 1, 'sprig']],
    stages: [
      ['onion', 'medium', 'Heat oil; soften curry leaves, onion and green chilli until onion is golden. Stir in ginger-garlic.', 'Onion is evenly golden; ginger-garlic loses its raw smell without burning.', ['oil', 'onion', 'green-chilli', 'curry-leaves', 'ginger-garlic'], 600],
      ['base', 'low', 'Soften tomato with turmeric and salt. Lower heat; stir in chilli powder and whisked yogurt.', 'The tomato breaks down; the thick masala smells cooked, not raw or scorched.', ['tomato', 'turmeric', 'salt', 'red-chilli', 'yogurt'], 300],
      ['chicken', 'medium', 'Coat chicken with the masala and the measured garam masala and coriander powders shown for your selected servings. Stir for three to four minutes.', 'The powders coat the moist masala; they are not dry-roasted in an empty pan.', ['chicken', 'garam-masala', 'coriander-powder'], 240],
      ['simmer', 'low', 'Cover briefly, then add hot water in portions. Simmer gently until the chicken is cooked through.', 'Check the thickest chicken reaches 74°C; extend cooking as needed rather than relying on the timer.', ['water', 'chicken'], 900],
      ['finish', 'off', 'Check seasoning and gravy thickness. Finish with chopped coriander and serve.', 'Taste only after chicken is safely cooked; increase spice in small measured additions.', ['salt', 'coriander-leaves']],
    ], note: `${powderNote} The publisher permits chicken masala in place of garam masala, but blends differ; compare packet dose, salt and chilli before choosing it. Do not add both as a full duplicate dose.`,
  },
  'pepper-chicken': {
    publisher: 'Swasthi’s Recipes', author: 'Swasthi Shreekanth', url: 'https://www.indianhealthyrecipes.com/pepper-chicken-recipe/',
    summary: 'Pepper chicken with ready garam masala and coarse ground pepper; no fresh spice-masala grinding.',
    method: 'Swasthi Shreekanth — no-grind pepper-chicken household variant, with optional whole aromatics omitted; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 4, prep: 15, cook: 25, equipment: ['Heavy kadai with lid', 'Measuring spoons', 'Food thermometer'],
    ingredients: [['chicken', 'Chicken', 500, 'g'], ['ginger-garlic-marinade', 'Ginger garlic paste (marinade)', .75, 'tsp'], ['turmeric', 'Turmeric powder', .125, 'tsp'], ['salt', 'Salt', 1, 'to taste'], ['oil', 'Oil', 2, 'tbsp'], ['onion', 'Finely chopped onion', 1, 'cup'], ['ginger-garlic-pan', 'Ginger garlic paste (pan)', .75, 'tsp'], ['tomato', 'Finely chopped tomato', 1, 'cup'], ['pepper', 'Coarse black pepper powder', 1, 'tsp'], ['red-chilli', 'Red chilli powder', .25, 'tsp'], ['garam-masala', 'Garam masala powder', .75, 'tsp'], ['curry-leaves', 'Curry leaves', 1, 'sprig'], ['cumin', 'Cumin seeds (tempering)', .5, 'tsp'], ['water', 'Water (only if pan dries)', 1, 'as needed']],
    stages: [
      ['prepare', 'off', 'Coat chicken with marinade ginger-garlic, turmeric and a little salt. Keep refrigerated while preparing the pan.', 'Ground pepper and ready garam masala replace a freshly roasted spice blend.', ['chicken', 'ginger-garlic-marinade', 'turmeric', 'salt']],
      ['onion', 'medium', 'Crackle cumin and curry leaves in oil. Cook pan ginger-garlic and onion until lightly golden.', 'Keep garlic fragrant rather than black or bitter.', ['oil', 'cumin', 'curry-leaves', 'ginger-garlic-pan', 'onion'], 420],
      ['masala', 'medium', 'Soften tomato, then add the measured coarse pepper, chilli powder and garam masala shown for your selected servings.', 'Stir the powders into the moist tomato until aromatic; lower heat if the pan catches.', ['tomato', 'pepper', 'red-chilli', 'garam-masala'], 240],
      ['cook', 'low', 'Add chicken, stir well and cover. Cook in its released juices; add a small splash of water only if necessary.', 'Check the thickest chicken reaches 74°C. The source timing alone does not prove doneness.', ['chicken', 'water'], 1200],
      ['reduce', 'medium', 'Uncover and stir gently until the masala coats the chicken. Check salt and serve.', 'Stop before the pepper masala scorches; extra heat is optional, not automatic.', ['salt']],
    ], note: `${powderNote} Selected the publisher’s ready-garam-masala route, not the optional Chettinad spice-grinding route. Coarse pepper keeps the intended pepper flavour.`,
  },
  'gongura-mutton': {
    publisher: 'Cookd', url: 'https://www.cookdtv.com/recipes/gongura-mutton',
    summary: 'Cookd’s gongura-and-spinach mutton variant with ready coriander, cumin and garam masala powders.',
    method: 'Cookd — gongura-and-spinach household variant with measured ready powders; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 4, prep: 20, cook: 60, equipment: ['Pressure cooker', 'Small frying pan', 'Blender'],
    ingredients: [['mutton', 'Mutton', 500, 'g'], ['gongura', 'Gongura leaves', 3, 'cup'], ['spinach', 'Spinach leaves', 1, 'cup'], ['onion', 'Chopped onion', 1, 'cup'], ['tomato', 'Chopped tomato', .5, 'cup'], ['green-chilli', 'Green chillies', 3, 'piece'], ['ginger-garlic', 'Ginger garlic paste', 1, 'tbsp'], ['red-chilli', 'Red chilli powder', 3, 'tsp'], ['coriander-powder', 'Coriander powder', 1, 'tsp'], ['cumin-powder', 'Cumin powder', .5, 'tsp'], ['turmeric', 'Turmeric powder', .5, 'tsp'], ['garam-masala', 'Garam masala powder', .75, 'tsp'], ['water', 'Water (check cooker minimum)', 1, 'cup'], ['salt', 'Salt (starting amount; adjust)', 1.25, 'tsp'], ['oil', 'Oil (mutton cooking)', 3, 'tbsp'], ['oil-greens', 'Oil (greens cooking)', 2, 'tsp'], ['cloves', 'Cloves (tempering)', 4, 'piece'], ['cinnamon', 'Cinnamon (tempering)', 2, 'inch'], ['fennel', 'Fennel seeds (tempering)', .5, 'tsp'], ['ghee', 'Ghee (finish)', 1, 'tbsp'], ['coriander-leaves', 'Chopped coriander', 3, 'tbsp'], ['sugar', 'Sugar (optional balance)', .5, 'tsp', true]],
    stages: [
      ['greens', 'medium', 'Wash and cook gongura and spinach in their measured oil until wilted. Cool, then blend the fresh leaves into a paste.', 'This is a leaf paste, not a freshly ground spice masala. Keep it aside.', ['gongura', 'spinach', 'oil-greens']],
      ['onion', 'medium', 'Heat oil; briefly temper cloves, cinnamon and fennel. Brown onion and green chilli, then cook ginger-garlic.', 'Onion is golden and ginger-garlic fragrant, without blackened spices.', ['oil', 'cloves', 'cinnamon', 'fennel', 'onion', 'green-chilli', 'ginger-garlic'], 480],
      ['powders', 'low', 'Soften tomato; stir in chilli, coriander, cumin and turmeric powders. Add mutton and salt; coat well.', 'Keep the base moist so powdered spices do not burn.', ['tomato', 'red-chilli', 'coriander-powder', 'cumin-powder', 'turmeric', 'mutton', 'salt'], 300],
      ['tender', 'medium', 'Add water, meeting the cooker’s minimum-liquid requirement. Pressure-cook according to its mutton guidance until tender.', 'Allow full natural depressurization before opening; do not use a universal whistle count.', ['water', 'mutton']],
      ['finish', 'low', 'Fold in the cooked leaf paste and measured garam masala. Simmer; finish with ghee, coriander and optional sugar after checking seasoning.', 'The mutton is tender and the greens are cooked through; extend gently if needed.', ['gongura', 'spinach', 'garam-masala', 'salt', 'ghee', 'coriander-leaves', 'sugar'], 300],
    ], note: `${powderNote} This is Cookd’s published spinach-containing variant, not Vismai’s original Guntur roasted-spice version. Cooker timing is appliance-dependent.`,
  },
  'fish-pulusu': {
    publisher: 'Swasthi’s Recipes', author: 'Swasthi Shreekanth', url: 'https://www.indianhealthyrecipes.com/fish-pulusu-south-indian-fish-curry-recipe/',
    summary: 'Swasthi’s mild-garam-masala family pulusu, with tamarind and the no-grind coconut-milk option.',
    method: 'Swasthi Shreekanth — family fish-pulusu variant with ready garam masala and coconut milk; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 4, prep: 15, cook: 25, equipment: ['Wide heavy pan with lid', 'Strainer', 'Measuring spoons'],
    ingredients: [['fish', 'Firm fish pieces', 1, 'kg'], ['chilli-marinade', 'Red chilli powder (marinade)', .5, 'tsp'], ['turmeric', 'Turmeric powder', .25, 'tsp'], ['salt-marinade', 'Salt (marinade)', 1 / 3, 'tsp'], ['lemon', 'Lemon juice', 1, 'tbsp'], ['curry-leaves', 'Curry leaves', 1, 'sprig'], ['onion', 'Finely chopped onion', 1, 'cup'], ['green-chilli', 'Green chillies', 2, 'piece'], ['ginger-garlic', 'Ginger garlic paste', 1, 'tbsp'], ['coriander-leaves', 'Coriander leaves with tender stems', 8, 'stalk'], ['oil', 'Oil', 4, 'tbsp'], ['chilli-gravy', 'Red chilli powder (gravy)', .5, 'tsp'], ['garam-masala', 'Mild garam masala powder', 2, 'tsp'], ['tamarind', 'Tamarind', 2, 'tbsp'], ['water-tamarind', 'Hot water (tamarind)', .75, 'cup'], ['coconut-milk', 'Coconut milk', .5, 'cup'], ['cumin', 'Cumin seeds (tempering)', .5, 'tsp'], ['water-gravy', 'Water (add only as needed)', 1, 'as needed'], ['salt-gravy', 'Salt (gravy; adjust)', .5, 'tsp']],
    stages: [
      ['prepare', 'off', 'Coat fish with marinade chilli, turmeric, salt and lemon; refrigerate briefly. Soften tamarind in hot water and strain.', 'Use the measured coconut-milk option; no nut or spice grinding is required.', ['fish', 'chilli-marinade', 'turmeric', 'salt-marinade', 'lemon', 'tamarind', 'water-tamarind']],
      ['onion', 'medium', 'Crackle cumin in oil; add curry leaves, green chilli and onion. Brown lightly, then cook ginger-garlic.', 'Keep the onion golden and the garlic fragrant, without blackening.', ['cumin', 'oil', 'curry-leaves', 'green-chilli', 'onion', 'ginger-garlic'], 420],
      ['fish', 'medium', 'Place fish in the wide pan; turn carefully after about three minutes. Sprinkle gravy chilli, garam masala and salt.', 'Avoid stirring or crowding delicate fish pieces.', ['fish', 'chilli-gravy', 'garam-masala', 'salt-gravy'], 360],
      ['simmer', 'low', 'Pour in tamarind extract and only enough water to partly cover the fish. Simmer gently, swirling the pan.', 'Fish reaches 63°C and flakes easily; extend gently if still undercooked.', ['tamarind', 'water-gravy', 'fish'], 300],
      ['finish', 'low', 'Add coconut milk and warm through until bubbling gently. Check seasoning and finish with coriander.', 'This is the publisher’s family garam-masala variant, not a claim to reproduce every regional pulusu.', ['coconut-milk', 'coriander-leaves', 'salt-gravy']],
    ], note: `${powderNote} Used the author’s explicit coconut-milk alternative and omitted optional whole aromatics. Mild garam masala defines this family variant; it is not the previous freshly ground Vismai fish-masala method.`,
  },
  'telangana-egg-curry': {
    publisher: 'Swasthi’s Recipes', author: 'Swasthi Shreekanth', url: 'https://www.indianhealthyrecipes.com/spicy-andhra-egg-curry-south-indian-egg-recipes/',
    title: { en: 'South Indian egg curry', te: 'దక్షిణ భారత గుడ్డు కూర' }, region: 'andhra',
    summary: 'Everyday South Indian egg curry with ready coriander and garam masala powders; optional coconut milk.',
    method: 'Swasthi Shreekanth — South Indian ready-powder household egg curry; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 3, prep: 15, cook: 20, equipment: ['Heavy frying pan', 'Measuring spoons', 'Small egg-boiling pot'],
    ingredients: [['eggs', 'Hard-boiled eggs', 4, 'piece'], ['oil', 'Oil', 2, 'tbsp'], ['mustard', 'Mustard seeds (tempering)', .25, 'tsp', true], ['cumin', 'Cumin seeds (tempering)', .5, 'tsp'], ['curry-leaves', 'Curry leaves', 1, 'sprig'], ['onion', 'Finely chopped onion', 1, 'cup'], ['green-chilli', 'Green chilli', 1, 'piece'], ['ginger-garlic', 'Ginger garlic paste', 1.25, 'tsp'], ['tomato', 'Finely chopped tomatoes', 2, 'piece'], ['turmeric', 'Turmeric powder', .125, 'tsp'], ['red-chilli', 'Red chilli powder', .75, 'tsp'], ['garam-masala', 'Garam masala powder', .75, 'tsp'], ['coriander-powder', 'Coriander powder', 1, 'tsp'], ['salt', 'Salt (starting amount; adjust)', .5, 'tsp'], ['water', 'Water (gravy; adjust)', .75, 'cup'], ['coriander-leaves', 'Chopped coriander', 3, 'tbsp'], ['coconut-milk', 'Thick coconut milk', .25, 'cup', true]],
    stages: [
      ['eggs', 'off', 'Peel fully boiled eggs and make shallow slits. Measure the spice powders and chop the vegetables.', 'Whites and yolks are set; keep prepared eggs chilled if the pan is not ready.', ['eggs']],
      ['onion', 'medium', 'Temper cumin, optional mustard and curry leaves in oil. Brown onion and green chilli; briefly cook ginger-garlic.', 'Onions are golden; no raw garlic smell remains.', ['oil', 'cumin', 'mustard', 'curry-leaves', 'onion', 'green-chilli', 'ginger-garlic'], 420],
      ['masala', 'low', 'Cook tomato until pulpy. Stir in measured chilli, turmeric, garam masala, coriander powder and salt.', 'Use the chopped-tomato option; no masala grinding is needed.', ['tomato', 'red-chilli', 'turmeric', 'garam-masala', 'coriander-powder', 'salt'], 300],
      ['simmer', 'low', 'Gently coat eggs in the masala; add water and simmer until the gravy thickens.', 'Keep eggs intact and the curry thoroughly hot; check salt before adding more.', ['eggs', 'water', 'salt'], 300],
      ['finish', 'low', 'If using coconut milk, warm it through gently. Finish with chopped coriander.', 'The source’s coconut-milk option replaces the optional nut-purée route.', ['coconut-milk', 'coriander-leaves']],
    ], note: `${powderNote} Three portions is within the source’s two-to-three serving yield. The stable recipe ID retains compatibility, but the title now accurately identifies this South Indian method rather than the previous Telangana roasted-nut gravy.`,
  },
  'gutti-vankaya': {
    publisher: 'Sailu’s Food', author: 'Sailu', url: 'https://www.sailusfood.com/gutti-vankaya-kura-stuffed-egg-plant-brinjal-curry',
    summary: 'Sailu’s Andhra brinjals stuffed with onion-garlic paste and measured coriander, cumin and chilli powders.',
    method: 'Sailu — onion-garlic stuffing with ready spice powders, cooked in a covered pan; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 5, prep: 20, cook: 60, diet: 'vegetarian', equipment: ['Wide heavy pan with lid', 'Small frying pan', 'Blender'],
    ingredients: [['brinjal', 'Small tender brinjals', 10, 'piece'], ['onion', 'Onions', 2, 'piece'], ['garlic', 'Garlic cloves', 6, 'piece'], ['oil-stuffing', 'Oil (onion stuffing)', .5, 'tbsp'], ['oil-cooking', 'Oil (brinjal cooking)', 1.5, 'tbsp'], ['coriander-powder', 'Coriander powder', 1, 'tsp'], ['cumin-powder', 'Cumin powder', .5, 'tsp'], ['red-chilli', 'Red chilli powder', 1, 'tsp'], ['turmeric', 'Turmeric powder', 1 / 3, 'tsp'], ['ghee', 'Ghee', 1, 'tbsp'], ['salt', 'Salt', 1, 'to taste'], ['tamarind', 'Thick tamarind extract', 2, 'tbsp'], ['cumin', 'Cumin seeds (tempering)', 1, 'tsp'], ['fenugreek', 'Fenugreek seeds (tempering)', 1, 'large pinch'], ['curry-leaves', 'Curry leaves', 12, 'leaf'], ['jaggery', 'Grated jaggery', .5, 'tbsp', true], ['water', 'Water (initial cooking and finishing; adjust)', 1.25, 'cup']],
    stages: [
      ['stuffing-base', 'medium', 'Cook sliced onion and garlic in the stuffing oil until softened. Cool before blending to a paste.', 'This is fresh onion-garlic paste; the masalas are already measured powders.', ['onion', 'garlic', 'oil-stuffing'], 300],
      ['stuff', 'off', 'Mix the paste with coriander, cumin, chilli, turmeric, salt and ghee. Cross-slit brinjals and fill gently.', 'Keep the stalk attached and the brinjal in one piece; reserve extra stuffing.', ['brinjal', 'coriander-powder', 'cumin-powder', 'red-chilli', 'turmeric', 'salt', 'ghee']],
      ['temper', 'medium', 'Temper cumin, a large pinch of fenugreek and curry leaves in the remaining oil. Add stuffed brinjals.', 'Seeds are fragrant, not blackened; lower the heat before brinjals scorch.', ['oil-cooking', 'cumin', 'fenugreek', 'curry-leaves', 'brinjal']],
      ['cook', 'low', 'Add reserved stuffing and a little of the measured water; cover and cook gently, turning carefully until tender.', 'A knife enters the brinjal easily. Add water if the base catches; vessel and brinjal size change timing.', ['water', 'brinjal'], 2700],
      ['finish', 'low', 'Stir in tamarind extract, remaining water and optional jaggery; simmer until the stuffing coats the brinjals.', 'Check salt and sourness after the brinjal is tender; keep pieces intact.', ['tamarind', 'water', 'jaggery', 'salt'], 600],
    ], note: `${powderNote} Selected the publisher’s onion-garlic stuffing family variant, not the previous peanut-coconut stuffing. Ten small brinjals is the lower end of the source’s 10–12; tenderness overrides its shorter headline cooking time. Contains milk from ghee.`,
  },
  'drumstick-sambar': {
    publisher: 'Dassana’s Veg Recipes', author: 'Dassana Amit', url: 'https://www.vegrecipesofindia.com/drumstick-sambar-recipe/',
    summary: 'Drumstick sambar using ready sambar powder, soft toor dal, shallots and tamarind.',
    method: 'Dassana Amit — ready-sambar-powder drumstick method; independently summarized and not kitchen-tested by Vantagallu.',
    servings: 4, prep: 20, cook: 35, equipment: ['Dal-cooking pot or pressure cooker', 'Saucepan', 'Small tempering pan'],
    ingredients: [['toor-dal', 'Toor dal', 1 / 3, 'cup'], ['turmeric-dal', 'Turmeric powder (dal)', .25, 'tsp'], ['water-dal', 'Water (dal; check cooker minimum)', 1.5, 'cup'], ['tamarind', 'Tamarind', .5, 'tbsp'], ['water-tamarind', 'Hot water (tamarind)', .25, 'cup'], ['onion', 'Chopped small onions', 1 / 3, 'cup'], ['tomato', 'Chopped tomato', 1 / 3, 'cup'], ['drumstick', 'Drumsticks, cut into short lengths', 175, 'g'], ['turmeric-gravy', 'Turmeric powder (gravy)', 1, 'pinch'], ['sambar-powder', 'Sambar powder', 4.5, 'tsp'], ['water-gravy', 'Water (gravy; adjust)', 1, 'cup'], ['salt', 'Salt', 1, 'to taste'], ['oil-cooking', 'Oil (vegetables)', 1, 'tbsp'], ['oil-tempering', 'Oil (tempering)', 1, 'tbsp'], ['mustard', 'Mustard seeds', .5, 'tsp'], ['red-chilli', 'Dried red chilli (tempering)', 1, 'piece'], ['fenugreek', 'Fenugreek seeds (tempering)', 5, 'seed'], ['curry-leaves', 'Curry leaves', 10, 'leaf'], ['coriander-leaves', 'Chopped coriander', 1, 'tbsp', true]],
    stages: [
      ['dal', 'medium', 'Rinse toor dal; cook with dal turmeric and water until completely soft. Mash after safe pressure release if using a cooker.', 'Use the appliance’s minimum liquid and natural release; soft dal should mash easily.', ['toor-dal', 'turmeric-dal', 'water-dal']],
      ['tamarind', 'off', 'Soften tamarind in its hot water, then squeeze and strain the extract.', 'Discard fibres and seeds; keep the clean extract aside.', ['tamarind', 'water-tamarind']],
      ['vegetables', 'medium', 'Soften onions in cooking oil. Add tomato, drumstick, gravy turmeric, salt and gravy water; cook covered until tender.', 'The drumstick flesh yields when pressed; cook vegetables before adding sour tamarind.', ['onion', 'oil-cooking', 'tomato', 'drumstick', 'turmeric-gravy', 'salt', 'water-gravy'], 900],
      ['powder', 'low', 'Add tamarind extract and simmer briefly. Stir in the measured ready sambar powder shown for your selected servings and the mashed dal; simmer together.', 'The powder disperses without lumps. Add water gradually if too thick; adjust spice only after tasting safely.', ['tamarind', 'sambar-powder', 'toor-dal', 'water-gravy'], 480],
      ['temper', 'low', 'Crackle mustard in tempering oil; briefly fry dried chilli, fenugreek and dry curry leaves. Pour over sambar; add optional coriander.', 'Stop before fenugreek turns black or bitter. No fresh spice-masala grinding is needed.', ['oil-tempering', 'mustard', 'red-chilli', 'fenugreek', 'curry-leaves', 'coriander-leaves']],
    ], note: `${powderNote} The recipe card uses 1½–2 tbsp ready sambar powder, displayed as 4½–6 tsp; selected the lower amount. Do not also make the page’s optional homemade powder appendix.`,
  },
}

export const powderMethodIds = Object.keys(methods)

export function applyPowderMethod(original: Recipe): Recipe {
  const method = methods[original.id]
  let updated: Recipe = method ? {
    ...original, ...(method.title ? { title: method.title } : {}), ...(method.diet ? { diet: method.diet } : {}), ...(method.region ? { region: method.region } : {}),
    summary: { en: method.summary }, authorMethod: method.method, baseServings: method.servings, prepMinutes: method.prep, cookMinutes: method.cook,
    equipment: method.equipment || original.equipment,
    ingredients: method.ingredients.map(makeIngredient), steps: method.stages.map(makeStep), substitutions: [],
    sources: [{ name: method.publisher, ...(method.author ? { author: method.author } : {}), url: method.url, note: method.note }, ...original.sources.filter(source => !/vismaifood|indianhealthyrecipes|vegrecipesofindia/i.test(source.url))],
  } : original
  let editorial = false
  if (original.id === 'paramannam') {
    const pods = 'cardamom-pods-optional-powder-also-listed-7'
    updated = { ...updated, ingredients: updated.ingredients.filter(item => item.id !== pods), steps: updated.steps.map(step => ({ ...step, ingredientIds: step.ingredientIds.filter(id => id !== pods), ...(step.id === 'step-4' ? { instruction: { en: 'Fry cashews and raisins in ghee; finish with the measured cardamom powder.' } } : {}) })) }
    editorial = true
  }
  let converted = false
  let clarifiedPinch = false
  const ingredients = updated.ingredients.map(item => {
    if (['ridge-gourd-egg', 'mango-pulissery'].includes(original.id) && /a pinch/i.test(item.name.en) && item.unit === 'to taste') {
      clarifiedPinch = true
      return { ...item, name: { ...item.name, en: item.name.en.replace(/\s*[–-]?\s*a pinch/i, '').trim() }, quantity: 1, unit: 'pinch' }
    }
    const measure = spiceMeasure(item.name.en, item.quantity, item.unit)
    if (measure.quantity === item.quantity && measure.unit === item.unit) return item
    converted = true
    return { ...item, ...measure }
  })
  if (!method && !converted && !editorial && !clarifiedPinch) return original
  updated = { ...updated, ingredients, version: original.version + 1 }
  if (converted) updated.sources = updated.sources.map((source, index) => index ? source : { ...source, note: `${source.note || 'Checked 2026-10-30.'} Ground-spice volumes displayed in tsp using 1 tbsp = 3 tsp and 1 cup = 48 tsp; no mass or whole-seed conversion.` })
  if (editorial || clarifiedPinch) updated.sources = updated.sources.map((source, index) => index ? source : { ...source, note: `${source.note || 'Checked 2026-10-30.'} ${editorial ? 'Selected the listed cardamom-powder option and removed duplicate optional pods.' : 'Source’s literal pinch is shown as one pinch, not an invented teaspoon amount.'}` })
  return updated
}

export const chickenSherva: Recipe = {
  id: 'chicken-sherva', version: 1, title: { en: 'Chicken sherva', te: 'చికెన్ షేర్వా' }, summary: { en: 'Vismai’s chicken salna with coriander powder and a measured chicken-masala finish; prepared-stock shortcut.' },
  region: 'telangana', categories: ['curry'], diet: 'non-vegetarian', baseServings: 6, prepMinutes: 20, cookMinutes: 40,
  equipment: ['Heavy kadai with lid', 'Blender', 'Measuring spoons'],
  authorMethod: 'Vismai Food — ready-stock salna shortcut with 1 tsp chicken masala powder for 350 g chicken; independently summarized and not kitchen-tested by Vantagallu.',
  ingredients: [
    ['chicken', 'Chicken', 350, 'g'], ['stock', 'Prepared unsalted chicken stock (add gradually)', 1.25, 'litre'], ['peanuts', 'Peanuts', .25, 'cup'], ['poppy', 'Poppy seeds', 1, 'tbsp'], ['coconut', 'Fresh coconut pieces', .5, 'cup'], ['oil', 'Oil', 4, 'tbsp'], ['fennel', 'Fennel seeds (tempering)', 1, 'tsp'], ['star-anise', 'Star anise (tempering)', 1, 'piece'], ['cardamom', 'Cardamom (tempering)', 3, 'piece'], ['cloves', 'Cloves (tempering)', 4, 'piece'], ['cinnamon', 'Cinnamon (tempering)', 1, 'inch'], ['bay-leaf', 'Bay leaf', 1, 'piece'], ['onion', 'Finely chopped onion', 1.5, 'cup'], ['salt', 'Salt', 1, 'to taste'], ['ginger-garlic', 'Ginger garlic paste', 2, 'tbsp'], ['tomato', 'Tomatoes', 2, 'piece'], ['green-chilli', 'Green chillies', 2, 'piece'], ['turmeric', 'Turmeric powder', .25, 'tsp'], ['coriander-powder', 'Coriander powder', 3.75, 'tsp'], ['red-chilli', 'Red chilli powder', 2.25, 'tsp'], ['chicken-masala', 'Chicken masala powder', 1, 'tsp'], ['mint', 'Mint leaves', 10, 'leaf'], ['coriander-leaves', 'Chopped coriander', 2, 'tbsp'], ['water-paste', 'Water (nut paste; adjust)', 4, 'tbsp'],
  ].map(row => makeIngredient(row as Ingredient)),
  steps: [
    ['nuts', 'low', 'Roast peanuts thoroughly, adding poppy seeds near the end. Cool; blend with coconut and a little water.', 'The nuts are cooked through; cool before blending. This paste thickens the salna.', ['peanuts', 'poppy', 'coconut', 'water-paste'], 300],
    ['onion', 'medium', 'Temper the whole aromatics and fennel in oil. Brown onion with a little salt, then fry ginger-garlic briefly.', 'Whole spices here infuse the tempering; the curry’s measured masalas are already powders.', ['oil', 'fennel', 'star-anise', 'cardamom', 'cloves', 'cinnamon', 'bay-leaf', 'onion', 'salt', 'ginger-garlic'], 480],
    ['chicken', 'medium', 'Add chicken; stir well. Soften tomato and green chilli, then stir in turmeric, coriander and chilli powders.', 'Keep powdered spices in the moist base, not in scorching dry oil.', ['chicken', 'tomato', 'green-chilli', 'turmeric', 'coriander-powder', 'red-chilli'], 300],
    ['simmer', 'low', 'Add prepared stock in portions and simmer. Stir in the nut-coconut paste and mint; keep the gravy loose.', 'Add only enough stock for the salna consistency; check the thickest chicken reaches 74°C.', ['stock', 'peanuts', 'poppy', 'coconut', 'mint'], 900],
    ['finish', 'low', 'Stir in the measured chicken masala powder shown for your selected servings, simmer about five minutes, then finish with coriander.', 'Check the blend’s salt and chilli before adding more. Do not add a second full garam-masala dose.', ['chicken-masala', 'salt', 'coriander-leaves'], 300],
  ].map(row => makeStep(row as Stage)),
  sources: [{ name: 'Vismai Food', url: 'https://vismaifood.com/en/chicken-sherva-chicken-salna-best-dosa-chapathi-and-rice-how-make-chicken-shorva', note: 'Checked 2026-10-30. Source explicitly uses 1 tsp chicken masala for 350 g chicken and allows a prepared-stock shortcut. Coriander 1¼ tbsp = 3¾ tsp; chilli 2¼ tsp. Stock added gradually; timing is not proof of safe doneness.' }, { name: 'FoodSafety.gov — safe cooking temperatures', url: 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures' }],
  reviewStatus: 'needs-kitchen-test', aliases: ['chicken salna', 'chicken shorba', 'chicken shorva', 'చికెన్ సాల్నా'],
  safetyNotes: ['Keep raw chicken chilled and separate from ready-to-eat food. The thickest chicken must reach 74°C.', 'Refrigerate perishable food within two hours (one hour above 32°C); reheat leftovers thoroughly.', 'Contains peanuts and coconut. Check chicken-masala and stock labels for salt and allergens.'],
}
