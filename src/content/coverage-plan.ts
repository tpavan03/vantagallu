// Named commissioning backlog, not cookable recipes. No provenance is implied.
export const coverageTargets = {
  breakfast: 45,
  chutney: 45,
  dal: 30,
  vegetable: 40,
  rice: 30,
  'chicken-egg': 35,
  mutton: 15,
  seafood: 20,
  pickle: 10,
  snack: 15,
  sweet: 15,
} as const

export type CoverageGroup = keyof typeof coverageTargets

export const plannedDishNames: Record<CoverageGroup, string[]> = {
  breakfast: [
    'Plain fermented dosa', 'Onion uttapam', 'Vegetable uttapam', 'Pesarattu with upma filling', 'Rava idli', 'Kanchipuram idli', 'Ragi idli', 'Jowar dosa', 'Jowar roti', 'Ragi mudde', 'Rayalaseema ragi sangati', 'Uggani', 'Atukula upma', 'Vegetable semiya upma', 'Lemon sevai', 'Poori', 'Chapati', 'Godhuma dosa', 'Akki rotti', 'Ragi rotti', 'Neer dosa', 'Benne dosa', 'Aval dosa', 'Paniyaram', 'Vegetable kuzhi paniyaram', 'Idiyappam', 'Puttu', 'Ragi puttu', 'Pathiri', 'Kerala parotta', 'Adai', 'Rava dosa', 'Sajja rotti', 'Ragi ambali', 'Vegetable poha', 'Broken wheat pongal', 'Rice rava upma',
  ],
  chutney: [
    'Coconut chutney', 'Roasted gram chutney', 'Onion chutney', 'Roasted tomato chutney', 'Coriander coconut chutney', 'Mint coconut chutney', 'Gongura pachadi', 'Roasted brinjal pachadi', 'Ridge gourd pachadi', 'Ridge gourd peel chutney', 'Beerakaya tomato pachadi', 'Bottle gourd chutney', 'Carrot chutney', 'Cabbage chana dal chutney', 'Radish pachadi', 'Cabbage pachadi', 'Chukkakura pachadi', 'Palakura perugu pachadi', 'Bendakaya perugu pachadi', 'Vankaya perugu pachadi', 'Nuvvula pachadi', 'Chintakaya pachadi', 'Nellikai thogayal', 'Poondu chutney', 'Kara chutney', 'Thengai thogayal', 'Kerala chammanthi', 'Mango coconut chammanthi', 'Idli milagai podi', 'Andhra kandi podi', 'Nalla karam podi', 'Palli podi', 'Nuvvula podi', 'Flaxseed podi', 'Ulavala karam podi', 'Kobbari karam podi', 'Garlic karam podi', 'Drumstick leaf podi', 'Groundnut flaxseed podi', 'Udupi neer chutney', 'Ripe red chilli pachadi', 'Fresh green chilli pachadi',
  ],
  dal: [
    'Mamidikaya pappu', 'Palakura pappu', 'Gongura pappu', 'Dosakaya pappu', 'Chukkakura pappu', 'Menthikura pappu', 'Cabbage pappu', 'Ridge gourd pappu', 'Usirikaya pappu', 'Pudina pappu', 'Pumpkin pappu', 'Hyderabadi khatti dal', 'Hyderabadi meethi dal', 'Andhra pappu charu', 'Tomato charu', 'Garlic rasam', 'Lemon rasam', 'Jeera rasam', 'Pineapple rasam', 'Kollu rasam', 'Tiffin sambar', 'Udupi ridge gourd sambar', 'Mangalore cucumber sambar', 'Arachuvitta sambar', 'Vendakkai sambar', 'Keerai sambar', 'Varutharacha sambar', 'Kerala parippu curry', 'Andhra ulava charu',
  ],
  vegetable: [
    'Gutti vankaya kura', 'Vankaya ullikaram', 'Vankaya tomato kura', 'Vankaya bangaladumpa kura', 'Bendakaya pulusu', 'Bendakaya vepudu', 'Dondakaya senagapappu kura', 'Dondakaya karam fry', 'Dondakaya ulavala vepudu', 'Sorakaya palu kura', 'Sorakaya pulusu', 'Beerakaya senagapappu kura', 'Beerakaya palu kura', 'Dosakaya tomato kura', 'Gummadikaya pulusu', 'Gummadikaya ullikaram', 'Kanda bachali', 'Kanda vepudu', 'Chamagadda pulusu', 'Kakarakaya ullikaram', 'Gutti kakarakaya', 'Cabbage coconut poriyal', 'Beans poriyal', 'Beetroot poriyal', 'Aratikaya podi kura', 'Aratikaya pulusu', 'Mukkala pulusu', 'Majjiga pulusu', 'Pesarapappu beerakaya kura', 'Chikkudukaya tomato kura', 'Goruchikkudu vepudu', 'Cauliflower peas kura', 'Mushroom pepper fry', 'Andhra vegetable kurma', 'Udupi white saagu', 'Avial', 'Olan', 'Cabbage thoran', 'Erissery', 'Kadala curry', 'Vegetable stew', 'Pineapple pachadi', 'Kootu', 'Ennai kathirikai', 'Potato podimas', 'Chettinad potato fry', 'Keerai masiyal',
  ],
  rice: [
    'Nimmakaya pulihora', 'Daddojanam', 'Bagara annam', 'Hyderabadi chicken dum biryani', 'Hyderabadi mutton dum biryani', 'Egg dum biryani', 'Gongura chicken biryani', 'Ulavacharu chicken biryani', 'Andhra vegetable pulao', 'Bisi bele bath', 'Vangi bath', 'Chitranna', 'Tomato bath', 'Thengai sadam', 'Ellu sadam', 'Milagu sadam', 'Kothimeera rice', 'Karuveppilai sadam', 'Curd semiya', 'Chettinad seeraga samba chicken biryani', 'Ambur chicken biryani', 'Dindigul mutton biryani', 'Thalassery chicken biryani', 'Kuska', 'Prawn pulao', 'Fish biryani', 'Coconut milk vegetable pulao', 'Vegetable millet pulao', 'Mushroom pulao', 'Tamarind millet rice',
  ],
  'chicken-egg': [
    'Andhra kodi pulusu', 'Naatukodi pulusu', 'Gongura chicken', 'Guntur chicken fry', 'Kodi vepudu with cashew', 'Chicken iguru', 'Coconut chicken kurma', 'Chicken shorva', 'Telangana red chicken', 'Chettinad chicken curry', 'Chettinad chicken sukka', 'Kori gassi', 'Chicken ghee roast', 'Kerala chicken roast', 'Kerala chicken stew', 'Malabar chicken curry', 'Chicken 65', 'Chicken liver fry', 'Naatukodi rasam', 'Boiled egg pepper fry', 'Egg masala fry', 'Andhra guddu pulusu', 'Gongura egg curry', 'Egg bhurji', 'Onion chilli omelette', 'Egg coconut kurma', 'Egg keema masala', 'Methi egg masala', 'Egg salna', 'Kerala mutta roast', 'Egg bonda', 'Spinach egg bhurji',
  ],
  mutton: [
    'Andhra mutton pulusu', 'Mutton iguru', 'Telangana mutton curry', 'Mutton shorva', 'Mutton pepper fry', 'Chettinad mutton curry', 'Chettinad mutton sukka', 'Kerala mutton stew', 'Malabar mutton roast', 'Mutton keema curry', 'Mutton keema peas', 'Mutton liver fry', 'Mutton bone soup', 'Mutton paya',
  ],
  seafood: [
    'Godavari royyala iguru', 'Gongura prawns', 'Raw mango prawns curry', 'Tomato prawns curry', 'Bendakaya royyalu', 'Prawn pepper fry', 'Prawn coconut curry', 'Andhra fish fry', 'Korameenu chepala pulusu', 'Telangana fish pulusu', 'Raw mango fish curry', 'Chettinad meen kuzhambu', 'Kerala kudampuli fish curry', 'Kerala fish moilee', 'Karimeen pollichathu', 'Kerala pepper fish fry', 'Mangalore fish gassi', 'Crab masala curry', 'Andhra peethala iguru', 'Endu royyala tomato kura', 'Endu nethallu mamidikaya kura',
  ],
  pickle: [
    'Avakaya mango pickle', 'Magaya', 'Instant mango pieces pickle', 'Grated mango pachadi', 'Gongura niluva pachadi', 'Usirikaya pickle', 'Nimmakaya pickle', 'Pandu mirapakaya pickle', 'Tomato niluva pachadi', 'Ginger pickle',
  ],
  snack: [
    'Medu vada', 'Masala vada', 'Punugulu', 'Pesara punukulu', 'Mirchi bajji', 'Stuffed mirchi bajji', 'Aratikaya bajji', 'Onion pakodi', 'Cashew pakodi', 'Sarva pindi', 'Sakinalu', 'Nippattu', 'Kerala banana chips', 'Ribbon pakoda', 'Sundal', 'Kobbari garelu',
  ],
  sweet: [
    'Bobbatlu', 'Poornam boorelu', 'Ariselu', 'Bellam gavvalu', 'Sunnundalu', 'Bellam appalu', 'Bellam undrallu', 'Modakam', 'Semiya payasam', 'Saggubiyyam payasam', 'Rava kesari', 'Mysore pak', 'Holige', 'Paal payasam', 'Ada pradhaman', 'Chakkara varatti',
  ],
}
