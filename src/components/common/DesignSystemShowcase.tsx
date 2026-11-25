import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Droplets,
  FileText,
  GraduationCap,
  HeartPulse,
  Leaf,
  QrCode,
  Search,
  ShieldCheck,
  Sun,
  Thermometer,
  Trophy,
  Users,
} from 'lucide-react';
import {
  AnimatedHorseLogo,
  Button,
  Card,
  EcoStable3DScene,
  Modal,
  PWAInstallButton,
  StatBadge,
} from './index';
import {
  fetchAcademyApplications,
  fetchBooks,
  fetchCompetitions,
  fetchComplexes,
  fetchEcoMetrics,
  fetchFeedingPlans,
  fetchHorses,
  fetchIoTSensors,
  fetchRoleDefinitions,
  fetchStables,
  fetchTrainingLogs,
} from '../../services';
import { brandColors, neutralColors, semanticColors } from '../../styles/designTokens';
import type {
  AcademyApplication,
  BookItem,
  Competition,
  EcoMetrics,
  EquestrianComplex,
  FeedingPlan,
  Horse,
  HorseHealthStatus,
  IoTSensorData,
  RoleDefinition,
  Stable,
  TrainingLog,
  UserRole,
} from '../../types';

import designSystemDoc from '../../../docs/DESIGN_SYSTEM.md?raw';
import architectureDoc from '../../../docs/ARCHITECTURE.md?raw';
import apiContractsDoc from '../../../docs/API_CONTRACTS.md?raw';
import aiAndSourcesDoc from '../../../docs/AI_AND_SOURCES.md?raw';

type ServiceTab = 'horses' | 'complexes' | 'iot_eco' | 'community';
type DocKey = 'design' | 'architecture' | 'api' | 'ai';

const COLOR_SWATCHES = [
  { name: 'Goýy Zümrüt', token: 'brand.emeraldDeep', hex: brandColors.emeraldDeep, role: 'Esasy brend · PWA tema' },
  { name: 'Ýaşyl Aksent', token: 'brand.emeraldAccent', hex: brandColors.emeraldAccent, role: 'Ekologiýa · Işjeň ýagdaý' },
  { name: 'Altyn Ahalteke', token: 'brand.goldAkhal', hex: brandColors.goldAkhal, role: 'Milli miras · Baýrak' },
  { name: 'Esasy Fon (60%)', token: 'neutral.canvas', hex: neutralColors.canvas, role: 'Sahypa fony' },
  { name: 'Gurluş Ýüzi (30%)', token: 'neutral.surfaceMuted', hex: neutralColors.surfaceMuted, role: 'Panel we tab fony' },
  { name: 'Esasy Tekst', token: 'neutral.inkPrimary', hex: neutralColors.inkPrimary, role: 'WCAG AAA ýazgy' },
];

const DOC_TABS: { key: DocKey; fileName: string; title: string; content: string }[] = [
  { key: 'design', fileName: 'DESIGN_SYSTEM.md', title: 'Dizaýn Ulgamy', content: designSystemDoc },
  { key: 'architecture', fileName: 'ARCHITECTURE.md', title: 'Arhitektura', content: architectureDoc },
  { key: 'api', fileName: 'API_CONTRACTS.md', title: 'API Şertnamalary', content: apiContractsDoc },
  { key: 'ai', fileName: 'AI_AND_SOURCES.md', title: 'AI we Çeşmeler (4.4)', content: aiAndSourcesDoc },
];

function healthTone(status: HorseHealthStatus): 'healthy' | 'warning' | 'critical' {
  if (status === 'healthy') return 'healthy';
  if (status === 'monitoring') return 'warning';
  return 'critical';
}

function healthLabel(status: HorseHealthStatus): string {
  if (status === 'healthy') return 'Sagdyn';
  if (status === 'monitoring') return 'Gözegçilikde';
  return 'Gyssagly barlag';
}

const HorsePortrait: React.FC<{ horse: Horse }> = ({ horse }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full h-48 rounded-xl bg-gradient-to-br from-[#064E3B] to-[#0F241D] flex flex-col items-center justify-center p-4 text-center">
        <AnimatedHorseLogo size="md" variant="emerald" animated={false} />
        <span className="mt-2 text-xs font-medium text-[#D4AF37]">{horse.name}</span>
      </div>
    );
  }

  return (
    <img
      src={horse.portraitUrl}
      alt={`${horse.name} — ${horse.coatLabel} ahalteke bedewi`}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="w-full h-48 object-cover rounded-xl bg-[#EEF3F1]"
    />
  );
};

export interface DesignSystemShowcaseProps {
  onBackToLanding: () => void;
}

