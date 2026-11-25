import type { AcademyApplication, BookItem, Competition } from '../types';

export const ACADEMY_OFFICIAL_URL = 'https://ihba.edu.tm';

export interface AcademySpecialty {
  id: string;
  name: string;
  faculty: string;
  duration: string;
  seats: number;
  summary: string;
}

export const ACADEMY_SPECIALTIES: AcademySpecialty[] = [
  {
    id: 'spec-01',
    name: 'Milli Seýisçilik we Sanly IoT Gözegçilik',
    faculty: 'Atçylyk we Seýisçilik fakulteti',
    duration: '4 ýyl · Bakalawr',
    seats: 40,
    summary:
      'Gadymy türkmen seýisçilik mekdebi, bedewleriň şejere hasaby we sanly biometrik datçikleri dolandyrmak.',
  },
  {
    id: 'spec-02',
    name: 'At Weterinariýasy we Biotehnologiýa',
    faculty: 'Weterinar lukmançylygy fakulteti',
    duration: '5 ýyl · Hünärmen',
    seats: 35,
    summary:
      'Bedewleriň öňüni alyş lukmançylygy, sport dikeldilişi, DNK pasportlaşdyrma we saglyk diagnostikasy.',
  },
  {
    id: 'spec-03',
    name: '«Ýaşyl Athana» Eko-Inženerçiligi',
    faculty: 'Atçylykda Sanly we Ýaşyl Tehnologiýalar fakulteti',
    duration: '4 ýyl · Bakalawr',
    seats: 30,
    summary:
      'Atçylyk toplumlarynda gün energiýasy, ýagyş suwuny süzmek, mikroklimat we bio-kompost ulgamlaryny taslamak.',
  },
  {
    id: 'spec-04',
    name: 'Atçylyk Sporty we Çapyksuwarlyk',
    faculty: 'Atçylyk sporty we Syýahatçylyk fakulteti',
    duration: '4 ýyl · Bakalawr',
    seats: 35,
    summary:
      'Halkara at çapyşyklary, konkur, uzak aralyk marafon taýýarlygy we sport menejmenti.',
  },
];

export const ACADEMY_ADMISSION_REQUIREMENTS: string[] = [
  'Türkmenistanyň orta bilimi hakynda şahadatnama ýa-da hünär orta diplomy (ýaşy 16–35 aralygy).',
  'Bedewlere ideg etmek we milli atçylyk sungatyna höwes (başlangyç, orta ýa-da ýokary tejribe).',
  'Saglyk barlagyndan geçenligi barada resmi kepilnama we şahsy resminamalar.',
  'Giriş synaglary: Biologiýa, Türkmenistanyň taryhy we saýlanan ugur boýunça amaly söhbetdeşlik.',
];

