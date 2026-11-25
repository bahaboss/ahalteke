import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Clock,
  Dumbbell,
  Leaf,
  Plus,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  createTrainingLog,
  fetchHorses,
  fetchHygieneTasks,
  fetchTrainingLogs,
  fetchVetSchedule,
  toggleHygieneTaskCompletion,
} from '../../services';
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

const VET_STATUS_META: Record<
  VetScheduleItem['status'],
  { label: string; textColor: string; dotColor: string }
> = {
  ýakynlaşýar: {
    label: 'Ýakynlaşýar',
    textColor: 'text-[#92400E]',
    dotColor: 'bg-[#D97706]',
  },
  meýilleşdirilen: {
    label: 'Meýilleşdirilen',
    textColor: 'text-[#064E3B]',
    dotColor: 'bg-[#064E3B]',
  },
  tamamlandy: {
    label: 'Tamamlandy',
    textColor: 'text-[#065F46]',
    dotColor: 'bg-[#10B981]',
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

const LOAD_LABELS: Record<TrainingLoadLevel, { label: string; color: string }> = {
  ýeňil: { label: 'Ýeňil ýük', color: 'text-[#059669]' },
  orta: { label: 'Orta ýük', color: 'text-[#92400E]' },
  ýokary: { label: 'Ýokary ýük', color: 'text-[#DC2626]' },
};

export const StaffHealthTrainingScreen: React.FC<StaffHealthTrainingScreenProps> = ({
  session,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('vet');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [vetSchedule, setVetSchedule] = useState<VetScheduleItem[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [hygieneTasks, setHygieneTasks] = useState<HygieneTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // Täze türgenleşik modaly
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [horsesRes, vetRes, trainRes, hygRes] = await Promise.all([
          fetchHorses(),
          fetchVetSchedule(),
          fetchTrainingLogs(),
          fetchHygieneTasks(),
        ]);
        if (!active) return;
        setHorses(horsesRes.data);
        setVetSchedule(vetRes.data);
        setTrainingLogs(trainRes.data);
        setHygieneTasks(hygRes.data);
        if (horsesRes.data.length > 0) {
          setFormHorseId(horsesRes.data[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAll();
    return () => {
      active = false;
    };
  }, []);

  const horseMap = useMemo(() => {
    const map = new Map<string, Horse>();
    horses.forEach((h) => map.set(h.id, h));
    return map;
  }, [horses]);

  const hygieneDoneCount = useMemo(
    () => hygieneTasks.filter((t) => t.completedToday).length,
    [hygieneTasks]
  );

  const handleToggleHygiene = async (task: HygieneTask) => {
    const next = !task.completedToday;
    setBusyTaskId(task.id);
    setHygieneTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, completedToday: next } : item))
    );
    try {
      await toggleHygieneTaskCompletion(task.id, next);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleCreateTrainingLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavingLog(true);
    try {
      const res = await createTrainingLog({
        horseId: formHorseId,
        date: formDate,
        trainerName: session.fullName,
        sessionType: formSessionType,
        durationMinutes: Number(formDuration),
        distanceKm: Number(formDistance),
        loadLevel: formLoad,
        notes: formNotes,
      });
      setTrainingLogs((prev) => [res.data, ...prev]);
      setFormNotes('');
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Türgenleşik ýazgysyny saklamakda säwlik boldy.'
      );
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ekran başlygy */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#059669]">
            Weterinariýa · Sport Žurnaly · Eko-Arassaçylyk
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#0F241D]">
            Saglyk, Sport Türgenleşigi we Arassaçylyk
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            Weterinar we waksina senenamasy, türgenleşik ýükleriniň žurnaly hem-de athananyň
            gündelik arassaçylyk çek-listi.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSubTab('training');
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          className="self-start md:self-auto"
        >
          Täze türgenleşik goş
        </Button>
      </div>

      {/* 3 bölekli saýlaw zoly */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white border border-[#DCE6E1]"
        role="tablist"
        aria-label="Saglyk we türgenleşik bölümleri"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'vet'}
          onClick={() => setSubTab('vet')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer',
            subTab === 'vet'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Weterinar / Waksina ({vetSchedule.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'training'}
          onClick={() => setSubTab('training')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer',
            subTab === 'training'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Dumbbell className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Sport Türgenleşigi ({trainingLogs.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'hygiene'}
          onClick={() => setSubTab('hygiene')}
          className={[
            'min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer',
            subTab === 'hygiene'
              ? 'bg-[#064E3B] text-white'
              : 'text-[#415850] hover:bg-[#F8FAF9] hover:text-[#064E3B]',
          ].join(' ')}
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            Arassaçylyk ({hygieneDoneCount}/{hygieneTasks.length})
          </span>
        </button>
      </div>

      {loading ? (
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
          {/* 1. Weterinar we Waksina Senenamasy */}
          {subTab === 'vet' && (
            <div className="space-y-3.5">
              {vetSchedule.map((item) => {
                const statusInfo = VET_STATUS_META[item.status];
                return (
                  <Card
                    key={item.id}
                    padding="md"
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="font-semibold text-[#059669]">
                          {VET_CATEGORY_LABELS[item.category]}
                        </span>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono tabular-nums text-[#0F241D] font-semibold">
                          {item.scheduledDate}
                        </span>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-[#064E3B]">{item.horseName}</span>
                      </div>

                      <h2 className="text-base font-bold text-[#0F241D]">{item.title}</h2>
                      <p className="text-xs text-[#415850] leading-relaxed">{item.notes}</p>
                      <p className="text-xs text-[#6B8078]">{item.veterinarian}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#EEF3F1]">
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 text-xs font-semibold',
                          statusInfo.textColor,
                        ].join(' ')}
                      >
                        <span
                          className={['w-2 h-2 rounded-full', statusInfo.dotColor].join(' ')}
                          aria-hidden="true"
                        />
                        {statusInfo.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 2. Sport Türgenleşik Žurnaly */}
          {subTab === 'training' && (
            <div className="space-y-3.5">
              {trainingLogs.map((log) => {
                const horse = horseMap.get(log.horseId);
                const loadMeta = LOAD_LABELS[log.loadLevel ?? 'orta'];
                return (
                  <Card
                    key={log.id}
                    padding="md"
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="font-mono tabular-nums text-[#6B8078]">{log.date}</span>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-bold text-[#064E3B]">
                          {horse?.name ?? log.horseId}
                        </span>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-[#415850]">
                          {SESSION_TYPE_LABELS[log.sessionType]}
                        </span>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className={['font-semibold', loadMeta.color].join(' ')}>
                          {loadMeta.label}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-[#0F241D] leading-relaxed">
                        {log.notes}
                      </p>
                      <p className="text-xs text-[#6B8078]">Seýis: {log.trainerName}</p>
                    </div>

                    <div className="grid grid-cols-3 sm:flex items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#EEF3F1] shrink-0 font-mono tabular-nums">
                      <div>
                        <span className="block text-[11px] font-sans text-[#6B8078]">Wagt</span>
                        <span className="text-sm font-bold text-[#064E3B]">
                          {log.durationMinutes} min
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-sans text-[#6B8078]">Aralyk</span>
                        <span className="text-sm font-bold text-[#064E3B]">
                          {log.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-sans text-[#6B8078]">
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
          )}

          {/* 3. Athananyň Gündelik Arassaçylyk Çek-listi */}
          {subTab === 'hygiene' && (
            <div className="space-y-4">
              <Card padding="md" className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-bold text-[#064E3B] flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    Gündelik arassaçylyk ýerine ýetirilişi
                  </span>
                  <span className="font-mono font-bold text-[#064E3B] tabular-nums">
                    {hygieneDoneCount} / {hygieneTasks.length} (
                    {hygieneTasks.length > 0
                      ? Math.round((hygieneDoneCount / hygieneTasks.length) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#EEF3F1] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                    style={{
                      width: `${
                        hygieneTasks.length > 0
                          ? Math.round((hygieneDoneCount / hygieneTasks.length) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </Card>

              <div className="space-y-3">
                {hygieneTasks.map((task) => (
                  <Card
                    key={task.id}
                    padding="md"
                    className={[
                      'flex items-start gap-4 transition-colors',
                      task.completedToday ? 'bg-[#F8FAF9] border-[#10B981]/35' : 'bg-white',
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

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B8078]">
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
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Täze sport türgenleşik ýazgysy modaly */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Täze sport türgenleşik ýazgysy"
        subtitle="Wagt, aralyk we ýük derejesini giriziň — žurnal enjamyňyzda saklanar."
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
                Wagt (minut)
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
              className="w-full px-3 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#6B8078] focus:outline-none focus:border-[#064E3B] focus:bg-white resize-y"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
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
