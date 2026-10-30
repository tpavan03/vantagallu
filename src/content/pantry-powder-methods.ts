import type { Recipe, RecipeIngredient, RecipeStep } from '../domain/types.ts'
import { isSpicePowder } from '../domain/measures.ts'

const grindingSource = {
  name: 'McCormick Kitchens — published spice grinding yields',
  url: 'https://www.mccormick.com/blogs/how-to/how-to-grind-your-own-spices-plus-spice-conversions-for-your-favorite-seasonings',
  note: 'Checked 2026-10-30. Approximate grinding-yield guidance for individual pure spices; not a guarantee of equal flavour from every brand, not a spice-blend dose and not a mass-to-volume conversion. Ready powders are added to a moist base rather than roasted like whole seeds.',
}
const fenugreekSource = { name: 'Spiceitupp / Sunrita — ground fenugreek substitution', url: 'https://spiceitupp.com/substitute-for-fenugreek-seeds/', note: 'Checked 2026-10-30. The author gives half as much ground fenugreek by volume as seeds. This applies to seed powder, not dried fenugreek leaves; taste and bitterness vary.' }
type Powder = [string, string, number, string?]
type Edit = { powders?: Powder[]; remove?: string[]; instructions?: Record<string, string>; stepAdds?: Record<string, string[]>; notes: string; extraSource?: Recipe['sources'][number] }

