import type { Heat, RecipeCategory, RecipeRegion } from '../domain/types'

export interface StarterMethod {
  index: number
  id: string
  title: string
  te: string
  region: RecipeRegion
  categories: RecipeCategory[]
  summary: string
  prep: number
  cook: number
  servings: number
  stages: [Heat, number, string, string][]
  note?: string
}

// Independently written cooking plans, adapted from the specific linked sources.
// Durations are suggested check-in timers, never a guarantee that food is cooked.
export const starterMethods: StarterMethod[] = [
  { index: 0, id: 'tomato-sesame-chutney', title: 'Tomato sesame chutney', te: 'టమాటా నువ్వుల పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 8, prep: 5, cook: 15, summary: 'Cooked tomato chutney thickened with toasted sesame.', stages: [
    ['low', 240, 'Toast fenugreek, coriander and cumin; add sesame last. Cool and powder.', 'Seeds smell nutty; discard a burnt batch.'],
    ['medium', 600, 'Use the larger oil portion to soften the chillies and chopped tomatoes.', 'Tomatoes collapse and no watery pockets remain.'],
    ['off', 0, 'Cool, then blend with the spice powder, garlic and salt.', 'The paste is spoonable, rather than watery.'],
    ['medium', 60, 'Heat the smaller oil portion; crackle mustard and curry leaves. Fold into the chutney.', 'Stand back when adding dry curry leaves.'],
  ] },
  { index: 1, id: 'tomato-mint-chutney', title: 'Tomato mint chutney', te: 'టమాటా పుదీనా పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 8, prep: 5, cook: 15, summary: 'A cooked mint-and-tomato pachadi with sesame body.', stages: [
    ['low', 180, 'Toast sesame until fragrant; cool and powder separately.', 'Seeds are pale golden, without black spots.'],
    ['medium', 480, 'Fry chilli, cumin and garlic in a little oil. Add tomato, tamarind and salt; soften thoroughly.', 'Tomato pieces crush easily against the pan.'],
    ['medium', 60, 'Wilt the mint briefly. Cool the mixture and pulse to a textured paste.', 'Mint remains aromatic; do not blend hot in a sealed jar.'],
    ['medium', 240, 'Temper mustard and the dals in the remaining oil. Stir in tomato paste and sesame powder; reduce.', 'The chutney thickens and begins releasing oil at the edges.'],
  ] },
  { index: 2, id: 'curry-leaf-podi', title: 'Curry leaf podi', te: 'కరివేపాకు పొడి', region: 'andhra', categories: ['podi'], servings: 15, prep: 15, cook: 15, summary: 'Dry curry-leaf and lentil powder for rice or tiffins.', stages: [
    ['off', 0, 'Wash the curry leaves and dry them completely on a clean towel.', 'No surface moisture remains before frying.'],
    ['low', 300, 'Fry chana and urad dal in oil until golden. Add coriander and dried chillies.', 'The dals smell toasted, not acrid.'],
    ['low', 240, 'Add dry curry leaves; crisp them gently. Add garlic, cumin and tamarind near the end.', 'A leaf crushes readily between cooled fingers.'],
    ['off', 0, 'Cool completely; grind with turmeric and salt. Use a clean, dry storage jar.', 'The powder is dry and no warmth is trapped in the jar.'],
  ] },
  { index: 3, id: 'appam', title: 'Kerala appam', te: 'కేరళ అప్పం', region: 'kerala', categories: ['breakfast'], servings: 6, prep: 1290, cook: 30, summary: 'Fermented rice appam with coconut and a lacy rim.', stages: [
    ['off', 18000, 'Rinse and soak both rices, urad and fenugreek for about five hours; drain.', 'The grains crush more readily after soaking.'],
    ['off', 57600, 'Grind with coconut and water to a smooth batter. Mix in coconut milk, sugar and salt; ferment, checking from eight hours.', 'Batter is aerated and mildly tangy; the source allows about sixteen hours.'],
    ['off', 0, 'For half the batch, mix half the baking soda and sparkling water into the fermented batter.', 'Batter coats the pan thinly; do not add all the soda to a half batch.'],
    ['medium', 180, 'Swirl a ladle of batter in a hot appam pan. Cover and cook each appam for about three minutes.', 'The centre is set and the rim lifts; no raw wet batter remains.'],
  ], note: 'Source-adapted full-batch quantities; add the soda mixture proportionally only to the batter being cooked.' },
  { index: 4, id: 'instant-poha-idli', title: 'Instant poha idli', te: 'అటుకుల ఇడ్లీ', region: 'south-indian', categories: ['breakfast'], servings: 3, prep: 45, cook: 15, summary: 'An unfermented rice-rava idli using sour buttermilk.', stages: [
    ['off', 900, 'Soften poha in buttermilk for fifteen minutes; mash it smooth.', 'No dry flakes remain.'],
    ['off', 1800, 'Mix in rice rava, salt and soda. Rest thirty minutes, then adjust with buttermilk.', 'The thick batter falls slowly from a spoon.'],
    ['medium', 540, 'Lightly oil moulds; fill and steam in a dedicated steamer for about seven to ten minutes.', 'A skewer comes out clean; extend steaming if the centre is sticky.'],
    ['off', 120, 'Rest two minutes before gently lifting out the idlis.', 'They release without breaking apart.'],
  ] },
  { index: 5, id: 'poori-masala', title: 'Poori masala', te: 'పూరీ కూర', region: 'south-indian', categories: ['curry'], servings: 4, prep: 15, cook: 20, summary: 'Soft onion and potato gravy lightly thickened with besan.', stages: [
    ['medium', 120, 'Temper mustard, dals, cumin, dried chilli and curry leaves in oil.', 'The dals are golden, not dark brown.'],
    ['medium', 300, 'Add sliced onions, green chilli and turmeric; soften with the larger water portion and salt.', 'Onions turn translucent and tender.'],
    ['low', 240, 'Whisk besan into the smaller water portion. Pour it in slowly while stirring; add ginger and mashed boiled potato.', 'No dry flour lumps or raw besan taste remain.'],
    ['off', 0, 'Loosen if needed, then finish with lemon juice.', 'The curry flows off a ladle and coats poori lightly.'],
  ] },
  { index: 6, id: 'wheat-rava-upma', title: 'Tangy wheat rava upma', te: 'గోధుమ రవ్వ పులుపు ఉప్మా', region: 'andhra', categories: ['breakfast'], servings: 3, prep: 10, cook: 25, summary: 'A tamarind-and-pea wheat-rava upma, rather than plain upma.', stages: [
    ['low', 300, 'Roast wheat rava with the small oil or ghee portion until fragrant.', 'Grains remain pale, without scorched specks.'],
    ['medium', 300, 'Temper mustard, dals, cumin, dried chilli, hing and green chilli. Add onion, curry leaves and peas.', 'Onion softens and the tempering dals are golden.'],
    ['medium', 180, 'Extract tamarind in the measured water; add to the pan with salt and a little jaggery. Bring to a boil.', 'The liquid tastes pleasantly sour, not harsh.'],
    ['low', 1080, 'Stir in roasted rava gradually. Cover and cook fifteen to eighteen minutes, stirring occasionally; finish with coriander.', 'The grain is tender and no dry centre remains.'],
  ] },
  { index: 7, id: 'millet-pongal', title: 'Foxtail millet pongal', te: 'కొర్ర పొంగలి', region: 'south-indian', categories: ['breakfast'], servings: 6, prep: 490, cook: 40, summary: 'Soft foxtail millet and moong dal with pepper-ghee tempering.', stages: [
    ['off', 28800, 'Rinse foxtail millet and soak overnight; drain before cooking.', 'The soak is part of the preparation time.'],
    ['low', 600, 'Dry-toast moong gently until aromatic, then rinse it.', 'Dal is light golden and has no burnt smell.'],
    ['medium', 1200, 'Pressure-cook millet, dal, salt and five cups water using the cooker guide; allow natural pressure release.', 'Millet and dal mash easily; add hot water if it tightens.'],
    ['low', 180, 'Fry cashews, pepper, cumin, chilli, hing and curry leaves in ghee; fold into the pongal.', 'Pongal is soft and spoonable, rather than separate grains.'],
  ] },
  { index: 8, id: 'set-dosa', title: 'Mangalore set dosa', te: 'మంగళూరు సెట్ దోశ', region: 'karnataka', categories: ['breakfast'], servings: 6, prep: 1040, cook: 25, summary: 'Small fermented dosas cooked under a lid for a soft centre.', stages: [
    ['off', 18000, 'Rinse rice, urad, fenugreek and poha; soak about five hours, then drain.', 'The dal is plump and easy to grind.'],
    ['off', 43200, 'Grind a smooth batter with water added gradually; allow it to ferment.', 'Check from eight hours; the source uses about twelve hours.'],
    ['off', 0, 'Stir in salt and soda diluted in a little water; thin to a thick pouring batter.', 'It pours freely but does not run like neer-dosa batter.'],
    ['medium', 180, 'Pour a small dosa without spreading thinly. Oil the edges, cover and cook one side.', 'The top is set with holes and the base is golden.'],
  ], note: 'Source batch makes roughly twelve small dosas; servings here count two dosas per person.' },
  { index: 9, id: 'ven-pongal', title: 'Ven pongal', te: 'కట్టె పొంగలి', region: 'tamil', categories: ['breakfast'], servings: 6, prep: 35, cook: 35, summary: 'Rice and moong cooked soft, then seasoned with pepper and ginger.', stages: [
    ['off', 1800, 'Rinse rice and soak thirty minutes. Toast moong lightly and rinse.', 'Dal is fragrant rather than browned.'],
    ['medium', 1800, 'Simmer rice, moong, water and salt in a heavy pot, stirring and adding hot water if needed.', 'Both grains crush easily; the mixture is loose and creamy.'],
    ['low', 180, 'Fry cashews, cumin, pepper, ginger, curry leaves and hing in ghee.', 'Cashews are golden and ginger no longer smells raw.'],
    ['off', 0, 'Fold the seasoning through. Add hot water if it thickens before serving.', 'Pongal settles softly instead of standing as a firm mound.'],
  ] },
  { index: 10, id: 'mysore-masala-dosa', title: 'Mysore masala dosa', te: 'మైసూరు మసాలా దోశ', region: 'karnataka', categories: ['breakfast'], servings: 6, prep: 1060, cook: 40, summary: 'Crisp fermented dosa with red chilli spread and potato filling.', stages: [
    ['off', 18000, 'Soak batter rice, urad, fenugreek, chana and poha five hours. Grind smooth; ferment roughly twelve hours.', 'Batter expands and smells mildly tangy.'],
    ['medium', 300, 'Toast the spread chana and sesame; soften its onion and garlic. Cool; grind with soaked Byadgi chilli, turmeric, salt and lemon.', 'The spread is smooth, without gritty dry chilli.'],
    ['medium', 480, 'Temper filling mustard, chana, cumin and curry leaves. Soften its onion; add ginger-garlic, turmeric and mashed potato with a little water.', 'Fold in green chilli and coriander when the filling is moist but not wet.'],
    ['medium', 180, 'Thin and salt fermented batter. Spread on a seasoned tawa; apply red spread and a little oil or ghee.', 'The base browns and releases easily.'],
    ['off', 0, 'Add potato filling, fold and serve immediately.', 'The cooked dosa has no wet raw batter on top.'],
  ], note: 'Source batch makes about twelve dosas; servings count two per person. Ingredient labels retain the batter/spread/filling groups.' },
  { index: 11, id: 'rava-upma', title: 'Soft rava upma', te: 'రవ్వ ఉప్మా', region: 'south-indian', categories: ['breakfast'], servings: 3, prep: 5, cook: 25, summary: 'Soft semolina upma with milk, cashew and ghee.', stages: [
    ['low', 600, 'Toast semolina with cumin, stirring until fragrant.', 'Rava stays pale and feels free-flowing.'],
    ['medium', 180, 'Temper mustard and dals in oil. Add curry leaves, cashews, chilli and ginger.', 'Dals and cashews become golden.'],
    ['medium', 180, 'Add the measured milk and water; bring to a steady boil.', 'Watch closely so the milk does not boil over.'],
    ['low', 300, 'Salt the roasted rava and pour it in gradually while stirring. Cover and cook about five minutes.', 'There are no dry lumps and the grains feel cooked.'],
    ['off', 300, 'Rest covered five minutes; fold in ghee.', 'The upma is soft; it firms as it cools.'],
  ] },
  { index: 12, id: 'dibba-rotti', title: 'Dibba rotti', te: 'దిబ్బ రొట్టె', region: 'andhra', categories: ['breakfast'], servings: 5, prep: 5, cook: 40, summary: 'Thick idli-batter rotti with a crisp crust and steamed centre.', stages: [
    ['off', 0, 'Beat thick idli batter with cumin and salt; use the measured water only if needed.', 'Batter is airy and thick, not dosa-thin.'],
    ['low', 1500, 'Oil a small heavy covered skillet; pour in batter and cook gently, covered, for about twenty-five minutes.', 'A skewer must come out clean before turning; reduce heat if the base darkens early.'],
    ['low', 600, 'Turn carefully onto an oiled tawa and brown the other side for about ten minutes.', 'Both crusts are golden and the centre is fully set.'],
    ['off', 120, 'Rest briefly, cut into wedges and serve with chutney.', 'Steam escapes when a wedge is cut, without sticky raw batter.'],
  ], note: 'Adapted to a covered skillet; the source places a water-filled glass inside the pan. This simplified cookware version requires kitchen testing.' },
  { index: 13, id: 'rayalaseema-egg-dosa', title: 'Rayalaseema karam egg dosa', te: 'రాయలసీమ కారం గుడ్డు దోశ', region: 'rayalaseema', categories: ['breakfast'], servings: 10, prep: 1080, cook: 40, summary: 'Fermented dosa with a cooked red-chilli spread and egg.', stages: [
    ['off', 18000, 'Soak rice, urad, fenugreek and poha about five hours. Grind and ferment eight to sixteen hours.', 'The batter is bubbly and mildly tangy.'],
    ['medium', 600, 'Blend softened red chilli, tamarind, garlic and salt. Temper mustard and curry leaves in oil; cook the paste, stirring.', 'The paste thickens and loses its raw chilli smell.'],
    ['medium', 180, 'Salt and thin the batter. Spread a dosa on the tawa; add a little roasting oil and red spread.', 'The base starts turning golden.'],
    ['medium', 120, 'Spread beaten egg over the dosa; cook, turn and finish the egg side.', 'Egg is completely set; do not rely on the source’s short timer alone.'],
  ], note: 'Batch yields approximately twenty small dosas. This adaptation uses ten eggs, shared across the batch, instead of an unquantified source egg amount.' },
  { index: 14, id: 'ragi-rava-dosa', title: 'Ragi rava dosa', te: 'రాగి రవ్వ దోశ', region: 'south-indian', categories: ['breakfast'], servings: 4, prep: 15, cook: 25, summary: 'A thin, unfermented ragi-and-semolina dosa with buttermilk.', stages: [
    ['off', 600, 'Mix ragi, rava, wheat flour, spices and herbs with buttermilk. Rest ten minutes.', 'The rava has hydrated without dry lumps.'],
    ['off', 0, 'Add water gradually to a thin batter; stir before each dosa.', 'The batter runs easily off a ladle.'],
    ['medium', 180, 'Oil a hot tawa; scatter onion and pour batter from the outside inward, leaving small holes.', 'The batter sizzles and forms a lacy sheet.'],
    ['medium', 120, 'Drizzle a little oil and cook until crisp; fold when it releases.', 'The centre is dry and the edges lift without tearing.'],
  ] },
  { index: 15, id: 'dondakaya-pachadi', title: 'Dondakaya roti pachadi', te: 'దొండకాయ రోటి పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 4, prep: 10, cook: 20, summary: 'Coarse cooked ivy-gourd chutney with a roasted dal tempering.', stages: [
    ['low', 240, 'Roast the first spice-and-dal group in its oil; cool and powder.', 'The dals are golden and fenugreek is not burnt.'],
    ['medium', 600, 'Cook chopped ivy gourd and green chilli in the larger vegetable oil portion, covered. Add tamarind near the end.', 'Ivy gourd is tender, without a hard raw centre.'],
    ['off', 0, 'Cool and pulse the vegetables with salt and roasted powder, without extra water.', 'Keep a coarse, spoonable texture.'],
    ['medium', 120, 'Temper the final mustard, cumin, dals, dried chilli, hing and curry leaves; mix in with coriander.', 'Dals are crisp and golden.'],
  ] },
  { index: 16, id: 'allam-pachadi', title: 'Allam pachadi', te: 'అల్లం పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 30, prep: 10, cook: 15, summary: 'A sweet-sour ginger chutney; this source uses green chillies.', stages: [
    ['medium', 300, 'Fry chopped green chillies in the first oil portion; add sliced ginger and cook a few minutes.', 'Chillies soften and ginger loses its harsh raw smell.'],
    ['off', 0, 'Cool; blend with softened tamarind, jaggery, salt and a little clean water.', 'A small taste balances ginger heat, sourness and sweetness.'],
    ['medium', 90, 'Heat the second oil portion; temper mustard, cumin, dried chilli and curry leaves.', 'Mustard has popped without burning.'],
    ['off', 0, 'Fold the tempering through and portion into a clean container.', 'This is a strong condiment; start with a small spoonful.'],
  ], note: 'Large condiment batch retained from the source; it is not a validated long-life preserve.' },
  { index: 17, id: 'mango-peanut-chutney', title: 'Raw mango peanut chutney', te: 'మామిడికాయ పల్లీ పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 6, prep: 10, cook: 5, summary: 'A tart mango chutney, adapted here to use roasted peanuts.', stages: [
    ['off', 0, 'Peel and chop washed raw mango; check that the peanuts are fresh and fully roasted.', 'Do not use rancid or mouldy nuts.'],
    ['off', 0, 'Blend mango, roasted peanuts, green chilli, salt and a little clean water.', 'The paste is smooth enough to spoon; adjust chilli before grinding more.'],
    ['medium', 90, 'Temper mustard, urad, cumin and dry curry leaves in oil.', 'Urad is golden and mustard has popped.'],
    ['off', 0, 'Stir into the chutney and serve promptly or refrigerate.', 'Sourness varies with the mango variety.'],
  ], note: 'Intentional editorial variant: roasted peanuts replace the source’s soaked raw peanuts; flavour and water needs differ.' },
  { index: 18, id: 'minapappu-pachadi', title: 'Minapappu pachadi', te: 'మినపప్పు పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 8, prep: 10, cook: 20, summary: 'Whole-skinned urad chutney with tamarind and jaggery.', stages: [
    ['low', 600, 'Use half the oil to roast whole urad slowly; set aside. Roast fenugreek, cumin and dried chilli separately.', 'Urad smells nutty throughout; a burnt seed makes the chutney bitter.'],
    ['off', 0, 'Cool the roasted ingredients. Grind with tamarind, jaggery, optional garlic and salt, adding water gradually.', 'Keep a coarse, thick texture.'],
    ['medium', 60, 'Temper mustard and curry leaves in the remaining oil.', 'Mustard splutters; leaves are dry before adding.'],
    ['off', 0, 'Combine with the chutney, then adjust salt and sourness.', 'Tamarind is balanced rather than sharply dominant.'],
  ], note: 'Salt and optional garlic occur in the source method but are omitted from its ingredient list; included explicitly here.' },
  { index: 19, id: 'dosakaya-pachadi', title: 'Dosakaya mustard pachadi', te: 'దోసకాయ ఆవ పచ్చడి', region: 'andhra', categories: ['chutney'], servings: 5, prep: 70, cook: 5, summary: 'Crunchy yellow cucumber folded through a mustard-tamarind paste.', stages: [
    ['off', 0, 'Wash and dice yellow cucumber; discard any bitter cucumber rather than using it.', 'Pieces should taste mild and be crisp.'],
    ['low', 180, 'Roast the tempering mustard, fenugreek, dals, cumin, dried chilli and hing in the small oil portion.', 'The dals are golden, without scorched spices.'],
    ['off', 0, 'Cool; grind with the remaining mustard, green chilli, tamarind, turmeric, coriander, salt and a little water.', 'The paste is smooth and pungent.'],
    ['off', 3600, 'Fold the paste and remaining oil into cucumber. Rest about an hour in the refrigerator.', 'Cucumber releases some juice; stir before serving.'],
  ] },
  { index: 20, id: 'bachali-pappu', title: 'Bachali aaku pappu', te: 'బచ్చలికూర పప్పు', region: 'andhra', categories: ['dal'], servings: 8, prep: 35, cook: 30, summary: 'Malabar spinach with toor, moong and chana dal.', stages: [
    ['off', 1800, 'Rinse and soak the cooking dals. Wash the leaves thoroughly and chop.', 'Remove tough stems and damaged leaves.'],
    ['medium', 1200, 'Pressure-cook the dals, greens, turmeric, green chilli and water according to the cooker guide; release naturally.', 'All three dals mash easily.'],
    ['low', 300, 'Mash; simmer with tamarind and salt.', 'The sourness is integrated and the dal is spoonable.'],
    ['medium', 180, 'Temper mustard, dals, cumin, dried chilli, hing and curry leaves in oil. Soften the tomato in it and fold into dal.', 'Tomato loses its raw bite.'],
  ] },
  { index: 21, id: 'sorakaya-pappu', title: 'Sorakaya pappu', te: 'సొరకాయ పప్పు', region: 'andhra', categories: ['dal'], servings: 6, prep: 65, cook: 30, summary: 'Bottle gourd and mixed dal finished with lemon and garlic tempering.', stages: [
    ['off', 3600, 'Rinse and soak toor and moong. Peel and dice a fresh, non-bitter bottle gourd.', 'Discard the entire gourd if it tastes bitter; cooking cannot make it safe.'],
    ['medium', 1200, 'Pressure-cook dal, gourd, tomato, onion, turmeric, green chilli and water; let pressure fall naturally.', 'The gourd is soft and both dals mash.'],
    ['medium', 180, 'Temper mustard, cumin, hing, curd chilli, curry leaves and garlic in oil or ghee.', 'Garlic is pale golden; do not burn the curd chilli.'],
    ['off', 0, 'Mash the dal; add tempering, salt, lemon and coriander.', 'A soft texture and fresh lemon aroma remain.'],
  ] },
  { index: 22, id: 'pepper-pappu-charu', title: 'Miriyala pappu charu', te: 'మిరియాల పప్పు చారు', region: 'andhra', categories: ['dal'], servings: 6, prep: 35, cook: 40, summary: 'Thin tamarind dal with freshly roasted pepper masala.', stages: [
    ['medium', 1200, 'Soak toor thirty minutes; cook with the smaller water portion and turmeric until mashable. Release pressure naturally.', 'No hard lentil centres remain.'],
    ['low', 180, 'Toast pepper, the first cumin portion, fenugreek, coriander and one dried chilli; cool and grind coarsely.', 'Pepper smells fragrant, without smoke.'],
    ['medium', 300, 'Temper mustard, urad, remaining cumin, chilli, hing and curry leaves in ghee. Soften onion and tomato.', 'Onion is translucent and tomato collapses.'],
    ['low', 1200, 'Add tamarind, pepper powder, dal and the larger water portion. Simmer about twenty minutes; finish with coriander.', 'The charu is pourable and the raw tamarind smell has softened.'],
  ] },
  { index: 23, id: 'rayalaseema-mutton-fry', title: 'Rayalaseema mutton fry', te: 'రాయలసీమ మటన్ వేపుడు', region: 'rayalaseema', categories: ['fry'], servings: 4, prep: 190, cook: 60, summary: 'Marinated mutton cooked tender, then reduced with chilli and curry leaves.', stages: [
    ['off', 10800, 'Coat mutton with the marinade oil, ginger-garlic, coriander, chilli, turmeric and salt. Refrigerate at least three hours.', 'Raw meat stays chilled throughout marination.'],
    ['medium', 1800, 'Cook with 300 ml water in a pressure cooker using its meat guidance; let pressure release naturally.', 'Meat is fork-tender; extend cooking if still chewy.'],
    ['medium', 180, 'Fry dried chilli, green chilli, curry leaves and remaining ginger-garlic in the frying oil.', 'The aromatics smell cooked rather than raw.'],
    ['medium', 900, 'Add meat and its cooking liquid. Reduce, stirring; finish with garam masala and coriander.', 'Liquid evaporates and masala coats tender meat; avoid burning the pan.'],
  ] },
  { index: 24, id: 'fish-pulusu', title: 'Andhra chepala pulusu', te: 'ఆంధ్ర చేపల పులుసు', region: 'andhra', categories: ['seafood'], servings: 5, prep: 15, cook: 35, summary: 'Fish simmered gently in tamarind gravy with a fresh spice powder.', stages: [
    ['low', 180, 'Toast coriander seeds, dried chilli and fenugreek; cool and grind with the masala garlic.', 'Spices are aromatic, without blackened seeds.'],
    ['medium', 600, 'Blend onion and green chilli. Fry with curry leaves, ginger-garlic, turmeric and spice powders; soften the tomato.', 'The onion paste loses its raw smell.'],
    ['medium', 300, 'Add tamarind juice and water; boil the gravy before adding fish.', 'The sauce is seasoned before delicate fish is added.'],
    ['low', 1200, 'Nestle fish into the gravy. Simmer gently; finish with ground masala and coriander.', 'Fish reaches 63°C or is opaque and flakes readily; swirl the pot instead of stirring hard.'],
  ] },
  { index: 25, id: 'prawn-masala', title: 'Andhra royyala masala', te: 'ఆంధ్ర రొయ్యల మసాలా', region: 'andhra', categories: ['seafood'], servings: 3, prep: 40, cook: 25, summary: 'Prawns in a reduced onion-ginger-garlic masala.', stages: [
    ['off', 1800, 'Coat cleaned prawns with salt and turmeric; refrigerate thirty minutes. Blend onion, chilli, ginger and garlic.', 'Keep shellfish chilled while preparing the paste.'],
    ['medium', 120, 'Briefly sauté prawns in part of the oil; reserve while preparing the gravy.', 'This is partial cooking; return them promptly to finish, not to storage.'],
    ['medium', 600, 'Use the remaining oil for curry leaves and onion paste. Cook down; add chilli, coriander and cumin powders with a splash of water.', 'The paste loses its raw onion smell.'],
    ['medium', 300, 'Return prawns; cook just until done and gravy thickens. Finish with garam masala and coriander.', 'Prawns are pearly and opaque throughout; stop before they become rubbery.'],
  ] },
  { index: 26, id: 'gongura-mutton', title: 'Gongura mutton', te: 'గోంగూర మటన్', region: 'andhra', categories: ['curry'], servings: 5, prep: 15, cook: 100, summary: 'Slow-cooked mutton finished with sorrel and freshly ground spices.', stages: [
    ['medium', 3600, 'In half the oil, cook onion, ginger-garlic, turmeric, mutton, chilli, salt and water, covered.', 'Check regularly; meat becomes fork-tender, adding hot water if the pot dries.'],
    ['low', 240, 'Toast coriander, cumin, cinnamon, cloves, pepper and dried chilli; add whole garlic last. Cool and grind.', 'The spice mixture is fragrant and not burnt.'],
    ['medium', 900, 'Add washed gongura leaves and remaining oil to the tender meat. Cook until the leaves collapse.', 'Sorrel is soft and distributed through the gravy.'],
    ['low', 600, 'Add grated garlic and ground masala; simmer covered, stirring occasionally.', 'Garlic no longer tastes raw and the gravy coats tender meat.'],
  ] },
  { index: 27, id: 'chicken-curry', title: 'Fresh masala chicken curry', te: 'మసాలా చికెన్ కూర', region: 'andhra', categories: ['curry'], servings: 5, prep: 45, cook: 45, summary: 'A roasted coconut-spice chicken curry with yogurt marinade.', stages: [
    ['low', 300, 'Toast whole spices, coconut, poppy seeds and dried chilli. Cool; blend with yogurt, ginger-garlic, turmeric and salt.', 'The spice paste is smooth and fragrant.'],
    ['off', 1800, 'Coat chicken with the paste, marinade oil, lemon, green chilli and herbs; refrigerate thirty minutes.', 'Keep raw chicken and its utensils separate from ready-to-eat food.'],
    ['medium', 600, 'Fry onion, garlic and curry leaves in the cooking oil; soften the tomato. Add marinated chicken and stir.', 'The tomato collapses and the masala coats the chicken.'],
    ['medium', 1500, 'Add the measured water and simmer until chicken is cooked. Finish with lemon and coriander.', 'Check the thickest pieces reach 74°C; a timer alone does not verify safety.'],
  ] },
  { index: 28, id: 'village-mutton-curry', title: 'Village-style mutton curry', te: 'పల్లెటూరి మటన్ కూర', region: 'andhra', categories: ['curry'], servings: 5, prep: 75, cook: 60, summary: 'Pressure-cooked mutton with tomato and whole spices.', stages: [
    ['off', 3600, 'Mix meat with marinade oil, ginger-garlic, salt, lemon and turmeric. Refrigerate for at least one hour.', 'Marination happens in the refrigerator, never on the counter.'],
    ['off', 0, 'Coat with onion, tomato, chilli and coriander powders, whole spices and green chilli.', 'The marinade covers the pieces evenly.'],
    ['medium', 2100, 'Heat cooking oil; add coated meat and water. Pressure-cook using the appliance guidance and release naturally.', 'Meat is fork-tender; re-cook if connective tissue is still tough.'],
    ['low', 300, 'Simmer uncovered to thicken; finish with coriander.', 'The sauce coats the meat without scorching.'],
  ] },
  { index: 29, id: 'nellore-fish-pulusu', title: 'Nellore chepala pulusu', te: 'నెల్లూరు చేపల పులుసు', region: 'andhra', categories: ['seafood'], servings: 4, prep: 15, cook: 50, summary: 'A tangy fish pulusu with raw mango and a light roasted masala.', stages: [
    ['off', 0, 'Season fish lightly with turmeric, chilli and salt; refrigerate. Grind fenugreek, mustard, cumin and coriander.', 'Chilli and salt are adjustable; this source is very strongly seasoned.'],
    ['medium', 600, 'Temper mustard; soften onion, green chilli and curry leaves in oil. Cook in tomato, chilli and salt.', 'Tomato becomes pulpy and the oil begins separating.'],
    ['medium', 600, 'Boil with tamarind juice, then add fish and hing gently.', 'The gravy is simmering, not violently bubbling.'],
    ['low', 1200, 'Add mango and ground spices; finish cooking by gently swirling the pot. Add coriander.', 'Fish reaches 63°C or flakes easily; mango is tender.'],
  ], note: 'Salt is deliberately to taste, replacing the source’s unusually high fixed amount. Omitted overnight room-temperature resting advice; refrigerate promptly.' },
  { index: 30, id: 'tomato-chicken', title: 'Tomato chicken', te: 'టమాటా చికెన్', region: 'andhra', categories: ['curry'], servings: 4, prep: 15, cook: 40, summary: 'Tomato-rich chicken with both a cooked paste and soft tomato pieces.', stages: [
    ['medium', 180, 'Fry a portion of tomato pieces in oil; reserve. Temper mustard, cumin and dried chilli in the same pan.', 'Tomato pieces soften but still hold their shape.'],
    ['medium', 600, 'Brown onion lightly; add ginger-garlic and the remaining tomatoes, puréed. Cook down thoroughly.', 'The tomato paste loses its raw smell.'],
    ['medium', 240, 'Add green chilli, salt and spice powders; coat chicken in the masala.', 'Stir so the bottom does not catch.'],
    ['medium', 1500, 'Add 250 ml water and simmer. Return reserved tomatoes and curry leaves; finish with coriander.', 'Chicken reaches 74°C in the thickest pieces and the sauce has thickened.'],
  ] },
  { index: 31, id: 'pepper-chicken', title: 'Pepper chicken fry', te: 'మిరియాల చికెన్ వేపుడు', region: 'south-indian', categories: ['fry'], servings: 4, prep: 15, cook: 35, summary: 'Dry chicken fry with freshly roasted pepper and whole-spice masala.', stages: [
    ['low', 240, 'Toast the whole masala spices gently; cool and powder.', 'Pepper and fennel are aromatic without smoke.'],
    ['medium', 360, 'Temper mustard, dried chilli, curry leaves and garlic in oil. Soften onion and ginger-garlic.', 'Onion is golden and garlic is not burnt.'],
    ['medium', 900, 'Add chicken, cover and cook in its released juices, stirring regularly.', 'Add a splash of water if the pan dries before the chicken cooks.'],
    ['medium', 600, 'Add salt, chilli, turmeric, lemon and pepper masala; reduce until coated. Finish with ghee and coriander.', 'Check 74°C inside the thickest chicken pieces before serving.'],
  ] },
  { index: 32, id: 'telangana-chicken-fry', title: 'Telangana chicken fry', te: 'తెలంగాణ చికెన్ వేపుడు', region: 'telangana', categories: ['fry'], servings: 4, prep: 10, cook: 40, summary: 'A slow-reduced chicken roast with onion, curry leaves and tamarind.', stages: [
    ['medium', 480, 'Brown sliced onion in oil. Add green chilli, curry leaves and ginger-garlic.', 'Aromatics smell cooked and onions are golden.'],
    ['medium', 180, 'Add chicken, salt, turmeric and the powdered spices; coat thoroughly.', 'Do not let dry spices burn against the pan.'],
    ['low', 1200, 'Cover and cook with a little water, stirring and scraping gently every few minutes.', 'Chicken cooks through; add water if the masala catches.'],
    ['medium', 600, 'Reduce with tamarind juice; finish with pepper and coriander.', 'The coating is thick, chicken reaches 74°C, and no burnt crust remains.'],
  ] },
  { index: 33, id: 'telangana-egg-curry', title: 'Telangana masala egg curry', te: 'తెలంగాణ మసాలా గుడ్డు కూర', region: 'telangana', categories: ['curry'], servings: 5, prep: 25, cook: 35, summary: 'Boiled eggs in peanut, sesame, coconut and tamarind gravy.', stages: [
    ['low', 300, 'Roast peanuts and fenugreek; add coriander, cumin, sesame and coconut in that order. Cool.', 'Nuts are cooked through and sesame is lightly golden.'],
    ['medium', 480, 'Brown onion in oil. Blend it with the roasted mixture, ginger-garlic, chilli, turmeric, tamarind and salt.', 'The paste is smooth, without gritty peanuts.'],
    ['medium', 180, 'Make shallow cuts in peeled, fully boiled eggs. Lightly fry, then reserve. Cook the masala paste in the pan.', 'Eggs stay intact and paste loses its raw smell.'],
    ['low', 900, 'Add water gradually, simmer, then return eggs for about fifteen minutes. Finish with coriander.', 'The gravy is creamy; stir gently from the bottom to prevent sticking.'],
  ] },
  { index: 34, id: 'ridge-gourd-egg', title: 'Beerakaya egg bhurji', te: 'బీరకాయ గుడ్డు పొరటు', region: 'andhra', categories: ['curry'], servings: 3, prep: 10, cook: 25, summary: 'Ridge gourd cooked first, then finished with set and broken eggs.', stages: [
    ['medium', 180, 'Temper cumin, dried chilli, green chilli, ginger and curry leaves in oil.', 'Ginger smells fragrant, without burnt spice.'],
    ['medium', 600, 'Soften chopped onion. Add peeled ridge gourd, turmeric, chilli, coriander powder and salt; cover.', 'Gourd is tender and most released water has evaporated.'],
    ['low', 300, 'Crack eggs over the vegetables. Cover until set before breaking them into soft pieces.', 'Eggs are fully firm; egg mixtures should reach 71°C.'],
    ['medium', 180, 'Fold gently and reduce remaining moisture. Finish with coriander and a little garam masala.', 'The dish is moist without watery egg.'],
  ] },
  { index: 35, id: 'tomato-egg-pulusu', title: 'Tomato egg pulusu', te: 'టమాటా గుడ్డు పులుసు', region: 'andhra', categories: ['curry'], servings: 3, prep: 10, cook: 25, summary: 'Eggs gently set in a loose tomato gravy.', stages: [
    ['medium', 300, 'Temper mustard and cumin in oil; soften onion with turmeric and a little salt.', 'Onion is translucent, without harsh raw aroma.'],
    ['medium', 480, 'Add tomato, green chilli, ginger-garlic, curry leaves and powdered spices; cook to a pulp.', 'Tomato crushes easily and the masala smells cooked.'],
    ['medium', 180, 'Add water; bring the gravy to a boil, then reduce to a gentle simmer.', 'There is enough liquid to surround the eggs.'],
    ['low', 600, 'Pour lightly beaten eggs into the gravy; leave undisturbed until fully set. Fold gently with pepper and coriander.', 'Egg is firm throughout; egg mixtures should reach 71°C.'],
  ] },
  { index: 36, id: 'kerala-egg-curry', title: 'Kerala coconut milk egg curry', te: 'కేరళ కొబ్బరి పాల గుడ్డు కూర', region: 'kerala', categories: ['curry'], servings: 4, prep: 25, cook: 25, summary: 'Boiled eggs in an onion-and-coconut-milk gravy.', stages: [
    ['medium', 300, 'Temper mustard and curry leaves in coconut oil; soften onion and green chilli.', 'Onions are lightly golden.'],
    ['medium', 480, 'Add tomato and ginger-garlic. Cook to a pulp, then stir in coriander, chilli, garam masala and fennel.', 'A splash of water prevents dry spices scorching.'],
    ['low', 300, 'Add thin coconut milk and simmer gently. Add peeled, halved, fully boiled eggs.', 'Eggs warm through without breaking.'],
    ['off', 0, 'Turn off the heat before stirring in thick coconut milk.', 'The gravy is smooth; avoid a hard boil after thick milk is added.'],
  ], note: 'Ginger-garlic paste is mentioned only in the source method; a one-teaspoon editorial starting amount is included.' },
  { index: 37, id: 'peanut-rice', title: 'Peanut sesame rice', te: 'పల్లీ నువ్వుల అన్నం', region: 'south-indian', categories: ['rice'], servings: 2, prep: 10, cook: 15, summary: 'Cooked rice tossed with a fresh peanut, sesame and coconut powder.', stages: [
    ['low', 300, 'Toast peanuts, dried chilli, coconut and sesame in stages; cool and grind coarsely.', 'Peanuts are cooked through and sesame is not burnt.'],
    ['medium', 120, 'Temper mustard, urad, chana and curry leaves in oil.', 'The dals are golden and crisp.'],
    ['medium', 180, 'Add safely stored cooked rice, salt and peanut powder; toss gently until hot throughout.', 'Grains stay separate; refrigerated leftovers reach 74°C.'],
    ['off', 0, 'Serve promptly or cool quickly for refrigeration.', 'Do not leave cooked rice cooling on the counter for hours.'],
  ], note: 'Source quantity is one cup cooked rice; this record counts two small side portions rather than four mains.' },
  { index: 38, id: 'coconut-rice', title: 'Coconut milk rice', te: 'కొబ్బరి పాల అన్నం', region: 'south-indian', categories: ['rice'], servings: 4, prep: 35, cook: 30, summary: 'Rice cooked in diluted coconut milk and finished with a coconut tempering.', stages: [
    ['off', 1800, 'Rinse rice and soak thirty minutes, then drain. Measure diluted coconut milk and water.', 'Use the corrected cup measure; the source page prints an implausible litre unit.'],
    ['medium', 1200, 'Cook rice with coconut milk and water using the vessel’s rice guidance. Let pressure release naturally if pressure-cooking.', 'Grains are cooked; add hot water if a hard centre remains.'],
    ['medium', 180, 'Temper cashews, mustard, cumin, dals, curry leaves and chilli in oil; add grated coconut briefly.', 'Cashews are golden and coconut is still pale.'],
    ['off', 0, 'Gently fold the tempering, salt and coriander into the cooked rice.', 'Rest before fluffing so the grains do not break.'],
  ], note: 'Editorial correction: 1¾ cups diluted coconut milk replaces the source’s 1¾ litres for one cup rice. This correction is not kitchen-tested.' },
  { index: 39, id: 'pudina-rice', title: 'Pudina rice', te: 'పుదీనా అన్నం', region: 'south-indian', categories: ['rice'], servings: 2, prep: 30, cook: 15, summary: 'Cooked-rice mint pulao with whole spices and a fresh mint finish.', stages: [
    ['off', 0, 'Cook and drain the measured raw rice separately, or use its safely refrigerated cooked yield.', 'Raw rice cannot be tossed directly into this dry-pan method.'],
    ['medium', 300, 'Fry whole spices in oil and ghee; soften onion and green chilli.', 'Onion turns lightly golden.'],
    ['medium', 180, 'Add ginger-garlic, salt, garam masala and mint paste; cook until fragrant. Wilt some mint leaves.', 'The paste loses its harsh raw smell.'],
    ['medium', 180, 'Fold in cooked rice and heat thoroughly. Finish with lemon and the remaining fresh mint.', 'Grains stay separate; refrigerated leftovers reach 74°C.'],
  ], note: 'The source lists rice but uses cooked rice in this method; the preparatory rice-cooking stage is made explicit.' },
  { index: 40, id: 'ava-pulihora', title: 'Ava pulihora', te: 'ఆవ పులిహోర', region: 'andhra', categories: ['rice'], servings: 30, prep: 20, cook: 50, summary: 'Large-batch tamarind rice with a pungent mustard paste.', stages: [
    ['off', 0, 'Soften tamarind in hot water and extract thick pulp. Grind mustard, ginger, chilli, turmeric and salt with a little hot water.', 'Stir the mustard-paste oil in after grinding.'],
    ['medium', 1500, 'Cook the kilogram of rice with turmeric and the measured cooking water; spread gently in a wide bowl with a little oil.', 'Grains are cooked but retain their shape.'],
    ['medium', 180, 'Temper peanuts, mustard, urad, chana, dried chilli, hing and curry leaves in the larger oil portion.', 'Peanuts and dals are cooked through and golden.'],
    ['off', 1800, 'Fold tamarind, salt, green chilli, tempering and mustard paste through the rice. Rest briefly before serving.', 'Taste in small portions; mustard strength increases during resting.'],
  ], note: 'Retains the source’s one-kilogram rice batch. Water and cookware must be reassessed when resizing, not simply multiplied.' },
  { index: 41, id: 'kaju-pulao', title: 'Kaju pulao', te: 'జీడిపప్పు పులావ్', region: 'south-indian', categories: ['rice'], servings: 2, prep: 35, cook: 30, summary: 'Cashew pulao with whole spices, herbs and a light rose aroma.', stages: [
    ['off', 1800, 'Rinse basmati, soak thirty minutes, then drain.', 'Rice is hydrated before pressure-cooking.'],
    ['medium', 480, 'Fry whole spices in oil and ghee. Add onion, then cashews; brown lightly.', 'Cashews turn golden without burning the onion.'],
    ['medium', 120, 'Add green chilli, herbs, ginger-garlic, salt and turmeric; cook briefly.', 'The ginger-garlic smells cooked.'],
    ['medium', 600, 'Add soaked basmati, water and food-grade rose petals. Cook using the appliance’s rice guidance.', 'For the source method, start with one cup water; rice and cooker type may need more.'],
    ['off', 900, 'Let pressure fall naturally and rest about fifteen minutes. Fluff gently.', 'Rice is tender; add hot water and finish covered if its centre is hard.'],
  ] },
  { index: 42, id: 'chicken-pulao', title: 'Chicken pulao', te: 'చికెన్ పులావ్', region: 'south-indian', categories: ['rice'], servings: 3, prep: 40, cook: 45, summary: 'A pressure-cooker chicken-and-basmati pulao with yogurt and herbs.', stages: [
    ['off', 1800, 'Rinse and soak basmati thirty minutes. Keep chicken chilled while preparing the ingredients.', 'Drain soaked rice just before adding.'],
    ['medium', 480, 'Temper whole spices in oil; brown onion, then add ginger-garlic and powdered spices.', 'Spices smell fragrant and are not scorched.'],
    ['medium', 300, 'Soften tomato, add chicken and sauté. Add the measured water, rice, whisked yogurt and herbs.', 'Scrape the base clean before sealing the cooker.'],
    ['medium', 900, 'Cook according to the cooker’s chicken-and-rice guidance; allow natural pressure release.', 'Chicken reaches 74°C and rice is tender; cook further if either check fails.'],
    ['off', 900, 'Rest, then fluff from the sides without crushing the rice.', 'All pressure has fallen before opening.'],
  ] },
  { index: 43, id: 'tomato-rice', title: 'Tomato rice', te: 'టమాటా అన్నం', region: 'south-indian', categories: ['rice'], servings: 2, prep: 10, cook: 20, summary: 'A quick cooked-rice method with both tomato paste and pieces.', stages: [
    ['medium', 120, 'Fry shah jeera, cloves, cinnamon and cardamom in oil and ghee.', 'Spices are aromatic, not blackened.'],
    ['medium', 300, 'Soften onion; add ginger-garlic and tomato paste. Cook until the raw smell softens.', 'Stir so the thick paste does not catch.'],
    ['medium', 300, 'Add spice powders, salt and diced tomato; cook until pulpy.', 'There are no firm raw tomato pieces.'],
    ['medium', 180, 'Toss in cooked rice; heat through and finish with coriander.', 'Safely refrigerated leftover rice reaches 74°C throughout.'],
  ] },
  { index: 44, id: 'aloo-methi-fry', title: 'Aloo methi fry', te: 'ఆలూ మెంతికూర వేపుడు', region: 'south-indian', categories: ['fry'], servings: 4, prep: 40, cook: 35, summary: 'Potato fry with fresh fenugreek leaves and a crisp finish.', stages: [
    ['off', 1800, 'Soak diced potato thirty minutes; drain and dry thoroughly.', 'No surface water remains before frying in oil.'],
    ['medium', 900, 'Fry potatoes in batches until lightly golden and nearly tender; reserve.', 'A knife enters easily; lower heat if edges brown before centres cook.'],
    ['medium', 180, 'In the pan oil, toast fenugreek seeds and dried chilli; wilt chopped methi leaves.', 'Leaves soften; seeds must not turn black.'],
    ['medium', 300, 'Return potato with salt, chilli and coriander powder. Toss until cooked and crisp.', 'Potato centres are tender; serve without trapping steam under a tight lid.'],
  ] },
  { index: 45, id: 'carrot-peanut-fry', title: 'Carrot peanut fry', te: 'క్యారెట్ పల్లీ వేపుడు', region: 'andhra', categories: ['fry'], servings: 4, prep: 10, cook: 25, summary: 'Tender carrots finished with a roasted peanut-sesame spice powder.', stages: [
    ['medium', 600, 'Cook chopped carrot with the measured water, covered, until tender; drain excess liquid.', 'Carrot holds its shape but is easy to bite.'],
    ['low', 300, 'Toast peanuts, chana, cumin, sesame and coriander; add dry coconut last. Cool; grind with garlic, chilli and salt.', 'Peanuts and chana are cooked through.'],
    ['medium', 420, 'Temper mustard and curry leaves in oil. Add turmeric and cooked carrots; sauté.', 'Carrots dry slightly without sticking.'],
    ['low', 60, 'Fold in enough spice powder to coat, starting with half a cup, then add coriander.', 'Reserve excess powder separately; the fry should not be powdery.'],
  ] },
  { index: 46, id: 'chemadumpa-fry', title: 'Chemadumpa vepudu', te: 'చేమదుంప వేపుడు', region: 'andhra', categories: ['fry'], servings: 4, prep: 20, cook: 30, summary: 'Cooked colocasia slices coated in rice flour and fried crisp.', stages: [
    ['medium', 900, 'Cook whole colocasia until tender, cool enough to handle, then peel and slice.', 'Do not taste raw colocasia; a knife should enter without resistance.'],
    ['off', 0, 'Coat gently with rice flour, turmeric, chilli, salt and amchur; add a little oil and the remaining flour.', 'Slices remain intact with a light, dry coating.'],
    ['medium', 360, 'Fry in small batches until golden and crisp; drain.', 'Centres are fully cooked, not hard or irritating.'],
    ['medium', 90, 'Temper garlic, curry leaves, mustard, cumin, urad and dried chilli in the smaller oil portion. Toss with the slices and curry powder.', 'Tempering is golden; toss gently to preserve the crust.'],
  ] },
  { index: 47, id: 'okra-garlic-fry', title: 'Okra garlic fry', te: 'వెల్లుల్లి బెండకాయ వేపుడు', region: 'andhra', categories: ['fry'], servings: 6, prep: 15, cook: 20, summary: 'Dry okra fry with peanuts and a coarse garlic-cumin seasoning.', stages: [
    ['off', 0, 'Wash okra, dry thoroughly and cut into short pieces.', 'Dry pieces reduce spluttering and sticky moisture.'],
    ['medium', 600, 'Fry okra in batches until tender and lightly golden; drain.', 'Do not fry so dark that the vegetable becomes bitter.'],
    ['medium', 180, 'Fry peanuts and dry curry leaves separately in the same oil.', 'Peanuts are cooked through and crisp.'],
    ['off', 0, 'Crush garlic, cumin, salt and chilli powder; toss with hot okra, peanuts and leaves.', 'Serve promptly without a sealed lid that traps steam.'],
  ] },
  { index: 48, id: 'ragi-neer-dosa', title: 'Ragi neer dosa', te: 'రాగి నీర్ దోశ', region: 'karnataka', categories: ['breakfast'], servings: 3, prep: 490, cook: 20, summary: 'Rice-and-ragi dosas with a thin, porous texture.', stages: [
    ['off', 28800, 'Rinse rice and soak overnight; drain before grinding.', 'Grains soften enough for a fine batter.'],
    ['off', 0, 'Grind with ragi flour, cumin, green chilli and water added gradually.', 'Batter is smooth and thin enough to spread naturally.'],
    ['high', 60, 'Lightly oil a hot tawa. Pour a small ladle of batter without spreading; cover briefly.', 'Use high heat only with suitable cookware; lower it if oil smokes.'],
    ['medium', 60, 'Lift when the surface is set and edges release. Rest briefly on a rack before stacking.', 'There is no wet raw batter at the centre.'],
  ] },
  { index: 49, id: 'udupi-pepper-rasam', title: 'Udupi pepper rasam', te: 'ఉడుపి మిరియాల రసం', region: 'karnataka', categories: ['dal'], servings: 5, prep: 10, cook: 20, summary: 'A no-garlic pepper rasam thickened with roasted urad and coconut.', stages: [
    ['low', 300, 'Toast pepper, urad and coriander in half the ghee; add the first cumin portion and coconut last.', 'Urad is golden and coconut is lightly toasted.'],
    ['off', 0, 'Cool and grind into a semi-coarse paste with a little water.', 'No whole hard dal pieces remain.'],
    ['medium', 480, 'Boil tamarind extract with water, turmeric and salt; stir in jaggery and the ground paste.', 'The raw tamarind smell mellows.'],
    ['medium', 120, 'Temper mustard, remaining cumin, curry leaves and hing in the remaining ghee; add and simmer briefly.', 'The finished rasam is thin enough to pour.'],
  ] },
  { index: 50, id: 'cabbage-saagu', title: 'Karnataka cabbage saagu', te: 'కర్ణాటక క్యాబేజీ సాగు', region: 'karnataka', categories: ['curry'], servings: 5, prep: 15, cook: 30, summary: 'Cabbage in a coconut, roasted gram and cashew kurma.', stages: [
    ['off', 0, 'Blend coconut, roasted chana, cashew, green chilli and cinnamon with a little water.', 'The paste is smooth, without gritty cashew pieces.'],
    ['medium', 480, 'Temper cumin and curry leaves in oil. Soften onion, then ginger-garlic and tomato.', 'Tomato becomes pulpy.'],
    ['medium', 300, 'Add the ground paste with a splash of water; cook until the raw aroma softens.', 'Stir frequently because coconut paste catches easily.'],
    ['low', 900, 'Add cabbage, salt and half a cup water. Cover and cook until tender; finish with garam masala and coriander.', 'Cabbage is soft and the gravy coats it.'],
  ], note: 'Uses the source method’s half-cup water instruction instead of its malformed ingredient amount “1/250 Cup/ml”.' },
  { index: 51, id: 'drumstick-sambar', title: 'Munakkada sambar', te: 'మునక్కాడ సాంబారు', region: 'tamil', categories: ['dal'], servings: 6, prep: 40, cook: 50, summary: 'Drumstick sambar with freshly roasted coconut-spice paste.', stages: [
    ['medium', 1200, 'Soak toor thirty minutes; cook with its garlic, turmeric and water until soft. Mash after natural pressure release.', 'No firm dal centres remain.'],
    ['low', 300, 'Roast the masala seeds, dals and dried chilli in its oil; add poppy and coconut last. Cool and grind.', 'The paste is aromatic, without burnt fenugreek.'],
    ['medium', 900, 'Soften small onions, drumstick and green chilli in oil and water. Add tomato, then tamarind and salt.', 'Drumstick flesh is tender before adding the acid.'],
    ['low', 900, 'Add spice paste, dal, chilli, turmeric, jaggery and remaining water. Simmer, stirring.', 'The raw spice aroma is gone and the sauce is pourable.'],
    ['medium', 120, 'Temper the final mustard, garlic, chilli, hing, cumin and curry leaves; fold in with coriander.', 'Garlic is golden, not burnt.'],
  ] },
  { index: 52, id: 'sambar-rice', title: 'Sambar saadham', te: 'సాంబారు అన్నం', region: 'tamil', categories: ['rice'], servings: 6, prep: 70, cook: 45, summary: 'Soft rice and dal combined with mixed vegetables and tamarind masala.', stages: [
    ['off', 3600, 'Rinse and soak rice and toor one hour; pressure-cook with the cooking water, turmeric and a little salt.', 'Allow natural pressure release; rice and dal should mash easily.'],
    ['off', 0, 'Mix tamarind extract with sambar powder, chilli, turmeric and jaggery.', 'Break up any spice lumps.'],
    ['medium', 900, 'Temper mustard, fenugreek, dried chilli, curry leaves and hing. Add onion, green chilli and vegetables; cook covered.', 'Drumstick and firm root vegetables are tender before tamarind is added.'],
    ['low', 600, 'Add tamarind mixture, then cooked rice-dal and hot water. Simmer, stirring from the bottom.', 'The mixture is soft and loose, not a dry pulao.'],
    ['off', 0, 'Finish with ghee and coriander; adjust salt last.', 'It thickens on standing; loosen with hot water if needed.'],
  ], note: 'Salt is to taste rather than the high fixed source measure. Vegetable piece counts are retained as a source batch, not nutritional serving claims.' },
  { index: 53, id: 'mango-pulissery', title: 'Mambazha pulissery', te: 'మామిడిపండు పులిస్సేరి', region: 'kerala', categories: ['curry'], servings: 4, prep: 15, cook: 20, summary: 'Ripe mango, coconut and yogurt curry with a mustard tempering.', stages: [
    ['off', 0, 'Grind coconut, pepper and cumin to a smooth paste. Peel and mash ripe mango; whisk yogurt separately.', 'Use ripe sweet mangoes and plain, unsweetened yogurt.'],
    ['medium', 480, 'Simmer mango, coconut paste, water, curry leaves, chilli, turmeric and salt.', 'The coconut paste tastes cooked and the mango is soft.'],
    ['low', 180, 'Reduce heat; stir in whisked yogurt gradually and warm gently while stirring.', 'The curry stays smooth; do not let it boil violently.'],
    ['medium', 90, 'Temper fenugreek, mustard, dried chilli, curry leaves and hing in oil; add to the curry.', 'Mustard pops and fenugreek is lightly golden.'],
  ], note: 'The source method requires curd but its ingredient list omits it; one cup plain yogurt is an editorial starting amount requiring kitchen testing.' },
  { index: 54, id: 'paramannam', title: 'Rice paramannam', te: 'బియ్యం పరమాన్నం', region: 'andhra', categories: ['sweet'], servings: 4, prep: 10, cook: 35, summary: 'Soft rice-and-moong payasam with jaggery and cardamom.', stages: [
    ['medium', 1200, 'Cook washed rice and moong with milk and the cooking water until very soft.', 'Use a heavy pot or a cooker approved for milk; avoid overfilling.'],
    ['low', 300, 'Melt jaggery in the smaller water portion; strain into a separate bowl.', 'The syrup is free of visible grit.'],
    ['low', 300, 'Take the rice mixture briefly off heat; add slightly cooled syrup, then warm gently while stirring.', 'The mixture is creamy, without scorching or vigorous boiling.'],
    ['low', 120, 'Fry cashews and raisins in ghee; add with cardamom.', 'Raisins swell and cashews turn golden.'],
  ], note: 'Moong is in the source ingredient list but absent from its written steps; cooked with rice here. Camphor is intentionally omitted.' },
  { index: 55, id: 'rava-laddu', title: 'Rava laddu', te: 'రవ్వ లడ్డూ', region: 'south-indian', categories: ['sweet'], servings: 10, prep: 130, cook: 35, summary: 'Coconut-semolina laddus bound with a light string-stage syrup.', stages: [
    ['off', 7200, 'Mix coconut and semolina; rest covered for two hours.', 'This is a fresh-coconut sweet, not a shelf-stable dry laddu.'],
    ['low', 1500, 'Fry cashews and raisins in ghee; reserve. Toast the rested rava slowly in the same pan.', 'It is fragrant and pale golden, without a raw grain taste.'],
    ['medium', 300, 'Boil sugar with the measured water to a light single-thread syrup; turn off heat.', 'Test a cooled drop safely; never touch hot syrup.'],
    ['off', 0, 'Mix in toasted rava, nuts and cardamom. Cool until safely warm, then shape small laddus with lightly greased hands.', 'The mixture binds without burning your fingers; refrigerate after cooling.'],
  ], note: 'Source yield is about twenty small laddus; servings here count two each. Cardamom is recorded as pods to resolve an ambiguous source powder amount.' },
  { index: 56, id: 'chakkara-pongali', title: 'Chakkara pongali', te: 'చక్కెర పొంగలి', region: 'south-indian', categories: ['sweet'], servings: 6, prep: 10, cook: 45, summary: 'Sweet rice and moong with jaggery, sugar and a nutty ghee finish.', stages: [
    ['low', 240, 'Toast moong lightly; rinse with rice and cook with the measured water until very soft.', 'Both rice and dal mash easily.'],
    ['low', 300, 'Melt jaggery and sugar with the smaller water portion; strain the syrup.', 'No visible grit remains.'],
    ['low', 1200, 'Stir syrup into the cooked rice-dal. Simmer gently, scraping the bottom and adding ghee gradually.', 'Syrup is absorbed and the mixture remains soft.'],
    ['low', 180, 'Fry cashews, raisins and coconut in part of the measured ghee; add with cardamom.', 'Nuts are golden; the pongali is glossy rather than dry.'],
  ], note: 'Camphor and room-temperature multi-day storage claims are intentionally omitted; use ordinary refrigerated cooked-food handling.' },
  { index: 57, id: 'chegodilu', title: 'Chegodilu', te: 'చేగోడీలు', region: 'andhra', categories: ['snack'], servings: 6, prep: 45, cook: 35, summary: 'Cooked-flour snack rings with ajwain and sesame.', stages: [
    ['medium', 180, 'Bring water, ghee, ajwain, sesame, turmeric and salt to a boil.', 'Keep flour measured before starting.'],
    ['off', 0, 'Turn off heat; mix in maida firmly. When safe to handle, knead with a protected utensil or cloth-assisted method.', 'The dough is smooth; do not put bare hands into scalding dough.'],
    ['off', 1800, 'Roll thin cords, join into small rings and rest thirty minutes.', 'Seal joins well so rings do not unravel in oil.'],
    ['medium', 360, 'Fry small batches in hot oil, turning until crisp and golden; cool on a rack.', 'Use a test ring to set heat; smoke means the oil is too hot.'],
  ], note: 'Uses ghee instead of the source’s optional hydrogenated fat. Source does not specify yield; six snack portions is an editorial estimate.' },
  { index: 58, id: 'murukulu', title: 'Andhra murukulu', te: 'ఆంధ్ర మురుకులు', region: 'andhra', categories: ['snack'], servings: 4, prep: 20, cook: 30, summary: 'Rice-and-urad flour murukulu, pressed and fried in small spirals.', stages: [
    ['off', 0, 'Use finely milled rice and urad flours in the stated ratio; sieve together.', 'There are no coarse particles that could block the press.'],
    ['off', 0, 'Mix with salt, crushed ajwain, the measured oil and water added gradually.', 'The dough is soft enough to press without crumbling.'],
    ['off', 0, 'Oil the press; form small spirals on an oiled plate or safe flat surface.', 'Do not press directly over hot oil if you cannot control it safely.'],
    ['medium', 360, 'Slide in a few spirals at a time; fry until crisp, drain and cool completely.', 'Bubbling subsides and the cooled murukku snaps cleanly.'],
  ], note: 'Ingredient labels specify flours because the source starts by milling raw rice and urad together.' },
  { index: 59, id: 'tomato-pappu', title: 'Tomato pappu', te: 'టమాటా పప్పు', region: 'andhra', categories: ['dal'], servings: 6, prep: 35, cook: 35, summary: 'Wedding-style tomato dal with separately cooked tomato-tamarind masala.', stages: [
    ['medium', 1200, 'Soak cooking toor and chana thirty minutes; cook with turmeric, cooking oil and the larger water portion. Release naturally and mash.', 'Both dals are soft without gritty centres.'],
    ['medium', 480, 'Fry onion and green chilli in the tomato-group oil. Add chilli, salt and tomato; soften covered.', 'Tomato crushes easily.'],
    ['low', 300, 'Add sambar powder and tamarind; cook briefly, then stir in mashed dal and the smaller water portion.', 'The masala is integrated; add hot water if too thick.'],
    ['medium', 120, 'Temper mustard, chana, urad, dried chilli, cumin, curry leaves and hing in the final oil and ghee. Fold into dal.', 'Tempering dals are golden and crisp.'],
  ] },
  { index: 60, id: 'mudda-pappu', title: 'Mudda pappu', te: 'ముద్ద పప్పు', region: 'andhra', categories: ['dal'], servings: 5, prep: 10, cook: 30, summary: 'Soft plain toor dal with a small cumin-and-hing ghee tempering.', stages: [
    ['low', 240, 'Toast dry toor gently until fragrant; rinse well.', 'The dal stays light coloured, without burnt specks.'],
    ['medium', 1200, 'Cook with turmeric and water until completely soft, following the cooker guide; let pressure release naturally.', 'The dal mashes into a smooth paste.'],
    ['off', 0, 'Mash and salt to taste; adjust with hot water if needed.', 'It is thick but soft, not grainy.'],
    ['low', 60, 'Warm ghee; bloom cumin and hing briefly, then fold into dal.', 'Cumin is fragrant and has not blackened.'],
  ] },
]
