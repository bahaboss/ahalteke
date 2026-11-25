# Smart & Green Ahalteke — Backend API Şertnamalary (`v1`)

Häzirki tapgyrda ähli maglumatlar `src/mockData/` faýllaryndan `src/services/` üsti bilen asinhron görnüşde alynýar. Her bir serwis funksiýasynda standart `// TODO: [BACKEND_API]` belligi goýlandyr.

Geljekde Node.js/Express ýa-da NestJS backend birikdirilende aşakdaky REST API nokatlary üýtgedilmezden şu TypeScript görnüşlerini (`src/types/domain.ts`) gaýtarar.

---

## 1. Umumy Jogap Formady (`ApiResponse<T>`)

```json
{
  "data": {},
  "timestamp": "2026-11-23T08:45:00.000Z",
  "source": "backend-api",
  "latencyMs": 42
}
```

---

## 2. Atçylyk Toplumlary, Athanalar we Rollar (`complexService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/complexes` | `EquestrianComplex[]` | Ähli atçylyk toplumlarynyň sanawy |
| `GET` | `/api/v1/stables?complexId=:id` | `Stable[]` | Belli bir toplumyň eko-athanalary |
| `GET` | `/api/v1/auth/roles` | `RoleDefinition[]` | Ulgam rollary we rugsatlar (Guest, User, Staff, Admin) |

---

## 3. Ahalteke Bedewleri we QR Pasport (`horseService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/horses?search=&healthStatus=&complexId=` | `Horse[]` | Bedewleri gözlemek we süzmek |
| `GET` | `/api/v1/horses/:id` | `Horse \| null` | ID boýunça bedewiň doly pasporty we şejeresi |
| `GET` | `/api/v1/horses/qr/:qrCodeId` | `Horse \| null` | QR-kod ID arkaly sanly bedew pasporty |

---

