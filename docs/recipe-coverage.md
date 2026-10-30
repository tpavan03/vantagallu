# Recipe coverage

Snapshot: 2026-10-30. **72 cookable source-adapted starters; 228 named planned entries; 300 total coverage targets.** No entry is independently kitchen-tested by Vantagallu. “Available” means that quantities, a cooking plan and specific source attribution exist, not that the recipe is officially endorsed or clinically reviewed.

The canonical API is `recipeCatalog: Recipe[]` and `getRecipeById(id)` in `src/data/recipes.ts`. `recipeCoverageManifest` in `src/data/coverage.ts` is a separate commissioning manifest. Planned dishes never become cookable through a search result or a server seed.

The 72 starters cover Andhra, Telangana, Rayalaseema, Tamil, Karnataka, Kerala and shared South Indian methods. English instructions and English/Telugu titles are supplied. Kannada/Hindi instructions are not fabricated translations; the selected-language agent must explain the same canonical recipe context.

| Family | Available | Planned | Target |
| --- | ---: | ---: | ---: |
| Breakfast and tiffins | 16 | 29 | 45 |
| Chutneys, pachadis and podis | 11 | 34 | 45 |
| Pappu, charu, rasam and sambar | 7 | 23 | 30 |
| Vegetable curries and fries | 8 | 32 | 40 |
| Rice, pulao and biryani | 10 | 20 | 30 |
| Chicken and egg | 9 | 26 | 35 |
| Mutton and offal | 3 | 12 | 15 |
| Fish, prawns and other seafood | 3 | 17 | 20 |
| Pickles | 0 | 10 | 10 |
| Snacks | 2 | 13 | 15 |
| Sweets and festival dishes | 3 | 12 | 15 |

Pickles are intentionally still planned: shelf-stable preservation needs a stronger recipe-specific safety validation than fresh chutney instructions. Regional labels identify the selected method, rather than claiming exclusive ownership of a dish. Planned entries deliberately have no fabricated author, URL or review claim.

Each target below is a real named dish or meaningful method variant. The remaining list is a backlog, not a claim that 300 complete recipes shipped. Promotion requires a specific accessible primary recipe, quantities and yield reconciled with instructions, independently written steps, checkpoints, allergy/food-safety checks and a clear kitchen-testing status. Kitchen testing should record vessel, batch size, rice/ingredient variety, observed timing and corrections before claiming validation.

## Breakfast and tiffins

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Pesarattu | available | `pesarattu` |
| Fermented rice idli | available | `idli` |
| Kerala appam | available | `appam` |
| Instant poha idli | available | `instant-poha-idli` |
| Tangy wheat rava upma | available | `wheat-rava-upma` |
| Foxtail millet pongal | available | `millet-pongal` |
| Mangalore set dosa | available | `set-dosa` |
| Ven pongal | available | `ven-pongal` |
| Mysore masala dosa | available | `mysore-masala-dosa` |
| Soft rava upma | available | `rava-upma` |
| Dibba rotti | available | `dibba-rotti` |
| Rayalaseema karam egg dosa | available | `rayalaseema-egg-dosa` |
| Ragi rava dosa | available | `ragi-rava-dosa` |
| Ragi neer dosa | available | `ragi-neer-dosa` |
| Plain fermented dosa | available | `plain-dosa` |
| Medu vada | available | `medu-vada` |
| Onion uttapam | planned | — |
| Vegetable uttapam | planned | — |
| Pesarattu with upma filling | planned | — |
| Rava idli | planned | — |
| Kanchipuram idli | planned | — |
| Ragi idli | planned | — |
| Jowar dosa | planned | — |
| Jowar roti | planned | — |
| Ragi mudde | planned | — |
| Rayalaseema ragi sangati | planned | — |
| Uggani | planned | — |
| Atukula upma | planned | — |
| Vegetable semiya upma | planned | — |
| Lemon sevai | planned | — |
| Poori | planned | — |
| Chapati | planned | — |
| Godhuma dosa | planned | — |
| Akki rotti | planned | — |
| Ragi rotti | planned | — |
| Neer dosa | planned | — |
| Benne dosa | planned | — |
| Aval dosa | planned | — |
| Paniyaram | planned | — |
| Vegetable kuzhi paniyaram | planned | — |
| Idiyappam | planned | — |
| Puttu | planned | — |
| Ragi puttu | planned | — |
| Pathiri | planned | — |
| Kerala parotta | planned | — |

