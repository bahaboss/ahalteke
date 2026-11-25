export interface RegionEcoRating {
  id: string;
  regionName: string;
  golName: string;
  ecoScore: number;
  solarSharePercent: number;
  waterSavedPercent: number;
  activeEcoStables: number;
  highlight: string;
  /** Position in the 5-göl horizontal strip (0..4) */
  stripIndex: number;
}

export interface HeroHorseLayer {
  id: string;
  name: string;
  coatLabel: string;
  layer: 'front' | 'middle' | 'back';
  side: 'outer-left' | 'inner-left' | 'center' | 'inner-right' | 'outer-right';
  heartRateBpm: number;
  waterSavedPercent: number;
  stableStatus: string;
  region: string;
  clipPath: string;
  hotspotLeftPercent: number;
  hotspotTopPercent: number;
}

export interface HeritageBook {
  id: string;
  title: string;
  author: string;
  year: number;
  pages: number;
  category: string;
  accentColor: string;
  excerpt: string;
  highlights: string[];
}

export interface CareLayerStep {
  id: string;
  indexLabel: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: { label: string; value: string }[];
}

export interface AcademyProgramHighlight {
  id: string;
  title: string;
  duration: string;
  seats: number;
  focus: string;
}

export const mockRegionEcoRatings: RegionEcoRating[] = [
  {
    id: 'reg-ahal',
    regionName: 'Ahal / Arkadag',
    golName: 'Teke göli',
    ecoScore: 96,
    solarSharePercent: 89,
    waterSavedPercent: 28,
    activeEcoStables: 10,
    highlight: 'Köpetdag eteklerindäki gün energiýaly baş toplumlaryň merkezi',
    stripIndex: 0,
  },
  {
    id: 'reg-balkan',
    regionName: 'Balkan',
    golName: 'Ýomut göli',
    ecoScore: 89,
    solarSharePercent: 84,
    waterSavedPercent: 31,
    activeEcoStables: 4,
    highlight: 'Şemal-gün gibrid energiýaly we suw süzgüçli athanalar',
    stripIndex: 1,
  },
  {
    id: 'reg-dasoguz',
    regionName: 'Daşoguz',
    golName: 'Salyr göli',
    ecoScore: 87,
    solarSharePercent: 78,
    waterSavedPercent: 26,
    activeEcoStables: 5,
    highlight: 'Organiki bio-kompost we ot-iým tygşytlylygy boýunça öňdebaryjy',
    stripIndex: 2,
  },
  {
    id: 'reg-lebap',
    regionName: 'Lebap',
    golName: 'Ärsary göli',
    ecoScore: 91,
    solarSharePercent: 82,
    waterSavedPercent: 24,
    activeEcoStables: 6,
    highlight: 'Amyderýa jülgesinde damjalaýyn suwaryşly ýaşyl öri meýdanlary',
    stripIndex: 3,
  },
  {
    id: 'reg-mary',
    regionName: 'Mary',
    golName: 'Saryk göli',
    ecoScore: 93,
    solarSharePercent: 86,
    waterSavedPercent: 27,
    activeEcoStables: 7,
    highlight: 'Gadymy tohum şejeresi we doly sanly IoT howa gözegçiligi',
    stripIndex: 4,
  },
];

