# Recipe sources and editorial method

Inspected 2026-10-30. These are source-adapted cooking plans written independently for Vantagallu. No publisher prose, photographs, videos, nutrition panels or scraped instruction text is bundled. Ingredient facts are stored in `src/content/source-facts.ts`; independently written methods are in `starter-methods.ts` and the three core records in `src/data/recipes.ts`. The original publishers retain their works; the app links directly to the specific recipe pages.

All 64 records have `reviewStatus: needs-kitchen-test`. The source pages were checked for their actual ingredient list and method; this does not mean the publisher approved these adaptations or that Vantagallu cooked them. The app must show the publisher, selected method and status before a session starts. Do not call these “official”, “chef-approved” or “kitchen-tested”.

## Sources used

- [Vismai Food recipe index](https://vismaifood.com/en/recipes): primary publisher for 61 records. Attribution is to Vismai Food; no unverified individual-chef byline is invented.
- [Dassana’s Veg Recipes](https://www.vegrecipesofindia.com/): three primary recipes below have the verified byline Dassana Amit.
- Vahrehvah was investigated as a future author-method source, but the relevant recipe page could not be reliably accessed in this run. No current recipe is falsely attributed to Vahchef or Food on Farm.

## Interpretation rules

- Ingredient quantities generally retain the source batch. Some sources count individual idlis/dosas/laddus; this catalogue explicitly estimates portions instead. Condiments and the one-kilogram ava pulihora retain larger batches, visible through baseServings.
- For quantity ranges, the lower bound is the initial recorded quantity; salt and chilli remain adjustable. A `to taste` or `as needed` unit is deliberately not an exact numerical promise. The UI should omit its numeric tracking default.
- The four source entries using an unspecified “spoon” for small spice amounts are standardised to teaspoons as an explicit editorial assumption; verify while kitchen testing. Pinch/sprig information in ingredient names is preserved as a unit rather than incorrectly displaying pieces.
- Prep time includes estimated soaking, fermentation and marination, unlike several source headers. Warmth and ingredient freshness affect fermentation; observe rise and aroma rather than waiting blindly for a timer.
- Cooking durations are suggested check-in reminders, not proof of doneness. Pressure-cooker whistle counts are replaced with model-specific guidance, natural-release instructions and texture checks. Water/oil/milk are method-dependent; seasoning is to taste. Resizing must reassess vessel capacity, liquid and batch depth.
- Repeated ingredients retain stable separate IDs and, for multi-part dosa/sambar/dal recipes, explicit group labels. Do not mark all repeated oil or water entries added when only one stage has been completed.
- Ingredient aliases support common English/Telugu names. Only English instructions and checked Telugu dish titles are supplied; do not present unverified machine translations as author-original text.
- Generic substitutions are explicitly editorial possibilities. Changes to already-added ingredients must be preserved as cooking-session facts, never erased when adapting the remaining plan.

## Deliberate corrections / adaptations

| Record | Change and reason |
| --- | --- |
| Tomato sesame chutney | Added a ¼-tsp cumin starting amount because cumin appears in the source tempering method but has no separate amount. |
| Tomato mint chutney | Added one tablespoon tempering oil because the method needs a separate tempering but the list gives only the earlier oil. |
| Instant poha idli | Added mould-greasing oil; prep includes fifteen-minute poha hydration plus thirty-minute rava rest. |
| Poori masala | One small boiled potato resolves an unquantified ingredient. |
| Millet pongal | Five cups cooking water is in the method, absent from its ingredient list. Overnight millet soaking is included in prep. |
| Set dosa / Mysore masala dosa | Source yields treated as approximately twelve dosas, six two-dosa portions; source component groups retained. |
| Rayalaseema egg dosa | Ten eggs distributed across roughly twenty small dosas is an editorial amount; source leaves eggs unquantified. Source’s long-life storage promise is not adopted. |
| Dibba rotti | Simplified to a heavy covered skillet without placing a drinking glass inside the pan; this cookware adaptation especially needs testing. |
| Raw mango peanut chutney | Roasted unsalted peanuts intentionally replace the source’s soaked raw peanuts. This is a labelled editorial variant, not the exact original method. |
| Minapappu pachadi | Salt and optional garlic are present in the source method but omitted from its ingredient list; included explicitly. |
| Mutton fry / tomato chicken / Telangana chicken fry | Cooking water mentioned in source methods is made explicit in the ingredient list. |
| Nellore fish pulusu | Replaced unusually high fixed salt amount with to-taste; do not inherit the room-temperature overnight-rest instruction. |
| Kerala egg curry | Added one teaspoon ginger-garlic as an editorial starting amount; source method mentions it but list omits it. |
| Coconut milk rice | Source prints 1¾ litres coconut milk for one cup rice; corrected to 1¾ cups as an explicit editorial assumption, not a validated correction. |
| Pudina rice | Source lists rice but its chosen pan method requires cooked rice; preparatory cooking is explicit. |
| Ava pulihora | Rice is one kilogram; cooking water is 2.1 litres including the additional 100 ml mentioned by the source. Preserve batch warnings when resizing. |
| Kaju pulao | Cooking water is taken from the source method; edible rose petals normalised to its one-teaspoon method amount. |
| Tomato rice | Source’s malformed 1(185) Cup(gms) becomes 185 g cooked rice; cinnamon is ¼ inch. |
| Chemadumpa fry | Combined tempering “mustard, cumin, urad ½ tsp” is made explicit as ½ tsp each; an editorial interpretation requiring testing. |
| Udupi rasam | Removed the ingredient-list reference to the already-prepared paste to avoid double-counting its constituents; included ¼ tsp tempering mustard as an editorial starting amount. |
| Cabbage saagu | Followed half-cup water in method instead of malformed “1/250 Cup/ml”. |
| Sambar rice | Salt made to-taste rather than inheriting high fixed source amounts. |
| Mango pulissery | Added one cup yogurt as an editorial starting amount; required in source method but missing from source list. |
| Paramannam | Cooked the listed moong with rice; source method omits this step. Omitted camphor. |
| Rava laddu | Source yield interpreted as twenty small laddus, ten portions; ambiguous cardamom-powder amount recorded as seeds of three pods. |
| Chakkara pongali | Omitted camphor and the source’s multi-day room-temperature storage claim; retained the listed ghee total rather than summing inconsistent method increments. |
| Chegodilu / murukulu | Specified ghee rather than optional hydrogenated fat; labelled rice/urad as flour after the source’s milling step; six chegodilu snack portions is an estimated yield. |
| Palli chutney | Two garlic cloves resolves the malformed source ingredient phrase “2 inches garlic cloves”; source method otherwise preserved. |

## Food-safety references

- [FoodSafety.gov safe cooking temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures): chicken 74°C; egg mixtures 71°C; firm egg yolk/white; fish 63°C or opaque/flaking; shellfish opaque/pearly; intact goat/lamb cuts 63°C plus three-minute rest, with longer braising for tenderness; ground meat 71°C.
- [FoodSafety.gov four steps](https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety): prevent cross-contamination, refrigerate within two hours (one hour above 32°C), refrigerator at 4°C or colder, safe thawing.
- [FoodSafety.gov cold storage chart](https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts): fresh meat and cooked-food storage context. No month-long chutney or ambient sweet-preservation promise is imported.
- [ICMR task-force assessment in Indian Journal of Medical Research](https://ijmr.org.in/assessment-of-effects-on-health-due-to-consumption-of-bitter-bottle-gourd-lagenaria-siceraria-juice/): bitter bottle gourd must be discarded. No proposed “fix” by cooking or masking bitterness.

## Specific recipe links

| Recipe | Publisher / verified author | Specific primary source |
| --- | --- | --- |
| Pesarattu | Dassana’s Veg Recipes / Dassana Amit | [Recipe page](https://www.vegrecipesofindia.com/moong-dal-dosa-pesarattu-a-cripsy-dosa-made-from-moong-dal/) |
| Palli chutney | Dassana’s Veg Recipes / Dassana Amit | [Recipe page](https://www.vegrecipesofindia.com/peanut-chutney/) |
| Fermented rice idli | Dassana’s Veg Recipes / Dassana Amit | [Recipe page](https://www.vegrecipesofindia.com/idli-recipe-how-to-make-soft-idlis/) |
| Tomato sesame chutney | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-sesame-chutney-tomato-nuvvula-chutney-recipe) |
| Tomato mint chutney | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-mint-chutney-tomato-pudina-chutney-tomato-pudhina-chutney) |
| Curry leaf podi | Vismai Food | [Recipe page](https://vismaifood.com/en/curry-leaves-podi-recipe-karivepaku-podi) |
| Kerala appam | Vismai Food | [Recipe page](https://vismaifood.com/en/best-appam-recipe-appam-batter-recipe-100-best-kerala-appam-how-to-make-appam) |
| Instant poha idli | Vismai Food | [Recipe page](https://vismaifood.com/en/instant-spongy-idli-recipeno-soaking-no-fermentation-how-make-spongy-idly) |
| Poori masala | Vismai Food | [Recipe page](https://vismaifood.com/en/hotel-style-puri-curry-poori-masala-recipe-how-make-poori-curry) |
| Tangy wheat rava upma | Vismai Food | [Recipe page](https://vismaifood.com/en/wheat-rava-upma-wheat-semolina-upma-godhuma-rava-upma-recipe-how-make-wheat-rava-upma) |
| Foxtail millet pongal | Vismai Food | [Recipe page](https://vismaifood.com/en/foxtail-millet-pongal-korra-pongal-millet-pongal-thinai-pongal-recipe-korra-biyyam-pongal-recipe-healthy-recipe) |
| Mangalore set dosa | Vismai Food | [Recipe page](https://vismaifood.com/en/manglore-style-spongy-set-dosa-home-set-dosa-steam-dosa-how-make-set-dosa) |
| Ven pongal | Vismai Food | [Recipe page](https://vismaifood.com/en/katte-pongal-ven-pongal-pongal-recipe-how-make-katte-pongali-recipe) |
| Mysore masala dosa | Vismai Food | [Recipe page](https://vismaifood.com/en/mysore-masala-dosa-recipe-crispy-masala-dosa-how-make-perfect-mysore-masala-dosa-batter-home) |
| Soft rava upma | Vismai Food | [Recipe page](https://vismaifood.com/en/perfect-rava-upma-secret-recipe-perfect-upma-tips-make-perfect-upma-recipe-how-make-rava-upma-easy-upma-recipe-breakfast) |
| Dibba rotti | Vismai Food | [Recipe page](https://vismaifood.com/en/dibba-rotti-recipe-how-make-andhra-minapa-rotti-recipe) |
| Rayalaseema karam egg dosa | Vismai Food | [Recipe page](https://vismaifood.com/en/egg-dosa-rayalaseema-special-karam-egg-dosa-how-make-perfect-egg-dosa) |
| Ragi rava dosa | Vismai Food | [Recipe page](https://vismaifood.com/en/instant-finger-millet-rava-dosa-ragi-rava-dosa-finger-millet-sooji-dosa) |
| Dondakaya roti pachadi | Vismai Food | [Recipe page](https://vismaifood.com/en/tindora-chutney-dondakaya-roti-pacchadi-andhra-style-dondakaya-chutney-recipe) |
| Allam pachadi | Vismai Food | [Recipe page](https://vismaifood.com/en/ginger-chutney-allam-pacchadi-andhra-allam-pacchadi-adrak-chatni-quick-easy-chutney-how-make-allam-pachadi-best-chutney-breakfast-recipes) |
| Raw mango peanut chutney | Vismai Food | [Recipe page](https://vismaifood.com/en/raw-mango-green-chillies-chutney-no-cooking-no-frying-instant-raw-mango-chutney-how-make-raw-mango-green-chilli-chutney) |
| Minapappu pachadi | Vismai Food | [Recipe page](https://vismaifood.com/en/black-gram-chutney-minapappu-pacchadi-how-make-urad-dal-chutney) |
| Dosakaya mustard pachadi | Vismai Food | [Recipe page](https://vismaifood.com/en/andhra-style-cucumber-chutney-how-to-make-cucumber-chutney) |
| Bachali aaku pappu | Vismai Food | [Recipe page](https://vismaifood.com/en/malabar-spinach-dal-bachala-aaku-pappu-healthy-recipe) |
| Sorakaya pappu | Vismai Food | [Recipe page](https://vismaifood.com/en/Sorakaya-Pappu-BottleGourd-Dal-Lauki-dal) |
| Miriyala pappu charu | Vismai Food | [Recipe page](https://vismaifood.com/en/miriyala-pappu-charu-recipe-black-pepper-dal-rasam-pepper-dal-rasam) |
| Rayalaseema mutton fry | Vismai Food | [Recipe page](https://vismaifood.com/en/mutton-fry-andhra-style-spicy-mutton-fry-rayalaseema-style-mutton-fry-how-make-spicy-mutton-fry) |
| Andhra chepala pulusu | Vismai Food | [Recipe page](https://vismaifood.com/en/fish-curry-chepala-pulusu-how-make-fish-curry-fish-masala-podi) |
| Andhra royyala masala | Vismai Food | [Recipe page](https://vismaifood.com/en/andhra-style-spicy-prawns-masala-curry-how-to-make-prawns-masala-fry) |
| Gongura mutton | Vismai Food | [Recipe page](https://vismaifood.com/en/andhra-style-gongura-mutton-mutton-curry-how-to-make-gongura-mutton) |
| Fresh masala chicken curry | Vismai Food | [Recipe page](https://vismaifood.com/en/easy-spicy-chicken-curry) |
| Village-style mutton curry | Vismai Food | [Recipe page](https://vismaifood.com/en/village-style-mutton-curry-mutton-curry-how-to-make-mutton-curry-in-village-style) |
| Nellore chepala pulusu | Vismai Food | [Recipe page](https://vismaifood.com/en/nellore-chepala-pulusu-fish-curry-nellore-fish-curry-chapala-pulusu) |
| Tomato chicken | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-chicken-thick-gravy-chicken-curry-how-make-spicy-tomato-chicken-curry-thick-gravy) |
| Pepper chicken fry | Vismai Food | [Recipe page](https://vismaifood.com/en/pepper-chicken-fry-dry-pepper-chicken-fry-how-make-chicken-fry) |
| Telangana chicken fry | Vismai Food | [Recipe page](https://vismaifood.com/en/telangana-restaurant-style-chicken-fry-chicken-roast) |
| Telangana masala egg curry | Vismai Food | [Recipe page](https://vismaifood.com/en/telangana-style-masala-egg-curry-egg-gravy-recipe-thick-masala-egg-gravy-recipe) |
| Beerakaya egg bhurji | Vismai Food | [Recipe page](https://vismaifood.com/en/ridged-gourd-scrambled-eggs-turai-egg-bhurji-masala-beerakaya-egg-burji-peerkangai-muttai-poriyal-recipe) |
| Tomato egg pulusu | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-egg-drop-curry-easy-tomato-egg-pulusu) |
| Kerala coconut milk egg curry | Vismai Food | [Recipe page](https://vismaifood.com/en/kerala-style-egg-curry-egg-curry) |
| Peanut sesame rice | Vismai Food | [Recipe page](https://vismaifood.com/en/peanut-spicy-rice-how-make-peanut-rice-quick-and-easy-recipes-perfect-lunch-box-recipe) |
| Coconut milk rice | Vismai Food | [Recipe page](https://vismaifood.com/en/coconut-rice-how-make-coconut-rice-thengai-sadam-nariyal-chawal-kobbari-annam) |
| Pudina rice | Vismai Food | [Recipe page](https://vismaifood.com/en/pudina-rice-mint-rice-pulao-how-make-pudina-pulao) |
| Ava pulihora | Vismai Food | [Recipe page](https://vismaifood.com/en/1kg-prasadam-ava-pulihora-tamarind-rice-prasadam-pulihora-home) |
| Kaju pulao | Vismai Food | [Recipe page](https://vismaifood.com/en/kaju-pulao-cashew-nut-rice-how-make-cashew-rice-recipe) |
| Chicken pulao | Vismai Food | [Recipe page](https://vismaifood.com/en/easy-chicken-pulao-pressure-cooker-homemade-chicken-pulao-recipe) |
| Tomato rice | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-rice-tomato-pulav-tomato-pulao-recipe-how-to-make-tomato-rice) |
| Aloo methi fry | Vismai Food | [Recipe page](https://vismaifood.com/en/crispy-potato-fry-aloo-fry-best-aloo-methi-fry-best-every-crispy-potato-fry-recipe-how-make-aloo-fry) |
| Carrot peanut fry | Vismai Food | [Recipe page](https://vismaifood.com/en/carrot-peanut-fry-carrot-veppudu-carrot-poriyal-carrot-recipes-easy-lunch-recipes-how-make-carrot-fry) |
| Chemadumpa vepudu | Vismai Food | [Recipe page](https://vismaifood.com/en/colocasia-arvi-fry-chemadumpa-vepudu-how-make-colocasia-fry) |
| Okra garlic fry | Vismai Food | [Recipe page](https://vismaifood.com/en/okra-garlic-fry-lehsuni-bhindi-how-make-bhindi-fry) |
| Ragi neer dosa | Vismai Food | [Recipe page](https://vismaifood.com/en/perfect-ragi-neer-dosa-recipe-ragi-neer-dosa-ragi-dosa) |
| Udupi pepper rasam | Vismai Food | [Recipe page](https://vismaifood.com/en/udupi-style-pepper-rasam-recipe-no-garlic-festive-special) |
| Karnataka cabbage saagu | Vismai Food | [Recipe page](https://vismaifood.com/en/karnataka-special-cabbage-kurma-cabbage-saagu-cabbage-curry) |
| Munakkada sambar | Vismai Food | [Recipe page](https://vismaifood.com/en/munakkada-sambar-munkkaya-sambar-drumstick-sambar-munakkada-sambar-vismai-food) |
| Sambar saadham | Vismai Food | [Recipe page](https://vismaifood.com/en/sambar-rice-sambar-saadam-how-to-make-sambar-rice) |
| Mambazha pulissery | Vismai Food | [Recipe page](https://vismaifood.com/en/mango-kadhli-mambazha-pulisserry-recipe-mambalam-pulisseri-mango-buttermilk-stew) |
| Rice paramannam | Vismai Food | [Recipe page](https://vismaifood.com/en/easy-cooker-kheer-rice-kheer-payasam-or-paramannam) |
| Rava laddu | Vismai Food | [Recipe page](https://vismaifood.com/en/rava-laddu-recipe-how-make-rava-laddu-home-suji-ke-laddu-rava-ladoo-preparation) |
| Chakkara pongali | Vismai Food | [Recipe page](https://vismaifood.com/en/sweet-pongal-recipe-chakkara-pongali-how-make-sakkarai-pongal) |
| Chegodilu | Vismai Food | [Recipe page](https://vismaifood.com/en/chegodis-chegodilu-chekodi-recipe-crispy-chekodi-recipe-how-to-make-chekodi) |
| Andhra murukulu | Vismai Food | [Recipe page](https://vismaifood.com/en/rice-flour-murukku-kaarappusa-chakli-jantikas-chakrams-how-make-andhra-style-murukulu) |
| Tomato pappu | Vismai Food | [Recipe page](https://vismaifood.com/en/tomato-dal-tomato-pappu-wedding-style-tomato-pappu-andhra-tomato-dal) |
| Mudda pappu | Vismai Food | [Recipe page](https://vismaifood.com/en/perfect-muddapappu-andhrastyle-mudda-pappu-recipe-how-make-andhra-style-plain-dal) |
