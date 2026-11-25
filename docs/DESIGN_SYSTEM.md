# Smart & Green Ahalteke — Umumy Design System (Dizaýn Ulgamy)

Bu resminama **«Smart & Green Ahalteke»** platformasynyň ähli ekranlary (Landing, Ulanyjy portaly, Işgär/Seýis paneli we geljekki Admin paneli) üçin ýeke-täk wizual we ergonomik düzgünleri kesgitleýär.

---

## 1. Wizual Şahsyýet we 60-30-10 Reňk Düzgüni

Platforma milli türkmen ahalteke mirasynyň asyllylygyny häzirki zaman «Smart & Green» ekologiýa tehnologiýalary bilen utgaşdyrýar.

| Token | HEX | Ulanylyş Paýy | Maksady |
| :--- | :--- | :--- | :--- |
| `neutral.canvas` | `#F8FAF9` | **60%** | Esasy arassa sahypa fony (ýumşak zümrüt öwüşginli ak-çal) |
| `neutral.surface` | `#FFFFFF` | **30%** | Kartoçkalar, modallar we maglumat bloklary |
| `neutral.surfaceMuted` | `#EEF3F1` | **30%** | Ikinji derejeli bölekler, tablaryň fony |
| `neutral.borderHairline` | `#DCE6E1` | — | 1px inçe serhet we bölüji çyzyklar |
| `brand.emeraldDeep` | `#064E3B` | **10% (Esasy)** | Brend nyşany, esasy hereket düwmeleri (CTA), PWA tema reňki |
| `brand.emeraldAccent` | `#10B981` | **10% (Aksent)** | Ekologiýa görkezijileri, işjeň nyşanlar, gün energiýasy |
| `brand.goldAkhal` | `#D4AF37` | **Aksent** | Milli ahalteke şöhraty, baýraklar, premium çyzyklar |

### Semantik Ýagdaý Reňkleri
Ýagdaýlar **hiç haçan diňe reňk arkaly** berilmeýär; elmydama düşnükli türkmençe ýazgy ýa-da nyşan bilen bile görkezilýär:
- **Kadaly (`healthy`)**: `#059669` + `#ECFDF5` fon
- **Üns bermeli (`warning`)**: `#B45309` + `#FFFBEB` fon
- **Gyssagly (`critical`)**: `#DC2626` + `#FEF2F2` fon
- **Maglumat (`info`)**: `#0F766E` + `#F0FDFA` fon

---

## 2. Tipografiýa we Tabular Sanlar

| Kategoriýa | Şrift Maşgalasy | Agram | Ulanylyşy |
| :--- | :--- | :--- | :--- |
| **Sözbaşylar (Display)** | `Playfair Display` | 600–700 | Esasy sözbaşylar, bölüm atlary (`text-wrap: balance`) |
| **Esasy Tekst (Body)** | `Plus Jakarta Sans` | 400–600 | Paragraflar (15–16px, 1.6 setir aralygy), düwmeler, menýular |
| **Maglumat / Telemetriýa** | `JetBrains Mono` | 400–600 | IoT görkezijiler, QR-kod ID-ler, seneler (`tabular-nums`) |

---

## 3. Umumy UI Komponentler (`src/components/common/`)

1. **`Button`**: `primary` (`#064E3B`), `secondary` (`#EEF3F1`), `gold` (`#D4AF37`), `outline`, `ghost` görnüşleri; `sm` / `md` / `lg` ölçegleri; ýükleniş ýagdaýy (`loading`) we iň az `44px` basyş belentligi.
2. **`Card`**: Bir derejeli tekiz gurluş (`1px solid #DCE6E1` ýa-da inçe altyn/ýaşyl çyzykly aýna-mat panel). Kartoçka içinde kartoçka we galyň çep aksent çyzygy (`border-l-4`) ulanylmaýar.
3. **`Modal`**: Fokus dolandyryşly, `Escape` düwmesi we fon basyşy bilen ýapylýan, elýeterli dialog penjiresi.
4. **`StatBadge`**: Reňk + tekst + nyşan utgaşmasy bilen IoT we ekologiýa görkezijileri (ýalpyldaýan/pulsasiýaly nokatsyz).
5. **`SkeletonLoader`**: `card`, `kpi`, `table`, `profile` we `page` görnüşli tekiz ýükleniş skeletleri (layout jitter ýok).
6. **`AnimatedHorseLogo`**: Kompozitor-esasynda (`transform`, `opacity`) ýeňil hereketlenýän milli Ahalteke + ýaşyl ýaprak SVG nyşany (`prefers-reduced-motion` goldawly).
7. **`ProtectedRoute` & `RoutePlaceholder`**: Rol esasynda goralan React Router goragçysy we täze modullar üçin arassa marşrut placeholder komponenti.
8. **`EcoStable3DScene`**: Prosedural Three.js PBR 3D «Ýaşyl Athana» we Ahalteke bedew sahnasy, aşaky ýygnalýan gözegçilik paneli bilen.
9. **`PWAInstallButton` & `OfflineIndicator`**: Mobil we desktop gurnama düwmesi (Chromium + iOS Safari gollanmasy) we oflaýn baglanyşyk duýduryşy.

---

## 4. Tor (Grid), Mobil Ergonomika we Hereket

- **Desktop (1440px)**: 12 sütünli tor, `max-w-7xl` (1280px) konteýner, `24px` aralyk.
- **Planşet (768px)**: 8 sütünli tor, `24px` konteýner boşlugy.
- **Mobil (390px)**: 4 sütünli tor, `16px` konteýner boşlugy, ähli interaktiw elementler ≥ `44x44px`, berkitilen paneller ekran belentliginiň 15%-inden geçmeýär.
- **Sticky Glassmorphism Header**: `bg-[#042F24]/78 backdrop-blur-xl` + `1px` altyn çyzyk (`border-[#D4AF37]/25`), çepde animasiýaly Ahalteke logosy, ortada Landing bölümleri we scroll progress görkezijisi, sagda `/login` we `/register` marşrutlaryna geçirýän altynsow düwmeler.
- **450vh Kadrlaýyn Canvas Hero we Scrim Kontrasty**: Ähli kadr we `bedew.webp` fallback sahnalarynyň üstünde ölçeglenen goýy zümrüt scrim (`WCAG AA ≥ 4.5:1`), diňe GPU kompozitor (`transform`, `opacity`) 4 perdeli geçişler we `prefers-reduced-motion` goldawy üpjün edilýär.
- **Hereket Tizligi**: Ähli mikro-interaksiýalar `150–200ms` (`cubic-bezier(0.16, 1, 0.3, 1)`), diňe `transform` we `opacity` häsiýetlerinde işleýär.