## 4. IoT Telemetriýa, Iýmitlendiriş, Türgenleşik, Saglyk we Arassaçylyk (`iotEcoService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/iot/telemetry?horseId=:id` | `IoTSensorData[]` | Ýürek urşy, temperatura, suw derejesi we athana howa görkezijileri |
| `WSS` | `/ws/v1/stables/:id/iot-stream` | `IoTStreamSnapshot` | Athananyň (temp, çyglylyk, ammiak, suw, gün paneli kWt) we saýlanan bedewiň 3s real-wagt IoT akymy |
| `GET` | `/api/v1/iot/alerts` | `IoTAlertLogItem[]` | Çözülmedik we çözülen IoT duýduryş žurnaly (`localStorage` mock) |
| `POST` | `/api/v1/iot/alerts` | `IoTAlertLogItem[]` | Anomaliýa duýduryşlaryny žurnala ýazmak (`localStorage` mock) |
| `PATCH` | `/api/v1/iot/alerts/:id/resolve` | `IoTAlertLogItem[]` | Duýduryşy «Çözüldi» diýip bellemek we `/staff/overview` bilen sinhronlamak |
| `GET` | `/api/v1/horses/notes?horseId=:id` | `StaffHorseNote[]` | Işgär tarapyndan atlara goşulan gözegçilik we ideg bellikleri (`localStorage` mock) |
| `POST` | `/api/v1/horses/:id/notes` | `StaffHorseNote` | Bedew üçin täze gözegçilik belligini döretmek (`/staff/horses/:id`-de görünýär) |
| `GET` | `/api/v1/feeding-plans?horseId=:id` | `FeedingPlan[]` | Gündelik isripsiz iýmitlendiriş tertibi (irden, günortan, agşam) |
| `PATCH` | `/api/v1/feeding-plans/:id/complete` | `{ planId: string; completedToday: boolean }` | Nahar tapgyrynyň ýerine ýetirilendigini bellemek (`localStorage` mock) |
| `PUT` | `/api/v1/stables/:id/feeding` | `FeedingPlan[]` | Rasion meýilnamasyny üýtgetmek ýa-da goşmak we isripçilikden tygşytlanan ot-iým mukdaryny (kg) awtomatiki hasaplamak (`localStorage` + `AppStoreContext`) |
| `GET` | `/api/v1/training-logs?horseId=:id` | `TrainingLog[]` | Seýis tarapyndan ýazylan sport türgenleşik žurnaly we ösüş grafiki maglumatlary |
| `POST` | `/api/v1/stables/:id/logs` | `TrainingLog \| VetScheduleItem \| HygieneConfirmResult` | Täze sport türgenleşik ýazgysyny, weterinar/waksina belligini goşmak, weterinar ýagdaýyny täzelemek we arassaçylyk çek-listini jogapkär işgäriň tassyklama wagty bilen ýazmak (`localStorage` + `AppStoreContext`) |
| `GET` | `/api/v1/health/vet-schedule` | `VetScheduleItem[]` | Weterinar barlaglarynyň we waksina senenamasynyň sanawy (`localStorage` bilen birleşdirilen) |
| `GET` | `/api/v1/stables/hygiene` | `HygieneTask[]` | Athananyň gündelik arassaçylyk çek-listi (jogapkär işgär we tassyklama wagty bilen) |
| `GET` | `/api/v1/eco-metrics?complexId=:id` | `EcoMetrics[]` | «Ýaşyl Athana» gün energiýasy, suw we CO₂ hasabatlary |
| `GET` | `/api/v1/stables/:id/eco-dashboard` | `EcoDashboardPayload` | IoT, rasion (`/staff/feeding`), arassaçylyk (`/staff/health-training`) we Waste-to-Green esasynda dinamiki Eco-Score (0–100), 4 KPI, aýlyk/hepdelik grafikler we Eko-Maslahatçy |
| `GET` | `/api/v1/stables/:id/eco/waste-logs` | `WasteToGreenLog[]` | Organiki galyndydan bio-dökün (kg) we biogaz (m³) gündelik hasabatlarynyň sanawy (`localStorage` mock) |
| `POST` | `/api/v1/stables/:id/eco/waste-logs` | `WasteToGreenLog` | Täze Waste-to-Green gündelik hasabatyny goşmak we Eco-Score / aýlyk grafik bilen sinhronlamak |
| `POST` | `/api/v1/eco/ai-recommendations/:id/apply` | `{ recommendationId: string; applied: boolean }` | Eko-Maslahatçy maslahatyny ýerine ýetirilen hökmünde bellemek (`localStorage` + `AppStoreContext`) |

---

## 5. Bäsleşikler, Kitaphana we Akademiýa (`communityService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/competitions` | `Competition[]` | Öňdäki we geçen bäsleşikleriň sanawy |
| `GET` | `/api/v1/competitions/reminders` | `string[]` | Ulanyjynyň goşan ýaryş ýatlatmalarynyň ID sanawy (`localStorage` mock) |
| `POST` | `/api/v1/competitions/:id/reminders` | `{ reminderIds: string[]; added: boolean }` | Ýaryş üçin ýatlatma goşmak ýa-da aýyrmak |
| `GET` | `/api/v1/library/books` | `BookItem[]` | Milli atçylyk kitaphanasynyň sanly neşirleri we bölümleri |
| `GET` | `/api/v1/academy/applications` | `AcademyApplication[]` | Aba Annaýew Akademiýasyna tabşyrylan arzalaryň sanawy |
| `POST` | `/api/v1/academy/applications` | `AcademyApplication` | Doly barlagly dalaşgärlik anketasyny (F.A.A., mekdebi, hünäri, telefon, email, düşündiriş) `AppStoreContext` we `localStorage` arkaly tabşyrmak |

---

## 6. Baş Sahypa Storytelling we Eko-Kalkulýator (`landingService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/landing/overview` | `LandingStoryPayload` | 5 welaýatyň «Ýaşyl Reýtingi», 5 Hero bedew IoT görkezijileri, kitaplar, 3 ideg gatlagy we Akademiýa ugurlary |
| `GET` | `/api/v1/eco/calculator?complexCount=:n&stablesPerComplex=:m` | `EcoCalculatorResult` | Saýlanan toplumlaryň we athanalaryň sany boýunça ýyllyk suw, elektrik/gün energiýasy, ot-iým we CO₂ tygşydy |

