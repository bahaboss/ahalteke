import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  Droplets,
  Flame,
  Info,
  Leaf,
  Recycle,
  Scale,
  Sparkles,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { fetchEcoDashboard, toggleEcoRecommendationApplied } from '../../services';
import type {
  AuthSession,
  EcoDashboardPayload,
  EcoKpiKey,
  EcoRecommendation,
  EcoTimeSeriesPoint,
} from '../../types';
import { Button, Card } from '../common';

export interface StaffEcoMonitoringScreenProps {
  session: AuthSession;
  onOpen3DStable: () => void;
}

type ChartPeriod = 'weekly' | 'monthly';

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
    subtitle: 'Syzma datçikleri we awtomat damjalaýyn suwaryş',
    extract: (p) => p.waterSavedLiters,
  },
  energy: {
    key: 'energy',
    label: 'Ýaşyl energiýa',
    unit: 'kWt',
    accentHex: '#D4AF37',
    subtitle: 'Gün panelleri we akylly LED yşyklandyryş',
    extract: (p) => p.solarEnergyKwh,
  },
  feeding: {
    key: 'feeding',
    label: 'Isripsiz iýmitlendiriş',
    unit: 'kg',
    accentHex: '#10B981',
    subtitle: 'Takyk rasion bilen tygşytlanan ot-iým',
    extract: (p) => p.feedSavedKg,
  },
  waste: {
    key: 'waste',
    label: 'Waste-to-Green',
    unit: 'kg',
    accentHex: '#064E3B',
    subtitle: 'Organiki galyndydan oba hojalyk bio-döküni / biogaz',
    extract: (p) => p.wasteToGreenKg,
  },
};

const CATEGORY_LABELS: Record<EcoKpiKey, string> = {
  water: 'Suw tygşytlylygy',
  energy: 'Ýaşyl energiýa',
  feeding: 'Isripsiz rasion',
  waste: 'Waste-to-Green',
};

/** Tegelek Eco-Score (0–100) SVG Progress görkezijisi */
const EcoScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img" aria-label={`Ýaşyl Reýting ${clamped} / 100`}>
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
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
          Eco-Score
        </span>
        <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-white leading-none mt-1">
          {clamped}
        </span>
        <span className="text-xs font-mono text-white/70 mt-1">/ 100 bal</span>
      </div>
    </div>
  );
};

