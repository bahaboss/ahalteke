import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Dumbbell,
  Leaf,
  Plus,
  RotateCcw,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type {
  AuthSession,
  Horse,
  HygieneTask,
  TrainingLoadLevel,
  TrainingLog,
  VetScheduleItem,
} from '../../types';
import { Button, Card, Modal } from '../common';

export interface StaffHealthTrainingScreenProps {
  session: AuthSession;
}

type SubTab = 'vet' | 'training' | 'hygiene';
type VetStatusFilter = 'all' | VetScheduleItem['status'];
type ChartMetricMode = 'both' | 'distance' | 'duration';

const VET_STATUS_META: Record<
  VetScheduleItem['status'],
  { label: string; textColor: string }
> = {
  ýakynlaşýar: {
    label: 'Ýakynlaşýar',
    textColor: 'text-[#B45309]',
  },
  meýilleşdirilen: {
    label: 'Meýilleşdirilen',
    textColor: 'text-[#064E3B]',
  },
  tamamlandy: {
    label: 'Tamamlandy',
    textColor: 'text-[#059669]',
  },
};

const VET_CATEGORY_LABELS: Record<VetScheduleItem['category'], string> = {
  waksina: 'Waksina sanjymy',
  barlag: 'Weterinar barlagy',
  diş_idegi: 'Diş idegi',
  toýnak_idegi: 'Toýnak we nal idegi',
};

const SESSION_TYPE_LABELS: Record<TrainingLog['sessionType'], string> = {
  ýöriş: 'Ýöriş',
  çapyşyk: 'Çapyşyk',
  gözellik_türgenleşigi: 'Gözellik türgenleşigi',
  dikeldiliş: 'Dikeldiliş',
};

const LOAD_LABELS: Record<
  TrainingLoadLevel,
  { label: string; color: string; strokeColor: string }