export const mockCompetitions: Competition[] = [
  {
    id: 'comp-001',
    title: 'Türkmen Bedewiniň Milli Baýramy — Halkara Gözellik Bäsleşigi',
    category: 'gözellik',
    date: '2027-04-25',
    location: 'Halkara Ahalteke Atçylyk Sport Toplumy, Ahal',
    complexId: 'cmp-ashgabat-01',
    prizePoolLabel: 'Baş baýrak we Altyn Kubok',
    status: 'öňde',
    registeredHorseIds: ['hrs-001', 'hrs-002', 'hrs-005'],
    description:
      'Arassa ganly ahalteke bedewleriniň daşky sypaty, milli kümüş şaý-sepleri we sazlaşykly hereket gözelligini görkezýän esasy halkara bäsleşik.',
  },
  {
    id: 'comp-002',
    title: '«Ýaşyl Köpetdag» Çydamlylyk Eko-Marafony (40 km)',
    category: 'marafon',
    date: '2026-12-12',
    location: 'Arkadag «Ýaşyl Bedew» Eko-Atçylyk Merkezi',
    complexId: 'cmp-arkadag-02',
    prizePoolLabel: 'Ýaşyl Sertifikat we Baýrak Gaznasy',
    status: 'öňde',
    registeredHorseIds: ['hrs-002', 'hrs-003', 'hrs-004'],
    description:
      'Bedewleriň IoT ýürek urşy we dikeldiliş görkezijileri esasynda saglygy gorap geçirilýän döwrebap uzak aralyk eko-marafony.',
  },
  {
    id: 'comp-003',
    title: 'Aşgabat Bahar At Çapyşygy — «Altyn Asyr» Kubogy (2000 m)',
    category: 'çapyşyk',
    date: '2027-03-21',
    location: 'Halkara Ahalteke Atçylyk Sport Toplumy, Gökdepe',
    complexId: 'cmp-ashgabat-01',
    prizePoolLabel: 'Altyn Kubok we Ýörite Baýraklar',
    status: 'öňde',
    registeredHorseIds: ['hrs-001', 'hrs-003', 'hrs-004'],
    description:
      'Nowruz baýramyna bagyşlanan 3 we 4 ýaşar ahalteke bedewleriniň arasyndaky däp bolan bahar at çapyşyklary.',
  },
  {
    id: 'comp-004',
    title: 'Aba Annaýew Akademiýasynyň Ýaş Çapyksuwarlar Konkur Bäsleşigi',
    category: 'konkur',
    date: '2027-01-28',
    location: 'Aba Annaýew Akademiýasynyň Okuw-Türgenleşik Toplumy, Arkadag',
    complexId: 'cmp-academy-04',
    prizePoolLabel: 'Akademiýa Kubogy we Stipendiýa',
    status: 'öňde',
    registeredHorseIds: ['hrs-004', 'hrs-006'],
    description:
      'Ýaş seýisleriň we talyplaryň päsgelçiliklerden bökmek (120–135 sm) boýunça ussatlyk görkezýän açyk sport ýaryşy.',
  },
];