## Chutneys, pachadis and podis

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Palli chutney | available | `peanut-chutney` |
| Tomato sesame chutney | available | `tomato-sesame-chutney` |
| Tomato mint chutney | available | `tomato-mint-chutney` |
| Curry leaf podi | available | `curry-leaf-podi` |
| Dondakaya roti pachadi | available | `dondakaya-pachadi` |
| Allam pachadi | available | `allam-pachadi` |
| Raw mango peanut chutney | available | `mango-peanut-chutney` |
| Minapappu pachadi | available | `minapappu-pachadi` |
| Dosakaya mustard pachadi | available | `dosakaya-pachadi` |
| Coconut chutney | available | `coconut-chutney` |
| Onion chutney | available | `onion-chutney` |
| Roasted gram chutney | planned | — |
| Roasted tomato chutney | planned | — |
| Coriander coconut chutney | planned | — |
| Mint coconut chutney | planned | — |
| Gongura pachadi | planned | — |
| Roasted brinjal pachadi | planned | — |
| Ridge gourd pachadi | planned | — |
| Ridge gourd peel chutney | planned | — |
| Beerakaya tomato pachadi | planned | — |
| Bottle gourd chutney | planned | — |
| Carrot chutney | planned | — |
| Cabbage chana dal chutney | planned | — |
| Radish pachadi | planned | — |
| Cabbage pachadi | planned | — |
| Chukkakura pachadi | planned | — |
| Palakura perugu pachadi | planned | — |
| Bendakaya perugu pachadi | planned | — |
| Vankaya perugu pachadi | planned | — |
| Nuvvula pachadi | planned | — |
| Chintakaya pachadi | planned | — |
| Nellikai thogayal | planned | — |
| Poondu chutney | planned | — |
| Kara chutney | planned | — |
| Thengai thogayal | planned | — |
| Kerala chammanthi | planned | — |
| Mango coconut chammanthi | planned | — |
| Idli milagai podi | planned | — |
| Andhra kandi podi | planned | — |
| Nalla karam podi | planned | — |
| Palli podi | planned | — |
| Nuvvula podi | planned | — |
| Flaxseed podi | planned | — |
| Ulavala karam podi | planned | — |
| Kobbari karam podi | planned | — |

## Pappu, charu, rasam and sambar

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Bachali aaku pappu | available | `bachali-pappu` |
| Sorakaya pappu | available | `sorakaya-pappu` |
| Miriyala pappu charu | available | `pepper-pappu-charu` |
| Udupi pepper rasam | available | `udupi-pepper-rasam` |
| Munakkada sambar | available | `drumstick-sambar` |
| Tomato pappu | available | `tomato-pappu` |
| Mudda pappu | available | `mudda-pappu` |
| Mamidikaya pappu | planned | — |
| Palakura pappu | planned | — |
| Gongura pappu | planned | — |
| Dosakaya pappu | planned | — |
| Chukkakura pappu | planned | — |
| Menthikura pappu | planned | — |
| Cabbage pappu | planned | — |
| Ridge gourd pappu | planned | — |
| Usirikaya pappu | planned | — |
| Pudina pappu | planned | — |
| Pumpkin pappu | planned | — |
| Hyderabadi khatti dal | planned | — |
| Hyderabadi meethi dal | planned | — |
| Andhra pappu charu | planned | — |
| Tomato charu | planned | — |
| Garlic rasam | planned | — |
| Lemon rasam | planned | — |
| Jeera rasam | planned | — |
| Pineapple rasam | planned | — |
| Kollu rasam | planned | — |
| Tiffin sambar | planned | — |
| Udupi ridge gourd sambar | planned | — |
| Mangalore cucumber sambar | planned | — |