// This second release is deliberately applied AFTER the first seven published
// powder methods. Each affected record advances from its live f1715 version.
const edits: Record<string, Edit> = {
  pesarattu: { powders: [['cumin', 'Cumin powder', .625]], instructions: { grind: 'Blend drained moong and rice with ginger, green chilli, coriander and salt. Stir in the measured ready cumin powder; add water gradually to a spreadable batter.' }, notes: 'Only the dry cumin is supplied ready-ground; the moong batter and fresh herbs still require blending.' },
  'tomato-sesame-chutney': {
    powders: [['fenugreek-seeds-5', 'Fenugreek powder', .375], ['coriander-seeds-6', 'Coriander powder', 3.75], ['cumin-seeds-7', 'Cumin powder', 1.25]],
    instructions: { 'step-1': 'Toast sesame gently on its own, then cool. Measure the ready coriander, cumin and fenugreek powders; do not dry-roast these powders.', 'step-2': 'Use the larger oil portion to soften green chillies and chopped tomatoes. Lower heat; stir the ready spice powders into this moist base and cook briefly until fragrant.', 'step-3': 'Cool the cooked tomato-spice base; blend with toasted sesame, garlic and salt.', 'step-4': 'Heat the smaller oil portion; crackle whole mustard, tempering cumin and curry leaves. Fold into the chutney.' },
    notes: 'Sesame remains the nutty body of this chutney. Fenugreek uses the referenced author’s half-volume ground-seed guidance; start with less if its bitterness is unfamiliar.', extraSource: fenugreekSource,
  },
  'tomato-mint-chutney': { powders: [['cumin-seeds-6', 'Cumin powder (tomato base)', 1.25]], instructions: { 'step-2': 'Fry green chilli and garlic in a little oil. Add tomato, tamarind, salt and the measured cumin powder; soften thoroughly.', 'step-4': 'Temper whole mustard, final cumin and the dals in the remaining oil. Stir in tomato-mint paste and toasted sesame powder; reduce gently.' }, notes: 'Only base cumin changes. Toasted sesame is retained as a nut-texture ingredient; the separate whole cumin in final popu remains whole.' },
  'dondakaya-pachadi': {
    powders: [['fenugreek-seeds-8', 'Fenugreek powder', .5], ['mustard-seeds-9', 'Pure mustard powder (chutney base)', 1.5], ['cumin-seeds-12', 'Cumin powder (chutney base)', 1.25]],
    instructions: { 'step-1': 'Roast only the first chana and urad portions in their oil. Cool; keep the measured ready mustard, cumin and fenugreek powders separate.', 'step-2': 'Cook chopped ivy gourd and green chilli in the vegetable oil portion, covered. Add tamarind, then lower heat and briefly cook the measured ready powders in the moist vegetables until fragrant.', 'step-3': 'Cool the cooked ivy-gourd and spice base; pulse with salt and roasted dals, without extra water.', 'step-4': 'Temper only the final whole mustard, cumin, dals, dried chilli, hing and curry leaves; fold into the chutney with coriander.' },
    notes: 'The base spices are ready powders; the final popu remains whole. Fenugreek follows the referenced half-volume ground-seed guidance. Whole roasted dals still provide the pachadi texture.', extraSource: fenugreekSource,
  },
  'minapappu-pachadi': {
    powders: [['cumin-seeds-3', 'Cumin powder', 1.25], ['fenugreek-seeds-4', 'Fenugreek powder', .5]],
    instructions: { 'step-1': 'Use half the oil to roast urad slowly until cooked through; soften the dried chilli separately. Lower heat and briefly bloom the ready cumin and fenugreek powders in a little warm oil without scorching.', 'step-2': 'Cool the roasted urad, chilli and bloomed powders. Grind this dal base with tamarind, jaggery, optional garlic and salt; add water gradually.' },
    notes: 'Only masala seeds move to ready powder. Urad is the defining bulk ingredient and must still be roasted/blended; dried chilli remains the source’s chutney component because no reliable variety-specific powder equivalence is implied. Fenugreek follows referenced half-volume guidance.', extraSource: fenugreekSource,
  },
  'dosakaya-pachadi': {
    powders: [['fenugreek-seeds-3', 'Fenugreek powder', .25], ['cumin-seeds-6', 'Cumin powder (chutney base)', .625], ['mustard-seeds-10', 'Pure mustard powder (chutney base)', 2.25]],
    instructions: { 'step-2': 'Briefly fry only the tempering mustard, dals, dried chilli and hing in the small oil portion; cool.', 'step-3': 'Blend the cooled dal-chilli mixture with green chilli, tamarind, turmeric, coriander and salt. Stir in the ready mustard, cumin and fenugreek powders; add a little water if necessary.' },
    notes: 'Pure mustard powder retains the intended sharp mustard character; do not use prepared yellow mustard or a seasoned English-mustard blend. The separate tempering mustard stays whole. Fenugreek follows the referenced half-volume guidance.', extraSource: fenugreekSource,
  },
  'pepper-pappu-charu': {
    powders: [['black-peppercorns-4', 'Black pepper powder', 4.5], ['cumin-seeds-5', 'Cumin powder (charu base)', .625], ['fenugreek-seeds-6', 'Fenugreek powder', 1, 'pinch'], ['coriander-seeds-7', 'Coriander powder', 2.5]],
    instructions: { 'step-2': 'Measure the ready pepper, cumin, coriander and fenugreek powders. Add the first dried chilli to the tempering rather than grinding a separate spice mixture.', 'step-3': 'Temper mustard, urad, final whole cumin, dried chillies, hing and curry leaves in ghee. Soften onion and tomato.', 'step-4': 'Stir the measured ready spice powders into the moist tomato base. Add tamarind, cooked dal and water; simmer gently and finish with coriander.' },
    notes: 'This remains a pepper-forward dal charu. Published grinding yields guide the pure pepper/cumin/coriander amounts; pepper heat varies, so start with part of its measured amount if sensitive. One pinch fenugreek is a stated editorial low starting amount. Whole popu is separate.',
  },
  'nellore-fish-pulusu': {
    powders: [['methi-fenugreek-seeds-1', 'Fenugreek powder', 1, 'pinch'], ['rai-mustard-seeds-2', 'Pure mustard powder (finishing masala)', .75], ['zeera-cumin-whole-3', 'Cumin powder', .625], ['dhaniya-coriander-whole-4', 'Coriander powder', 3.75]],
    instructions: { 'step-1': 'Season fish lightly with turmeric, chilli and salt; refrigerate. Measure ready fenugreek, mustard, cumin and coriander powders for the finishing masala.', 'step-4': 'Add mango and the measured ready spice powders to the moist gravy. Finish cooking by gently swirling the pot; add coriander.' },
    notes: 'A labeled pantry adaptation of the Nellore source: souring agents and fish sequence stay intact, but ready powders replace its ground masala. Only finishing mustard changes; final popu mustard remains whole. Fenugreek is an editorial low starting pinch.',
  },
  'carrot-peanut-fry': {
    powders: [['coriander-seeds-6', 'Coriander powder (peanut coating)', 3.75], ['cumin-seeds-8', 'Cumin powder (peanut coating)', 1.25]],
    instructions: { 'step-2': 'Toast only peanuts, chana and sesame; add dry coconut last. Cool and grind the nut mixture with fresh garlic, chilli, salt and the measured ready coriander and cumin powders.', 'step-4': 'Fold in enough peanut coating to coat the carrots, reserving extra. Stir gently over low heat until the coating is warm and fragrant, then finish with coriander leaves.' },
    notes: 'The ground peanut-sesame coating is a bulk nut ingredient, not a generic chicken/curry masala. Its dry coriander and cumin use ready powders. The source permits making this coating ahead; no universal ready curry-powder substitute is invented.',
  },
  'okra-garlic-fry': { powders: [['cumin-seeds-7', 'Cumin powder', 1.25]], instructions: { 'step-4': 'Crush only fresh garlic. Mix it with measured ready cumin, salt and chilli powder; toss with hot okra, peanuts and leaves.' }, notes: 'Fresh garlic is still crushed; no dry spice crushing is required.' },
  'ragi-neer-dosa': { powders: [['cumin-3', 'Cumin powder', .625]], instructions: { 'step-2': 'Grind soaked rice with ragi flour, green chilli and water added gradually. Stir in the measured ready cumin powder.' }, notes: 'Rice batter still needs grinding; only its dry cumin changes to ready powder.' },
  'cabbage-saagu': { powders: [['cinnamon-dalchini-5', 'Cinnamon powder', 2 / 3]], instructions: { 'step-1': 'Blend fresh coconut, roasted chana, cashew and green chilli with a little water. Stir in the measured ready cinnamon powder.' }, notes: 'Fresh coconut/nut paste remains the body of the saagu. Published grinding yield for the source’s one-inch cinnamon piece is approximate; brand/species potency differs, so begin with less if using strong cassia.' },
  'mango-pulissery': { powders: [['pepper-3', 'Black pepper powder', .75], ['cumin-seeds-4', 'Cumin powder (coconut paste)', 1.25]], instructions: { 'step-1': 'Blend fresh coconut into a smooth paste and stir in the measured ready pepper and cumin powders. Peel and mash ripe mango; whisk yogurt separately.' }, notes: 'Fresh coconut paste and yogurt are retained; only dry pepper and cumin are supplied ready-ground. Whole mustard/fenugreek for final popu remain whole.' },
  'rava-laddu': { powders: [['cardamom-pods-seeds-crushed-8', 'Cardamom powder', .25]], instructions: { 'step-4': 'Mix in toasted rava, nuts and the measured ready cardamom powder. Cool until safely warm, then shape small laddus with lightly greased hands.' }, notes: 'Ready cardamom uses McCormick’s approximate twelve-dehusked-pods-per-teaspoon grinding yield; this replaces the source list’s three crushed pods, not a guessed bulk spice blend.' },
  'medu-vada': { powders: [['ingredient-5', 'Coarse black pepper powder', .75], ['ingredient-4', 'Cumin powder', .625]], instructions: { 'step-3': 'Fold in salt, measured ready coarse pepper and cumin powders, herbs and optional onion or coconut. Shape small rings with lightly damp hands.' }, notes: 'Pepper and cumin are supplied ready-ground. Batter aeration and texture still require grinding the urad itself.' },
  'curry-leaf-podi': { powders: [['coriander-seeds-4', 'Coriander powder', 11.25], ['cumin-seeds-5', 'Cumin powder', 1.25]], instructions: { 'step-2': 'Fry chana and urad dal in oil until golden. Add the source’s dried chillies; do not add the ready powders yet.', 'step-3': 'Add completely dry curry leaves and crisp gently. Add garlic, then lower the heat and briefly stir in measured ready coriander and cumin powders just until fragrant.', 'step-4': 'Cool completely; grind the crisp leaves, dals, dried chillies and garlic with turmeric and salt. Use a clean, dry storage jar.' }, notes: 'Even the podi-making recipe supplies its coriander and cumin as ready powders. The leaves, dals, garlic and variety-specific dried chillies still require grinding to manufacture the actual condiment; no unsupported dried-chilli powder equivalence is invented.' },
  'ava-pulihora': {
    powders: [['mustard-seeds-6', 'Pure brown mustard powder (weigh; not a seasoned blend)', 60, 'g']],
    instructions: { 'step-1': 'Soften tamarind in its hot water and strain. Blend fresh ginger and the masala chillies with a little water. Stir the weighed pure brown mustard powder, turmeric, a little salt and the mustard-paste oil into that fresh paste.' },
    notes: 'The source’s sixty-gram mustard grinding component is supplied as the same mass of pure ground brown mustard; no invented teaspoon density is provided. This is a very large one-kilogram-rice batch. Whole mustard in final popu remains whole. Use only pure mustard powder, not a prepared mustard condiment or a seasoned blend.',
  },
  'village-mutton-curry': {
    remove: ['cardamoms-11', 'cloves-12', 'inches-cinnamon-13'], powders: [['pepper-14', 'Black pepper powder', .75], ['cumin-seeds-16', 'Cumin powder', 1.25], ['ready-garam-masala', 'Garam masala powder', 1.5]],
    instructions: { 'step-2': 'Coat with onion, tomato, the measured ready chilli, coriander, cumin, pepper and garam masala powders, and green chilli. Keep the bay leaves whole for infusion.' },
    stepAdds: { prepare: ['ready-garam-masala'], 'step-2': ['ready-garam-masala'] },
    notes: 'Household ready-garam-masala variation: the original coating’s cinnamon, cardamom and cloves are replaced with a measured blend. The 1½-tsp ready-garam option for a 500-g mutton batch is grounded in Swasthi’s mutton-korma alternative; the resulting aroma differs from the village source. Check the blend’s salt/chilli and do not add both full whole-spice and blend doses.',
    extraSource: { name: 'Swasthi’s Recipes — whole spices or ready garam masala in mutton', url: 'https://www.indianhealthyrecipes.com/mutton-korma-recipe/', note: 'Published alternative for 500 g mutton: whole aromatics or 1½ tsp garam masala; used as a clearly labeled home adaptation, not a claim of identical village-curry flavour.' },
  },
  murukulu: { powders: [['ajwain-5', 'Pure ajwain powder (household starting measure)', 1]], instructions: { 'step-2': 'Mix the flours with salt, measured ready ajwain powder, oil and water added gradually.' }, notes: 'One tsp pure ajwain powder is an explicit mild household starting measure for this 300-g flour batch, not a one-to-one conversion of the original tablespoon of seeds. Ground ajwain is a published chakali option; the supporting recipe uses a different flour blend.', extraSource: { name: 'SOS Children’s Villages / Sunanda — ajwain-powder chakali', url: 'https://www.soschildrensvillages.ca/recipe/authentic-indian-chakali-recipe-670', note: 'The author’s chakali uses ready ajwain powder. Our different rice-and-urad dough uses an explicitly labeled conservative starting measure, not a claim of exact batch equivalence.' } },
  'rayalaseema-egg-dosa': { powders: [['red-chillies-5', 'Pure medium-heat dried red chilli powder (weigh)', 100, 'g']], instructions: { 'step-2': 'Blend only softened tamarind, garlic and salt. Hydrate the weighed pure dried-chilli powder with water as needed, stir into that fresh paste, then cook the moist paste in tempered mustard, curry leaves and oil until its raw aroma softens.' }, notes: 'The primary recipe photographs show dried red chillies. This household route supplies the same source mass as pure dried-chilli powder, not a guessed teaspoon density or a fresh-chilli conversion. This is the source’s large batch for about twenty dosas/ten portions; use a comparable mild-to-medium chilli variety, review heat tolerance and start with less when unsure. Never substitute an equally large amount of a much hotter powder.' },
  'dibba-rotti': { powders: [['cumin-3', 'Cumin powder', 1.25]], instructions: { 'step-1': 'Beat thick idli batter with measured ready cumin powder and salt; add the measured water only if needed.' }, notes: 'Ready cumin replaces the batter’s cumin-seed inclusion using the published approximate grinding yield; no change to the thick idli-batter method.' },
  'ragi-rava-dosa': { powders: [['cumin-8', 'Cumin powder', 1.25]], instructions: { 'step-1': 'Mix ragi, rava and wheat flour with measured ready cumin and pepper powders, salt, hing, herbs and buttermilk. Rest ten minutes.' }, notes: 'The batter cumin now uses ready powder, while its existing pepper powder is retained. Ready powder is mixed into the batter rather than treated as whole popu.' },
  chegodilu: { powders: [['ajwain-carom-seeds-3', 'Pure ajwain powder (household starting measure)', .5]], instructions: { 'step-1': 'Bring water, ghee, sesame, turmeric and salt to a boil.', 'step-2': 'Turn off heat; mix in maida and the measured ready ajwain powder firmly. When safe to handle, knead with a protected utensil or cloth-assisted method.' }, notes: 'Half a tsp ready ajwain powder is an explicit mild household starting amount for this 250-g maida dough. A published ground-ajwain chakali method supports the powder route, but this different dough has not been kitchen-tested and no one-to-one seed conversion is claimed.', extraSource: { name: 'SOS Children’s Villages / Sunanda — ajwain-powder chakali', url: 'https://www.soschildrensvillages.ca/recipe/authentic-indian-chakali-recipe-670', note: 'Supports using ready ajwain powder in fried flour dough. The Chegodilu dose is a clearly labeled mild household starting measure for a different flour blend.' } },
  'onion-chutney': { powders: [['ingredient-3', 'Kashmiri red chilli powder', 1]], instructions: { 'step-1': 'Fry chana and urad in the sautéing oil until golden. Keep the ready chilli powder aside.', 'step-2': 'Add onion and garlic; cook until lightly golden. Lower heat and briefly cook the measured chilli powder in the moist onion, adding a little blending water if dry. Cool before blending.', 'step-3': 'Blend with tamarind, salt and the remaining measured blending water.' }, notes: 'A labeled household adaptation of Dassana’s dal-onion base using Swasthi’s explicit one-tsp chilli-powder option for one cup onion. This is not a pod-count conversion; Kashmiri powder supplies a milder starting heat.', extraSource: { name: 'Swasthi’s Recipes — onion chutney ready-chilli-powder option', url: 'https://www.indianhealthyrecipes.com/onion-chutney-recipe/', note: 'The recipe card explicitly allows 1 tsp red chilli powder instead of 3–4 mild dried chillies for a one-cup onion batch; our separate dal-onion base is a clearly labeled household adaptation.' } },
}