export const mockHeroHorseLayers: HeroHorseLayer[] = [
  {
    id: 'hero-horse-1',
    name: 'Ýanardag Altyn',
    coatLabel: 'Altyn dor',
    layer: 'back',
    side: 'outer-left',
    heartRateBpm: 36,
    waterSavedPercent: 24,
    stableStatus: 'Kadaly',
    region: 'Mary welaýaty',
    clipPath: 'polygon(0% 23%, 30% 23%, 32% 96%, 0% 96%)',
    hotspotLeftPercent: 14,
    hotspotTopPercent: 44,
  },
  {
    id: 'hero-horse-2',
    name: 'Garadag Ýyldyrym',
    coatLabel: 'Gara bedew',
    layer: 'middle',
    side: 'inner-left',
    heartRateBpm: 39,
    waterSavedPercent: 21,
    stableStatus: 'Kadaly',
    region: 'Balkan welaýaty',
    clipPath: 'polygon(22% 23%, 47% 23%, 47% 96%, 24% 96%)',
    hotspotLeftPercent: 33,
    hotspotTopPercent: 40,
  },
  {
    id: 'hero-horse-3',
    name: 'Akhan Merjen',
    coatLabel: 'Ak bedew',
    layer: 'front',
    side: 'center',
    heartRateBpm: 38,
    waterSavedPercent: 22,
    stableStatus: 'Kadaly',
    region: 'Ahal / Arkadag',
    clipPath: 'polygon(43% 21%, 62% 21%, 61% 96%, 44% 96%)',
    hotspotLeftPercent: 52,
    hotspotTopPercent: 34,
  },
  {
    id: 'hero-horse-4',
    name: 'Gara Bürgüt',
    coatLabel: 'Gara bedew',
    layer: 'middle',
    side: 'inner-right',
    heartRateBpm: 37,
    waterSavedPercent: 23,
    stableStatus: 'Kadaly',
    region: 'Lebap welaýaty',
    clipPath: 'polygon(58% 24%, 79% 24%, 77% 96%, 59% 96%)',
    hotspotLeftPercent: 69,
    hotspotTopPercent: 40,
  },
  {
    id: 'hero-horse-5',
    name: 'Altyn Ganat',
    coatLabel: 'Sary-dor',
    layer: 'back',
    side: 'outer-right',
    heartRateBpm: 35,
    waterSavedPercent: 25,
    stableStatus: 'Kadaly',
    region: 'Daşoguz welaýaty',
    clipPath: 'polygon(71% 25%, 100% 25%, 100% 96%, 72% 96%)',
    hotspotLeftPercent: 86,
    hotspotTopPercent: 46,
  },
];

export const mockHeritageBooks: HeritageBook[] = [
  {
    id: 'hb-01',
    title: 'Ahalteke bedewi — biziň buýsanjymyz we şöhratymyz',
    author: 'Gahryman Arkadagymyz',
    year: 2008,
    pages: 264,
    category: 'Milli Miras we Taryh',
    accentColor: '#064E3B',
    excerpt:
      'Türkmen halkynyň müňýyllyk atşynaslyk sungaty, behişdi bedewleriň dünýä medeniýetindäki orny we arassa ganly tohumy gorap saklamak baradaky düýpli eser.',
    highlights: [
      'Ahalteke bedewiniň gadymy taryhy gözbaşlary',
      'Milli seýisçilik mekdebiniň inçe syrlary',
      'Halkara derejede ykrar edilen tohum aýratynlyklary',
    ],
  },
  {
    id: 'hb-02',
    title: 'Gadamy batly bedew',
    author: 'Gahryman Arkadagymyz',
    year: 2016,
    pages: 312,
    category: 'Seýisçilik we Ösüş',
    accentColor: '#0B6B51',
    excerpt:
      'Türkmen bedewiniň döwrebap atçylyk sportundaky belent sepgitleri, atşynaslyk toplumlarynyň gurluşygy we ýaş nesle geçirilýän däpler hakynda giňişleýin beýan.',
    highlights: [
      'Döwrebap halkara atçylyk sport toplumlarynyň ösüşi',
      'Bedewleriň çydamlylygy we çapyşyk taýýarlygy',
      'Atşynaslykda halkara hyzmatdaşlyk',
    ],
  },
  {
    id: 'hb-03',
    title: 'Atda wepa-da bar, sapa-da',
    author: 'Gahryman Arkadagymyz',
    year: 2019,
    pages: 296,
    category: 'Ruhy Gymmatlyk',
    accentColor: '#14532D',
    excerpt:
      'Adam bilen bedewiň arasyndaky mukaddes dostluk, wepalylyk, milli şaý-sep sungaty we türkmen atşynaslarynyň nesilden-nesle geçýän ýörelgeleri.',
    highlights: [
      'Kümüş we altyn at esbaplarynyň sungaty',
      'Bedewleriň häsiýeti we adam bilen sazlaşygy',
      'Halk döredijiliginde we edebiýatda ahalteke keşbi',
    ],
  },
  {
    id: 'hb-04',
    title: 'Ýaşlar — Watanyň daýanjy we Sanly Geljek',
    author: 'Hormatly Prezidentimiz',
    year: 2024,
    pages: 280,
    category: 'Ýaşlar we Ýaşyl Tehnologiýa',
    accentColor: '#856510',
    excerpt:
      'Ýaş türkmen hünärmenleriniň sanly ulgamlary, ekologiýa taýdan arassa «ýaşyl» çözgütleri we milli gymmatlyklary utgaşdyryp ösdürmekdäki orny.',
    highlights: [
      'Arkadag şäherindäki akylly we ýaşyl infrastruktura',
      'Aba Annaýew akademiýasynda ýaş seýisleriň taýýarlygy',
      'Durnukly ösüş we innowasion tehnologiýalar',
    ],
  },
];