## Vegetable curries and fries

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Poori masala | available | `poori-masala` |
| Aloo methi fry | available | `aloo-methi-fry` |
| Carrot peanut fry | available | `carrot-peanut-fry` |
| Chemadumpa vepudu | available | `chemadumpa-fry` |
| Okra garlic fry | available | `okra-garlic-fry` |
| Karnataka cabbage saagu | available | `cabbage-saagu` |
| Mambazha pulissery | available | `mango-pulissery` |
| Gutti vankaya kura | available | `gutti-vankaya` |
| Vankaya ullikaram | planned | — |
| Vankaya tomato kura | planned | — |
| Vankaya bangaladumpa kura | planned | — |
| Bendakaya pulusu | planned | — |
| Bendakaya vepudu | planned | — |
| Dondakaya senagapappu kura | planned | — |
| Dondakaya karam fry | planned | — |
| Dondakaya ulavala vepudu | planned | — |
| Sorakaya palu kura | planned | — |
| Sorakaya pulusu | planned | — |
| Beerakaya senagapappu kura | planned | — |
| Beerakaya palu kura | planned | — |
| Dosakaya tomato kura | planned | — |
| Gummadikaya pulusu | planned | — |
| Gummadikaya ullikaram | planned | — |
| Kanda bachali | planned | — |
| Kanda vepudu | planned | — |
| Chamagadda pulusu | planned | — |
| Kakarakaya ullikaram | planned | — |
| Gutti kakarakaya | planned | — |
| Cabbage coconut poriyal | planned | — |
| Beans poriyal | planned | — |
| Beetroot poriyal | planned | — |
| Aratikaya podi kura | planned | — |
| Aratikaya pulusu | planned | — |
| Mukkala pulusu | planned | — |
| Majjiga pulusu | planned | — |
| Pesarapappu beerakaya kura | planned | — |
| Chikkudukaya tomato kura | planned | — |
| Goruchikkudu vepudu | planned | — |
| Cauliflower peas kura | planned | — |
| Mushroom pepper fry | planned | — |

## Rice, pulao and biryani

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Peanut sesame rice | available | `peanut-rice` |
| Coconut milk rice | available | `coconut-rice` |
| Pudina rice | available | `pudina-rice` |
| Ava pulihora | available | `ava-pulihora` |
| Kaju pulao | available | `kaju-pulao` |
| Chicken pulao | available | `chicken-pulao` |
| Tomato rice | available | `tomato-rice` |
| Sambar saadham | available | `sambar-rice` |
| Hyderabadi chicken dum biryani | available | `hyderabadi-chicken-dum-biryani` |
| Vegetable dum biryani | available | `vegetable-dum-biryani` |
| Nimmakaya pulihora | planned | — |
| Daddojanam | planned | — |
| Bagara annam | planned | — |
| Hyderabadi mutton dum biryani | planned | — |
| Egg dum biryani | planned | — |
| Gongura chicken biryani | planned | — |
| Ulavacharu chicken biryani | planned | — |
| Andhra vegetable pulao | planned | — |
| Bisi bele bath | planned | — |
| Vangi bath | planned | — |
| Chitranna | planned | — |
| Tomato bath | planned | — |
| Thengai sadam | planned | — |
| Ellu sadam | planned | — |
| Milagu sadam | planned | — |
| Kothimeera rice | planned | — |
| Karuveppilai sadam | planned | — |
| Curd semiya | planned | — |
| Chettinad seeraga samba chicken biryani | planned | — |
| Ambur chicken biryani | planned | — |

## Chicken and egg

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Fresh masala chicken curry | available | `chicken-curry` |
| Tomato chicken | available | `tomato-chicken` |
| Pepper chicken fry | available | `pepper-chicken` |
| Telangana chicken fry | available | `telangana-chicken-fry` |
| Telangana masala egg curry | available | `telangana-egg-curry` |
| Beerakaya egg bhurji | available | `ridge-gourd-egg` |
| Tomato egg pulusu | available | `tomato-egg-pulusu` |
| Kerala coconut milk egg curry | available | `kerala-egg-curry` |
| Chicken 65 | available | `chicken-65` |
| Andhra kodi pulusu | planned | — |
| Naatukodi pulusu | planned | — |
| Gongura chicken | planned | — |
| Guntur chicken fry | planned | — |
| Kodi vepudu with cashew | planned | — |
| Chicken iguru | planned | — |
| Coconut chicken kurma | planned | — |
| Chicken shorva | planned | — |
| Telangana red chicken | planned | — |
| Chettinad chicken curry | planned | — |
| Chettinad chicken sukka | planned | — |
| Kori gassi | planned | — |
| Chicken ghee roast | planned | — |
| Kerala chicken roast | planned | — |
| Kerala chicken stew | planned | — |
| Malabar chicken curry | planned | — |
| Chicken liver fry | planned | — |
| Naatukodi rasam | planned | — |
| Boiled egg pepper fry | planned | — |
| Egg masala fry | planned | — |
| Andhra guddu pulusu | planned | — |
| Gongura egg curry | planned | — |
| Egg bhurji | planned | — |
| Onion chilli omelette | planned | — |
| Egg coconut kurma | planned | — |
| Egg keema masala | planned | — |