export const mockBooks: BookItem[] = [
  {
    id: 'bk-001',
    title: 'Ahalteke bedewi — biziň buýsanjymyz we şöhratymyz',
    author: 'Gahryman Arkadagymyz',
    publishYear: 2008,
    category: 'taryh',
    pages: 264,
    language: 'Türkmençe / Iňlisçe',
    accentColor: '#064E3B',
    summary:
      'Türkmen halkynyň müňýyllyk atşynaslyk sungaty, behişdi bedewleriň dünýä medeniýetindäki orny we arassa ganly tohumy gorap saklamak baradaky düýpli eser.',
    availableFormats: ['PDF', 'EPUB', 'Audio'],
    isFeatured: true,
    keyQuotes: [
      'Ahalteke bedewi türkmen halkynyň kalbynyň aýnasydyr, onuň taryhy ýolunyň wepaly hemrasydyr.',
      'Arassa ganly tohumy gorap saklamak — geljekki nesilleriň öňündäki mukaddes borjumyzdyr.',
    ],
    chapters: [
      {
        title: '1-nji bölüm · Gadymy Gözbaşlar we Nisa Bedewleri',
        content:
          'Gadymy taryhy çeşmelerde «asman bedewleri» diýlip atlandyrylan ahalteke atlary Köpetdagyň eteklerinde we Garagumuň giňişliklerinde türkmen seýisleriniň müňýyllyk zähmeti netijesinde kemala gelipdir. Olaryň inçe sypaty, ýalpyldawuk reňki we tebigy çydamlylygy dünýä atşynaslygynyň altyn hazynasydyr.',
      },
      {
        title: '2-nji bölüm · Milli Seýisçilik Mekdebi',
        content:
          'Türkmen seýisçiligi diňe bir bedewi çapyşyga taýýarlamak däl, eýsem onuň häsiýetine, iýmitine, suwuna we ruhy ýagdaýyna inçe gözegçilik etmek sungatydyr. Halypadan şägirdine geçýän bu ýörelgeler häzirki wagtda ylmy esasda öwrenilýär.',
      },
      {
        title: '3-nji bölüm · Döwrebap Atçylyk we Halkara Hyzmatdaşlyk',
        content:
          'Halkara ahalteke atçylyk assosiasiýasynyň döredilmegi we täze sport toplumlarynyň gurulmagy türkmen bedewiniň şöhratyny dünýäniň ähli künjeklerine ýaýdy.',
      },
    ],
  },
  {
    id: 'bk-002',
    title: 'Gadamy batly bedew',
    author: 'Gahryman Arkadagymyz',
    publishYear: 2016,
    category: 'seýisçilik',
    pages: 312,
    language: 'Türkmençe / Iňlisçe',
    accentColor: '#0B6B51',
    summary:
      'Türkmen bedewiniň döwrebap atçylyk sportundaky belent sepgitleri, halkara toplumlaryň ösüşi we ýaş nesle geçirilýän seýisçilik däpleri barada giňişleýin beýan.',
    availableFormats: ['PDF', 'EPUB', 'Audio'],
    isFeatured: true,
    keyQuotes: [
      'Bedewiň batly gadamy — Watanymyzyň ösüş depgininiň we täze sepgitleriniň nyşanydyr.',
    ],
    chapters: [
      {
        title: '1-nji bölüm · Sport Toplumlary we Täze Infrastruktura',
        content:
          'Ýurdumyzyň ähli welaýatlarynda gurlan häzirki zaman atçylyk sport toplumlary ahalteke atlarynyň tohum arassalygyny goramak we ýaş çapyksuwarlary taýýarlamak üçin giň mümkinçilikleri açdy.',
      },
      {
        title: '2-nji bölüm · Çapyşyk we Çydamlylyk Syrlary',
        content:
          'Ahalteke bedewi gysga aralykda ýokary tizlik görkezmek bilen bir hatarda, uzak aralyk marafonlarynda-da deňsiz-taýsyz çydamlylygyny subut edýär. Dogry türgenleşik we dikeldiliş tertibi üstünligiň girewidir.',
      },
    ],
  },
  {
    id: 'bk-003',
    title: 'Atda wepa-da bar, sapa-da',
    author: 'Gahryman Arkadagymyz',
    publishYear: 2019,
    category: 'taryh',
    pages: 296,
    language: 'Türkmençe',
    accentColor: '#14532D',
    summary:
      'Adam bilen bedewiň arasyndaky mukaddes dostluk, wepalylyk, kümüş at şaý-sepleriniň sungaty we türkmen halk döredijiligindäki ahalteke keşbi.',
    availableFormats: ['PDF', 'EPUB'],
    isFeatured: true,
    keyQuotes: [
      'Irden turup ataňy gör, ataňdan soň — atyňy.',
      'Bedew bilen ynsanyň arasyndaky ynam asyrlaryň synagyndan geçen dostlukdyr.',
    ],
    chapters: [
      {
        title: '1-nji bölüm · Wepa we Ynam',
        content:
          'Türkmen nakyllarynda we dessanlarynda bedew hemişe mertligiň, wepalylygyň we ýoldaşlygyň nyşany bolup gelipdir. Bedew öz eýesiniň sesini we ýürek urşuny duýýar.',
      },
      {
        title: '2-nji bölüm · Kümüş we Altyn Şaý-Sep Sungaty',
        content:
          'Türkmen zergärleriniň ahalteke bedewleri üçin ýasan göwüsbentleri, boýunlyklary we haly at örtükleri hakyky amaly-haşam sungat eserleridir.',
      },
    ],
  },
  {
    id: 'bk-004',
    title: 'Ýaşlar — Watanyň daýanjy',
    author: 'Hormatly Prezidentimiz',
    publishYear: 2023,
    category: 'ekologiýa',
    pages: 280,
    language: 'Türkmençe / Iňlisçe',
    accentColor: '#856510',
    summary:
      'Ýaş türkmen hünärmenleriniň milli mirasy gorap saklamakda, Arkadag şäherindäki akylly we ýaşyl tehnologiýalary ösdürmekdäki hem-de atçylyk ylymlaryny sanlylaşdyrmakdaky orny.',
    availableFormats: ['PDF', 'EPUB', 'Audio'],
    isFeatured: true,
    keyQuotes: [
      'Ýaşlaryň döredijilik güýji, bilimi we innowasion pikirlenişi — ýurdumyzyň ýaşyl geljeginiň kepilidir.',
    ],
    chapters: [
      {
        title: '1-nji bölüm · Arkadag — Akylly we Ýaşyl Şäher',
        content:
          'Arkadag şäherinde açylan Aba Annaýew adyndaky Halkara atçylyk akademiýasy ýaş nesliň gadymy seýisçilik sungatyny häzirki zaman sanly we ekologiýa tehnologiýalary bilen utgaşdyryp öwrenmegi üçin döredilen bilim ojogydyr.',
      },
      {
        title: '2-nji bölüm · Ýaşyl Tehnologiýalar we Durnukly Ösüş',
        content:
          'Gün energiýasy, suw serişdelerini aýawly ulanmak we sanly gözegçilik ulgamlary ýaş inženerleriň öňünde duran esasy ylmy-amaly wezipelerdir.',
      },
    ],
  },
  {
    id: 'bk-005',
    title: '«Ýaşyl Athana»: Energiýa we Suw Tygşytlaýjy Ekologiýa Standartlary',
    author: 'Ekologiýa we Durnukly Ösüş Merkezi',
    publishYear: 2025,
    category: 'ekologiýa',
    pages: 168,
    language: 'Türkmençe',
    accentColor: '#059669',
    summary:
      'Atçylyk toplumlarynda gün panelleri, ýagyş suwuny süzmek, IoT howa datçikleri we bio-kompost öndürmek boýunça amaly gollanma.',
    availableFormats: ['PDF'],
    isFeatured: false,
    chapters: [
      {
        title: '1-nji bölüm · Gün Energiýasy we Mikroklimat',
        content:
          'Athana üçeklerinde oturdylan gün panelleri yşyklandyryş we howa çalşygy ulgamlarynyň 84%-e çenli energiýasyny tebigy çeşmeden üpjün edýär.',
      },
      {
        title: '2-nji bölüm · Ýagyş Suwy we Organiki Kompost',
        content:
          'Ýygnalan ýagyş suwy köp basgançakly süzgüçden geçirilip, öri meýdanlaryny damjalaýyn suwarmakda we athana arassaçylygynda gaýtadan ulanylýar.',
      },
    ],
  },
];

