# Smart & Green Ahalteke — Ulgam Arhitekturasy

Bu resminama taslamanyň modullaşdyryş ýörelgelerini, papka gurluşyny, PWA binýadyny we geljekde React Native-e hem-de hakyky backend serwerine geçiş strategiýasyny beýan edýär.

---

## 1. Gatlaklaýyn Modullaşdyryş (React Native Taýýarlygy)

Taslama DOM-a bagly UI gatlagyny arassa biznes logikasyndan doly aýyrýar:

```text
┌──────────────────────────────────────────────────────────┐
│  Prezentasiýa Gatlagy (React + Tailwind CSS + Three.js)  │
│  src/components/{common,landing,auth,user,staff,admin}   │
└───────────────────────────┬──────────────────────────────┘
                            │ Props & Hooks
┌───────────────────────────▼──────────────────────────────┐
│  Serwis Gatlagy (Asinhron API Şertnamasy)                │
│  src/services/*  (// TODO: [BACKEND_API] bellikli)       │
└───────────────────────────┬──────────────────────────────┘
                            │ Mock / Geljekki REST API
┌───────────────────────────▼──────────────────────────────┐
│  Arassa Domain we Token Gatlagy (100% RN-Göçürilýän)     │
│  src/types/*  |  src/styles/designTokens.ts  | mockData  │
└──────────────────────────────────────────────────────────┘
```