function powderIngredient(current: RecipeIngredient | undefined, [id, name, quantity, unit = 'tsp']: Powder): RecipeIngredient {
  return { ...(current || {}), id, name: { en: name }, quantity, unit, scaling: 'linear', aliases: [], allergens: /mustard/i.test(name) ? ['mustard'] : [] }
}

export const additionalPowderMethodIds = [...Object.keys(edits), 'udupi-pepper-rasam']

function readyUdupiRasam(current: Recipe): Recipe {
  const facts: [string, string, number, string][] = [
    ['toor-dal', 'Toor dal', .25, 'cup'], ['tomato', 'Tomatoes', 2, 'piece'], ['water-dal', 'Water (dal and tomato cooking)', 2, 'cup'], ['tamarind', 'Tamarind', 1, 'gooseberry-sized ball'], ['water-tamarind', 'Water (tamarind)', 1, 'cup'], ['coconut-oil', 'Coconut oil', 1, 'tsp'], ['mustard', 'Mustard seeds (tempering; editorial starting measure)', .25, 'tsp'], ['salt', 'Salt (adjust to taste)', 1, 'tsp'], ['jaggery', 'Jaggery', 2, 'tsp'], ['saaru-podi', 'Udupi saaru podi / Udupi rasam powder', 3, 'tsp'], ['coriander', 'Coriander leaves', 3, 'sprig'], ['ghee', 'Ghee (finish)', 1, 'tsp'],
  ]
  const ingredients: RecipeIngredient[] = facts.map(([id, name, quantity, unit]) => ({ id, name: { en: name }, quantity, unit, scaling: /water|oil/.test(name.toLowerCase()) ? 'method-dependent' : /salt|powder/.test(name.toLowerCase()) ? 'to-taste' : 'linear', allergens: id === 'ghee' ? ['milk'] : [], aliases: [] }))
  const stages: [string, RecipeStep['heat'], string, string, string[]][] = [
    ['dal', 'medium', 'Rinse toor dal; cook with tomatoes and the dal water until soft, then mash together.', 'If using a pressure cooker, follow its liquid guidance and allow safe natural release.', ['toor-dal', 'tomato', 'water-dal']],
    ['tamarind', 'off', 'Soften tamarind in its water, squeeze and strain the extract.', 'Discard fibres and seeds; keep the clean sour extract aside.', ['tamarind', 'water-tamarind']],
    ['base', 'medium', 'Temper mustard in coconut oil. Add tamarind extract, salt and jaggery; simmer gently.', 'Whole mustard is popu, not a spice-masala grinding step.', ['mustard', 'coconut-oil', 'tamarind', 'salt', 'jaggery']],
    ['podi', 'low', 'Stir in the measured ready Udupi saaru podi and the mashed dal-tomato mixture. Simmer until aromatic.', 'Use the actual Udupi rasam blend; generic garam masala or chicken masala is not equivalent.', ['saaru-podi', 'toor-dal', 'tomato']],
    ['finish', 'off', 'Finish with fresh coriander leaves and ghee. Check seasoning and serve.', 'The selected pantry route skips manufacturing the page’s separate saaru-podi recipe.', ['coriander', 'ghee', 'salt']],
  ]
  return { ...current, version: current.version + 1, title: { en: 'Udupi rasam · ready saaru podi', te: 'ఉడుపి రసం' }, summary: { en: 'Kannamma Cooks’ Udupi tomato-dal rasam with measured ready saaru podi; no fresh spice-masala grinding.' }, baseServings: 4, prepMinutes: 15, cookMinutes: 30,
    authorMethod: 'Kannamma Cooks — ready Udupi saaru-podi method with tomato and dal, independently summarized and not kitchen-tested.', equipment: ['Dal-cooking pot or pressure cooker', 'Saucepan', 'Strainer'], ingredients,
    steps: stages.map(([id, heat, instruction, checkpoint, ingredientIds]) => ({ id, heat, instruction: { en: instruction }, checkpoint: { en: checkpoint }, ingredientIds })), substitutions: [],
    sources: [{ name: 'Kannamma Cooks', url: 'https://www.kannammacooks.com/udupi-rasam-tomato-rasam-udupi-saaru/', note: 'Checked 2026-10-30. Actual published ready-powder route: 1 tbsp Udupi saaru podi = 3 tsp for four servings. The source does not quantify tempering mustard; ¼ tsp is an explicit editorial starting measure. Dal cooking is included in estimated time; appliance-specific checks replace universal whistle counts.' }, ...current.sources.slice(1)] }
}

