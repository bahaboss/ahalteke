import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { subscribeStableIoTStream } from '../../services';
import { useAppStore } from '../../store';
import type { AuthSession, IoTAlertLogItem, IoTStreamSnapshot } from '../../types';
import { Button, Card } from '../common';
import { AnimatedHorseAvatar } from '../user';

export interface StaffIoTSensorsScreenProps {
  session: AuthSession;
  initialHorseId?: string;
}

const ACTIVITY_LABELS: Record<IoTStreamSnapshot['activityLevel'], string> = {
  dynç: 'Dynç alyşda',
  ýöriş: 'Ýörişde',
  türgenleşik: 'Türgenleşikde',
  çapyşyk: 'Ýokary çapyşyk',
};

type CombinedMetricKey = 'all' | 'temp' | 'ammonia' | 'solar' | 'heart';

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

function formatDateTimeShort(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

interface SparklineChartProps {
  values: number[];
  min: number;
  max: number;
  strokeColor: string;
  fillColor: string;
  label: string;
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  values,
  min,
  max,
  strokeColor,
  fillColor,
  label,
}) => {
  const width = 180;
  const height = 42;
  const padY = 4;

  const series = values.length >= 2 ? values : [values[0] ?? min, values[0] ?? min];
  const range = Math.max(0.01, max - min);

  const coords = series.map((val, idx) => {
    const x = (idx / Math.max(1, series.length - 1)) * width;
    const clamped = Math.min(max, Math.max(min, val));
    const y = height - padY - ((clamped - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePoints = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `M 0,${height} L ${coords
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' L ')} L ${width},${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-11 overflow-visible"
      role="img"
      aria-label={label}
    >
      <path d={areaPath} fill={fillColor} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />
      {last && <circle cx={last.x} cy={last.y} r="3" fill={strokeColor} />}
    </svg>
  );
};

interface CombinedLiveChartProps {
  snapshotsChronological: IoTStreamSnapshot[];
  activeMetric: CombinedMetricKey;
}

const CombinedLiveChart: React.FC<CombinedLiveChartProps> = ({
  snapshotsChronological,
  activeMetric,
}) => {
  const width = 680;
  const height = 210;
  const padL = 42;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const points =
    snapshotsChronological.length >= 2
      ? snapshotsChronological
      : snapshotsChronological.length === 1
        ? [snapshotsChronological[0], snapshotsChronological[0]]
        : [];

  if (points.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-xs text-[#6B8078]">
        Telemetriýa akymy garaşylýar...
      </div>
    );
  }

  const metricDefs: Record<
    Exclude<CombinedMetricKey, 'all'>,
    {
      label: string;
      unit: string;
      color: string;
      min: number;
      max: number;
      getVal: (s: IoTStreamSnapshot) => number;
    }
  > = {
    temp: {
      label: 'Temperatura',
      unit: '°C',
      color: '#D4AF37',
      min: 14,
      max: 34,
      getVal: (s) => s.stableTempC,
    },
    ammonia: {
      label: 'Ammiak (NH₃)',
      unit: 'ppm',
      color: '#EF4444',
      min: 0,
      max: 20,
      getVal: (s) => s.ammoniaPpm,
    },
    solar: {
      label: 'Gün paneli',
      unit: 'kWt',
      color: '#10B981',
      min: 0,
      max: 36,
      getVal: (s) => s.solarPowerKw,
    },
    heart: {
      label: 'Ýürek urşy',
      unit: 'bpm',
      color: '#064E3B',
      min: 24,
      max: 72,
      getVal: (s) => s.heartRateBpm,
    },
  };

  const keysToDraw: Exclude<CombinedMetricKey, 'all'>[] =
    activeMetric === 'all' ? ['temp', 'ammonia', 'solar', 'heart'] : [activeMetric];

  const yAxisLabels =
    activeMetric === 'all'
      ? ['100%', '75%', '50%', '25%', '0%']
      : (() => {
          const def = metricDefs[activeMetric];
          const step = (def.max - def.min) / 4;
          return [0, 1, 2, 3, 4].map((i) => `${(def.max - step * i).toFixed(0)} ${def.unit}`);
        })();

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[520px] h-56"
        role="img"
        aria-label="Real-wagt IoT datçikleriniň umumy çyzykly grafigi"
      >
        {/* Horizontal gridlines & Y labels */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const y = padT + (idx / 4) * plotH;
          return (
            <g key={idx}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="#E2EAE6"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#647A72"
                fontFamily="JetBrains Mono, monospace"
              >
                {yAxisLabels[idx]}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {keysToDraw.map((key) => {
          const def = metricDefs[key];
          const range = Math.max(0.01, def.max - def.min);
          const coords = points.map((snap, i) => {
            const x = padL + (i / Math.max(1, points.length - 1)) * plotW;
            const raw = def.getVal(snap);
            const clamped = Math.min(def.max, Math.max(def.min, raw));
            const y = padT + plotH - ((clamped - def.min) / range) * plotH;
            return { x, y };
          });
          const poly = coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const last = coords[coords.length - 1];

          return (
            <g key={key}>
              <polyline
                fill="none"
                stroke={def.color}
                strokeWidth={activeMetric === 'all' ? '2.2' : '2.8'}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={poly}
              />
              {last && <circle cx={last.x} cy={last.y} r="3.8" fill={def.color} />}
            </g>
          );
        })}

        {/* X-axis timestamps */}
        {points.map((snap, i) => {
          const showLabel =
            points.length <= 6 ||
            i === 0 ||
            i === points.length - 1 ||
            i % Math.ceil(points.length / 5) === 0;
          if (!showLabel) return null;
          const x = padL + (i / Math.max(1, points.length - 1)) * plotW;
          return (
            <text
              key={`${snap.timestamp}-${i}`}
              x={x}
              y={height - 6}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              fontSize="10"
              fill="#647A72"
              fontFamily="JetBrains Mono, monospace"
            >
              {formatTime(snap.timestamp)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const StaffIoTSensorsScreen: React.FC<StaffIoTSensorsScreenProps> = ({
  session,
  initialHorseId,
}) => {
  const { horses, iotAlertLogs, appendIoTAlertLogs, resolveIoTAlert } = useAppStore();

  const [selectedHorseId, setSelectedHorseId] = useState<string>(() => {
    if (initialHorseId) return initialHorseId;
    const stableMatch = horses.find((h) => h.stableId === session.stableId);
    return stableMatch?.id ?? horses[0]?.id ?? 'hrs-001';
  });
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [snapshot, setSnapshot] = useState<IoTStreamSnapshot | null>(null);
  const [history, setHistory] = useState<IoTStreamSnapshot[]>([]);
  const [chartMetric, setChartMetric] = useState<CombinedMetricKey>('all');
  const [logFilter, setLogFilter] = useState<'unresolved' | 'all'>('unresolved');

  const loggedAnomalyCycleRef = useRef(false);

  useEffect(() => {
    if (initialHorseId) {
      setSelectedHorseId(initialHorseId);
      return;
    }
    if (horses.length > 0 && !horses.some((h) => h.id === selectedHorseId)) {
      const stableMatch = horses.find((h) => h.stableId === session.stableId);
      setSelectedHorseId(stableMatch ? stableMatch.id : horses[0].id);
    }
  }, [initialHorseId, horses, session.stableId, selectedHorseId]);

  useEffect(() => {
    if (!isAlertMode) {
      loggedAnomalyCycleRef.current = false;
    }
  }, [isAlertMode]);

  useEffect(() => {
    if (isPaused) return;
    const stableId = session.stableId ?? 'stb-01';
    const unsubscribe = subscribeStableIoTStream(
      stableId,
      selectedHorseId,
      isAlertMode,
      (tick) => {
        setSnapshot(tick);
        setHistory((prev) => [tick, ...prev].slice(0, 12));

        // Anomaliýa synagynda her gezek bir gezek gurluşly duýduryş žurnalyna ýazmak
        if (tick.isAlertMode && !loggedAnomalyCycleRef.current) {
          loggedAnomalyCycleRef.current = true;
          const nowIso = tick.timestamp;
          const stamp = Date.now();
          const generated: IoTAlertLogItem[] = [
            {
              id: `alert-${stamp}-nh3`,
              stableId: tick.stableId,
              horseId: tick.horseId,
              sensorLabel: 'Ammiak (NH₃) we Temperatura',
              severity: 'critical',
              message: `Howa düzüminde ammiak (${tick.ammoniaPpm.toFixed(1)} ppm) we temperatura (${tick.stableTempC.toFixed(1)} °C) kadadan ýokary çykdy.`,
              recommendation:
                'Athananyň wentilýasiýa ulgamyny 100% kuwwatda işlediň, bokslaryň aşagyny arassalaň we howa çalşygyny barlaň.',
              measuredValue: `${tick.ammoniaPpm.toFixed(1)} ppm · ${tick.stableTempC.toFixed(1)} °C`,
              createdAt: nowIso,
              resolved: false,
            },
            {
              id: `alert-${stamp}-water`,
              stableId: tick.stableId,
              horseId: tick.horseId,
              sensorLabel: 'Suw derejesi we Gün paneli',
              severity: 'warning',
              message: `Suw gabynyň derejesi peseldi (${tick.waterLevelPercent}%) we gün paneli kuwwaty azaldy (${tick.solarPowerKw.toFixed(1)} kWt).`,
              recommendation:
                'Awtomatiki suw klapanyny açyň, ýagyş suwy howdanynyň nasosyny we gün inwertorynyň batareýa ätiýajyny barlaň.',
              measuredValue: `Suw ${tick.waterLevelPercent}% · ${tick.solarPowerKw.toFixed(1)} kWt`,
              createdAt: nowIso,
              resolved: false,
            },
          ];
          appendIoTAlertLogs(generated);
        }
      },
      3000
    );
    return unsubscribe;
  }, [session.stableId, selectedHorseId, isAlertMode, isPaused, appendIoTAlertLogs]);

  const selectedHorse = horses.find((h) => h.id === selectedHorseId) ?? horses[0];
  const hasAlerts = Boolean(snapshot && snapshot.alerts.length > 0);

  const isTempAlert = Boolean(snapshot && snapshot.stableTempC > 26.5);
  const isHumidityAlert = Boolean(snapshot && snapshot.stableHumidityPercent > 68);
  const isAmmoniaAlert = Boolean(snapshot && snapshot.ammoniaPpm > 10);
  const isWaterAlert = Boolean(snapshot && snapshot.waterLevelPercent < 30);
  const isSolarAlert = Boolean(snapshot && snapshot.solarPowerKw < 10);
  const isHeartAlert = Boolean(snapshot && snapshot.heartRateBpm > 52);
  const isBodyTempAlert = Boolean(snapshot && snapshot.bodyTemperatureC > 38.6);

  const chronologicalHistory = useMemo(() => [...history].reverse(), [history]);

  const unresolvedAlerts = useMemo(
    () => iotAlertLogs.filter((item) => !item.resolved),
    [iotAlertLogs]
  );

  const visibleAlertLogs = useMemo(
    () => (logFilter === 'unresolved' ? unresolvedAlerts : iotAlertLogs),
    [logFilter, unresolvedAlerts, iotAlertLogs]
  );

  return (
    <div className="space-y-6">
      {/* Başlyk we Live Akym / Anomaliýa dolandyryşy */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#059669] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
            Real-Wagt IoT Telemetriýa Akymy (Her 3s)
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F241D]">
            IoT Datçikler we Live Gözegçilik
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            {session.stableName ?? 'Athana №1'} mikroklimat, suw, gün paneli datçikleri we saýlanan
            bedewiň biometriýasy her 3 sekuntda janly grafikler bilen täzelenýär.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {snapshot && (
            <span className="text-xs font-mono text-[#6B8078] tabular-nums mr-1">
              Täzelenme: <strong className="text-[#064E3B]">{formatTime(snapshot.timestamp)}</strong>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className={[
              'inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap',
              isPaused
                ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] hover:bg-[#D1FAE5]'
                : 'bg-white border-[#DCE6E1] text-[#0F241D] hover:border-[#064E3B]/45',
            ].join(' ')}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                <span>Live akymy başlat</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
                <span>Live akymy togtat</span>
              </>
            )}
          </button>

          {isAlertMode ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setIsAlertMode(false);
                if (isPaused) setIsPaused(false);
              }}
              leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
            >
              Kadalaşdyr
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isPaused) setIsPaused(false);
                setIsAlertMode(true);
              }}
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EF4444]"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Anomaliýa duýduryşyny syna</span>
            </button>
          )}
        </div>
      </div>

      {/* Status zolagy */}
      {hasAlerts && snapshot ? (
        <div
          role="alert"
          className="rounded-2xl bg-[#FEF2F2] border border-[#EF4444] p-5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[#991B1B]">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-[#991B1B]">
                  Howply kadadan çykma hasaba alyndy!
                </h2>
                <p className="text-xs text-[#991B1B]/85">
                  Wentilýasiýany güýçlendirmek, suw üpjünçiligini barlamak we aşakdaky Duýduryş
                  Žurnalyndan maslahaty ýerine ýetirmek talap edilýär.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAlertMode(false)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Kadalaşdyr
            </Button>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#FECACA]">
            {snapshot.alerts.map((msg) => (
              <li
                key={msg}
                className="text-xs font-semibold text-[#991B1B] flex items-start gap-2"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          role="status"
          className={[
            'rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 text-sm',
            isPaused
              ? 'bg-[#FFFBEB] border-[#D4AF37]/50 text-[#92400E]'
              : 'bg-[#ECFDF5] border-[#10B981]/40 text-[#065F46]',
          ].join(' ')}
        >
          <div className="flex items-center gap-2.5">
            {isPaused ? (
              <Pause className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
            )}
            <span className="font-medium">
              {isPaused
                ? 'Live telemetriýa akymy wagtlaýyn togtadyldy. Dowam etmek üçin «Live akymy başlat» düwmesine basyň.'
                : 'Athananyň ähli mikroklimat, gün paneli we bedew datçikleri kadaly aralykda işleýär.'}
            </span>
          </div>
          <span className="text-xs font-mono tabular-nums hidden sm:inline opacity-80">
            {isPaused ? 'WSS Akym · Togtadylan' : 'WSS Akym · 3s Işjeň'}
          </span>
        </div>
      )}

      {/* 6 sany Live Datçik Kartoçkasy (her birinde mini sparkline grafik bilen) */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-[#0F241D]">
            Athananyň 6 Esasy Live Datçigi
          </h2>
          <span className="text-xs text-[#6B8078] font-mono tabular-nums">
            Soňky {chronologicalHistory.length} ölçeg (her 3s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* 1. Temperatura */}
          <Card
            padding="md"
            className={isTempAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Temperatura</span>
              <Thermometer
                className={['w-4 h-4', isTempAlert ? 'text-[#EF4444]' : 'text-[#D4AF37]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isTempAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.stableTempC.toFixed(1)} °C` : '—'}
              </p>
              <span
                className={
                  isTempAlert ? 'text-xs font-bold text-[#EF4444]' : 'text-xs font-semibold text-[#059669]'
                }
              >
                {isTempAlert ? 'Ýokary!' : 'Kadaly'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.stableTempC)}
                min={14}
                max={34}
                strokeColor={isTempAlert ? '#EF4444' : '#D4AF37'}
                fillColor={isTempAlert ? 'rgba(239,68,68,0.12)' : 'rgba(212,175,55,0.14)'}
                label="Temperatura grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Kadaly aralyk: 16.0–26.5 °C
            </p>
          </Card>

          {/* 2. Çyglylyk */}
          <Card
            padding="md"
            className={isHumidityAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Çyglylyk</span>
              <Droplets
                className={['w-4 h-4', isHumidityAlert ? 'text-[#EF4444]' : 'text-[#10B981]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isHumidityAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.stableHumidityPercent}%` : '—'}
              </p>
              <span
                className={
                  isHumidityAlert
                    ? 'text-xs font-bold text-[#EF4444]'
                    : 'text-xs font-semibold text-[#059669]'
                }
              >
                {isHumidityAlert ? 'Ýokary!' : 'Kadaly'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.stableHumidityPercent)}
                min={25}
                max={90}
                strokeColor={isHumidityAlert ? '#EF4444' : '#10B981'}
                fillColor={isHumidityAlert ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.14)'}
                label="Çyglylyk grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Kadaly aralyk: 35–68%
            </p>
          </Card>

          {/* 3. Ammiak / Howa arassalygy */}
          <Card
            padding="md"
            className={isAmmoniaAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">
                Ammiak / Howa arassalygy
              </span>
              <Wind
                className={['w-4 h-4', isAmmoniaAlert ? 'text-[#EF4444]' : 'text-[#064E3B]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isAmmoniaAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.ammoniaPpm.toFixed(1)} ppm` : '—'}
              </p>
              <span
                className={
                  isAmmoniaAlert
                    ? 'text-xs font-bold text-[#EF4444]'
                    : 'text-xs font-semibold text-[#059669]'
                }
              >
                {isAmmoniaAlert ? 'Howply!' : 'Arassa'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.ammoniaPpm)}
                min={0}
                max={20}
                strokeColor={isAmmoniaAlert ? '#EF4444' : '#064E3B'}
                fillColor={isAmmoniaAlert ? 'rgba(239,68,68,0.12)' : 'rgba(6,78,59,0.12)'}
                label="Ammiak grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Kadaly çäk: &lt; 10.0 ppm
            </p>
          </Card>

          {/* 4. Suw derejesi */}
          <Card
            padding="md"
            className={isWaterAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Suw derejesi</span>
              <Droplets
                className={['w-4 h-4', isWaterAlert ? 'text-[#EF4444]' : 'text-[#059669]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isWaterAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.waterLevelPercent}%` : '—'}
              </p>
              <span
                className={
                  isWaterAlert ? 'text-xs font-bold text-[#EF4444]' : 'text-xs font-semibold text-[#059669]'
                }
              >
                {isWaterAlert ? 'Pes!' : 'Ýeterlik'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.waterLevelPercent)}
                min={0}
                max={100}
                strokeColor={isWaterAlert ? '#EF4444' : '#059669'}
                fillColor={isWaterAlert ? 'rgba(239,68,68,0.12)' : 'rgba(5,150,105,0.12)'}
                label="Suw derejesi grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Kadaly aralyk: &gt; 30%
            </p>
          </Card>

          {/* 5. Gün paneli kuwwaty (kWt) */}
          <Card
            padding="md"
            className={isSolarAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850]">Gün paneli kuwwaty</span>
              <Sun
                className={['w-4 h-4', isSolarAlert ? 'text-[#EF4444]' : 'text-[#D4AF37]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isSolarAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.solarPowerKw.toFixed(1)} kWt` : '—'}
              </p>
              <span
                className={
                  isSolarAlert ? 'text-xs font-bold text-[#EF4444]' : 'text-xs font-semibold text-[#059669]'
                }
              >
                {isSolarAlert ? 'Pes!' : 'Öndürýär'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.solarPowerKw)}
                min={0}
                max={36}
                strokeColor={isSolarAlert ? '#EF4444' : '#10B981'}
                fillColor={isSolarAlert ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.14)'}
                label="Gün paneli kuwwaty grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Gündizki kadaly kuwwat: 12–34 kWt
            </p>
          </Card>

          {/* 6. Saýlanan atyň Ýürek urşy & Hereket işjeňligi */}
          <Card
            padding="md"
            className={isHeartAlert ? 'border-[#EF4444] bg-[#FEF2F2]/60' : 'bg-white'}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#415850] truncate">
                Ýürek urşy ({selectedHorse?.name ?? 'Bedew'})
              </span>
              <HeartPulse
                className={['w-4 h-4 shrink-0', isHeartAlert ? 'text-[#EF4444]' : 'text-[#059669]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p
                className={[
                  'text-2xl sm:text-3xl font-bold font-mono tabular-nums',
                  isHeartAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
                ].join(' ')}
              >
                {snapshot ? `${snapshot.heartRateBpm} bpm` : '—'}
              </p>
              <span className="text-xs font-semibold text-[#064E3B]">
                {snapshot ? ACTIVITY_LABELS[snapshot.activityLevel] : '—'}
              </span>
            </div>
            <div className="mt-2">
              <SparklineChart
                values={chronologicalHistory.map((s) => s.heartRateBpm)}
                min={24}
                max={72}
                strokeColor={isHeartAlert ? '#EF4444' : '#064E3B'}
                fillColor={isHeartAlert ? 'rgba(239,68,68,0.12)' : 'rgba(6,78,59,0.12)'}
                label="Ýürek urşy grafigi"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B8078] font-mono tabular-nums">
              Dynçlykda: 28–42 bpm · {snapshot ? `${snapshot.dailySteps.toLocaleString('en-US')} ädim` : '—'}
            </p>
          </Card>
        </div>
      </div>

      {/* Umumy Real-Wagt Çyzykly Grafik */}
      <Card padding="lg" className="bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#EEF3F1]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0F241D]">
              Umumy Real-Wagt Telemetriýa Grafigi
            </h2>
            <p className="text-xs text-[#6B8078]">
              Soňky 12 ölçegiň dinamikasy — her 3 sekuntda täze nokat goşulýar.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grafik görkezijisi">
            {(
              [
                { id: 'all', label: 'Ählisi (%)' },
                { id: 'temp', label: 'Temp (°C)' },
                { id: 'ammonia', label: 'Ammiak' },
                { id: 'solar', label: 'Gün (kWt)' },
                { id: 'heart', label: 'Ýürek (bpm)' },
              ] as { id: CombinedMetricKey; label: string }[]
            ).map((tab) => {
              const active = chartMetric === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartMetric(tab.id)}
                  className={[
                    'min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-[#F8FAF9] border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <CombinedLiveChart
          snapshotsChronological={chronologicalHistory}
          activeMetric={chartMetric}
        />

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#EEF3F1] text-xs text-[#415850]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
            Temperatura (°C)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" aria-hidden="true" />
            Ammiak (NH₃ ppm)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" aria-hidden="true" />
            Gün paneli (kWt)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#064E3B]" aria-hidden="true" />
            Ýürek urşy (bpm)
          </span>
        </div>
      </Card>

      {/* Saýlanan bedewiň jikme-jik biometriýasy */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EEF3F1]">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedHorse && (
              <AnimatedHorseAvatar
                src={selectedHorse.animatedAvatarUrl}
                alt={selectedHorse.name}
                size="md"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#059669]">Saýlanan Bedewiň Boýun Halkasy</p>
              <h2 className="font-display text-lg font-bold text-[#0F241D] truncate">
                {selectedHorse?.name ?? 'Bedew saýlanýar...'}
              </h2>
              {selectedHorse && (
                <p className="text-xs text-[#6B8078] font-mono tabular-nums">
                  {selectedHorse.qrCodeId} · {selectedHorse.coatLabel}
                </p>
              )}
            </div>
          </div>

          <div className="sm:w-72 shrink-0">
            <label htmlFor="iot-horse-select" className="sr-only">
              IoT gözegçiligi üçin bedewi saýlaň
            </label>
            <select
              id="iot-horse-select"
              value={selectedHorseId}
              onChange={(e) => setSelectedHorseId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors"
            >
              {horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.qrCodeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={[
              'p-4 rounded-xl border',
              isHeartAlert ? 'bg-[#FEF2F2] border-[#EF4444]' : 'bg-[#F8FAF9] border-[#DCE6E1]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between text-xs text-[#6B8078]">
              <span>Ýürek urşy (bpm)</span>
              <HeartPulse
                className={['w-4 h-4', isHeartAlert ? 'text-[#EF4444]' : 'text-[#059669]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <p
              className={[
                'mt-2 text-2xl font-bold font-mono tabular-nums',
                isHeartAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
              ].join(' ')}
            >
              {snapshot ? `${snapshot.heartRateBpm}` : '—'}{' '}
              <span className="text-xs font-normal text-[#6B8078]">ur/min</span>
            </p>
            <p className="mt-1 text-xs text-[#6B8078]">Kadaly dynçlykda: 28–42</p>
          </div>

          <div
            className={[
              'p-4 rounded-xl border',
              isBodyTempAlert ? 'bg-[#FEF2F2] border-[#EF4444]' : 'bg-[#F8FAF9] border-[#DCE6E1]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between text-xs text-[#6B8078]">
              <span>Beden gyzgyny</span>
              <Thermometer
                className={['w-4 h-4', isBodyTempAlert ? 'text-[#EF4444]' : 'text-[#D4AF37]'].join(' ')}
                aria-hidden="true"
              />
            </div>
            <p
              className={[
                'mt-2 text-2xl font-bold font-mono tabular-nums',
                isBodyTempAlert ? 'text-[#EF4444]' : 'text-[#064E3B]',
              ].join(' ')}
            >
              {snapshot ? `${snapshot.bodyTemperatureC.toFixed(1)} °C` : '—'}
            </p>
            <p className="mt-1 text-xs text-[#6B8078]">Kadaly: 37.5–38.3 °C</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
            <div className="flex items-center justify-between text-xs text-[#6B8078]">
              <span>Hereket işjeňligi</span>
              <Activity className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-xl font-bold text-[#0F241D]">
              {snapshot ? ACTIVITY_LABELS[snapshot.activityLevel] : '—'}
            </p>
            <p className="mt-1 text-xs text-[#6B8078] font-mono tabular-nums">
              {snapshot ? `${snapshot.dailySteps.toLocaleString('en-US')} ädim / gün` : '—'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
            <div className="flex items-center justify-between text-xs text-[#6B8078]">
              <span>Boýun datçik batareýasy</span>
              <BatteryCharging className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
              {snapshot ? `${snapshot.batteryPercent}%` : '—'}
            </p>
            <p className="mt-1 text-xs text-[#059669]">Gün zarýadly akylly halka</p>
          </div>
        </div>
      </Card>

      {/* Duýduryş Žurnaly (Alert Log) — /staff/overview bilen sinhronlanan */}
      <Card padding="lg" className="bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#EEF3F1]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F241D] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
              Duýduryş Žurnaly (Alert Log)
            </h2>
            <p className="text-xs text-[#6B8078] mt-0.5">
              Çözülmedik duýduryşlar «Umumy Gözegçilik» sahypasynda hem awtomatiki görkezilýär.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] self-start">
            <button
              type="button"
              onClick={() => setLogFilter('unresolved')}
              className={[
                'min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                logFilter === 'unresolved'
                  ? 'bg-[#EF4444] text-white'
                  : 'text-[#415850] hover:text-[#0F241D]',
              ].join(' ')}
            >
              Çözülmedik ({unresolvedAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('all')}
              className={[
                'min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                logFilter === 'all'
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#415850] hover:text-[#0F241D]',
              ].join(' ')}
            >
              Ählisi ({iotAlertLogs.length})
            </button>
          </div>
        </div>

        {visibleAlertLogs.length === 0 ? (
          <div className="rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 p-5 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-[#065F46]">
              Häzirki wagtda çözülmedik IoT duýduryşy ýok
            </p>
            <p className="text-xs text-[#065F46]/80">
              Synag üçin ýokardaky «Anomaliýa duýduryşyny syna» düwmesini ulanyp bilersiňiz.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlertLogs.map((item) => (
              <div
                key={item.id}
                className={[
                  'rounded-2xl border p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4 transition-colors',
                  item.resolved
                    ? 'bg-[#F8FAF9] border-[#DCE6E1]'
                    : 'bg-[#FEF2F2]/80 border-[#EF4444]/60',
                ].join(' ')}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={[
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold',
                        item.resolved
                          ? 'bg-[#ECFDF5] text-[#065F46]'
                          : 'bg-[#EF4444] text-white',
                      ].join(' ')}
                    >
                      {item.resolved ? 'Çözüldi' : item.severity === 'critical' ? 'Gyssagly' : 'Duýduryş'}
                    </span>
                    <span className="font-bold text-[#0F241D]">{item.sensorLabel}</span>
                    <span className="font-mono tabular-nums text-[#6B8078]">
                      ({item.measuredValue})
                    </span>
                    <span className="font-mono tabular-nums text-[#6B8078]">
                      · {formatDateTimeShort(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#0F241D]">{item.message}</p>

                  <p className="text-xs text-[#415850] leading-relaxed">
                    <strong className="text-[#064E3B]">Maslahat:</strong> {item.recommendation}
                  </p>

                  {item.resolved && item.resolvedBy && (
                    <p className="text-[11px] text-[#059669] font-medium">
                      Çözüldi: {item.resolvedBy}{' '}
                      {item.resolvedAt ? `· ${formatDateTimeShort(item.resolvedAt)}` : ''}
                    </p>
                  )}
                </div>

                {!item.resolved && (
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => resolveIoTAlert(item.id, session.fullName)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                      <span>Çözüldi diýip belle</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Soňky real-wagt ýazgylar tablisasy */}
      <Card padding="md" className="bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
          <h3 className="text-sm font-bold text-[#0F241D]">Soňky telemetriýa ölçegleri</h3>
          <span className="text-xs text-[#6B8078]">Her 3 sekuntda awtomatiki täzelenýär</span>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EEF3F1] text-[#6B8078]">
                <th className="py-2.5 pr-4 font-semibold">Wagt</th>
                <th className="py-2.5 px-3 font-semibold text-right">Temp.</th>
                <th className="py-2.5 px-3 font-semibold text-right">Çyglylyk</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ammiak</th>
                <th className="py-2.5 px-3 font-semibold text-right">Suw</th>
                <th className="py-2.5 px-3 font-semibold text-right">Gün paneli</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ýürek urşy</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Ýagdaý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F1] font-mono tabular-nums">
              {history.slice(0, 8).map((row, index) => {
                const rowAlert = row.alerts.length > 0;
                return (
                  <tr key={`${row.timestamp}-${index}`} className="hover:bg-[#F8FAF9]">
                    <td className="py-2.5 pr-4 text-[#0F241D]">{formatTime(row.timestamp)}</td>
                    <td className="py-2.5 px-3 text-right text-[#0F241D]">
                      {row.stableTempC.toFixed(1)} °C
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#0F241D]">
                      {row.stableHumidityPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#0F241D]">
                      {row.ammoniaPpm.toFixed(1)} ppm
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#0F241D]">
                      {row.waterLevelPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#064E3B]">
                      {row.solarPowerKw.toFixed(1)} kWt
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#0F241D]">
                      {row.heartRateBpm} bpm
                    </td>
                    <td
                      className={[
                        'py-2.5 pl-3 text-right font-sans font-semibold',
                        rowAlert ? 'text-[#EF4444]' : 'text-[#059669]',
                      ].join(' ')}
                    >
                      {rowAlert ? 'Duýduryş' : 'Kadaly'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