export const mockAcademyApplications: AcademyApplication[] = [
  {
    id: 'aca-001',
    applicantName: 'Begenç Nuryýew',
    age: 19,
    region: 'Ahal welaýaty',
    schoolName: 'Gökdepe etrabynyň 14-nji orta mekdebi',
    phone: '+993 65 42 18 90',
    email: 'begenc.nuryyew@sanly.tm',
    programName: 'Milli Seýisçilik we Sanly IoT Gözegçilik',
    experienceLevel: 'orta',
    submittedAt: '2026-11-18',
    status: 'tassyklandy',
    preferredComplexId: 'cmp-ashgabat-01',
    motivationNote:
      'Atamdan miras galan seýisçilik hünärini sanly IoT tehnologiýalary bilen ösdürmek isleýärin.',
  },
  {
    id: 'aca-002',
    applicantName: 'Aýlar Gurbanowa',
    age: 21,
    region: 'Arkadag şäheri',
    schoolName: 'Arkadag şäheriniň 3-nji ýöriteleşdirilen orta mekdebi',
    phone: '+993 62 71 34 05',
    email: 'aylar.gurbanowa@sanly.tm',
    programName: 'At Weterinariýasy we Biotehnologiýa',
    experienceLevel: 'ýokary',
    submittedAt: '2026-11-21',
    status: 'söhbetdeşlik',
    preferredComplexId: 'cmp-arkadag-02',
    motivationNote:
      'Weterinar lukmançylygy boýunça diplom işimi ahalteke bedewleriniň dikeldiliş fiziologiýasyna bagyşlaýaryn.',
  },
  {
    id: 'aca-003',
    applicantName: 'Serdar Hojamyradow',
    age: 17,
    region: 'Mary welaýaty',
    schoolName: 'Mary şäheriniň 21-nji orta mekdebi',
    phone: '+993 64 19 88 23',
    email: 'serdar.hoja@sanly.tm',
    programName: 'Atçylyk Sporty we Çapyksuwarlyk',
    experienceLevel: 'başlangyç',
    submittedAt: '2026-11-22',
    status: 'garalýar',
    preferredComplexId: 'cmp-mary-03',
    motivationNote:
      'Kiçilikden bäri ahalteke atlaryna ideg edýärin, resmi akademiýada bilim almak meniň arzuwym.',
  },
];