const stageIngredients: Record<string, Record<string, string[]>> = {
  'tomato-sesame-chutney': { 'step-1': ['sesame-seeds-3'], 'step-2': ['ripe-tomatoes-1', 'green-chillies-2', 'oil-8', 'coriander-seeds-6', 'cumin-seeds-7', 'fenugreek-seeds-5'], 'step-3': ['ripe-tomatoes-1', 'sesame-seeds-3', 'garlic-cloves-4', 'salt-9'], 'step-4': ['oil-12', 'mustard-seeds-11', 'cumin-seeds-tempering-13', 'curry-leaves-10'] },
  'tomato-mint-chutney': { 'step-2': ['green-chillies-4', 'garlic-pieces-5', 'oil-9', 'ripe-red-tomatoes-1', 'tamarind-ball-size-of-a-gooseberry-7', 'salt-8', 'cumin-seeds-6'], 'step-4': ['oil-tempering-14', 'mustard-seeds-10', 'cumin-seeds-13', 'bengal-gram-11', 'black-gram-12', 'ripe-red-tomatoes-1', 'handful-of-mint-leaves-2', 'sesame-seeds-3'] },
  'dondakaya-pachadi': { 'step-1': ['black-gram-10', 'bengal-gram-11', 'oil-7'], 'step-2': ['coccinia-kundru-dondakaya-1', 'green-chillies-2', 'oil-4', 'tamarind-a-small-ball-3', 'mustard-seeds-9', 'cumin-seeds-12', 'fenugreek-seeds-8'], 'step-3': ['coccinia-kundru-dondakaya-1', 'salt-6', 'black-gram-10', 'bengal-gram-11'], 'step-4': ['oil-14', 'mustard-seeds-15', 'cumin-seeds-16', 'black-gram-17', 'bengal-gram-18', 'red-chillies-19', 'asafoetida-20', 'curry-leaves-21', 'green-coriander-5'] },
  'minapappu-pachadi': { 'step-1': ['whole-black-gram-with-skin-1', 'red-chillies-2', 'oil-9', 'cumin-seeds-3', 'fenugreek-seeds-4'], 'step-2': ['whole-black-gram-with-skin-1', 'red-chillies-2', 'cumin-seeds-3', 'fenugreek-seeds-4', 'tamarind-size-of-a-lemon-5', 'jaggery-6', 'garlic-optional-11', 'salt-10', 'water-blending-12'] },
  'dosakaya-pachadi': { 'step-2': ['oil-1', 'mustard-seeds-2', 'black-gram-4', 'bengal-gram-5', 'red-chillies-7', 'asafoetida-8'], 'step-3': ['black-gram-4', 'bengal-gram-5', 'red-chillies-7', 'green-chillies-11', 'tamarind-paste-12', 'turmeric-15', 'green-coriander-a-little-14', 'salt-13', 'mustard-seeds-10', 'cumin-seeds-6', 'fenugreek-seeds-3', 'water-to-grind-16'] },
  'pepper-pappu-charu': { 'step-2': ['black-peppercorns-4', 'cumin-seeds-5', 'fenugreek-seeds-6', 'coriander-seeds-7'], 'step-3': ['ghee-9', 'mustard-seeds-10', 'urad-dal-black-gram-dal-12', 'cumin-seeds-13', 'dry-red-chilli-8', 'dry-red-chilli-11', 'hing-asafoetida-15', 'curry-leaves-16', 'sliced-onions-17', 'tomato-cubed-18'], 'step-4': ['black-peppercorns-4', 'cumin-seeds-5', 'fenugreek-seeds-6', 'coriander-seeds-7', 'tamarind-extract-extracted-from-a-lemon-sized-tamarind-soaked-in-water-19', 'toor-dal-pigeon-pea-lentils-soaked-for-30-minutes-1', 'water-21', 'salt-to-taste-20', 'coriander-leaves-chopped-22'] },
  'nellore-fish-pulusu': { 'step-1': ['fish-pieces-and-one-fish-head-5', 'haldi-turmeric-11', 'chilli-powder-7', 'salt-6'], 'step-2': ['oil-15', 'rai-mustard-seeds-18', 'onion-chopped-14', 'green-chillies-13', 'curry-leaves-12', 'tomatoes-pur-ed-10', 'chilli-powder-7', 'salt-6'], 'step-3': ['tamarind-juice-8', 'fish-pieces-and-one-fish-head-5', 'heeng-asafoetida-17'], 'step-4': ['raw-mango-9', 'methi-fenugreek-seeds-1', 'rai-mustard-seeds-2', 'zeera-cumin-whole-3', 'dhaniya-coriander-whole-4', 'kothmir-coriander-leaves-chopped-16'] },
  'carrot-peanut-fry': { 'step-2': ['groundnuts-peanuts-3', 'bengal-gram-7', 'sesame-seeds-4', 'dry-coconut-powder-5', 'garlic-10', 'mirchi-powder-11', 'salt-9', 'coriander-seeds-6', 'cumin-seeds-8'] },
  'okra-garlic-fry': { 'step-4': ['garlic-6', 'cumin-seeds-7', 'salt-4', 'mirchi-powder-5', 'okra-pieces-1', 'peanuts-2', 'curry-leaves-3'] },
  'cabbage-saagu': { 'step-1': ['fresh-coconut-grated-1', 'roasted-chana-dal-phutana-2', 'cashew-kaju-jeedi-pappu-3', 'green-chillies-4', 'water-to-grind-the-paste-6', 'cinnamon-dalchini-5'] },
  'mango-pulissery': { 'step-1': ['raw-coconut-2', 'pepper-3', 'cumin-seeds-4', 'ripe-mangoes-1', 'plain-yogurt-editorial-starting-amount-17'], 'step-2': ['ripe-mangoes-1', 'raw-coconut-2', 'water-7', 'curry-leaves-5', 'mirchi-powder-8', 'green-chilli-paste-9', 'turmeric-a-pinch-10', 'salt-6'], 'step-4': ['coconut-oil-groundnut-oil-11', 'fenugreek-seeds-12', 'mustard-seeds-13', 'red-chillies-14', 'curry-leaves-15', 'asafoetida-a-pinch-16'] },
  'rava-laddu': { 'step-4': ['bombay-rava-semolina-1', 'cashew-nuts-4', 'raisins-5', 'cardamom-pods-seeds-crushed-8'] },
  'ava-pulihora': { 'step-1': ['seedless-tamarind-4', 'hot-water-5', 'ginger-7', 'red-chilies-8', 'mustard-seeds-6', 'turmeric-9', 'salt-a-little-10', 'hot-water-a-little-11', 'oil-12'], 'step-3': ['sesame-oil-groundnut-oil-17', 'groundnut-18', 'mustard-seeds-19', 'black-gram-20', 'raw-bengal-gram-21', 'red-chilies-22', 'asafoetida-23', 'curry-leaves-24'] },
  'medu-vada': { 'step-3': ['ingredient-4', 'ingredient-5', 'ingredient-6', 'ingredient-7', 'ingredient-8', 'ingredient-9', 'ingredient-10', 'ingredient-11', 'ingredient-12', 'ingredient-13'] },
  'dibba-rotti': { 'step-1': ['idli-batter-1', 'salt-2', 'cumin-3', 'water-4'] },
  'ragi-rava-dosa': { 'step-1': ['ragi-flour-1', 'bombay-rava-2', 'wheat-flour-3', 'salt-4', 'curry-leaves-5', 'asafoetida-1-pinch-6', 'pepper-powder-7', 'cumin-8', 'chopped-green-chillies-9', 'diluted-butter-milk-10'] },
  chegodilu: { 'step-1': ['water-1', 'ghee-2', 'sesame-seeds-4', 'turmeric-5', 'salt-6'], 'step-2': ['maida-7', 'ajwain-carom-seeds-3', 'water-1'] },
  'onion-chutney': { 'step-1': ['ingredient-4', 'ingredient-5', 'ingredient-6'], 'step-2': ['ingredient-1', 'ingredient-2', 'ingredient-3', 'ingredient-9'], 'step-3': ['ingredient-7', 'ingredient-8', 'ingredient-9'] },
  'village-mutton-curry': { 'step-2': ['onions-chopped-7', 'tomato-paste-8', 'red-chilli-powder-9', 'coriander-powder-10', 'pepper-14', 'biryani-leaves-15', 'cumin-seeds-16', 'ready-garam-masala', 'green-chillies-19'] },
  'rayalaseema-egg-dosa': { 'step-2': ['tamarind-6', 'garlic-7', 'salt-8', 'red-chillies-5', 'water-for-making-the-paste-9', 'mustard-seeds-11', 'curry-leaves-12', 'oil-10'] },
}