export const DesignSystemShowcase: React.FC<DesignSystemShowcaseProps> = ({ onBackToLanding }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(true);
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');
  const [activeServiceTab, setActiveServiceTab] = useState<ServiceTab>('horses');
  const [serviceLoading, setServiceLoading] = useState(false);

  const [horseSearch, setHorseSearch] = useState('');
  const [horseStatusFilter, setHorseStatusFilter] = useState<HorseHealthStatus | 'all'>('all');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);
  const [stables, setStables] = useState<Stable[]>([]);
  const [sensors, setSensors] = useState<IoTSensorData[]>([]);
  const [feedingPlans, setFeedingPlans] = useState<FeedingPlan[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [ecoMetrics, setEcoMetrics] = useState<EcoMetrics[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [applications, setApplications] = useState<AcademyApplication[]>([]);

  const [activeDoc, setActiveDoc] = useState<DocKey>('design');

  useEffect(() => {
    let active = true;
    const loadCore = async () => {
      setServiceLoading(true);
      const [
        rolesRes,
        complexesRes,
        stablesRes,
        sensorsRes,
        feedingRes,
        trainingRes,
        ecoRes,
        compRes,
        booksRes,
        appsRes,
      ] = await Promise.all([
        fetchRoleDefinitions(),
        fetchComplexes(),
        fetchStables(),
        fetchIoTSensors(),
        fetchFeedingPlans(),
        fetchTrainingLogs(),
        fetchEcoMetrics(),
        fetchCompetitions(),
        fetchBooks(),
        fetchAcademyApplications(),
      ]);

      if (!active) return;
      setRoles(rolesRes.data);
      setComplexes(complexesRes.data);
      setStables(stablesRes.data);
      setSensors(sensorsRes.data);
      setFeedingPlans(feedingRes.data);
      setTrainingLogs(trainingRes.data);
      setEcoMetrics(ecoRes.data);
      setCompetitions(compRes.data);
      setBooks(booksRes.data);
      setApplications(appsRes.data);
      setServiceLoading(false);
    };
    loadCore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadHorses = async () => {
      setServiceLoading(true);
      const res = await fetchHorses({
        search: horseSearch,
        healthStatus: horseStatusFilter,
      });
      if (!active) return;
      setHorses(res.data);
      setServiceLoading(false);
    };
    loadHorses();
    return () => {
      active = false;
    };
  }, [horseSearch, horseStatusFilter]);

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // Clipboard fallback ignored cleanly
    }
    setCopiedHex(hex);
    window.setTimeout(() => {
      setCopiedHex((prev) => (prev === hex ? null : prev));
    }, 1800);
  };

  const activeRoleInfo = roles.find((r) => r.role === selectedRole);
  const activeDocItem = DOC_TABS.find((d) => d.key === activeDoc) ?? DOC_TABS[0];
  const selectedHorseSensor = selectedHorse
    ? sensors.find((s) => s.horseId === selectedHorse.id)
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D]">
      {/* Strict 3-Zone One-Row Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981] rounded-lg"
          >
            <AnimatedHorseLogo size="sm" variant="emerald" animated={logoAnimated} />
            <span className="font-display text-lg font-bold tracking-tight text-[#064E3B]">
              Smart &amp; Green Ahalteke
            </span>
          </button>

          <nav
            aria-label="Sergi bölümleri"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#415850]"
          >
            <a
              href="#scene-3d"
              className="hover:text-[#064E3B] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#10B981]"
            >
              3D Athana
            </a>
            <a
              href="#design-system"
              className="hover:text-[#064E3B] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#10B981]"
            >
              Dizaýn Ulgamy
            </a>
            <a
              href="#komponentler"
              className="hover:text-[#064E3B] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#10B981]"
            >
              Komponentler
            </a>
            <a
              href="#serwisler"
              className="hover:text-[#064E3B] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#10B981]"
            >
              Serwisler
            </a>
            <a
              href="#resminamalar"
              className="hover:text-[#064E3B] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#10B981]"
            >
              Resminamalar
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBackToLanding}
            >
              Baş sahypa
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-20">
        {/* SECTION 1: Hero & Interactive Three.js 3D «Ýaşyl Athana» Scene */}
        <section id="scene-3d" className="scroll-mt-24 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#415850]">
              <span>1-nji Ädim · Taslama Binýady</span>
              <span aria-hidden="true">·</span>
              <span>Smart &amp; Green Technology Challenge</span>
              <span aria-hidden="true">·</span>
              <span>PWA + Three.js PBR</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#064E3B] leading-[1.12] tracking-tight">
              Milli ahalteke mirasy üçin bitewi dizaýn ulgamy we 3D «Ýaşyl Athana»
            </h1>
            <p className="text-base text-[#415850] leading-relaxed max-w-2xl">
              Bu sergi ekrany taslamanyň umumy dizaýn tokenlerini, gaýtadan ulanylýan UI
              komponentlerini, doly interaktiw 3D eko-athana modelini, asinhron mock serwislerini we
              resminamalaryny bir ýerde barlamak üçin taýýarlandy.
            </p>
          </div>

          <EcoStable3DScene />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="sm">
              <p className="text-xs text-[#647A72]">Gün energiýasy paýy</p>
              <p className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#064E3B]">
                84% <span className="text-xs font-sans font-normal text-[#415850]">· 420 kW</span>
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-[#647A72]">Tygşytlanan ýagyş suwy</p>
              <p className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#064E3B]">
                42 600 <span className="text-xs font-sans font-normal text-[#415850]">litr / aý</span>
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-[#647A72]">Domain TypeScript modelleri</p>
              <p className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#064E3B]">
                12 <span className="text-xs font-sans font-normal text-[#415850]">· RN taýýar</span>
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-[#647A72]">CO₂ zyňyndy azaldylyşy</p>
              <p className="mt-1.5 font-mono tabular-nums text-2xl font-semibold text-[#064E3B]">
                14.9 <span className="text-xs font-sans font-normal text-[#415850]">tonna / aý</span>
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 2: Design System */}
        <section id="design-system" className="scroll-mt-24 space-y-8 pt-6 border-t border-[#DCE6E1]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#059669]">01. Design System</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#0F241D]">
                Reňk Palitrasy, Tipografiýa we Tor Düzgünleri
              </h2>
            </div>
            <p className="text-sm text-[#415850] max-w-md">
              60-30-10 paýlanyşy esasynda döredildi. Islendik reňk kartoçkasyna basyp HEX kodyny bufera göçürip
              bilersiňiz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLOR_SWATCHES.map((swatch) => {
              const isCopied = copiedHex === swatch.hex;
              return (
                <button
                  key={swatch.token}
                  type="button"
                  onClick={() => handleCopyHex(swatch.hex)}
                  className="group text-left bg-white border border-[#DCE6E1] rounded-2xl p-4 flex items-center gap-4 hover:border-[#064E3B]/45 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981]"
                >
                  <span
                    className="w-14 h-14 rounded-xl border border-black/10 shrink-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#0F241D] truncate">{swatch.name}</span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-[#415850] group-hover:text-[#064E3B]">
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#059669]" />
                            <span className="text-[#059669]">Göçürildi</span>
                          </>
                        ) : (
                          <>
                            <span>{swatch.hex}</span>
                            <Copy className="w-3 h-3 opacity-60" />
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#647A72] truncate">{swatch.role}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#647A72]">{swatch.token}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <Card className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#DCE6E1] pb-3">
                <h3 className="text-lg font-bold text-[#0F241D]">Tipografiýa Iýerarhiýasy (2+1)</h3>
                <span className="text-xs text-[#647A72]">Türkmen elipbiýi doly goldanýar</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#647A72]">Playfair Display · Display / Sözbaşy</p>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[#064E3B] mt-1">
                    Älemgoşar öwüşginli Ahalteke bedewleri
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF3F1]">
                  <p className="text-xs text-[#647A72]">Plus Jakarta Sans · Esasy tekst we interfeýs</p>
                  <p className="text-[15px] text-[#415850] leading-relaxed mt-1">
                    Öňdebaryjy IoT datçikleri, gün energiýasy we ýagyş suwuny gaýtadan ulanyş ulgamy bilen
                    enjamlaşdyrylan häzirki zaman türkmen atçylyk toplumlary.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF3F1]">
                  <p className="text-xs text-[#647A72]">JetBrains Mono · Tabular sanlar we QR şahsyýet</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-4 font-mono tabular-nums text-sm text-[#0F241D]">
                    <span>AHAL-TM-2026-001</span>
                    <span className="text-[#DCE6E1]">|</span>
                    <span>34 urgy/min</span>
                    <span className="text-[#DCE6E1]">|</span>
                    <span>37.8 °C</span>
                    <span className="text-[#DCE6E1]">|</span>
                    <span>4.1 ppm NH₃</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-5 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-[#DCE6E1] pb-3">
                  <h3 className="text-lg font-bold text-[#0F241D]">Tor we Mobil Ergonomika</h3>
                  <span className="font-mono text-xs text-[#647A72]">1440px / 390px</span>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#EEF3F1]">
                    <dt className="text-[#415850]">Desktop tor (max-w-7xl)</dt>
                    <dd className="font-mono tabular-nums font-medium text-[#064E3B]">12 sütün · 24px</dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#EEF3F1]">
                    <dt className="text-[#415850]">Planşet tor (768px)</dt>
                    <dd className="font-mono tabular-nums font-medium text-[#064E3B]">8 sütün · 24px</dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#EEF3F1]">
                    <dt className="text-[#415850]">Mobil tor (390px)</dt>
                    <dd className="font-mono tabular-nums font-medium text-[#064E3B]">4 sütün · 16px</dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#EEF3F1]">
                    <dt className="text-[#415850]">Iň kiçi basyş meýdany</dt>
                    <dd className="font-mono tabular-nums font-medium text-[#064E3B]">44 × 44 px</dd>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <dt className="text-[#415850]">Semantik ýagdaýlar</dt>
                    <dd className="text-xs font-medium text-[#059669]">
                      {semanticColors.healthy.label} · {semanticColors.warning.label} ·{' '}
                      {semanticColors.critical.label}
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="text-xs text-[#647A72]">
                Ähli tokenler <code className="font-mono text-[#064E3B]">src/styles/designTokens.ts</code> faýlynda
                DOM-syz saklanýar we React Native-e göni geçirilmäge taýýardyr.
              </p>
            </Card>
          </div>
        </section>

        {/* SECTION 3: Reusable Common UI Components */}
        <section id="komponentler" className="scroll-mt-24 space-y-8 pt-6 border-t border-[#DCE6E1]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#059669]">02. Umumy UI Komponentler</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#0F241D]">
                Gaýtadan Ulanylýan Komponentler Synag Meýdançasy
              </h2>
            </div>
            <p className="text-sm text-[#415850]">
              Button, Card, Modal, StatBadge we AnimatedHorseLogo — ähli ekranlar üçin ýeke-täk kitapça.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#0F241D]">Button we Modal</h3>
                <button
                  type="button"
                  onClick={() => setDemoLoading((prev) => !prev)}
                  className="text-xs font-medium text-[#064E3B] underline underline-offset-4 hover:text-[#10B981] cursor-pointer"
                >
                  {demoLoading ? 'Ýüklenişi öçür' : 'Ýüklenişi synap gör'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading={demoLoading} onClick={() => setIsDemoModalOpen(true)}>
                  Esasy Düwme
                </Button>
                <Button variant="gold" loading={demoLoading} onClick={() => setIsDemoModalOpen(true)}>
                  Altyn Aksent
                </Button>
                <Button variant="secondary" onClick={() => setIsDemoModalOpen(true)}>
                  Ikinji Derejeli
                </Button>
                <Button variant="outline" onClick={() => setIsDemoModalOpen(true)}>
                  Kontur
                </Button>
                <Button variant="ghost" onClick={() => setIsDemoModalOpen(true)}>
                  Ýeňil
                </Button>
              </div>

              <div className="pt-4 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#415850]">
                  Elýeterli dialog penjiresini <code className="font-mono">Escape</code> ýa-da fon basyşy bilen
                  ýapyp barlaň.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<QrCode className="w-4 h-4" />}
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  Modal Penjiresini Aç
                </Button>
              </div>
            </Card>

            <Card className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#0F241D]">StatBadge we AnimatedHorseLogo</h3>
                <div className="flex items-center gap-1.5">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setLogoSize(sz)}
                      className={[
                        'px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors',
                        logoSize === sz
                          ? 'bg-[#064E3B] text-white'
                          : 'bg-[#EEF3F1] text-[#415850] hover:bg-[#DCE6E1]',
                      ].join(' ')}
                    >
                      {sz}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLogoAnimated((prev) => !prev)}
                    className="ml-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EEF3F1] text-[#064E3B] hover:bg-[#DCE6E1] cursor-pointer"
                  >
                    {logoAnimated ? 'Duruz' : 'Hereketlendir'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <StatBadge
                  tone="healthy"
                  label="Ýürek urşy"
                  value={34}
                  unit="urgy/min"
                  icon={<HeartPulse className="w-4 h-4" />}
                />
                <StatBadge
                  tone="gold"
                  label="Gün energiýasy"
                  value="84%"
                  icon={<Sun className="w-4 h-4" />}
                />
                <StatBadge
                  tone="warning"
                  label="Gözegçilikde"
                  value="38.4"
                  unit="°C"
                  icon={<Thermometer className="w-4 h-4" />}
                />
                <StatBadge tone="critical" label="Gyssagly duýduryş" value="14" unit="ppm" />
              </div>

              <div className="pt-4 border-t border-[#EEF3F1] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <AnimatedHorseLogo size={logoSize} variant="emerald" animated={logoAnimated} />
                  <AnimatedHorseLogo size={logoSize} variant="light" animated={logoAnimated} />
                  <AnimatedHorseLogo size={logoSize} variant="gold" animated={logoAnimated} />
                </div>
                <p className="text-xs text-[#647A72] max-w-[200px] text-right">
                  Kompozitor animasiýaly (<code className="font-mono">transform</code>) 3 brend görnüşi.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 4: Roles & Async Mock Services Explorer */}
        <section id="serwisler" className="scroll-mt-24 space-y-8 pt-6 border-t border-[#DCE6E1]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#059669]">03. Mock Serwisler we Rol Modeli</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#0F241D]">
                Asinhron Maglumat Gatlagy we Rol Barlaýjysy
              </h2>
            </div>
            <p className="text-sm text-[#415850]">
              Ähli maglumatlar <code className="font-mono text-xs text-[#064E3B]">src/services/</code> üsti bilen
              asinhron çekilýär.
            </p>
          </div>

          <Card padding="md" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#0F241D]">Ulanyjy Rollary (UserRole)</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EEF3F1] rounded-xl">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setSelectedRole(r.role)}
                    className={[
                      'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                      selectedRole === r.role
                        ? 'bg-white text-[#064E3B] shadow-xs'
                        : 'text-[#415850] hover:text-[#0F241D]',
                    ].join(' ')}
                  >
                    {r.titleTk}
                  </button>
                ))}
              </div>
            </div>

            {activeRoleInfo && (
              <div className="pt-3 border-t border-[#EEF3F1] grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#647A72]">
                    <span className="font-mono text-[#064E3B] font-semibold">role: &apos;{activeRoleInfo.role}&apos;</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {activeRoleInfo.availability === 'geljekki_tapgyr'
                        ? 'Geljekki tapgyr (Placeholder)'
                        : 'Arhitekturada işjeň'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0F241D]">{activeRoleInfo.subtitleTk}</p>
                </div>
                <ul className="md:col-span-7 space-y-1.5 text-sm text-[#415850]">
                  {activeRoleInfo.permissions.map((perm) => (
                    <li key={perm} className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EEF3F1] rounded-xl">
              {(
                [
                  { key: 'horses', label: 'Ahalteke Bedewleri (QR)' },
                  { key: 'complexes', label: 'Toplumlar we Athanalar' },
                  { key: 'iot_eco', label: 'IoT we «Ýaşyl Athana»' },
                  { key: 'community', label: 'Bäsleşikler · Kitaphana · Akademiýa' },
                ] as { key: ServiceTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveServiceTab(tab.key)}
                  className={[
                    'min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    activeServiceTab === tab.key
                      ? 'bg-white text-[#064E3B] shadow-xs'
                      : 'text-[#415850] hover:text-[#0F241D]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeServiceTab === 'horses' && (
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={horseSearch}
                    onChange={(e) => setHorseSearch(e.target.value)}
                    placeholder="At ady ýa-da QR ID gözle..."
                    aria-label="Bedew gözlegi"
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-white border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:outline-2 focus:outline-[#10B981]"
                  />
                </div>
                <select
                  value={horseStatusFilter}
                  onChange={(e) => setHorseStatusFilter(e.target.value as HorseHealthStatus | 'all')}
                  aria-label="Saglyk ýagdaýy boýunça süzmek"
                  className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-2 focus:outline-[#10B981] cursor-pointer"
                >
                  <option value="all">Ähli ýagdaýlar</option>
                  <option value="healthy">Sagdyn</option>
                  <option value="monitoring">Gözegçilikde</option>
                </select>
              </div>
            )}
          </div>

          {activeServiceTab === 'horses' && (
            <div>
              {serviceLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[1, 2, 3, 4].map((n) => (
                    <Card key={n} padding="sm" className="space-y-3 animate-pulse">
                      <div className="h-48 rounded-xl bg-[#EEF3F1]" />
                      <div className="h-5 w-2/3 rounded bg-[#EEF3F1]" />
                      <div className="h-4 w-full rounded bg-[#EEF3F1]" />
                    </Card>
                  ))}
                </div>
              ) : horses.length === 0 ? (
                <Card className="text-center py-12 space-y-3">
                  <p className="font-display text-lg font-bold text-[#0F241D]">Gözlege laýyk bedew tapylmady</p>
                  <p className="text-sm text-[#415850]">Gözleg sözüni ýa-da saglyk süzgüjini arassalap synanyşyň.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHorseSearch('');
                      setHorseStatusFilter('all');
                    }}
                  >
                    Süzgüji arassala
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {horses.map((horse) => (
                    <Card
                      key={horse.id}
                      padding="sm"
                      interactive
                      onClick={() => setSelectedHorse(horse)}
                      className="flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <HorsePortrait horse={horse} />
                          <img
                            src={horse.animatedAvatarUrl}
                            alt=""
                            aria-hidden="true"
                            className="w-10 h-10 rounded-xl border-2 border-white shadow-sm absolute bottom-2.5 right-2.5 bg-[#064E3B]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-[#0F241D] truncate">{horse.name}</h3>
                            <span className="font-mono text-xs text-[#647A72] tabular-nums shrink-0">
                              {horse.ageYears} ýaş
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#647A72]">
                            {horse.coatLabel} · {horse.heightCm} sm · {horse.gender}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-[#064E3B]">{horse.qrCodeId}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EEF3F1] flex items-center justify-between gap-2">
                        <StatBadge tone={healthTone(horse.healthStatus)} label={healthLabel(horse.healthStatus)} />
                        <span className="text-xs font-semibold text-[#064E3B]">Pasport →</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeServiceTab === 'complexes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {complexes.map((cmp) => (
                  <Card key={cmp.id} className="space-y-3">
                    <div className="text-xs text-[#647A72]">
                      {cmp.region} · {cmp.ecoCertificationLevel}
                    </div>
                    <h3 className="text-lg font-bold text-[#0F241D]">{cmp.name}</h3>
                    <p className="text-sm text-[#415850] leading-relaxed">{cmp.description}</p>
                    <div className="pt-3 border-t border-[#EEF3F1] flex items-center justify-between text-xs font-mono tabular-nums text-[#064E3B]">
                      <span>{cmp.totalStables} athana</span>
                      <span>{cmp.totalHorses} bedew</span>
                      <span>{cmp.solarCapacityKw} kW gün</span>
                    </div>
                  </Card>
                ))}
              </div>

              <Card padding="none" className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#DCE6E1] bg-[#F8FAF9] text-xs text-[#647A72]">
                      <th className="py-3.5 px-5 font-semibold">Athana we Kody</th>
                      <th className="py-3.5 px-4 font-semibold">Baş Seýis</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Bokslar</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Howa (AQI)</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Temperatura / Çyglylyk</th>
                      <th className="py-3.5 px-5 font-semibold text-right">Ýagyş suwy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F1]">
                    {stables.map((st) => (
                      <tr key={st.id} className="hover:bg-[#F8FAF9]/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#0F241D]">{st.name}</div>
                          <div className="font-mono text-xs text-[#647A72]">{st.code}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#415850]">{st.headSeisName}</td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          {st.occupiedBoxes}/{st.boxCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#059669]">
                          {st.airQualityIndex}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          {st.temperatureC}°C · {st.humidityPercent}%
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                          {st.rainwaterHarvestingLiters.toLocaleString('tk-TM')} L
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {activeServiceTab === 'iot_eco' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {ecoMetrics.map((eco) => {
                  const complex = complexes.find((c) => c.id === eco.complexId);
                  return (
                    <Card key={eco.id} className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#647A72]">«Ýaşyl Athana» · {eco.periodLabel}</p>
                          <h3 className="mt-0.5 text-lg font-bold text-[#0F241D]">
                            {complex?.name ?? eco.complexId}
                          </h3>
                        </div>
                        <StatBadge
                          tone="healthy"
                          label="Eko-Baha"
                          value={`${eco.ecoRatingScore}/100`}
                          icon={<Leaf className="w-4 h-4" />}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#EEF3F1]">
                        <div>
                          <p className="text-xs text-[#647A72]">Gün energiýasy</p>
                          <p className="mt-1 font-mono tabular-nums font-semibold text-[#064E3B]">
                            {eco.solarEnergyGeneratedKwh.toLocaleString()} kWt·s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#647A72]">Suw tygşytlylygy</p>
                          <p className="mt-1 font-mono tabular-nums font-semibold text-[#064E3B]">
                            {eco.waterSavedLiters.toLocaleString()} L
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#647A72]">Bio-kompost</p>
                          <p className="mt-1 font-mono tabular-nums font-semibold text-[#064E3B]">
                            {eco.compostProducedKg.toLocaleString()} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#647A72]">CO₂ azaldylyşy</p>
                          <p className="mt-1 font-mono tabular-nums font-semibold text-[#059669]">
                            -{eco.co2ReducedKg.toLocaleString()} kg
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Card padding="none" className="lg:col-span-7 overflow-x-auto">
                  <div className="px-5 py-4 border-b border-[#DCE6E1] flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0F241D]">IoT Datçik Telemetriýasy</h3>
                    <span className="text-xs text-[#647A72]">mockIoTSensors</span>
                  </div>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#EEF3F1] bg-[#F8FAF9] text-xs text-[#647A72]">
                        <th className="py-3 px-5 font-semibold">Bedew</th>
                        <th className="py-3 px-3 font-semibold text-right">Ýürek urşy</th>
                        <th className="py-3 px-3 font-semibold text-right">Beden °C</th>
                        <th className="py-3 px-3 font-semibold text-right">NH₃ ppm</th>
                        <th className="py-3 px-5 font-semibold text-right">Ýagdaý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF3F1]">
                      {sensors.map((s) => {
                        const h = horses.find((item) => item.id === s.horseId);
                        return (
                          <tr key={s.id}>
                            <td className="py-3 px-5 font-medium text-[#0F241D]">{h?.name ?? s.horseId}</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums">{s.heartRateBpm}</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums">{s.bodyTemperatureC}°C</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums">{s.ammoniaPpm}</td>
                            <td className="py-3 px-5 text-right">
                              <span
                                className={
                                  s.status === 'healthy'
                                    ? 'text-xs font-semibold text-[#059669]'
                                    : 'text-xs font-semibold text-[#B45309]'
                                }
                              >
                                {healthLabel(s.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>

                <Card className="lg:col-span-5 space-y-4">
                  <h3 className="text-base font-bold text-[#0F241D]">Iýmitlendiriş we Türgenleşik Nusgalary</h3>
                  <div className="space-y-3">
                    {feedingPlans.slice(0, 2).map((fp) => (
                      <div key={fp.id} className="pb-3 border-b border-[#EEF3F1] text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F241D]">
                            {fp.mealTime} · {fp.mealName}
                          </span>
                          <span className="font-mono text-xs text-[#059669] tabular-nums">
                            {fp.quantityKg} kg · {fp.waterLiters} L
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#415850]">{fp.forageType}</p>
                      </div>
                    ))}
                    {trainingLogs.slice(0, 2).map((tr) => (
                      <div key={tr.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F241D]">{tr.trainerName}</span>
                          <span className="font-mono text-xs text-[#415850] tabular-nums">
                            {tr.distanceKm} km · {tr.durationMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#415850]">{tr.notes}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeServiceTab === 'community' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="space-y-4">
                <div className="flex items-center gap-2 text-[#064E3B]">
                  <Trophy className="w-4 h-4" aria-hidden="true" />
                  <h3 className="text-base font-bold">Bäsleşikler ({competitions.length})</h3>
                </div>
                <div className="space-y-4 divide-y divide-[#EEF3F1]">
                  {competitions.map((comp) => (
                    <div key={comp.id} className="pt-3 first:pt-0">
                      <p className="text-xs font-mono text-[#647A72]">
                        {comp.date} · {comp.category}
                      </p>
                      <p className="mt-1 font-semibold text-sm text-[#0F241D]">{comp.title}</p>
                      <p className="mt-1 text-xs text-[#415850]">{comp.location}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-2 text-[#064E3B]">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <h3 className="text-base font-bold">Milli Kitaphana ({books.length})</h3>
                </div>
                <div className="space-y-4 divide-y divide-[#EEF3F1]">
                  {books.map((book) => (
                    <div key={book.id} className="pt-3 first:pt-0">
                      <p className="text-xs text-[#647A72]">
                        {book.publishYear} · {book.pages} sahypa · {book.availableFormats.join(' / ')}
                      </p>
                      <p className="mt-1 font-semibold text-sm text-[#0F241D]">{book.title}</p>
                      <p className="mt-1 text-xs text-[#415850]">{book.author}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center gap-2 text-[#064E3B]">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                  <h3 className="text-base font-bold">Akademiýa Ýüz Tutmalary ({applications.length})</h3>
                </div>
                <div className="space-y-4 divide-y divide-[#EEF3F1]">
                  {applications.map((app) => (
                    <div key={app.id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs text-[#647A72]">
                        <span>
                          {app.region} · {app.age} ýaş
                        </span>
                        <span className="font-semibold text-[#064E3B]">{app.status}</span>
                      </div>
                      <p className="mt-1 font-semibold text-sm text-[#0F241D]">{app.applicantName}</p>
                      <p className="mt-0.5 text-xs text-[#415850]">{app.programName}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </section>

        {/* SECTION 5: Live Markdown Documentation Viewer */}
        <section id="resminamalar" className="scroll-mt-24 space-y-6 pt-6 border-t border-[#DCE6E1]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#059669]">04. Markdown Resminamalar (docs/)</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#0F241D]">
                Taslama Resminamalary we Düzgünnama 4.4
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EEF3F1] rounded-xl">
              {DOC_TABS.map((doc) => (
                <button
                  key={doc.key}
                  type="button"
                  onClick={() => setActiveDoc(doc.key)}
                  className={[
                    'min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    activeDoc === doc.key
                      ? 'bg-white text-[#064E3B] shadow-xs'
                      : 'text-[#415850] hover:text-[#0F241D]',
                  ].join(' ')}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          </div>

          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#DCE6E1]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#064E3B]">
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span className="font-mono">docs/{activeDocItem.fileName}</span>
              </div>
              <span className="text-xs text-[#647A72]">Hakyky repozitoriý faýlyndan göni okalýar</span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-[#415850] leading-relaxed max-h-[420px] overflow-y-auto pr-2">
              {activeDocItem.content}
            </pre>
          </Card>
        </section>
      </main>

      <footer className="mt-16 border-t border-[#DCE6E1] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#647A72]">
          <div className="flex items-center gap-2.5">
            <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
            <span className="font-semibold text-[#064E3B]">Smart &amp; Green Ahalteke</span>
            <span aria-hidden="true">·</span>
            <span>1-nji Ädim: Design System, PWA we 3D Binýat</span>
          </div>
          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <Button variant="ghost" size="sm" onClick={onBackToLanding}>
              Baş sahypa dolan
            </Button>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Umumy Modal Komponenti"
        subtitle="Bu penjire ähli geljekki ekranlarda (QR pasport, bäsleşik ýazgysy, IoT duýduryşy) gaýtadan ulanylar."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Ýap
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDemoModalOpen(false)}>
              Tassykla
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            <strong>Smart &amp; Green Ahalteke</strong> dizaýn ulgamynyň modal penjiresi klawiatura (
            <code className="font-mono text-xs">Escape</code>), daşky fon basyşy we mobil ekranlarda aýlanýan mazmun
            bilen doly üpjün edilendir.
          </p>
          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] flex flex-wrap items-center gap-3">
            <StatBadge tone="healthy" label="PWA Manifest" value="#064E3B" />
            <StatBadge tone="gold" label="React Native Taýýar" value="100%" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedHorse)}
        onClose={() => setSelectedHorse(null)}
        title={selectedHorse ? `${selectedHorse.name} — Sanly QR Pasport` : ''}
        subtitle={selectedHorse ? `${selectedHorse.breed} · ${selectedHorse.lineage}` : ''}
        size="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setSelectedHorse(null)}>
            Ýapmak
          </Button>
        }
      >
        {selectedHorse && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-3">
              <HorsePortrait horse={selectedHorse} />
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
                <img
                  src={selectedHorse.animatedAvatarUrl}
                  alt="Animasiýaly bedew awatary"
                  className="w-12 h-12 rounded-xl shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-[#647A72]">QR Şahsyýet Kody</p>
                  <p className="font-mono text-sm font-semibold text-[#064E3B] truncate">
                    {selectedHorse.qrCodeId}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatBadge
                  tone={healthTone(selectedHorse.healthStatus)}
                  label={healthLabel(selectedHorse.healthStatus)}
                />
                <StatBadge tone="gold" label="Boýy" value={selectedHorse.heightCm} unit="sm" />
                <StatBadge tone="neutral" label="Ýaşy" value={selectedHorse.ageYears} unit="ýyl" />
              </div>

              <p className="text-sm text-[#415850] leading-relaxed">{selectedHorse.healthSummary}</p>

              {selectedHorseSensor && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-[#647A72]">
                      <Activity className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Ýürek urşy</span>
                    </div>
                    <p className="mt-1 font-mono tabular-nums text-base font-semibold text-[#0F241D]">
                      {selectedHorseSensor.heartRateBpm} bpm
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-[#647A72]">
                      <Thermometer className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Beden °C</span>
                    </div>
                    <p className="mt-1 font-mono tabular-nums text-base font-semibold text-[#0F241D]">
                      {selectedHorseSensor.bodyTemperatureC} °C
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-[#647A72]">
                      <Droplets className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Çyglylyk</span>
                    </div>
                    <p className="mt-1 font-mono tabular-nums text-base font-semibold text-[#0F241D]">
                      {selectedHorseSensor.stableHumidityPercent}%
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-[#415850]">
                <p>
                  <strong className="text-[#0F241D]">Eýesi:</strong> {selectedHorse.ownerName}
                </p>
                <p>
                  <strong className="text-[#0F241D]">Seýis:</strong> {selectedHorse.seisName}
                </p>
              </div>

              {selectedHorse.achievements.length > 0 && (
                <div className="pt-3 border-t border-[#EEF3F1]">
                  <p className="text-xs font-semibold text-[#064E3B] mb-2">Üstünlikleri:</p>
                  <ul className="space-y-1 text-xs text-[#415850]">
                    {selectedHorse.achievements.map((ach) => (
                      <li key={ach}>· {ach}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