export const StaffEcoMonitoringScreen: React.FC<StaffEcoMonitoringScreenProps> = ({
  session,
  onOpen3DStable,
}) => {
  const [dashboard, setDashboard] = useState<EcoDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ChartPeriod>('weekly');
  const [activeMetric, setActiveMetric] = useState<EcoKpiKey>('water');
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);
  const [busyRecId, setBusyRecId] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(true);

  const loadDashboard = async () => {
    const res = await fetchEcoDashboard(session.complexId, session.stableName);
    setDashboard(res.data);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchEcoDashboard(session.complexId, session.stableName)
      .then((res) => {
        if (!active) return;
        setDashboard(res.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session.complexId, session.stableName]);

  const handleToggleRecommendation = async (rec: EcoRecommendation) => {
    setBusyRecId(rec.id);
    try {
      await toggleEcoRecommendationApplied(rec.id, !rec.applied);
      await loadDashboard();
    } finally {
      setBusyRecId(null);
    }
  };

  const series = useMemo(() => {
    if (!dashboard) return [];
    return period === 'weekly' ? dashboard.weeklySeries : dashboard.monthlySeries;
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

  if (loading || !dashboard) {
    return (
      <div className="space-y-5">
        <div className="h-56 rounded-2xl bg-[#064E3B]/15 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  const appliedCount = dashboard.recommendations.filter((r) => r.applied).length;

  return (
    <div className="space-y-6">
      {/* 1. Esasy Fokal Blok — Athananyň «Ýaşyl Reýtingi» (Eco-Score 0–100) */}
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
                <p className="text-xs font-semibold tracking-wider text-[#10B981]">
                  «Ýaşyl Athana» Ekologik Gözegçilik Merkezi
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Athananyň «Ýaşyl Reýtingi»
                </h1>
                <p className="mt-1.5 text-sm text-white/80 leading-relaxed max-w-2xl">
                  {dashboard.stableLabel} boýunça suw tygşytlylygy, gün energiýasy, isripsiz rasion
                  we organiki galyndylary gaýtadan işlemek görkezijileriniň umumy ekologik bahasy.
                </p>
              </div>

              <Button
                variant="gold"
                size="sm"
                onClick={onOpen3DStable}
                leftIcon={<Boxes className="w-4 h-4" aria-hidden="true" />}
                className="self-start shrink-0"
              >
                3D Athana
              </Button>
            </div>

            {/* Hasaplama düşündirişi (4 ugryň agramly paýy) */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormula((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  {showFormula ? 'Hasaplama düşündirişini gizle' : 'Hasaplama düşündirişini görkez'}
                </button>
                <span className="text-xs font-mono tabular-nums text-white/80">
                  CO₂ azaldyşy: <strong className="text-[#10B981]">{dashboard.kpis.co2ReducedKg.toLocaleString('en-US')} kg</strong>
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
                      <p className="text-[11px] text-white/70 leading-snug">{comp.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. 4 sany Esasy Ekologik KPI Kartoçkasy */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-[#0F241D]">
            4 Esasy Ekologik Görkeziji (KPI)
          </h2>
          <span className="text-xs text-[#6B8078]">
            Grafikde görmek üçin islendik kartoçka basyň
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
              'flex flex-col justify-between gap-3',
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
                <span className="text-sm font-normal text-[#6B8078]">L</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums">
                {dashboard.kpis.waterSavedPercent}% gaýtadan ulanyş we tygşyt
              </p>
            </div>
            <p className="text-xs text-[#6B8078] leading-snug pt-2 border-t border-[#EEF3F1]">
              Syzma datçikleri we awtomat damjalaýyn suwaryş
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
              'flex flex-col justify-between gap-3',
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
                <span className="text-sm font-normal text-[#6B8078]">kWt</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#856510] font-mono tabular-nums">
                {dashboard.kpis.solarSharePercent}% gün energiýasy paýy
              </p>
            </div>
            <p className="text-xs text-[#6B8078] leading-snug pt-2 border-t border-[#EEF3F1]">
              Gün panelleri we akylly LED yşyklandyryş
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
              'flex flex-col justify-between gap-3',
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
                <span className="text-sm font-normal text-[#6B8078]">kg</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums">
                -{dashboard.kpis.feedSavedPercent}% ot-iým isripi azaldyldy
              </p>
            </div>
            <p className="text-xs text-[#6B8078] leading-snug pt-2 border-t border-[#EEF3F1]">
              Takyk rasion we gündelik çek-list gözegçiligi
            </p>
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
              'flex flex-col justify-between gap-3',
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
                <span className="text-sm font-normal text-[#6B8078]">kg</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#059669] font-mono tabular-nums flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                {dashboard.kpis.biogasM3.toLocaleString('en-US')} m³ biogaz + dökün
              </p>
            </div>
            <p className="text-xs text-[#6B8078] leading-snug pt-2 border-t border-[#EEF3F1]">
              Organiki galyndydan oba hojalyk döküni we biogaz
            </p>
          </Card>
        </div>
      </div>

      {/* 3. Hepdelik (7 gün) we Aýlyk (6 aý) Ekologik Ösüş Grafiki */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              Ekologik Netijelilik Grafiki
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0F241D]">{chartMeta.label}</h2>
            <p className="text-xs text-[#6B8078] mt-0.5">{chartMeta.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex p-1 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]"
              role="tablist"
              aria-label="Grafik döwri"
            >
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
            </div>
          </div>
        </div>

        {/* Saýlanan döwür we nokat boýunça sanly jemleme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F8FAF9] border border-[#DCE6E1] rounded-2xl p-4">
          <div>
            <span className="text-xs text-[#6B8078] block">
              {period === 'weekly' ? '7 günlük jemi' : '6 aýlyk jemi'}
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#064E3B]">
              {Math.round(chartStats.total).toLocaleString('en-US')} {chartMeta.unit}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#6B8078] block">
              Saýlanan nokat ({activePoint?.label ?? '—'})
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#0F241D]">
              {activePoint ? chartMeta.extract(activePoint).toLocaleString('en-US') : '—'}{' '}
              {chartMeta.unit}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#6B8078] block">CO₂ azaldyş goşandy</span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#059669]">
              {activePoint ? activePoint.co2ReducedKg.toLocaleString('en-US') : '—'} kg
            </span>
          </div>
        </div>

        {/* Arassa SVG Sütin we Trend Grafiki */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[440px]">
            <div className="grid gap-3 items-end h-56 pt-6 pb-2 px-2" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
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
                          : 'text-[#6B8078] group-hover:text-[#0F241D]',
                      ].join(' ')}
                    >
                      {value.toLocaleString('en-US')}
                    </span>

                    <div className="w-full max-w-[52px] flex-1 flex items-end">
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
                        isSelected ? 'text-[#064E3B]' : 'text-[#6B8078]',
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

      {/* 4. AI Eko-Maslahatçy (3 anyk maslahat + «Ýerine ýetir» düwmesi) */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              IoT we Rasion Sanlaryna Esaslanýan Analiz
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0F241D]">AI Eko-Maslahatçy</h2>
            <p className="mt-1 text-sm text-[#415850]">
              Athananyň häzirki datçik görkezijilerine görä işgäre hödürlenýän 3 sany anyk ekologik
              ädim. Ýerine ýetirilen her maslahat «Ýaşyl Reýtingi» ýokarlandyrýar.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-[#6B8078] block">Ýerine ýetirilen</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#064E3B]">
              {appliedCount} / {dashboard.recommendations.length}
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          {dashboard.recommendations.map((rec, index) => {
            const isBusy = busyRecId === rec.id;
            return (
              <div
                key={rec.id}
                className={[
                  'p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors',
                  rec.applied
                    ? 'bg-[#ECFDF5]/60 border-[#10B981]/45'
                    : 'bg-[#F8FAF9] border-[#DCE6E1]',
                ].join(' ')}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    <span className="font-mono font-bold text-[#064E3B]">0{index + 1}.</span>
                    <span className="font-semibold text-[#059669]">
                      {CATEGORY_LABELS[rec.category]}
                    </span>
                    <span className="text-[#DCE6E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#6B8078]">{rec.sourceSignal}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F241D] leading-snug">{rec.title}</h3>

                  <p className="text-sm text-[#415850] leading-relaxed">{rec.description}</p>

                  <p className="text-xs font-semibold text-[#856510] font-mono tabular-nums pt-1 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                    Garaşylýan täsir: {rec.impactLabel}
                  </p>
                </div>

                <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#DCE6E1]/60">
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
                    className="w-full lg:w-auto"
                  >
                    {rec.applied ? 'Ýerine ýetirildi' : 'Ýerine ýetir'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