function applyMethodOnly(current: Recipe): Recipe {
  if (current.id === 'udupi-pepper-rasam') return readyUdupiRasam(current)
  const edit = edits[current.id]
  if (!edit) return current
  for (const id of Object.keys(edit.instructions || {})) if (!current.steps.some(step => step.id === id)) throw new Error(`Unknown pantry-method step: ${current.id}/${id}`)
  const removed = new Set(edit.remove || [])
  const replacements = new Map(edit.powders?.map(powder => [powder[0], powder]) || [])
  const ingredients = current.ingredients.filter(item => !removed.has(item.id)).map(item => replacements.has(item.id) ? powderIngredient(item, replacements.get(item.id)!) : item)
  for (const powder of edit.powders || []) if (!ingredients.some(item => item.id === powder[0])) ingredients.push(powderIngredient(undefined, powder))
  const valid = new Set(ingredients.map(item => item.id))
  const steps: RecipeStep[] = current.steps.map(step => {
    const exact = stageIngredients[current.id]?.[step.id]
    if (exact?.some(id => !valid.has(id))) throw new Error(`Unknown pantry ingredient: ${current.id}/${step.id}/${exact.filter(id => !valid.has(id)).join(',')}`)
    return { ...step, ...(edit.instructions?.[step.id] ? { instruction: { en: edit.instructions[step.id] } } : {}), ingredientIds: exact || [...new Set([...step.ingredientIds.filter(id => valid.has(id)), ...(edit.stepAdds?.[step.id] || [])])],
      ...(current.id === 'pepper-pappu-charu' && step.id === 'step-2' ? { heat: 'off' as const, durationSeconds: undefined, checkpoint: { en: 'Ready powders are measured only; no whole-spice roasting or grinding is required.' } } : {}),
      ...(current.id === 'dondakaya-pachadi' && step.id === 'step-1' ? { checkpoint: { en: 'The dals are golden and cooked through; ready powders remain separate until the moist vegetable stage.' } } : {}),
      ...(current.id === 'ava-pulihora' && step.id === 'step-1' ? { checkpoint: { en: 'Ginger and chilli form the fresh paste; weighed ready mustard powder is stirred in separately.' } } : {}),
      ...(current.id === 'onion-chutney' && step.id === 'step-1' ? { checkpoint: { en: 'The dals are cooked and golden; ready chilli powder stays aside until the moist onion stage.' } } : {}),
    }
  })
  return {
    ...current, version: current.version + 1, ingredients, steps,
    authorMethod: `Vantagallu pantry-powder adaptation of ${current.sources[0].author || current.sources[0].name}; ready individual spices with the fresh base retained, not kitchen-tested.`,
    substitutions: current.substitutions?.filter(swap => valid.has(swap.ingredientId)),
    sources: [{ ...current.sources[0], note: `${current.sources[0].note || 'Checked 2026-10-30.'} Pantry adaptation: ${edit.notes} Approximate individual grinding yields are identified in the separate primary reference; these are not blanket one-to-one brand substitutions.` }, ...current.sources.slice(1), grindingSource, ...(edit.extraSource ? [edit.extraSource] : [])],
  }
}

export function applyCompletePantryMethod(current: Recipe): Recipe {
  const updated = applyMethodOnly(current)
  let scaled = false
  const ingredients = updated.ingredients.map(item => {
    if (isSpicePowder(item.name.en) && /^(?:tsp|tbsp|cup|g|kg)$/i.test(item.unit) && !/\bsalt\b/i.test(item.name.en) && item.scaling !== 'linear') {
      scaled = true
      return { ...item, scaling: 'linear' as const }
    }
    return item
  })
  if (!scaled) return updated
  return { ...updated, ingredients, version: current.version + 1, sources: updated.sources.map((source, index) => index ? source : { ...source, note: `${source.note || 'Checked 2026-10-30.'} Measured ground-spice starting doses scale with selected servings; taste adjustment remains manual. Confirmed already-added amounts are never rescaled.` }) }
}