export const mockCareLayers: CareLayerStep[] = [
  {
    id: 'care-01',
    indexLabel: '01',
    title: 'Däp-dessurly Ideg we Organiki Iýmitlendiriş',
    subtitle: 'Halypa seýisleriň köpasyrlyk tejribesi sanly tertipnamada',
    description:
      'Her bir ahalteke bedewi üçin ýaşyna, türgenleşik ýüküne we möwsümine görä ýorunja, arassa arpa, süle hem-de mineral goşundylarynyň takyk gündelik ölçegi sazlanýar.',
    metrics: [
      { label: 'Organiki ot-iým paýy', value: '100%' },
      { label: 'Gündelik suw gözegçiligi', value: '16°C · 42 L' },
      { label: 'Iýmit galyndysynyň azalmagy', value: '-19%' },
    ],
  },
  {
    id: 'care-02',
    indexLabel: '02',
    title: 'Akylly IoT Biometrika we Howa Datçikleri',
    subtitle: '24/7 üznüksiz saglyk we athana mikroklimat gözegçiligi',
    description:
      'Ýeňil boýunlyk we athana datçikleri ýürek urşuny, beden temperaturasyny, hereket işjeňligini, athananyň çyglylygyny we ammiak derejesini säwliksiz ölçäp seýise habar berýär.',
    metrics: [
      { label: 'Ýürek urşy takyklygy', value: '±1 bpm' },
      { label: 'Ammiak (NH₃) çägi', value: '< 5 ppm' },
      { label: 'Batareýa ömri', value: '180 gün' },
    ],
  },
  {
    id: 'care-03',
    indexLabel: '03',
    title: '«Ýaşyl Athana» Gün we Suw Aýlanyşygy',
    subtitle: 'Energiýa garaşsyz we nol zyňyndyly ekologiýa standarty',
    description:
      'Athana üçeklerindäki gün panelleri yşyklandyryş we howa çalşygyny üpjün edýär, ýagyş suwy süzülip gaýtadan ulanylýar, organiki galyndylar bolsa ýokary hilli bio-komposta öwrülýär.',
    metrics: [
      { label: 'Gün energiýasy bilen üpjünçilik', value: '84–91%' },
      { label: 'Suwy gaýtadan ulanyş', value: '+22–31%' },
      { label: 'Bio-kompost gaýtadan işleme', value: '100%' },
    ],
  },
];

export const mockAcademyPrograms: AcademyProgramHighlight[] = [
  {
    id: 'prg-01',
    title: 'Milli Seýisçilik we Sanly IoT Gözegçilik',
    duration: '4 ýyl · Bakalawr',
    seats: 40,
    focus: 'Bedewleriň fiziologiýasy, şejere hasaby we telemetriýa ulgamlary',
  },
  {
    id: 'prg-02',
    title: 'At Weterinariýasy we Biotehnologiýa',
    duration: '5 ýyl · Hünärmen',
    seats: 35,
    focus: 'Öňüni alyş lukmançylygy, sport dikeldilişi we DNK pasportlaşdyrma',
  },
  {
    id: 'prg-03',
    title: '«Ýaşyl Athana» Eko-Inženerçiligi',
    duration: '4 ýyl · Bakalawr',
    seats: 30,
    focus: 'Gün energiýasy, ýagyş suwuny süzmek we organiki kompost ulgamlary',
  },
];