---

## 7. Awtorizasiýa, Hasap Açmak we Sessiýa (`authService.ts`)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | `AuthSession` | Ýönekeý ulanyjynyň e-poçta/telefon we parol arkaly girmegi |
| `POST` | `/api/v1/auth/register` | `AuthSession` | Täze ýönekeý ulanyjy hasabyny döretmek we sessiýany açmak |
| `POST` | `/api/v1/auth/staff/login` | `AuthSession` | Işgäri toplum, jogapkär athana we wezipe boýunça girizmek |
| `POST` | `/api/v1/auth/admin/login` | `AuthSession` | Merkezi Admin dolandyryjysyny gulluk e-poçtasy we paroly bilen girizmek |
| `POST` | `/api/v1/auth/demo-login` | `AuthSession` | Synag Ulanyjy, Synag Işgär ýa-da Synag Admin sessiýasyny açmak |
| `POST` | `/api/v1/auth/logout` | `{ loggedOut: true }` | Işjeň sessiýany ýapmak we `localStorage` ýadyndan arassalamak |

---

## 8. Merkezi Admin Paneli (`adminService.ts` — 12-nji Ädim)

| Metod | Endpoint | Jogap Görnüşi | Düşündiriş |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/overview` | `AdminOverviewData` | Ähli toplumlaryň, athanalaryň jemleýji statistikasy, welaýat/toplum süzgüçli Eco-Score reýting tablisasy we suw/energiýa grafiki |
| `GET` | `/api/v1/admin/overview/export` | `text/csv` (UTF-8 BOM) | Athanalaryň «Ýaşyl Reýting» (Eco-Score) tablisasyny Excel üçin CSV görnüşinde eksport etmek |
| `POST` | `/api/v1/admin/complexes` | `EquestrianComplex[]` | Täze atçylyk sport toplumyny döretmek ýa-da bar bolan toplumy redaktirlemek (`localStorage` + `AppStoreContext`) |
| `POST` | `/api/v1/admin/stables` | `Stable` | Täze athana döretmek we degişli atçylyk toplumyna birikdirmek |
| `PUT` | `/api/v1/admin/stables/:id` | `Stable[]` | Bar bolan athananyň boks, ýagyş suwy, baş seýis we gün üçegi maglumatlaryny täzelemek |
| `GET` | `/api/v1/admin/assignments` | `StaffAssignment[]` | Işgärleriň sport toplumy we athana jogapkärçilik sanawy (`localStorage` mock) |
| `POST` | `/api/v1/admin/assignments` | `StaffAssignment[]` | Işgäri sport toplumyna we athana jogapkär edip bellemek ýa-da üýtgetmek |
| `DELETE` | `/api/v1/admin/assignments/:id` | `StaffAssignment[]` | Işgär jogapkärçilik ýazgysyny sanawdan aýyrmak |
| `POST` | `/api/v1/admin/content` | `Competition[] \| BookItem[]` | Ulanyjy panelinde görünýän ýaryşlary we kitaplary goşmak ýa-da üýtgetmek (`AppStoreContext` bilen göni sinhronlanýar) |
| `DELETE` | `/api/v1/admin/content/competitions/:id` | `Competition[]` | Ýaryşy sanawdan aýyrmak |
| `DELETE` | `/api/v1/admin/content/books/:id` | `BookItem[]` | Kitaphana neşirini sanawdan aýyrmak |
| `PATCH` | `/api/v1/admin/applications/:id` | `AcademyApplication[]` | Aba Annaýew Akademiýasyna gelen anketanyň statusyny (`garalýar` / `söhbetdeşlik` / `tassyklandy` / `ret_edildi`) üýtgetmek |
| `GET` | `/api/v1/admin/applications/export` | `text/csv` (UTF-8 BOM) | Akademiýa dalaşgärlik anketalaryny Excel üçin CSV görnüşinde eksport etmek |