## Mutton and offal

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Rayalaseema mutton fry | available | `rayalaseema-mutton-fry` |
| Gongura mutton | available | `gongura-mutton` |
| Village-style mutton curry | available | `village-mutton-curry` |
| Andhra mutton pulusu | planned | — |
| Mutton iguru | planned | — |
| Telangana mutton curry | planned | — |
| Mutton shorva | planned | — |
| Mutton pepper fry | planned | — |
| Chettinad mutton curry | planned | — |
| Chettinad mutton sukka | planned | — |
| Kerala mutton stew | planned | — |
| Malabar mutton roast | planned | — |
| Mutton keema curry | planned | — |
| Mutton keema peas | planned | — |
| Mutton liver fry | planned | — |

## Fish, prawns and other seafood

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Andhra chepala pulusu | available | `fish-pulusu` |
| Andhra royyala masala | available | `prawn-masala` |
| Nellore chepala pulusu | available | `nellore-fish-pulusu` |
| Godavari royyala iguru | planned | — |
| Gongura prawns | planned | — |
| Raw mango prawns curry | planned | — |
| Tomato prawns curry | planned | — |
| Bendakaya royyalu | planned | — |
| Prawn pepper fry | planned | — |
| Prawn coconut curry | planned | — |
| Andhra fish fry | planned | — |
| Korameenu chepala pulusu | planned | — |
| Telangana fish pulusu | planned | — |
| Raw mango fish curry | planned | — |
| Chettinad meen kuzhambu | planned | — |
| Kerala kudampuli fish curry | planned | — |
| Kerala fish moilee | planned | — |
| Karimeen pollichathu | planned | — |
| Kerala pepper fish fry | planned | — |
| Mangalore fish gassi | planned | — |

## Pickles

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Avakaya mango pickle | planned | — |
| Magaya | planned | — |
| Instant mango pieces pickle | planned | — |
| Grated mango pachadi | planned | — |
| Gongura niluva pachadi | planned | — |
| Usirikaya pickle | planned | — |
| Nimmakaya pickle | planned | — |
| Pandu mirapakaya pickle | planned | — |
| Tomato niluva pachadi | planned | — |
| Ginger pickle | planned | — |

## Snacks

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Chegodilu | available | `chegodilu` |
| Andhra murukulu | available | `murukulu` |
| Masala vada | planned | — |
| Punugulu | planned | — |
| Pesara punukulu | planned | — |
| Mirchi bajji | planned | — |
| Stuffed mirchi bajji | planned | — |
| Aratikaya bajji | planned | — |
| Onion pakodi | planned | — |
| Cashew pakodi | planned | — |
| Sarva pindi | planned | — |
| Sakinalu | planned | — |
| Nippattu | planned | — |
| Kerala banana chips | planned | — |
| Ribbon pakoda | planned | — |

## Sweets and festival dishes

| Dish / method | Status | Recipe ID |
| --- | --- | --- |
| Rice paramannam | available | `paramannam` |
| Rava laddu | available | `rava-laddu` |
| Chakkara pongali | available | `chakkara-pongali` |
| Bobbatlu | planned | — |
| Poornam boorelu | planned | — |
| Ariselu | planned | — |
| Bellam gavvalu | planned | — |
| Sunnundalu | planned | — |
| Bellam appalu | planned | — |
| Bellam undrallu | planned | — |
| Modakam | planned | — |
| Semiya payasam | planned | — |
| Saggubiyyam payasam | planned | — |
| Rava kesari | planned | — |
| Mysore pak | planned | — |