> = {
  ýeňil: { label: 'Ýeňil ýük', color: 'text-[#059669]', strokeColor: '#10B981' },
  orta: { label: 'Orta ýük', color: 'text-[#B45309]', strokeColor: '#D4AF37' },
  ýokary: { label: 'Ýokary ýük', color: 'text-[#DC2626]', strokeColor: '#EF4444' },
};

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}`;
}

export const StaffHealthTrainingScreen: React.FC<StaffHealthTrainingScreenProps> = ({
  session,
}) => {
  const {
    horses,
    vetSchedule,
    trainingLogs,
    hygieneTasks,
    isHydrating,
    addVetScheduleItem,
    updateVetStatus,
    addTrainingLog,
    toggleHygieneComplete,
  } = useAppStore();

  const stableId = session.stableId ?? 'stb-01';

  const [subTab, setSubTab] = useState<SubTab>('vet');
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busyVetId, setBusyVetId] = useState<string | null>(null);

  // Tab 1: Weterinar süzgüçleri
  const [vetStatusFilter, setVetStatusFilter] = useState<VetStatusFilter>('all');
  const [vetHorseFilter, setVetHorseFilter] = useState<string>('all');

  // Tab 2: Sport türgenleşigi süzgüçleri we grafik saýlawy
  const [trainingHorseFilter, setTrainingHorseFilter] = useState<string>('all');
  const [chartMetricMode, setChartMetricMode] = useState<ChartMetricMode>('both');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Täze weterinar belligi modaly
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [vetHorseId, setVetHorseId] = useState('hrs-001');
  const [vetCategory, setVetCategory] = useState<VetScheduleItem['category']>('waksina');
  const [vetTitle, setVetTitle] = useState('');
  const [vetDate, setVetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vetDoctor, setVetDoctor] = useState(
    session.staffPosition === 'Weterinar lukman'
      ? `Weterinar lukman ${session.fullName}`
      : 'Weterinar lukman Aýna Durdyýewa'
  );
  const [vetStatus, setVetStatus] = useState<VetScheduleItem['status']>('meýilleşdirilen');
  const [vetNotes, setVetNotes] = useState('');
  const [vetFormError, setVetFormError] = useState<string | null>(null);
  const [savingVet, setSavingVet] = useState(false);

  // Täze türgenleşik modaly
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [formHorseId, setFormHorseId] = useState('hrs-001');
  const [formSessionType, setFormSessionType] =
    useState<TrainingLog['sessionType']>('ýöriş');
  const [formDuration, setFormDuration] = useState('40');
  const [formDistance, setFormDistance] = useState('7.5');
  const [formLoad, setFormLoad] = useState<TrainingLoadLevel>('orta');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savingLog, setSavingLog] = useState(false);

  // Jogapkär athananyň atlary (eger boş bolsa ähli atlar görkezilýär)
  const scopedHorses = useMemo(() => {
    const byStable = horses.filter((h) => h.stableId === stableId);
    return byStable.length > 0 ? byStable : horses;
  }, [horses, stableId]);

  useEffect(() => {
    if (scopedHorses.length > 0) {
      if (!scopedHorses.some((h) => h.id === formHorseId)) {
        setFormHorseId(scopedHorses[0].id);
      }
      if (!scopedHorses.some((h) => h.id === vetHorseId)) {
        setVetHorseId(scopedHorses[0].id);
      }
    }
  }, [scopedHorses, formHorseId, vetHorseId]);

  const horseMap = useMemo(() => {
    const map = new Map<string, Horse>();
    horses.forEach((h) => map.set(h.id, h));
    return map;
  }, [horses]);

  // --- Tab 1 hasaplamalary ---
  const vetSummary = useMemo(() => {
    let approaching = 0;
    let planned = 0;
    let completed = 0;
    vetSchedule.forEach((item) => {
      if (item.status === 'ýakynlaşýar') approaching += 1;
      else if (item.status === 'meýilleşdirilen') planned += 1;
      else completed += 1;
    });
    return { approaching, planned, completed };
  }, [vetSchedule]);

  const filteredVetSchedule = useMemo(() => {
    return vetSchedule
      .filter((item) => (vetStatusFilter === 'all' ? true : item.status === vetStatusFilter))
      .filter((item) => (vetHorseFilter === 'all' ? true : item.horseId === vetHorseFilter))
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }, [vetSchedule, vetStatusFilter, vetHorseFilter]);

  // --- Tab 2 hasaplamalary ---
  const filteredTrainingLogs = useMemo(() => {
    return trainingLogs
      .filter((log) =>
        trainingHorseFilter === 'all' ? true : log.horseId === trainingHorseFilter
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trainingLogs, trainingHorseFilter]);

  const chronologicalChartLogs = useMemo(() => {
    return [...filteredTrainingLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [filteredTrainingLogs]);

  const activeChartPoint = useMemo(() => {
    if (chronologicalChartLogs.length === 0) return null;
    if (selectedPointId) {
      const found = chronologicalChartLogs.find((item) => item.id === selectedPointId);
      if (found) return found;
    }
    return chronologicalChartLogs[chronologicalChartLogs.length - 1];
  }, [chronologicalChartLogs, selectedPointId]);

  const trainingSummary = useMemo(() => {
    const count = filteredTrainingLogs.length;
    const totalDistanceKm = filteredTrainingLogs.reduce((sum, l) => sum + l.distanceKm, 0);
    const totalDurationMin = filteredTrainingLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const avgSpeed =
      count > 0
        ? filteredTrainingLogs.reduce((sum, l) => sum + l.avgSpeedKmh, 0) / count
        : 0;
    return {
      count,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMin,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
    };
  }, [filteredTrainingLogs]);

  // --- Tab 3 hasaplamalary ---
  const hygieneDoneCount = useMemo(
    () => hygieneTasks.filter((t) => t.completedToday).length,
    [hygieneTasks]
  );

  const hygienePercent =
    hygieneTasks.length > 0 ? Math.round((hygieneDoneCount / hygieneTasks.length) * 100) : 0;

  const latestHygieneConfirmation = useMemo(() => {
    const confirmed = hygieneTasks
      .filter((t) => t.completedToday && t.confirmedAt)
      .sort((a, b) => (b.confirmedAt ?? '').localeCompare(a.confirmedAt ?? ''));
    return confirmed[0] ?? null;
  }, [hygieneTasks]);

  // --- Handlers ---
  const handleToggleHygiene = async (task: HygieneTask) => {
    const next = !task.completedToday;
    setBusyTaskId(task.id);
    try {
      await toggleHygieneComplete(task.id, next, session.fullName, stableId);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleToggleVetStatus = async (item: VetScheduleItem) => {
    const nextStatus: VetScheduleItem['status'] =
      item.status === 'tamamlandy' ? 'meýilleşdirilen' : 'tamamlandy';
    setBusyVetId(item.id);
    try {
      await updateVetStatus(stableId, item.id, nextStatus);
    } finally {
      setBusyVetId(null);
    }
  };

  const handleCreateVetRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setVetFormError(null);
    setSavingVet(true);
    try {
      const targetHorse = horseMap.get(vetHorseId) ?? scopedHorses[0];
      await addVetScheduleItem(stableId, {
        horseId: vetHorseId,
        horseName: targetHorse?.name ?? 'Ahalteke bedewi',
        title: vetTitle,
        category: vetCategory,
        scheduledDate: vetDate,
        veterinarian: vetDoctor,
        status: vetStatus,
        notes: vetNotes,
      });
      setVetTitle('');
      setVetNotes('');
      setIsVetModalOpen(false);
    } catch (err) {
      setVetFormError(
        err instanceof Error ? err.message : 'Weterinar belligini saklamakda säwlik boldy.'
      );
    } finally {
      setSavingVet(false);
    }
  };

  const handleCreateTrainingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavingLog(true);
    try {
      const created = await addTrainingLog(
        {
          horseId: formHorseId,
          date: formDate,
          trainerName: session.fullName,
          sessionType: formSessionType,
          durationMinutes: Number(formDuration),
          distanceKm: Number(formDistance),
          loadLevel: formLoad,
          notes: formNotes,
        },
        stableId
      );
      setSelectedPointId(created.id);
      setFormNotes('');
      setIsTrainingModalOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Türgenleşik ýazgysyny saklamakda säwlik boldy.'
      );
    } finally {
      setSavingLog(false);
    }
  };

  // --- SVG Ösüş Grafiki geometriýasy ---
  const chartGeometry = useMemo(() => {
    const width = 720;
    const height = 220;
    const padLeft = 42;
    const padRight = 24;
    const padTop = 20;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxDist = Math.max(
      12,
      ...chronologicalChartLogs.map((l) => Math.ceil(l.distanceKm + 1))
    );
    const maxDur = Math.max(
      60,
      ...chronologicalChartLogs.map((l) => Math.ceil((l.durationMinutes + 10) / 10) * 10)
    );

    const count = chronologicalChartLogs.length;
    const points = chronologicalChartLogs.map((log, idx) => {
      const x =
        count === 1 ? padLeft + plotW / 2 : padLeft + (idx / (count - 1)) * plotW;
      const yDist = padTop + plotH - (log.distanceKm / maxDist) * plotH;
      const barH = (log.durationMinutes / maxDur) * plotH;
      const yDur = padTop + plotH - barH;
      return {
        log,
        x,
        yDist,
        yDur,
        barH,
      };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yDist.toFixed(1)}`)
      .join(' ');

    const areaPath =
      points.length > 1
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
        : '';

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      y: padTop + plotH - ratio * plotH,
      distLabel: `${(ratio * maxDist).toFixed(0)} km`,
      durLabel: `${Math.round(ratio * maxDur)} m`,
    }));

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      points,
      linePath,
      areaPath,
      yTicks,
    };
  }, [chronologicalChartLogs]);

  return (
    <div className="space-y-6">
      {/* Ekran başlygy */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Weterinariýa · Sport Türgenleşigi · Arassaçylyk
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
            Saglyk, Sport Türgenleşigi we Arassaçylyk
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl leading-relaxed">
            Waksina senenamasy we weterinar barlaglary, her bedewiň türgenleşik ösüş grafiki
            hem-de jogapkär işgäriň tassyklama wagty bilen gündelik arassaçylyk çek-listi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {subTab === 'vet' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setVetFormError(null);
                setIsVetModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
              className="whitespace-nowrap shrink-0"
            >
              Täze weterinar belligi
            </Button>
          )}
          {subTab === 'training' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setFormError(null);
                if (trainingHorseFilter !== 'all') {
                  setFormHorseId(trainingHorseFilter);
                }
                setIsTrainingModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
              className="whitespace-nowrap shrink-0"
            >
              Täze türgenleşik goş
            </Button>
          )}
          {subTab === 'hygiene' && (
            <div className="text-right font-mono tabular-nums">
              <p className="text-xs font-sans text-[#647A72]">Gündelik ýerine ýetiriliş</p>
              <p className="text-lg font-bold text-[#064E3B]">{hygienePercent}%</p>
            </div>
          )}
        </div>
      </div>

      {/* 3 aýratyn içki tab zoly */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white border border-[#DCE6E1]"
        role="tablist"
        aria-label="Saglyk, türgenleşik we arassaçylyk bölümleri"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'vet'}
          onClick={() => setSubTab('vet')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
            subTab === 'vet'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Weterinar we Saglyk</span>
          <span className="font-mono tabular-nums opacity-80">({vetSchedule.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'training'}
          onClick={() => setSubTab('training')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
            subTab === 'training'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Dumbbell className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Sport Türgenleşigi</span>
          <span className="font-mono tabular-nums opacity-80">({trainingLogs.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'hygiene'}
          onClick={() => setSubTab('hygiene')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
            subTab === 'hygiene'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Arassaçylyk we Ideg</span>
          <span className="font-mono tabular-nums opacity-80">
            ({hygieneDoneCount}/{hygieneTasks.length})
          </span>
        </button>
      </div>

      {isHydrating ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* ==============================================================
              TAB 1: WETERINAR WE SAGLYK
             ============================================================== */}
          {subTab === 'vet' && (
            <div className="space-y-5" role="tabpanel" aria-label="Weterinar we Saglyk">
              {/* Jemleýji görkezijiler */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Ýakynlaşýan waksina / barlag</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#B45309]">
                    {vetSummary.approaching}
                  </p>
                  <p className="text-xs text-[#415850]">Ýakyn günlerde üns berilmeli</p>
                </Card>

                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Meýilleşdirilen senenama</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                    {vetSummary.planned}
                  </p>
                  <p className="text-xs text-[#415850]">Tertipnama girizilen idegler</p>
                </Card>

                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Tamamlanan barlag taryhy</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#059669]">
                    {vetSummary.completed}
                  </p>
                  <p className="text-xs text-[#415850]">Lukman tarapyndan tassyklanan</p>
                </Card>
              </div>

              {/* Süzgüç zoly */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white border border-[#DCE6E1]">
                  {(
                    [
                      { key: 'all', label: 'Ählisi' },
                      { key: 'ýakynlaşýar', label: 'Ýakynlaşýar' },
                      { key: 'meýilleşdirilen', label: 'Meýilleşdirilen' },
                      { key: 'tamamlandy', label: 'Tamamlandy' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setVetStatusFilter(opt.key)}
                      className={[
                        'min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        vetStatusFilter === opt.key
                          ? 'bg-[#064E3B] text-white'
                          : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <label htmlFor="vet-horse-filter" className="sr-only">
                    Bedew boýunça süz
                  </label>
                  <select
                    id="vet-horse-filter"
                    value={vetHorseFilter}
                    onChange={(e) => setVetHorseFilter(e.target.value)}
                    className="min-h-[42px] px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="all">Ähli bedewler ({horses.length})</option>
                    {horses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Waksina senenamasy we lukman barlagynyň taryhy */}
              {filteredVetSchedule.length === 0 ? (
                <Card padding="lg" className="bg-white text-center space-y-3">
                  <Stethoscope className="w-8 h-8 text-[#94A3B8] mx-auto" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#0F241D]">
                      Saýlanan süzgüç boýunça weterinar ýazgysy tapylmady
                    </p>
                    <p className="text-xs text-[#647A72]">
                      Täze waksina senesini ýa-da lukman barlagynyň netijesini goşup bilersiňiz.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setVetFormError(null);
                        setIsVetModalOpen(true);
                      }}
                      leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
                    >
                      Täze weterinar belligi
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredVetSchedule.map((item) => {
                    const statusInfo = VET_STATUS_META[item.status];
                    const isDone = item.status === 'tamamlandy';
                    return (
                      <Card
                        key={item.id}
                        padding="md"
                        className={[
                          'flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors',
                          isDone ? 'bg-[#F8FAF9]' : 'bg-white',
                        ].join(' ')}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-semibold text-[#059669]">
                              {VET_CATEGORY_LABELS[item.category]}
                            </span>
                            <span className="text-[#CBD5E1]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono tabular-nums text-[#0F241D] font-semibold">
                              {item.scheduledDate}
                            </span>
                            <span className="text-[#CBD5E1]" aria-hidden="true">
                              ·
                            </span>
                            <Link
                              to={`/staff/horses/${encodeURIComponent(item.horseId)}`}
                              className="font-semibold text-[#064E3B] hover:underline"
                            >
                              {item.horseName}
                            </Link>
                            <span className="text-[#CBD5E1]" aria-hidden="true">
                              ·
                            </span>
                            <span
                              className={[
                                'inline-flex items-center gap-1 font-semibold',
                                statusInfo.textColor,
                              ].join(' ')}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              {statusInfo.label}
                            </span>
                          </div>

                          <h2 className="text-base font-bold text-[#0F241D]">{item.title}</h2>
                          <p className="text-xs sm:text-sm text-[#415850] leading-relaxed">
                            {item.notes}
                          </p>
                          <p className="text-xs text-[#647A72]">{item.veterinarian}</p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#EEF3F1]">
                          <button
                            type="button"
                            disabled={busyVetId === item.id}
                            onClick={() => handleToggleVetStatus(item)}
                            className={[
                              'inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#10B981]',
                              isDone
                                ? 'bg-white border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40 hover:text-[#064E3B]'
                                : 'bg-[#064E3B] text-white hover:bg-[#04392B]',
                            ].join(' ')}
                          >
                            {isDone ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Täzeden aç</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                                <span>Tamamlandy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==============================================================
              TAB 2: SPORT TÜRGENLEŞIGI WE ÖSÜŞ GRAFIKI
             ============================================================== */}
          {subTab === 'training' && (
            <div className="space-y-5" role="tabpanel" aria-label="Sport Türgenleşigi">
              {/* Bedew saýlawy we jemleýji görkezijiler */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="trn-horse-filter" className="text-xs font-semibold text-[#415850]">
                    Bedew saýla:
                  </label>
                  <select
                    id="trn-horse-filter"
                    value={trainingHorseFilter}
                    onChange={(e) => {
                      setTrainingHorseFilter(e.target.value);
                      setSelectedPointId(null);
                    }}
                    className="min-h-[42px] px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B]"
                  >
                    <option value="all">Ähli bedewler ({horses.length})</option>
                    {horses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#DCE6E1] self-start sm:self-auto">
                  {(
                    [
                      { key: 'both', label: 'Aralyk we Wagt' },
                      { key: 'distance', label: 'Aralyk (km)' },
                      { key: 'duration', label: 'Wagt (min)' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setChartMetricMode(mode.key)}
                      className={[
                        'min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        chartMetricMode === mode.key
                          ? 'bg-[#064E3B] text-white'
                          : 'text-[#415850] hover:text-[#064E3B]',
                      ].join(' ')}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Jemleýji Türgenleşik KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Jemi geçilen aralyk</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                    {trainingSummary.totalDistanceKm.toFixed(1)}{' '}
                    <span className="text-xs font-sans font-medium text-[#647A72]">km</span>
                  </p>
                  <p className="text-xs text-[#415850] font-mono tabular-nums">
                    {trainingSummary.count} türgenleşik tapgyry
                  </p>
                </Card>

                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Jemi ylgaw wagty</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
                    {trainingSummary.totalDurationMin}{' '}
                    <span className="text-xs font-sans font-medium text-[#647A72]">min</span>
                  </p>
                  <p className="text-xs text-[#415850]">Gündelik işjeňlik möçberi</p>
                </Card>

                <Card padding="md" className="bg-white space-y-1">
                  <p className="text-xs font-medium text-[#647A72]">Ortaça tizlik</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#0F241D]">
                    {trainingSummary.avgSpeed.toFixed(1)}{' '}
                    <span className="text-xs font-sans font-medium text-[#647A72]">km/s</span>
                  </p>
                  <p className="text-xs text-[#415850]">Saýlanan tapgyrlar boýunça</p>
                </Card>
              </div>

              {/* Sport Türgenleşigi Ösüş Grafiki */}
              <Card padding="lg" className="bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#064E3B] shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0F241D]">
                        Türgenleşik Ösüş Grafiki
                      </h2>
                      <p className="text-xs text-[#647A72]">
                        {trainingHorseFilter === 'all'
                          ? 'Ähli bedewleriň soňky türgenleşik dinamikasy (aralyk we ylgaw wagty)'
                          : `${horseMap.get(trainingHorseFilter)?.name ?? 'Saýlanan bedew'} — ylgaw wagty we aralyk ösüşi`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#415850]">
                    {(chartMetricMode === 'both' || chartMetricMode === 'distance') && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-[#064E3B] inline-block" aria-hidden="true" />
                        Aralyk (km)
                      </span>
                    )}
                    {(chartMetricMode === 'both' || chartMetricMode === 'duration') && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-xs bg-[#D4AF37]/50 border border-[#D4AF37] inline-block"
                          aria-hidden="true"
                        />
                        Ylgaw wagty (min)
                      </span>
                    )}
                  </div>
                </div>

                {chronologicalChartLogs.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <Activity className="w-8 h-8 text-[#94A3B8] mx-auto" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#0F241D]">
                      Bu bedew üçin heniz türgenleşik ýazgysy goşulmadyk
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setFormError(null);
                        if (trainingHorseFilter !== 'all') setFormHorseId(trainingHorseFilter);
                        setIsTrainingModalOpen(true);
                      }}
                      leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
                    >
                      Ilkinji türgenleşigi ýaz
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-full overflow-x-auto">
                      <svg
                        viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                        className="w-full min-w-[520px] h-auto select-none"
                        role="img"
                        aria-label="Sport türgenleşigi aralyk we ylgaw wagty ösüş grafiki"
                      >
                        {/* Horizontal grid lines */}
                        {chartGeometry.yTicks.map((tick, idx) => (
                          <g key={idx}>
                            <line
                              x1={chartGeometry.padLeft}
                              x2={chartGeometry.width - chartGeometry.padRight}
                              y1={tick.y}
                              y2={tick.y}
                              stroke="#EEF3F1"
                              strokeWidth="1"
                            />
                            <text
                              x={chartGeometry.padLeft - 8}
                              y={tick.y + 4}
                              textAnchor="end"
                              fill="#647A72"
                              fontSize="10"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {chartMetricMode === 'duration' ? tick.durLabel : tick.distLabel}
                            </text>
                          </g>
                        ))}

                        {/* Duration bars (min) */}
                        {(chartMetricMode === 'both' || chartMetricMode === 'duration') &&
                          chartGeometry.points.map((pt) => {
                            const isSelected = activeChartPoint?.id === pt.log.id;
                            const barWidth = Math.min(
                              32,
                              Math.max(14, chartGeometry.plotW / (chartGeometry.points.length * 2.4))
                            );
                            return (
                              <rect
                                key={`bar-${pt.log.id}`}
                                x={pt.x - barWidth / 2}
                                y={pt.yDur}
                                width={barWidth}
                                height={Math.max(2, pt.barH)}
                                rx="4"
                                fill={isSelected ? 'rgba(212, 175, 55, 0.55)' : 'rgba(212, 175, 55, 0.28)'}
                                stroke={isSelected ? '#B45309' : 'rgba(212, 175, 55, 0.6)'}
                                strokeWidth="1"
                                className="cursor-pointer transition-opacity"
                                onClick={() => setSelectedPointId(pt.log.id)}
                                onMouseEnter={() => setSelectedPointId(pt.log.id)}
                              />
                            );
                          })}

                        {/* Distance area & line (km) */}
                        {(chartMetricMode === 'both' || chartMetricMode === 'distance') && (
                          <>
                            {chartGeometry.areaPath && (
                              <path
                                d={chartGeometry.areaPath}
                                fill="rgba(16, 185, 129, 0.10)"
                              />
                            )}
                            {chartGeometry.points.length > 1 && (
                              <path
                                d={chartGeometry.linePath}
                                fill="none"
                                stroke="#064E3B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            {chartGeometry.points.map((pt) => {
                              const isSelected = activeChartPoint?.id === pt.log.id;
                              const loadColor =
                                LOAD_LABELS[pt.log.loadLevel ?? 'orta'].strokeColor;
                              return (
                                <g
                                  key={`pt-${pt.log.id}`}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedPointId(pt.log.id)}
                                  onMouseEnter={() => setSelectedPointId(pt.log.id)}
                                >
                                  <circle
                                    cx={pt.x}
                                    cy={pt.yDist}
                                    r={isSelected ? 7 : 5}
                                    fill="#FFFFFF"
                                    stroke={loadColor}
                                    strokeWidth={isSelected ? 3 : 2.2}
                                  />
                                </g>
                              );
                            })}
                          </>
                        )}

                        {/* X-axis date labels */}
                        {chartGeometry.points.map((pt) => {
                          const isSelected = activeChartPoint?.id === pt.log.id;
                          return (
                            <text
                              key={`lbl-${pt.log.id}`}
                              x={pt.x}
                              y={chartGeometry.height - 10}
                              textAnchor="middle"
                              fill={isSelected ? '#064E3B' : '#647A72'}
                              fontWeight={isSelected ? '700' : '500'}
                              fontSize="10"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              {formatShortDate(pt.log.date)}
                            </text>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Saýlanan nokadyň jikme-jik setiri */}
                    {activeChartPoint && (
                      <div className="pt-3 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="font-mono tabular-nums font-bold text-[#064E3B]">
                            {activeChartPoint.date}
                          </span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-bold text-[#0F241D]">
                            {horseMap.get(activeChartPoint.horseId)?.name ??
                              activeChartPoint.horseId}
                          </span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#415850]">
                            {SESSION_TYPE_LABELS[activeChartPoint.sessionType]}
                          </span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={[
                              'font-semibold',
                              LOAD_LABELS[activeChartPoint.loadLevel ?? 'orta'].color,
                            ].join(' ')}
                          >
                            {LOAD_LABELS[activeChartPoint.loadLevel ?? 'orta'].label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums text-[#0F241D]">
                          <span>
                            Aralyk: <strong className="text-[#064E3B]">{activeChartPoint.distanceKm.toFixed(1)} km</strong>
                          </span>
                          <span>
                            Wagt: <strong className="text-[#064E3B]">{activeChartPoint.durationMinutes} min</strong>
                          </span>
                          <span>
                            Tizlik: <strong>{activeChartPoint.avgSpeedKmh} km/s</strong>
                          </span>
                          <span>
                            Puls: <strong>{activeChartPoint.maxHeartRateBpm} bpm</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>

              {/* Türgenleşik žurnalynyň sanawy */}
              <div className="space-y-3">
                {filteredTrainingLogs.map((log) => {
                  const horse = horseMap.get(log.horseId);
                  const loadMeta = LOAD_LABELS[log.loadLevel ?? 'orta'];
                  return (
                    <Card
                      key={log.id}
                      padding="md"
                      className="bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                          <span className="font-mono tabular-nums text-[#647A72]">{log.date}</span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <Link
                            to={`/staff/horses/${encodeURIComponent(log.horseId)}`}
                            className="font-bold text-[#064E3B] hover:underline"
                          >
                            {horse?.name ?? log.horseId}
                          </Link>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-semibold text-[#415850]">
                            {SESSION_TYPE_LABELS[log.sessionType]}
                          </span>
                          <span className="text-[#CBD5E1]" aria-hidden="true">
                            ·
                          </span>
                          <span className={['font-semibold', loadMeta.color].join(' ')}>
                            {loadMeta.label}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-[#0F241D] leading-relaxed">
                          {log.notes}
                        </p>
                        <p className="text-xs text-[#647A72]">Seýis: {log.trainerName}</p>
                      </div>

                      <div className="grid grid-cols-3 sm:flex items-center gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#EEF3F1] shrink-0 font-mono tabular-nums">
                        <div>
                          <span className="block text-[11px] font-sans text-[#647A72]">Wagt</span>
                          <span className="text-sm font-bold text-[#064E3B]">
                            {log.durationMinutes} min
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-sans text-[#647A72]">Aralyk</span>
                          <span className="text-sm font-bold text-[#064E3B]">
                            {log.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-sans text-[#647A72]">
                            Tizlik / Puls
                          </span>
                          <span className="text-sm font-bold text-[#0F241D]">
                            {log.avgSpeedKmh} km/s · {log.maxHeartRateBpm}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 3: ARASSAÇYLYK WE IDEG ÇEK-LISTI
             ============================================================== */}
          {subTab === 'hygiene' && (
            <div className="space-y-4" role="tabpanel" aria-label="Arassaçylyk we Ideg Çek-listi">
              {/* Ýerine ýetiriliş göterimi we soňky tassyklama */}
              <Card padding="md" className="bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <span className="font-bold text-[#064E3B] flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                    <span>Gündelik arassaçylyk we ideg ýerine ýetirilişi</span>
                  </span>
                  <span className="font-mono font-bold text-[#064E3B] tabular-nums">
                    {hygieneDoneCount} / {hygieneTasks.length} ({hygienePercent}%)
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-[#EEF3F1] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                    style={{ width: `${hygienePercent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#647A72]">
                  <span>Athana: {session.stableName ?? 'Athana №1'}</span>
                  {latestHygieneConfirmation ? (
                    <span className="inline-flex items-center gap-1.5 text-[#065F46] font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                      <span>
                        Soňky tassyklama: {latestHygieneConfirmation.confirmedBy} ·{' '}
                        <span className="font-mono tabular-nums">
                          {latestHygieneConfirmation.confirmedAt}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span>Heniz tassyklanan tabşyryk ýok</span>
                  )}
                </div>
              </Card>

              {/* Arassaçylyk çek-listi */}
              <div className="space-y-3">
                {hygieneTasks.map((task) => (
                  <Card
                    key={task.id}
                    padding="md"
                    className={[
                      'flex items-start gap-4 transition-colors',
                      task.completedToday ? 'bg-[#F8FAF9] border-[#10B981]/40' : 'bg-white',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      disabled={busyTaskId === task.id}
                      onClick={() => handleToggleHygiene(task)}
                      aria-pressed={task.completedToday}
                      aria-label={`${task.title} ýerine ýetirildi`}
                      className="min-h-[44px] min-w-[44px] -mt-1 flex items-center justify-center rounded-xl hover:bg-[#EEF3F1] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#10B981]"
                    >
                      {task.completedToday ? (
                        <CheckCircle2 className="w-7 h-7 text-[#059669]" />
                      ) : (
                        <Circle className="w-7 h-7 text-[#94A3B8]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#647A72]">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#064E3B]">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {task.scheduledTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{task.area}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.responsibleRole}</span>
                      </div>

                      <h3
                        className={[
                          'text-base font-bold',
                          task.completedToday ? 'text-[#415850] line-through' : 'text-[#0F241D]',
                        ].join(' ')}
                      >
                        {task.title}
                      </h3>

                      <p className="text-xs text-[#059669] flex items-start gap-1.5">
                        <Leaf className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{task.ecoNote}</span>
                      </p>

                      {/* Jogapkär işgäriň tassyklama wagty */}
                      <div className="pt-1.5 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2 text-xs">
                        {task.completedToday ? (
                          <span className="inline-flex items-center gap-1.5 text-[#065F46] font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" aria-hidden="true" />
                            <span>
                              Tassyklady: <strong>{task.confirmedBy ?? session.fullName}</strong>
                              {task.confirmedAt && (
                                <>
                                  {' '}
                                  ·{' '}
                                  <span className="font-mono tabular-nums">
                                    {task.confirmedAt}
                                  </span>
                                </>
                              )}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#647A72]">
                            Ýagdaý: Garaşylýar — tassyklamak üçin çek-belgini basyň
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==============================================================
          MODAL 1: TÄZE WETERINAR / SAGLYK BELLIGI
         ============================================================== */}
      <Modal
        isOpen={isVetModalOpen}
        onClose={() => setIsVetModalOpen(false)}
        title="Täze weterinar we saglyk belligi"
        subtitle="Waksina senesini ýa-da lukman barlagynyň netijesini athananyň žurnalyna giriziň."
        size="md"
      >
        <form onSubmit={handleCreateVetRecord} className="space-y-4" noValidate>
          {vetFormError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{vetFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="vet-horse"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Bedew
              </label>
              <select
                id="vet-horse"
                value={vetHorseId}
                onChange={(e) => setVetHorseId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vet-category"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Barlag görnüşi
              </label>
              <select
                id="vet-category"
                value={vetCategory}
                onChange={(e) =>
                  setVetCategory(e.target.value as VetScheduleItem['category'])
                }
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                <option value="waksina">Waksina sanjymy</option>
                <option value="barlag">Weterinar barlagy</option>
                <option value="diş_idegi">Diş idegi</option>
                <option value="toýnak_idegi">Toýnak we nal idegi</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="vet-title"
              className="block text-xs font-semibold text-[#0F241D] mb-1.5"
            >
              Barlagyň ýa-da waksinanyň ady
            </label>
            <input
              id="vet-title"
              type="text"
              required
              value={vetTitle}
              onChange={(e) => setVetTitle(e.target.value)}
              placeholder="Meselem: Ýazky waksina sanjymy we gan seljermesi"
              className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="vet-date"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Sene
              </label>
              <input
                id="vet-date"
                type="date"
                required
                value={vetDate}
                onChange={(e) => setVetDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="vet-status"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Ýagdaýy
              </label>
              <select
                id="vet-status"
                value={vetStatus}
                onChange={(e) =>
                  setVetStatus(e.target.value as VetScheduleItem['status'])
                }
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                <option value="ýakynlaşýar">Ýakynlaşýar</option>
                <option value="meýilleşdirilen">Meýilleşdirilen</option>
                <option value="tamamlandy">Tamamlandy</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="vet-doctor"
              className="block text-xs font-semibold text-[#0F241D] mb-1.5"
            >
              Jogapkär weterinar lukman
            </label>
            <input
              id="vet-doctor"
              type="text"
              required
              value={vetDoctor}
              onChange={(e) => setVetDoctor(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="vet-notes"
              className="block text-xs font-semibold text-[#0F241D] mb-1.5"
            >
              Lukman belligi we maslahaty
            </label>
            <textarea
              id="vet-notes"
              rows={3}
              required
              value={vetNotes}
              onChange={(e) => setVetNotes(e.target.value)}
              placeholder="Barlagyň netijesi, sanjym dozasy ýa-da dynç alyş tertibi barada bellik..."
              className="w-full px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsVetModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={savingVet}>
              Ýazgyny sakla
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==============================================================
          MODAL 2: TÄZE SPORT TÜRGENLEŞIK ÝAZGYSY
         ============================================================== */}
      <Modal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        title="Täze sport türgenleşik ýazgysy"
        subtitle="Ylgaw wagtyny, aralygyny we ýük derejesini giriziň — ösüş grafiki derrew täzelener."
        size="md"
      >
        <form onSubmit={handleCreateTrainingLog} className="space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="trn-horse"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Bedew
              </label>
              <select
                id="trn-horse"
                value={formHorseId}
                onChange={(e) => setFormHorseId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="trn-date"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Sene
              </label>
              <input
                id="trn-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="trn-type"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Türgenleşik görnüşi
              </label>
              <select
                id="trn-type"
                value={formSessionType}
                onChange={(e) =>
                  setFormSessionType(e.target.value as TrainingLog['sessionType'])
                }
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                <option value="ýöriş">Ýöriş</option>
                <option value="çapyşyk">Çapyşyk</option>
                <option value="gözellik_türgenleşigi">Gözellik türgenleşigi</option>
                <option value="dikeldiliş">Dikeldiliş</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="trn-load"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Ýük derejesi
              </label>
              <select
                id="trn-load"
                value={formLoad}
                onChange={(e) => setFormLoad(e.target.value as TrainingLoadLevel)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              >
                <option value="ýeňil">Ýeňil ýük</option>
                <option value="orta">Orta ýük</option>
                <option value="ýokary">Ýokary ýük</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="trn-duration"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Ylgaw wagty (minut)
              </label>
              <input
                id="trn-duration"
                type="number"
                min={5}
                max={240}
                required
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="trn-distance"
                className="block text-xs font-semibold text-[#0F241D] mb-1.5"
              >
                Aralyk (km)
              </label>
              <input
                id="trn-distance"
                type="number"
                step="0.5"
                min={0.5}
                max={60}
                required
                value={formDistance}
                onChange={(e) => setFormDistance(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="trn-notes"
              className="block text-xs font-semibold text-[#0F241D] mb-1.5"
            >
              Seýis belligi
            </label>
            <textarea
              id="trn-notes"
              rows={3}
              required
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Bedewiň ädim ritmi, dikeldilişi we indiki meýilnama barada bellik..."
              className="w-full px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsTrainingModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={savingLog}>
              Žurnala ýaz
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