### Papka Gurluşy we Ýakorsyz React Router (`src/router.tsx`)
- `docs/` — 4 sany taslama resminamasy (`DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `AI_AND_SOURCES.md`).
- `public/frames/hero/` — Baş sahypanyň 3D scroll kadr yzygiderliligi üçin niýetlenen media bukjasy.
- `src/styles/` — Umumy dizaýn tokenleri (`designTokens.ts`).
- `src/types/` — Esasy domain TypeScript interfeýsleri.
- `src/mockData/` — Türkmen dilindäki realistik nusga maglumatlary.
- `src/store/` — Merkezi **Global Store** (`AppStoreContext.tsx` / `useAppStore()`), ähli panelleriň maglumatlaryny we sessiýasyny bir ýerden dolandyrýar.
- `src/services/` — Geljekki backend API-a geçmäge taýýar `// TODO: [BACKEND_API]` bellikli asinhron serwisler.
- `src/layouts/` — 5 aýratyn Layout gabygy:
  - `PublicLayout` (`/`, `/design-system`)
  - `AuthLayout` (`/login`, `/register`)
  - `UserLayout` (`/user/horses`, `/user/horses/:id`, `/user/competitions`, `/user/books`, `/user/academy`)
  - `StaffLayout` (`/staff/overview`, `/staff/stables`, `/staff/horses`, `/staff/horses/:id`, `/staff/iot`, `/staff/feeding`, `/staff/health-training`, `/staff/green-eco`)
  - `AdminLayout` (`/admin/dashboard`, `/admin/complexes`, `/admin/staff`, `/admin/content`, `/admin/applications`)
- `src/pages/` — `landing/`, `auth/`, `user/`, `staff/`, `admin/` üçin arassa URL sahypa modullary.
- `src/hooks/` — PWA gurnama (`usePWAInstall`) we tor ýagdaýy (`useOnlineStatus`) huklary.
- `src/components/common/` — Gaýtadan ulanylýan UI komponentleri (`Button`, `Card`, `Modal`, `StatBadge`, `SkeletonLoader`, `AnimatedHorseLogo`, `ProtectedRoute`, `RoutePlaceholder`, `EcoStable3DScene`, `PWAInstallButton`, `OfflineIndicator`).
- `src/components/landing/`, `auth/`, `user/`, `staff/`, `admin/` — Doly işjeň domen ekranlary we modallary (ähli öňki ädimler hiç zady bozmazdan täze `src/router.tsx` marşrutlaryna birikdirildi).

---

## 2. Ulanyjy Rollary (RBAC Modeli)

| Rol (`UserRole`) | Ýagdaýy | Esasy Mümkinçilikleri |
| :--- | :--- | :--- |
| `guest` | **Işjeň (2-nji ädim: Landing)** | 5 sahnaly 3D Storytelling baş sahypa, 5 welaýat «Ýaşyl Reýtingi», Eko-Kalkulýator we 3D «Ýaşyl Athana» |
| `user` | **Doly Işjeň (Ulanyjy Paneli)** | `UserLayout` (desktop sidebar/topbar + mobil bottom bar, dinamiki breadcrumb we ýatlatma sany) + ýakorsyz `/user/horses` (tohum/reňk süzgüji, animasiýaly awatar, çalt QR), `/user/horses/:id` (3 nesilli nesil daragty, QR-pasport, taryh, üstünlikler we IoT ýagdaýy), `/user/competitions` (welaýat/toplum süzgüji we Store-da saklanýan ýatlatmalar), `/user/books` we `/user/academy` |
| `staff` | **Doly Işjeň (Işgär Paneli)** | Ýakorsyz `StaffLayout` (hemişelik çep `<NavLink>` sidebar, ýokarda işgär/toplum/athana we çykyş, çözülmedik IoT duýduryş sany), `/staff/overview` (4 jemleýji KPI we dinamiki Ýaşyl Reýting + gyssagly duýduryşlar), `/staff/stables`, `/staff/horses` (täze at bellikleri + `localStorage`), `/staff/horses/:id` (QR-pasport, saglyk, rasion we bellikler), `/staff/iot` (6 datçik — gün paneli kWt bilen, her 3s mini sparkline + umumy grafik, live togtat/başlat, anomaliýa synagy we çözülýän Duýduryş Žurnaly), `/staff/feeding` (agrama we ýüke görä rasion kartasy, modal üýtgetme we tygşytlanan kg hasaplamasy), `/staff/health-training` (3 içki tab: Weterinar/waksina senenamasy + täze bellik formasy, Sport Türgenleşigi + SVG ösüş grafiki, Arassaçylyk çek-listi + işgär tassyklama wagty) we `/staff/green-eco` (IoT, rasion we arassaçylykdan dinamiki hasaplanýan Eco-Score 0–100, 4 interaktiw KPI, aýlyk/hepdelik grafikler, Waste-to-Green hasabat žurnaly + modal, Eko-Maslahatçy we içki 3D «Ýaşyl Athana» modaly) |
| `admin` | **Doly Işjeň (12-nji ädim: Admin Paneli)** | Ýakorsyz `AdminLayout` (ýygnalýan desktop sidebar, global `Ctrl+K` çalt gözleg, mobil 5-düwmeli aşaky menýu, garaşylýan anketalaryň janly san görkezijisi we `ProtectedRoute` 403 «Rugsat çäklendirilen» gorag ekrany) + 5 özbaşdak URL marşruty: `/admin/dashboard` (dinamiki KPI, interaktiw eko-grafik, welaýat/toplum süzgüçli «Ýaşyl Reýting» tablisasy we UTF-8 BOM CSV eksporty), `/admin/complexes` (Sport Toplumlary we Athanalar üçin doly CRUD), `/admin/staff` (Işgär bellemeleri we jogapkärçilik CRUD), `/admin/content` (Ýaryşlar we Kitaphana CRUD) we `/admin/applications` (4 status: Garaşylýar, Söhbetdeşlik, Kabul edildi, Ret edildi + Excel UTF-8 BOM CSV eksporty) — ählisi `AppStoreContext` we `localStorage` arkaly Ulanyjy we Işgär panelleri bilen göni sinhronlanýar |

---

## 3. PWA we Oflaýn Arhitektura (12-nji Ädim Jemleýji Barlagy)

- **Web App Manifest**: `vite-plugin-pwa` we `public/manifest.json` arkaly `display: "standalone"`, tema reňki `#064E3B`, gysga ady `Ahalteke`, `192×192`, `512×512` we `maskable 512×512` PNG nyşanlar hem-de iOS `apple-touch-icon.png`.
- **Service Worker**: `src/main.tsx` içinde `virtual:pwa-register` (`registerSW({ immediate: true })`), Workbox precache (`js, css, html, ico, png, svg, jpg, webp, woff, woff2`) + Google Fonts üçin `CacheFirst` runtime keşleýiş; mobil aşaky menýularyň üstüni ýapmaýan `OfflineIndicator`.
- **In-App Gurnama**: Chromium/Android üçin `beforeinstallprompt`, iOS Safari üçin ädimme-ädim türkmençe gurnama penjiresi (`PWAInstallButton` ähli portallarda elýeterli).

---

## 4. Lenis Smooth Scroll, 450vh Kadrlaýyn Canvas Hero we Three.js 3D «Ýaşyl Athana»

- **Diňe `/` üçin Çäklendirilen Lenis (`src/pages/landing/hooks/useLandingLenis.ts`)**: `Lenis` ýumşak scroll diňe Baş sahypada (`/`) işleýär we ulanyjy beýleki marşrutlara (`/login`, `/register`, `/user/*`, `/staff/*`, `/admin/*`) geçende `lenis.destroy()` bilen arassa öçürilýär. Şeýlelikde dashboard tablisalary we modallary tebigy scroll bilen işleýär.
- **450vh «Frame-by-Frame Canvas Scrubbing» Hero (`src/pages/landing/components/HeroFrameScrub.tsx`)**:
  - `src/config/heroFrames.ts` arkaly `TOTAL_FRAMES = 150` we `FRAME_PATH = '/frames/hero/frame_{index}.webp'` aňsat üýtgedilýär.
  - Ilkinji kadr derrew barlanylýar: kadrlar bar bolsa preloader + ýüklenme göterimi bilen 60fps tizlikde `<canvas>` üstünde yza-öňe oýnadylýar; kadrlar ýok bolsa hiç hili ýalňyşlyksyz `public/bedew.webp` bilen 3D zoom/parallax fallback režimine geçýär.
  - **4 Perdeli Yza-öňe Açylýan Kinematografik Gatlaklar**: `0–25%` (5 türkmen haly göli we welaýat «Ýaşyl Reýting» kartoçkasy), `25–50%` (altynsow Serif «ALTYN ASYRYŇ BEDEWLERI» sözbaşy we 2 CTA), `50–75%` (altyn tozan/eko-bölejikler + janly IoT Gologramma), `75–100%` (ýumşak ýokaryk ýygnanyp indiki sahna geçiş).
- **Yza-öňe 3D Storytelling (`framer-motion`)**: Aşaky 4 hekaýa sahnasynda (`BooksStoryScene`, `StatsEcoCalculatorScene`, `CareAndIoTScene`, `AcademyComplexesScene`) we öňki `HeroFiveHorsesScene` modulynda `useScroll`, `useTransform`, `useSpring` hem-de `useReducedMotion` sazlaşykly saklandy.
- **Three.js 3D «Ýaşyl Athana»**: Daşarky `.glb` faýllaryna bagly bolmazdan 100% prosedural PBR geometriýa, gün panelli eko-athana, ýagyş suwy howdany we IoT datçik stansiýalary (`DesignSystemShowcase` we «Ýaşyl Athana» ekranyndan göni elýeterli).

---

## 5. Tapgyrlaýyn Ösüş Ýol Kartasy (Ähli 12 Ädim Tamamlandy)

- **1–3-nji Ädimler (Tamamlandy)**: Design System, 5 Layout we ýakorsyz React Router (`src/router.tsx`), `AppStoreContext`, 450vh Kadrlaýyn Hero + 5 sahnaly 3D Storytelling Landing Page, Three.js 3D «Ýaşyl Athana», PWA binýady we Giriş/Hasap açmak (`/login`, `/register`).
- **4–6-njy Ädimler (Tamamlandy)**: Ýakorsyz Ulanyjy Paneli (`UserLayout` — `/user/horses`, `/user/horses/:id`, `/user/competitions`, `/user/books`, `/user/academy` onlaýn dalaşgärlik anketasy).
- **7–11-nji Ädimler (Tamamlandy)**: Ýakorsyz Işgär Paneli (`StaffLayout` — `/staff/overview`, `/staff/stables`, `/staff/horses`, `/staff/horses/:id`, `/staff/iot`, `/staff/feeding`, `/staff/health-training` 3-tab moduly we 40-ballyk `/staff/green-eco` «Ýaşyl Athana» Eco-Score, Waste-to-Green we 3D modal).
- **12-nji Ädim (Tamamlandy)**: Ýakorsyz Merkezi Admin Paneli (`AdminLayout` + janly garaşylýan anketa sany) we 5 özbaşdak marşrut (`/admin/dashboard`, `/admin/complexes`, `/admin/staff`, `/admin/content`, `/admin/applications` 4-statusly + UTF-8 BOM CSV eksporty) hem-de jemleýji marşrut, `ProtectedRoute`, mobil PWA we 4 Markdown resminamasynyň barlagy.
- **Geljekki Tapgyr (Backend Integrasiýasy)**: `src/services/` içindäki ähli `// TODO: [BACKEND_API]` nokatlarynyň hakyky REST/WebSocket serwerine birikdirilmegi.
