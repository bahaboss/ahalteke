import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Droplets,
  Flame,
  Info,
  Leaf,
  Plus,
  Recycle,
  Scale,
  Sparkles,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { computeDynamicEcoDashboard } from '../../services';
import { useAppStore } from '../../store';
import type {
  AuthSession,
  EcoKpiKey,
  EcoRecommendation,
  EcoTimeSeriesPoint,
  WasteDestination,
} from '../../types';
import { Button, Card, EcoStable3DScene, Modal } from '../common';

export interface StaffEcoMonitoringScreenProps {
  session: AuthSession;
  onOpen3DStable?: () => void;
}

type ChartPeriod = 'monthly' | 'weekly';

interface KpiChartMeta {
  key: EcoKpiKey;
  label: string;
  unit: string;
  accentHex: string;
  subtitle: string;
  extract: (point: EcoTimeSeriesPoint) => number;
}

const KPI_CHART_META: Record<EcoKpiKey, KpiChartMeta> = {
  water: {
    key: 'water',
    label: 'Suw tygşytlylygy',
    unit: 'L',
    accentHex: '#0284C7',
    subtitle: 'Syzma datçikleri we awtomat damjalaýyn suwaryş ulgamy',
    extract: (p) => p.waterSavedLiters,
  },
  energy: {
    key: 'energy',
    label: 'Ýaşyl energiýa',
    unit: 'kWt',
    accentHex: '#D4AF37',
    subtitle: 'Gün panelleri we akylly LED yşyklandyryş ulgamy',
    extract: (p) => p.solarEnergyKwh,
  },
  feeding: {
    key: 'feeding',
    label: 'Isripsiz iýmitlendiriş',
    unit: 'kg',
    accentHex: '#10B981',
    subtitle: 'Takyk rasion (/staff/feeding) arkaly tygşytlanan ot-iým',
    extract: (p) => p.feedSavedKg,
  },
  waste: {
    key: 'waste',
    label: 'Waste-to-Green',
    unit: 'kg',
    accentHex: '#064E3B',
    subtitle: 'Organiki galyndydan oba hojalygy üçin bio-dökün we biogaz',
    extract: (p) => p.wasteToGreenKg,
  },
};

const CATEGORY_LABELS: Record<EcoKpiKey, string> = {
  water: 'Suw tygşytlylygy',
  energy: 'Ýaşyl energiýa',
  feeding: 'Isripsiz rasion',
  waste: 'Waste-to-Green',
};

const DESTINATION_LABELS: Record<WasteDestination, string> = {
  oba_hojalyk: 'Oba hojalyk meýdany (bio-dökün)',
  ýyladyşhana: 'Ýyladyşhana we ot-iým ekinleri',
  biogaz_stansiýasy: 'Biogaz energiýa stansiýasy',
};

/** Animasiýaly tegelek Eco-Score (0–100) SVG Progress görkezijisi */
const EcoScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full -rotate-90"
        role="img"
        aria-label={`Ýaşyl Reýting ${clamped} / 100`}
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-[#D4AF37]">
          Eco-Score
        </span>
        <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-white leading-none mt-1">
          {clamped}
        </span>
        <span className="text-xs font-mono tabular-nums text-white/75 mt-1">/ 100 bal</span>
      </div>
    </div>
  );
};

