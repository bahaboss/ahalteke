# Smart & Green Ahalteke — AI Ulanylyşy we Çeşmeler (Düzgünnama 4.4)

Bu resminama **«Smart & Green Technology Challenge»** hakaton bäsleşiginiň **Düzgünnama 4.4** talaplaryna laýyklykda, taslamada ulanylan emeli aň (AI) gurallary, açyk çeşmeli kitaphanalar we maglumat çeşmeleri barada doly açyk hasabat berýär.

---

## 1. 1–7-nji Ädimlerde Emeli Aň (AI) Gurallarynyň Ulanylyşy

- **Arhitektura we Kod Düzümi**: Frontend arhitekturasyny (React + TypeScript + Tailwind CSS + Framer Motion + Three.js + PWA), dizaýn tokenlerini, 5 sahnaly 3D storytelling baş sahypasyny, Giriş/Hasap açmak ekranlaryny, 4-ekranly Ýönekeý Ulanyjy panelini, 5-ekranly Işgär Dashboardyny («Athanam we Atlar», real-wagt «IoT Datçikler», «Isripsiz Rasion», «Saglyk/Türgenleşik/Arassaçylyk» we 40-ballyk **«Ýaşyl Athana»** Eco-Monitoring), 4-ekranly **Merkezi Admin Panelini** («Umumy Gözegçilik we Ýaşyl Reýting», «Toplumlar, Athanalar we Işgärler», «Ýaryşlar we Kitaphana Dolandyryşy», «Akademiýa Dalaşgärlik Anketalary» + CSV eksporty) hem-de mock serwislerini taýýarlamakda generatiw AI kod kömekçisi ulanyldy.
- **«AI Eko-Maslahatçy» Moduly**: «Ýaşyl Athana» ekranyndaky AI Eko-Maslahatçy häzirki oflaýn-taýýar PWA tapgyrynda IoT suw/energiýa we isripsiz rasion görkezijilerine esaslanýan açyk algoritmik düzgünler bilen işleýär we geljekde `/api/v1/eco/ai-recommendations/:id/apply` serwer nokadyna birikdirmäge taýýardyr.
- **Wizual Çeşmeler**:
  - Baş sahypanyň 450vh «Frame-by-Frame Canvas Scrubbing» Hero sahnasy `public/frames/hero/` kadr yzygiderliligini 60fps oýnadýar; kadrlar ýok wagtynda awtomatiki fallback hökmünde generatiw AI bilen döredilen ýerli Ahalteke suraty (`public/bedew.webp`) we 5 welaýat haly gölleri (`/assets/aistudio/bedew_20e11c72.webp`) ulanylýar.
  - `src/mockData/horses.ts` katalogyndaky Ahalteke bedewleriniň nusga portretleri we animasiýaly SVG awatarlary (`/public/avatars/`, `/src/assets/images/`) daşarky baglanyşyksyz ýerli çeşmeler hökmünde taýýarlandy.
- **Işleýiş Tertibi we Ýerli Saklaýyş**: Häzirki tapgyrda platforma doly frontend mock serwislerinde (`src/mockData/` + `src/services/`) işleýär; awtorizasiýa sessiýasy, ýaryş/kitaphana üýtgeşmeleri, täze athanalar, işgär bellemeleri, akademiýa anketa statuslary, çek-listler we AI eko-maslahat ýerine ýetirişleri `localStorage`-da diňe parolsyz görnüşde saklanýar we Ulanyjy, Işgär hem-de Admin panelleri arasynda göni sinhronlanýar.

---

## 2. Açyk Çeşmeli Tehnologiýalar we Kitaphanalar

| Kitaphana | Lisenziýa | Taslamadaky Roly |
| :--- | :--- | :--- |
| **React 19** & **TypeScript** | MIT / Apache-2.0 | Komponent esasyndaky UI we berk görnüş howpsuzlygy |
| **React Router (`react-router-dom`)** | MIT | Ýakorsyz arassa URL marşrutlaşdyrmasy, 5 Layout we `ProtectedRoute` goragy |
| **Vite 8** | MIT | Çalt işläp düzüş we önümçilik gurluşy |
| **Tailwind CSS v4** | MIT | Design System tokenleri we jogapkärli tor ulgamy |
| **Lenis (`lenis`)** | MIT | Diňe `/` Baş sahypasy üçin çäklendirilen ýumşak scroll |
| **Framer Motion (`framer-motion`)** | MIT | 450vh kadrlaýyn Hero, yza-öňe 3D storytelling sahnalary (`useScroll`, `useTransform`, `useSpring`, `AnimatePresence`) |
| **Three.js** | MIT | 100% prosedural 3D «Ýaşyl Athana» we Ahalteke bedew sahnasy |
| **vite-plugin-pwa** (Workbox) | MIT | Web App Manifest, Service Worker we oflaýn PWA goldawy |
| **Lucide React** | ISC | Ýeňil, elýeterli wektor nyşanlar |
| **Google Fonts** (`Playfair Display`, `Plus Jakarta Sans`, `JetBrains Mono`) | OFL | Türkmen diliniň (ä, ň, ö, ş, ü, ý, ž) doly goldawy bilen tipografiýa |

---

## 3. Maglumat Çeşmeleri we Etiki Düzgünler

- **Nusga Maglumatlary (`src/mockData/`)**: Häzirki tapgyrdaky at atlary, welaýat «Ýaşyl Reýtingi», IoT görkezijiler, gün energiýasy hasabatlary we akademiýa ýüz tutmalary diňe hakaton demonstrasiýasy üçin döredilen **realistik emeli nusgalardyr (mock data)**; hiç hili şahsy raýat maglumatlary (PII) ulanylmaýar.
- **Fiziologik we Ekologiýa Kadalar**: Atlar üçin dynçlykdaky ýürek urşy (28–42 urgy/min), kadaly beden temperaturasy (37.5–38.3°C) we athanada ammiak çägi (<10 ppm) halkara weterinar we ekologiýa standartlaryna esaslanýar.
- **Gizlinlik we Howpsuzlyk**: Hiç bir API açary brauzer kodunda saklanmaýar; geljekki backend integrasiýasy diňe `.env` gurşaw üýtgeýjileri we serwer proksi (`/api/v1/*`) arkaly amala aşyrylar.
