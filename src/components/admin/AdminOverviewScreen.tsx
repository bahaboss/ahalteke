import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Award,
  Building2,
  Droplets,
  Leaf,
  Search,
  Sun,
  Users,
  Warehouse,
} from 'lucide-react';
import { fetchAdminOverview } from '../../services';
import type { AdminOverviewData, ComplexEcoSummaryPoint } from '../../types';
import { Card } from '../common';

type ChartMetric = 'water' | 'energy';
type SortKey = 'ecoScore' | 'waterSavedLiters' | 'solarEnergyKwh';

export interface AdminOverviewScreenProps {
  onNavigateTab?: (tab: 'assignments' | 'content' | 'applications') => void;
}

export const AdminOverviewScreen: React.FC<AdminOverviewScreenProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('water');
  const [selectedComplexId, setSelectedComplexId] = useState<string>('');
  const [tableComplexFilter, setTableComplexFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ecoScore');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchAdminOverview();
        if (!active) return;
        setData(res.data);
        if (res.data.complexSeries.length > 0) {
          setSelectedComplexId((prev) => prev || res.data.complexSeries[0].complexId);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredRankings = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.stableRankings
      .filter((item) => {
        if (tableComplexFilter !== 'all' && item.complexId !== tableComplexFilter) {
          return false;
        }
        if (!q) return true;
        return (
          item.stableName.toLowerCase().includes(q) ||
          item.stableCode.toLowerCase().includes(q) ||
          item.complexName.toLowerCase().includes(q) ||
          item.headSeisName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [data, tableComplexFilter, searchQuery, sortKey]);

  const activeComplexPoint: ComplexEcoSummaryPoint | undefined = useMemo(() => {
    if (!data) return undefined;
    return (
      data.complexSeries.find((c) => c.complexId === selectedComplexId) ?? data.complexSeries[0]
    );
  }, [data, selectedComplexId]);

  const chartMaxValue = useMemo(() => {
    if (!data || data.complexSeries.length === 0) return 1;
    const values = data.complexSeries.map((c) =>
      chartMetric === 'water' ? c.waterSavedLiters : c.solarEnergyKwh
    );
    return Math.max(...values, 1);
  }, [data, chartMetric]);

  if (loading || !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Umumy gözegçilik maglumatlary ýüklenýär">
        <div className="h-9 w-72 rounded-xl bg-[#E6EFEA] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-32 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sahypa sözbaşysy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Merkezi Admin Gözegçiligi · Ähli Welaýatlar
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
            Umumy Gözegçilik we Ýaşyl Reýting
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            Türkmenistanyň ähli atçylyk sport toplumlarynyň, athanalaryň we ekologiýa tygşytlylygynyň
            jemleýji sanly görkezijileri.
          </p>
        </div>

        {onNavigateTab && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('assignments')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs sm:text-sm font-semibold hover:bg-[#053D2E] transition-colors cursor-pointer whitespace-nowrap"
            >
              Athana we işgär goş
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('applications')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#DCE6E1] text-[#064E3B] text-xs sm:text-sm font-semibold hover:bg-[#EEF3F1] transition-colors cursor-pointer whitespace-nowrap tabular-nums"
            >
              Garaşýan anketalar: {data.totals.pendingApplicationsCount}
            </button>
          </div>
        )}
      </div>

      {/* 4 sany Jemleýji Milli KPI Kartoçkasy */}
      <section aria-label="Jemleýji statistika" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card padding="md" className="bg-white space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#647A72]">
            <span>Toplumlar we Athanalar</span>
            <Building2 className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-[#0F241D]">
            {data.totals.complexCount}
            <span className="text-base font-medium text-[#647A72] ml-1.5">
              / {data.totals.stableCount} athana
            </span>
          </p>
          <p className="text-xs text-[#415850] tabular-nums">
            Işjeň berkidilen işgärler: <strong className="text-[#064E3B]">{data.totals.staffCount}</strong>
          </p>
        </Card>

        <Card padding="md" className="bg-white space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#647A72]">
            <span>Umumy Ahalteke Bedewi</span>
            <Users className="w-4 h-4 text-[#059669]" aria-hidden="true" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-[#0F241D]">
            {data.totals.horseCount.toLocaleString('en-US').replace(/,/g, ' ')}
          </p>
          <p className="text-xs text-[#415850]">
            Ähli 5 welaýat, Aşgabat we Arkadag boýunça
          </p>
        </Card>

        <Card padding="md" className="bg-[#064E3B] text-white border-[#064E3B] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#D4AF37]">
            <span>Ortaça «Ýaşyl Reýting»</span>
            <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-white">
            {data.totals.avgEcoScore}
            <span className="text-base font-normal text-white/70"> / 100</span>
          </p>
          <p className="text-xs text-white/80">
            Ýokary ekologik standart derejesi (Eco-Score)
          </p>
        </Card>

        <Card padding="md" className="bg-white space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#647A72]">
            <span>Suw we Gün Energiýasy</span>
            <Leaf className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#064E3B]">
            {(data.totals.totalWaterSavedLiters / 1000).toFixed(1)} müň L
          </p>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            + {data.totals.totalSolarEnergyKwh.toLocaleString('en-US').replace(/,/g, ' ')} kWt ýaşyl energiýa
          </p>
        </Card>
      </section>

      {/* Suw we Gün Energiýasy Tygşytlylygynyň Umumy Grafiki */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <Card padding="md" className="xl:col-span-8 bg-white flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F241D]">
                Toplumlar Boýunça Suw we Energiýa Tygşytlylygy
              </h2>
              <p className="text-xs text-[#647A72] mt-0.5">
                Jikme-jik maglumat görmek üçin islendik toplumyň sütunyna basyň.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Grafik görkezijisi"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EEF3F1] self-start sm:self-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={chartMetric === 'water'}
                onClick={() => setChartMetric('water')}
                className={[
                  'min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap',
                  chartMetric === 'water'
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-[#415850] hover:text-[#0F241D]',
                ].join(' ')}
              >
                <Droplets className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Suw (L)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMetric === 'energy'}
                onClick={() => setChartMetric('energy')}
                className={[
                  'min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap',
                  chartMetric === 'energy'
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-[#415850] hover:text-[#0F241D]',
                ].join(' ')}
              >
                <Sun className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                Gün energiýasy (kWt)
              </button>
            </div>
          </div>

          {/* Interaktiw SVG Sütun Grafiki */}
          <div className="w-full overflow-x-auto pb-1">
            <div className="min-w-[520px]">
              <svg
                viewBox="0 0 700 248"
                className="w-full h-auto"
                role="img"
                aria-label={
                  chartMetric === 'water'
                    ? 'Toplumlar boýunça suw tygşytlylygynyň grafiki'
                    : 'Toplumlar boýunça gün energiýasynyň grafiki'
                }
              >
                {/* Kese tor çyzyklary */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 200 - ratio * 164;
                  const val = Math.round(chartMaxValue * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1="56"
                        x2="688"
                        y1={y}
                        y2={y}
                        stroke="#E6EFEA"
                        strokeWidth="1"
                        strokeDasharray={ratio === 0 ? undefined : '4 4'}
                      />
                      <text
                        x="48"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#647A72] text-[10px] font-mono"
                      >
                        {chartMetric === 'water'
                          ? `${(val / 1000).toFixed(0)}k`
                          : val.toString()}
                      </text>
                    </g>
                  );
                })}

                {data.complexSeries.map((point, index) => {
                  const slotWidth = 624 / Math.max(data.complexSeries.length, 1);
                  const barWidth = Math.min(54, slotWidth * 0.56);
                  const x = 62 + index * slotWidth + (slotWidth - barWidth) / 2;
                  const value =
                    chartMetric === 'water' ? point.waterSavedLiters : point.solarEnergyKwh;
                  const barHeight = Math.max(12, (value / chartMaxValue) * 164);
                  const y = 200 - barHeight;
                  const isSelected = point.complexId === activeComplexPoint?.complexId;

                  const fillColor = isSelected
                    ? '#D4AF37'
                    : chartMetric === 'water'
                      ? '#064E3B'
                      : '#10B981';

                  return (
                    <g
                      key={point.complexId}
                      onClick={() => setSelectedComplexId(point.complexId)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${point.complexName}: ${value} ${chartMetric === 'water' ? 'litr' : 'kWt'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedComplexId(point.complexId);
                        }
                      }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="8"
                        fill={fillColor}
                        className="transition-opacity duration-150 hover:opacity-90"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 7}
                        textAnchor="middle"
                        className="fill-[#0F241D] text-[10px] font-mono font-semibold"
                      >
                        {chartMetric === 'water'
                          ? `${(value / 1000).toFixed(1)}k`
                          : `${value}`}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y="222"
                        textAnchor="middle"
                        className={[
                          'text-[11px]',
                          isSelected ? 'fill-[#064E3B] font-bold' : 'fill-[#415850] font-medium',
                        ].join(' ')}
                      >
                        {point.shortName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </Card>

        {/* Saýlanan Toplumyň Jikme-jik Ekologik Kartoçkasy */}
        <Card padding="md" className="xl:col-span-4 bg-white flex flex-col justify-between gap-4">
          {activeComplexPoint && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#059669]">
                  Saýlanan Toplum · {activeComplexPoint.region}
                </p>
                <h3 className="font-display text-lg font-bold text-[#0F241D] leading-snug">
                  {activeComplexPoint.complexName}
                </h3>
                <p className="text-xs text-[#647A72]">
                  Sertifikat derejesi:{' '}
                  <span className="font-semibold text-[#064E3B]">
                    {activeComplexPoint.certificationLevel}
                  </span>
                </p>
              </div>

              <div className="divide-y divide-[#EEF3F1] border-y border-[#EEF3F1]">
                <div className="py-3 flex items-center justify-between text-sm">
                  <span className="text-[#415850]">Ortaça Ýaşyl Reýting</span>
                  <span className="font-mono tabular-nums font-bold text-[#064E3B]">
                    {activeComplexPoint.avgEcoScore} / 100
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between text-sm">
                  <span className="text-[#415850]">Suw tygşytlylygy</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                    {activeComplexPoint.waterSavedLiters.toLocaleString('en-US').replace(/,/g, ' ')} L
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between text-sm">
                  <span className="text-[#415850]">Gün energiýasy</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                    {activeComplexPoint.solarEnergyKwh.toLocaleString('en-US').replace(/,/g, ' ')} kWt
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between text-sm">
                  <span className="text-[#415850]">Athana / Bedew sany</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                    {activeComplexPoint.stableCount} / {activeComplexPoint.horseCount}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTableComplexFilter(activeComplexPoint.complexId)}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#ECFDF5] text-[#064E3B] text-xs font-semibold hover:bg-[#D1FAE5] transition-colors cursor-pointer"
              >
                Tablisada diňe şu toplumyň athanalaryny gör
              </button>
            </>
          )}
        </Card>
      </section>

      {/* Iň ýokary «Ýaşyl Reýtingli» (Eco-Score) Athanalaryň Tablisasy */}
      <Card padding="none" className="bg-white overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DCE6E1] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F241D]">
              Iň Ýokary «Ýaşyl Reýtingli» Athanalaryň Tablisasy
            </h2>
            <p className="text-xs text-[#647A72] mt-0.5 tabular-nums">
              Jemi {filteredRankings.length} athana görkezilýär · Eco-Score, suw we gün energiýasy boýunça tertiplenýär
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#647A72] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Athana, kod ýa-da seýis gözle..."
                aria-label="Athana gözlegi"
                className="w-full sm:w-56 min-h-[42px] pl-9 pr-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              />
            </div>

            <select
              value={tableComplexFilter}
              onChange={(e) => setTableComplexFilter(e.target.value)}
              aria-label="Toplum boýunça süzgüç"
              className="min-h-[42px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
            >
              <option value="all">Ähli toplumlary görkez</option>
              {data.complexSeries.map((c) => (
                <option key={c.complexId} value={c.complexId}>
                  {c.shortName} ({c.stableCount})
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EEF3F1]">
              {(
                [
                  { key: 'ecoScore' as SortKey, label: 'Eco-Score' },
                  { key: 'waterSavedLiters' as SortKey, label: 'Suw' },
                  { key: 'solarEnergyKwh' as SortKey, label: 'Energiýa' },
                ]
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSortKey(opt.key)}
                  className={[
                    'min-h-[34px] px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap',
                    sortKey === opt.key
                      ? 'bg-white text-[#064E3B] shadow-xs'
                      : 'text-[#415850] hover:text-[#0F241D]',
                  ].join(' ')}
                >
                  <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredRankings.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Warehouse className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0F241D]">
              Süzgüje gabat gelýän athana tapylmady
            </p>
            <button
              type="button"
              onClick={() => {
                setTableComplexFilter('all');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ECFDF5] text-[#064E3B] text-xs font-semibold hover:bg-[#D1FAE5] cursor-pointer"
            >
              Süzgüçleri arassala
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                  <th className="py-3 pl-6 pr-3 w-12">#</th>
                  <th className="py-3 px-3">Athana we Kod</th>
                  <th className="py-3 px-3">Atçylyk Toplumy</th>
                  <th className="py-3 px-3">Jogapkär Seýis</th>
                  <th className="py-3 px-3 text-right">Boks dolulygy</th>
                  <th className="py-3 px-3 text-right">Suw (L)</th>
                  <th className="py-3 px-3 text-right">Gün (kWt)</th>
                  <th className="py-3 pl-3 pr-6 text-right">Ýaşyl Reýting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F1] text-sm">
                {filteredRankings.map((row, idx) => (
                  <tr
                    key={row.stableId}
                    className="hover:bg-[#F8FAF9] transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-3 font-mono tabular-nums text-xs font-semibold text-[#647A72]">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#0F241D] leading-snug">{row.stableName}</p>
                      <p className="text-xs text-[#647A72] font-mono">
                        {row.stableCode} · {row.solarRoofEnabled ? 'Gün üçekli' : 'Adaty üçek'}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="text-[#0F241D] text-xs sm:text-sm font-medium">
                        {row.complexName}
                      </p>
                      <p className="text-xs text-[#647A72]">{row.region}</p>
                    </td>
                    <td className="py-3.5 px-3 text-xs sm:text-sm text-[#415850]">
                      {row.headSeisName}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs sm:text-sm text-[#0F241D]">
                      {row.occupiedBoxes} / {row.boxCount}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs sm:text-sm text-[#0F241D]">
                      {row.waterSavedLiters.toLocaleString('en-US').replace(/,/g, ' ')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs sm:text-sm text-[#0F241D]">
                      {row.solarEnergyKwh.toLocaleString('en-US').replace(/,/g, ' ')}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#E6EFEA] overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.ecoScore}%`,
                              backgroundColor: row.ecoScore >= 92 ? '#064E3B' : '#10B981',
                            }}
                          />
                        </div>
                        <span
                          className={[
                            'font-mono tabular-nums font-bold text-sm',
                            row.ecoScore >= 92 ? 'text-[#064E3B]' : 'text-[#059669]',
                          ].join(' ')}
                        >
                          {row.ecoScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