export const StaffEcoMonitoringScreen: React.FC<StaffEcoMonitoringScreenProps> = ({
  session,
}) => {
  const {
    ecoMetrics,
    feedingPlans,
    hygieneTasks,
    iotAlertLogs,
    wasteToGreenLogs,
    ecoRecommendations,
    isHydrating,
    addWasteToGreenLog,
    toggleEcoRecommendation,
  } = useAppStore();

  const stableId = session.stableId ?? 'stb-01';

  const [period, setPeriod] = useState<ChartPeriod>('monthly');
  const [activeMetric, setActiveMetric] = useState<EcoKpiKey>('water');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);
  const [busyRecId, setBusyRecId] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(true);

  // Içki 3D «Ýaşyl Athana» modaly
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // Waste-to-Green täze hasabat modaly
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteDate, setWasteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [organicWasteKg, setOrganicWasteKg] = useState('180');
  const [compostKg, setCompostKg] = useState('122');
  const [biogasM3, setBiogasM3] = useState('25.2');
  const [destination, setDestination] = useState<WasteDestination>('oba_hojalyk');
  const [wasteNotes, setWasteNotes] = useState('');
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [savingWaste, setSavingWaste] = useState(false);

  const dashboard = useMemo(
    () =>
      computeDynamicEcoDashboard({
        complexId: session.complexId,
        stableLabel: session.stableName,
        ecoMetrics,
        feedingPlans,
        hygieneTasks,
        iotAlertLogs,
        wasteLogs: wasteToGreenLogs,
        recommendations: ecoRecommendations,
      }),
    [
      session.complexId,
      session.stableName,
      ecoMetrics,
      feedingPlans,
      hygieneTasks,
      iotAlertLogs,
      wasteToGreenLogs,
      ecoRecommendations,
    ]
  );

  const series = useMemo(() => {
    return period === 'monthly' ? dashboard.monthlySeries : dashboard.weeklySeries;
  }, [dashboard, period]);

  const chartMeta = KPI_CHART_META[activeMetric];

  const chartStats = useMemo(() => {
    if (series.length === 0) {
      return { values: [] as number[], max: 1, total: 0, totalCo2: 0 };
    }
    const values = series.map((p) => chartMeta.extract(p));
    const max = Math.max(...values, 1);
    const total = values.reduce((sum, v) => sum + v, 0);
    const totalCo2 = series.reduce((sum, p) => sum + p.co2ReducedKg, 0);
    return { values, max, total, totalCo2 };
  }, [series, chartMeta]);

  const activePointIndex =
    selectedPointIdx !== null && selectedPointIdx < series.length
      ? selectedPointIdx
      : series.length > 0
        ? series.length - 1
        : 0;
  const activePoint = series[activePointIndex];

  const wasteLogTotals = useMemo(() => {
    const totalOrganic = wasteToGreenLogs.reduce((s, l) => s + l.organicWasteKg, 0);
    const totalCompost = wasteToGreenLogs.reduce((s, l) => s + l.compostKg, 0);
    const totalBiogas = wasteToGreenLogs.reduce((s, l) => s + l.biogasM3, 0);
    return {
      totalOrganic,
      totalCompost,
      totalBiogas: Math.round(totalBiogas * 10) / 10,
    };
  }, [wasteToGreenLogs]);

  const handleToggleRecommendation = async (rec: EcoRecommendation) => {
    setBusyRecId(rec.id);
    try {
      await toggleEcoRecommendation(rec.id, !rec.applied);
    } finally {
      setBusyRecId(null);
    }
  };

  const handleOrganicKgChange = (val: string) => {
    setOrganicWasteKg(val);
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      setCompostKg(String(Math.round(parsed * 0.68)));
      setBiogasM3(String(Math.round(parsed * 0.14 * 10) / 10));
    }
  };

  const handleSaveWasteLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setWasteError(null);
    setSavingWaste(true);
    try {
      await addWasteToGreenLog(stableId, {
        date: wasteDate,
        organicWasteKg: Number(organicWasteKg),
        compostKg: Number(compostKg),
        biogasM3: Number(biogasM3),
        destination,
        recordedBy: session.fullName,
        notes: wasteNotes,
      });
      setWasteNotes('');
      setIsWasteModalOpen(false);
      setActiveMetric('waste');
    } catch (err) {
      setWasteError(
        err instanceof Error ? err.message : 'Waste-to-Green hasabatyny saklamakda säwlik boldy.'
      );
    } finally {
      setSavingWaste(false);
    }
  };

  if (isHydrating) {
    return (
      <div className="space-y-5">
        <div className="h-56 rounded-2xl bg-[#064E3B]/15 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  const appliedCount = dashboard.recommendations.filter((r) => r.applied).length;
  const unresolvedAlertsCount = iotAlertLogs.filter((a) => !a.resolved).length;
  const completedFeedingsCount = feedingPlans.filter((f) => f.completedToday).length;
  const completedHygieneCount = hygieneTasks.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-6">
      {/* 1. Esasy Fokal Blok — Dinamiki «Ýaşyl Reýting» (Eco-Score 0–100) */}
      <Card variant="emerald" padding="lg" className="relative overflow-hidden">
        <div
          className="absolute -right-14 -top-14 w-64 h-64 rounded-full bg-[#D4AF37]/10 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-8 items-center">
          <div className="flex flex-col items-center gap-3">
            <EcoScoreRing score={dashboard.ecoScore} />
            <span className="text-xs font-semibold text-[#D4AF37] text-center">
              {dashboard.certificationLabel}
            </span>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#10B981]">
                  «Ýaşyl Athana» Ekologik Gözegçilik Merkezi
                </p>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white leading-tight text-balance">
                  Athananyň «Ýaşyl Reýtingi»
                </h1>
                <p className="mt-1.5 text-sm text-white/80 leading-relaxed max-w-2xl">
                  {dashboard.stableLabel} boýunça IoT datçikleri, isripsiz iýmitlendiriş, arassaçylyk
                  çek-listi we Waste-to-Green hasabatlaryndan real wagtda hasaplanýan ekologik baha.
                </p>
              </div>

              <Button
                variant="gold"
                size="sm"
                onClick={() => setIs3DModalOpen(true)}
                leftIcon={<Boxes className="w-4 h-4" aria-hidden="true" />}
                className="self-start shrink-0 whitespace-nowrap"
              >
                3D Athana
              </Button>
            </div>

            {/* Çeşme modullary bilen janly sinhronizasiýa setiri */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/80">
              <Link to="/staff/iot" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1">
                <span>
                  IoT: {unresolvedAlertsCount > 0 ? `${unresolvedAlertsCount} duýduryş` : 'Kadaly'}
                </span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </Link>
              <span className="text-white/30" aria-hidden="true">
                ·
              </span>
              <Link to="/staff/feeding" className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1 font-mono tabular-nums">
                <span className="font-sans">Rasion:</span> {completedFeedingsCount}/{feedingPlans.length}
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </Link>
              <span className="text-white/30" aria-hidden="true">
                ·
              </span>
              <Link
                to="/staff/health-training"
                className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1 font-mono tabular-nums"
              >
                <span className="font-sans">Arassaçylyk:</span> {completedHygieneCount}/{hygieneTasks.length}
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            {/* Hasaplama düşündirişi (4 ugryň 25% agramly paýy) */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormula((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  {showFormula ? 'Dinamiki formulany gizle' : 'Dinamiki formulany görkez'}
                </button>
                <span className="text-xs font-mono tabular-nums text-white/85">
                  CO₂ azaldyşy:{' '}
                  <strong className="text-[#10B981]">
                    {dashboard.kpis.co2ReducedKg.toLocaleString('en-US')} kg
                  </strong>
                </span>
              </div>

              {showFormula && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {dashboard.scoreComponents.map((comp) => (
                    <div
                      key={comp.key}
                      className="rounded-xl bg-white/8 border border-white/12 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-white truncate">{comp.label}</span>
                        <span className="font-mono tabular-nums text-[#D4AF37] shrink-0">
                          {comp.weightPercent}%
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-lg font-bold font-mono tabular-nums text-white">
                          {comp.score}
                          <span className="text-xs font-normal text-white/65">/100</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                          style={{ width: `${comp.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-white/75 leading-snug">{comp.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. 4 Esasy Ekologik KPI Kartoçkasy */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-lg font-bold text-[#0F241D]">
            4 Esasy Ekologik Görkeziji (KPI)
          </h2>
          <span className="text-xs text-[#647A72]">
            Aýlyk grafikde görmek üçin islendik kartoçka basyň
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: Suw tygşytlylygy */}
          <Card
            padding="md"
            interactive
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveMetric('water');
              setSelectedPointIdx(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveMetric('water');
                setSelectedPointIdx(null);
              }
            }}
            className={[
              'bg-white flex flex-col justify-between gap-3',
              activeMetric === 'water' ? 'ring-2 ring-[#064E3B] border-[#064E3B]' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Suw tygşytlylygy</span>
              <Droplets className="w-4 h-4 text-[#0284C7]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                {dashboard.kpis.waterSavedLiters.toLocaleString('en-US')}{' '}
                <span className="text-sm font-normal text-[#647A72]">L</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums">
                {dashboard.kpis.waterSavedPercent}% gaýtadan ulanyş we tygşyt
              </p>
            </div>
            <p className="text-xs text-[#647A72] leading-snug pt-2 border-t border-[#EEF3F1]">
              Awtomat suwaryş we syzma datçikleri
            </p>
          </Card>

          {/* KPI 2: Ýaşyl energiýa */}
          <Card
            padding="md"
            interactive
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveMetric('energy');
              setSelectedPointIdx(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveMetric('energy');
                setSelectedPointIdx(null);
              }
            }}
            className={[
              'bg-white flex flex-col justify-between gap-3',
              activeMetric === 'energy' ? 'ring-2 ring-[#064E3B] border-[#064E3B]' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Ýaşyl energiýa</span>
              <Sun className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                {dashboard.kpis.solarEnergyKwh.toLocaleString('en-US')}{' '}
                <span className="text-sm font-normal text-[#647A72]">kWt</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#856510] font-mono tabular-nums">
                {dashboard.kpis.solarSharePercent}% gün energiýasy paýy
              </p>
            </div>
            <p className="text-xs text-[#647A72] leading-snug pt-2 border-t border-[#EEF3F1]">
              Gün panelleri we akylly yşyklandyryş
            </p>
          </Card>

          {/* KPI 3: Isripsiz iýmitlendiriş */}
          <Card
            padding="md"
            interactive
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveMetric('feeding');
              setSelectedPointIdx(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveMetric('feeding');
                setSelectedPointIdx(null);
              }
            }}
            className={[
              'bg-white flex flex-col justify-between gap-3',
              activeMetric === 'feeding' ? 'ring-2 ring-[#064E3B] border-[#064E3B]' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Isripsiz iýmitlendiriş</span>
              <Scale className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                {dashboard.kpis.feedSavedKg.toLocaleString('en-US')}{' '}
                <span className="text-sm font-normal text-[#647A72]">kg</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums">
                -{dashboard.kpis.feedSavedPercent}% ot-iým isripi azaldyldy
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-[#647A72] pt-2 border-t border-[#EEF3F1]">
              <span>Rasion bilen bagly</span>
              <Link
                to="/staff/feeding"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[#064E3B] hover:underline whitespace-nowrap"
              >
                Rasiony aç →
              </Link>
            </div>
          </Card>

          {/* KPI 4: Waste-to-Green */}
          <Card
            padding="md"
            interactive
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveMetric('waste');
              setSelectedPointIdx(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveMetric('waste');
                setSelectedPointIdx(null);
              }
            }}
            className={[
              'bg-white flex flex-col justify-between gap-3',
              activeMetric === 'waste' ? 'ring-2 ring-[#064E3B] border-[#064E3B]' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Waste-to-Green</span>
              <Recycle className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                {dashboard.kpis.wasteToGreenKg.toLocaleString('en-US')}{' '}
                <span className="text-sm font-normal text-[#647A72]">kg</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                {dashboard.kpis.biogasM3.toLocaleString('en-US')} m³ biogaz + bio-dökün
              </p>
            </div>
            <p className="text-xs text-[#647A72] leading-snug pt-2 border-t border-[#EEF3F1]">
              Organiki galyndydan oba hojalygy üçin dökün/biogaz
            </p>
          </Card>
        </div>
      </div>

      {/* 3. Aýlyk (6 aý) we Hepdelik (7 gün) Ekologik Grafik */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              Ekologik Netijelilik Grafiki
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#0F241D]">
              {chartMeta.label}
            </h2>
            <p className="text-xs text-[#647A72] mt-0.5">{chartMeta.subtitle}</p>
          </div>

          <div
            className="inline-flex p-1 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] self-start md:self-auto"
            role="tablist"
            aria-label="Grafik döwri"
          >
            <button
              type="button"
              role="tab"
              aria-selected={period === 'monthly'}
              onClick={() => {
                setPeriod('monthly');
                setSelectedPointIdx(null);
              }}
              className={[
                'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                period === 'monthly'
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#415850] hover:text-[#064E3B]',
              ].join(' ')}
            >
              Aýlyk (6 aý)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === 'weekly'}
              onClick={() => {
                setPeriod('weekly');
                setSelectedPointIdx(null);
              }}
              className={[
                'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                period === 'weekly'
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#415850] hover:text-[#064E3B]',
              ].join(' ')}
            >
              Hepdelik (7 gün)
            </button>
          </div>
        </div>

        {/* Sanly jemleme setiri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-b border-[#EEF3F1]">
          <div>
            <span className="text-xs text-[#647A72] block">
              {period === 'monthly' ? '6 aýlyk jemi' : '7 günlük jemi'}
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#064E3B]">
              {Math.round(chartStats.total).toLocaleString('en-US')} {chartMeta.unit}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#647A72] block">
              Saýlanan nokat ({activePoint?.label ?? '—'})
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#0F241D]">
              {activePoint ? chartMeta.extract(activePoint).toLocaleString('en-US') : '—'}{' '}
              {chartMeta.unit}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#647A72] block">CO₂ azaldyş goşandy</span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#059669]">
              {activePoint ? activePoint.co2ReducedKg.toLocaleString('en-US') : '—'} kg
            </span>
          </div>
        </div>

        {/* Interaktiw Sütin Grafiki */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[440px]">
            <div
              className="grid gap-3 items-end h-56 pt-6 pb-2 px-2"
              style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
            >
              {series.map((point, idx) => {
                const value = chartMeta.extract(point);
                const heightPct = Math.max(14, Math.round((value / chartStats.max) * 100));
                const isSelected = idx === activePointIndex;

                return (
                  <button
                    key={point.label}
                    type="button"
                    onClick={() => setSelectedPointIdx(idx)}
                    className="h-full flex flex-col items-center justify-end gap-2 group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981] rounded-xl"
                  >
                    <span
                      className={[
                        'text-[11px] font-mono tabular-nums transition-colors',
                        isSelected
                          ? 'font-bold text-[#064E3B]'
                          : 'text-[#647A72] group-hover:text-[#0F241D]',
                      ].join(' ')}
                    >
                      {value.toLocaleString('en-US')}
                    </span>

                    <div className="w-full max-w-[56px] flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-xl transition-all duration-300"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isSelected ? chartMeta.accentHex : '#DCE6E1',
                        }}
                      />
                    </div>

                    <span
                      className={[
                        'text-xs font-semibold',
                        isSelected ? 'text-[#064E3B]' : 'text-[#647A72]',
                      ].join(' ')}
                    >
                      {point.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Waste-to-Green Gündelik Hasabat Žurnaly */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
              Oba Hojalygy Üçin Bio-Dökün we Biogaz Hasabaty
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#0F241D]">
              Waste-to-Green Gündelik Žurnal
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#415850]">
              Organiki galyndydan gaýtadan işlenen bio-dökün we biogaz ýazgylary gönüden-göni
              Eco-Score bahasyna hem-de aýlyk grafike goşulýar.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setWasteError(null);
              setIsWasteModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
            className="self-start sm:self-auto shrink-0 whitespace-nowrap"
          >
            Täze hasabat goş
          </Button>
        </div>

        {/* Žurnal jemleri */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2 border-b border-[#EEF3F1] text-xs">
          <div>
            <span className="text-[#647A72] block">Jemi ýygnalan organiki galyndy</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#0F241D]">
              {wasteLogTotals.totalOrganic.toLocaleString('en-US')} kg
            </span>
          </div>
          <div>
            <span className="text-[#647A72] block">Öndürilen bio-dökün</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#064E3B]">
              {wasteLogTotals.totalCompost.toLocaleString('en-US')} kg
            </span>
          </div>
          <div>
            <span className="text-[#647A72] block">Öndürilen biogaz</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#856510]">
              {wasteLogTotals.totalBiogas.toLocaleString('en-US')} m³
            </span>
          </div>
        </div>

        {/* Hasabat tablisasy */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                <th className="py-2.5 pr-4">Sene</th>
                <th className="py-2.5 px-3 text-right">Organiki galyndy</th>
                <th className="py-2.5 px-3 text-right">Bio-dökün</th>
                <th className="py-2.5 px-3 text-right">Biogaz</th>
                <th className="py-2.5 px-3">Ugradylan ugur</th>
                <th className="py-2.5 pl-3">Jogapkär we Bellik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F1] text-xs sm:text-sm">
              {wasteToGreenLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#F8FAF9] transition-colors">
                  <td className="py-3 pr-4 font-mono tabular-nums font-semibold text-[#0F241D] whitespace-nowrap">
                    {entry.date}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-[#415850] whitespace-nowrap">
                    {entry.organicWasteKg} kg
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#064E3B] whitespace-nowrap">
                    {entry.compostKg} kg
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#856510] whitespace-nowrap">
                    {entry.biogasM3} m³
                  </td>
                  <td className="py-3 px-3 text-[#0F241D]">
                    {DESTINATION_LABELS[entry.destination]}
                  </td>
                  <td className="py-3 pl-3">
                    <p className="text-xs font-semibold text-[#064E3B]">{entry.recordedBy}</p>
                    <p className="text-xs text-[#647A72] leading-snug">{entry.notes}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Eko-Maslahatçy (3 anyk maslahat + «Ýerine ýetir» düwmesi) */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              IoT, Rasion we Arassaçylyk Sanlaryna Esaslanýan Analiz
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#0F241D]">
              Eko-Maslahatçy
            </h2>
            <p className="mt-1 text-sm text-[#415850]">
              Athananyň häzirki datçik görkezijilerine görä işgäre hödürlenýän 3 sany anyk ekologik
              ädim. Ýerine ýetirilen her maslahat «Ýaşyl Reýtingi» ýokarlandyrýar.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-[#647A72] block">Ýerine ýetirilen</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#064E3B]">
              {appliedCount} / {dashboard.recommendations.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#EEF3F1]">
          {dashboard.recommendations.map((rec, index) => {
            const isBusy = busyRecId === rec.id;
            return (
              <div
                key={rec.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    <span className="font-mono font-bold text-[#064E3B]">0{index + 1}.</span>
                    <span className="font-semibold text-[#059669]">
                      {CATEGORY_LABELS[rec.category]}
                    </span>
                    <span className="text-[#CBD5E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#647A72]">{rec.sourceSignal}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F241D] leading-snug">{rec.title}</h3>

                  <p className="text-sm text-[#415850] leading-relaxed">{rec.description}</p>

                  <p className="text-xs font-semibold text-[#856510] font-mono tabular-nums pt-0.5 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                    <span>Garaşylýan täsir: {rec.impactLabel}</span>
                  </p>
                </div>

                <div className="shrink-0">
                  <Button
                    variant={rec.applied ? 'secondary' : 'primary'}
                    size="md"
                    loading={isBusy}
                    onClick={() => handleToggleRecommendation(rec)}
                    leftIcon={
                      rec.applied ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                      )
                    }
                    className="w-full lg:w-auto whitespace-nowrap"
                  >
                    {rec.applied ? 'Ýerine ýetirildi' : 'Ýerine ýetir'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ==============================================================
          MODAL 1: WASTE-TO-GREEN TÄZE HASABAT GOŞMAK
         ============================================================== */}
      <Modal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        title="Täze Waste-to-Green hasabaty"
        subtitle="Organiki galyndydan taýýarlanan bio-dökün we biogaz mukdaryny giriziň."
        size="md"
      >
        <form onSubmit={handleSaveWasteLog} className="space-y-4" noValidate>
          {wasteError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{wasteError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="wst-date"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Sene
              </label>
              <input
                id="wst-date"
                type="date"
                required
                value={wasteDate}
                onChange={(e) => setWasteDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="wst-dest"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Ugradylan ugur
              </label>
              <select
                id="wst-dest"
                value={destination}
                onChange={(e) => setDestination(e.target.value as WasteDestination)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                <option value="oba_hojalyk">Oba hojalyk meýdany (bio-dökün)</option>
                <option value="ýyladyşhana">Ýyladyşhana we ot-iým ekinleri</option>
                <option value="biogaz_stansiýasy">Biogaz energiýa stansiýasy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="wst-organic"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Organiki galyndy (kg)
              </label>
              <input
                id="wst-organic"
                type="number"
                min={5}
                max={5000}
                required
                value={organicWasteKg}
                onChange={(e) => handleOrganicKgChange(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="wst-compost"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Bio-dökün (kg)
              </label>
              <input
                id="wst-compost"
                type="number"
                min={1}
                max={4000}
                required
                value={compostKg}
                onChange={(e) => setCompostKg(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="wst-biogas"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Biogaz (m³)
              </label>
              <input
                id="wst-biogas"
                type="number"
                step="0.1"
                min={0}
                max={600}
                required
                value={biogasM3}
                onChange={(e) => setBiogasM3(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#647A72]">
            Organiki galyndy girizilende bio-dökün (~68%) we biogaz (~0.14 m³/kg) awtomatiki
            teklip edilýär; hakyky ölçeg boýunça el bilen düzedip bilersiňiz.
          </p>

          <div>
            <label
              htmlFor="wst-notes"
              className="block text-xs font-semibold text-[#0F241D] mb-1.5"
            >
              Hasabat belligi
            </label>
            <textarea
              id="wst-notes"
              rows={3}
              required
              value={wasteNotes}
              onChange={(e) => setWasteNotes(e.target.value)}
              placeholder="Galyndynyň ýygnalan bölümi we dökün/biogaz ulanylyşy barada bellik..."
              className="w-full px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsWasteModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={savingWaste}>
              Hasabaty sakla
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==============================================================
          MODAL 2: IÇKI 3D «ÝAŞYL ATHANA» INTERAKTIW GÖRNÜŞI
         ============================================================== */}
      <Modal
        isOpen={is3DModalOpen}
        onClose={() => setIs3DModalOpen(false)}
        title="3D «Ýaşyl Athana» Interaktiw Görnüşi"
        subtitle={`${dashboard.stableLabel} · Eco-Score ${dashboard.ecoScore}/100 · Gün panelleri, ýagyş suwy howdany we IoT stansiýalary`}
        size="lg"
      >
        <div className="space-y-3">
          {is3DModalOpen && <EcoStable3DScene />}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#647A72]">
            <span>
              Kamerany aýlamak üçin syçanjyk ýa-da barmak bilen süýşüriň; ýokarky düwmelerden gün
              panellerine ýa-da IoT nokatlaryna geçip bilersiňiz.
            </span>
            <span className="font-mono tabular-nums font-semibold text-[#064E3B]">
              Gün paýy: {dashboard.kpis.solarSharePercent}% · Suw tygşydy:{' '}
              {dashboard.kpis.waterSavedPercent}%
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
