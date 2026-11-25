import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  Droplets,
  MessageSquareText,
  QrCode,
  Search,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type {
  AuthSession,
  Horse,
  HorseHealthStatus,
  IoTSensorData,
  StaffHorseNoteCategory,
} from '../../types';
import { Button, Card, Modal } from '../common';
import {
  AnimatedHorseAvatar,
  GENDER_LABELS,
  HorsePortrait,
  QrCodeGraphic,
} from '../user';

export interface StaffStableHorsesScreenProps {
  session: AuthSession;
  onJumpToIoT?: (horseId: string) => void;
}

type ScopeMode = 'stable' | 'all';
type HealthFilter = 'all' | HorseHealthStatus;

const STAFF_HEALTH_META: Record<
  HorseHealthStatus,
  { label: string; textColor: string; dotColor: string; badgeBg: string }
> = {
  healthy: {
    label: 'Kadaly',
    textColor: 'text-[#065F46]',
    dotColor: 'bg-[#10B981]',
    badgeBg: 'bg-[#ECFDF5] border-[#10B981]/30',
  },
  monitoring: {
    label: 'Gözegçilikde',
    textColor: 'text-[#92400E]',
    dotColor: 'bg-[#D4AF37]',
    badgeBg: 'bg-[#FFFBEB] border-[#D4AF37]/45',
  },
  attention: {
    label: 'Lukman zerur',
    textColor: 'text-[#991B1B]',
    dotColor: 'bg-[#EF4444]',
    badgeBg: 'bg-[#FEF2F2] border-[#EF4444]/35',
  },
};

const NOTE_CATEGORIES: { id: StaffHorseNoteCategory; label: string }[] = [
  { id: 'ideg', label: 'Ideg' },
  { id: 'saglyk', label: 'Saglyk' },
  { id: 'türgenleşik', label: 'Türgenleşik' },
  { id: 'iýmit', label: 'Iýmit' },
];

export const StaffStableHorsesScreen: React.FC<StaffStableHorsesScreenProps> = ({
  session,
  onJumpToIoT,
}) => {
  const { stables, horses, iotTelemetry, horseNotes, addHorseNote, isHydrating } = useAppStore();

  const stable = useMemo(() => {
    const complexStables = stables.filter((s) => s.complexId === session.complexId);
    return (
      stables.find((s) => s.id === session.stableId) ??
      complexStables[0] ??
      stables[0] ??
      null
    );
  }, [stables, session.complexId, session.stableId]);

  const stableHorsesCount = useMemo(() => {
    if (!stable) return 0;
    return horses.filter((h) => h.stableId === stable.id).length;
  }, [horses, stable]);

  const [scope, setScope] = useState<ScopeMode>('stable');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [passportHorse, setPassportHorse] = useState<Horse | null>(null);

  // Täze at belligi modaly
  const [noteTargetHorse, setNoteTargetHorse] = useState<Horse | null>(null);
  const [noteCategory, setNoteCategory] = useState<StaffHorseNoteCategory>('ideg');
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [recentNoteSavedHorseId, setRecentNoteSavedHorseId] = useState<string | null>(null);

  const effectiveScope: ScopeMode =
    scope === 'stable' && stableHorsesCount === 0 ? 'all' : scope;

  const sensorByHorse = useMemo(() => {
    const map = new Map<string, IoTSensorData>();
    iotTelemetry.forEach((s) => map.set(s.horseId, s));
    return map;
  }, [iotTelemetry]);

  const noteCountByHorse = useMemo(() => {
    const map = new Map<string, number>();
    horseNotes.forEach((n) => {
      map.set(n.horseId, (map.get(n.horseId) ?? 0) + 1);
    });
    return map;
  }, [horseNotes]);

  const visibleHorses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return horses.filter((horse) => {
      if (effectiveScope === 'stable' && stable && horse.stableId !== stable.id) return false;
      if (healthFilter !== 'all' && horse.healthStatus !== healthFilter) return false;
      if (!q) return true;
      return (
        horse.name.toLowerCase().includes(q) ||
        horse.qrCodeId.toLowerCase().includes(q) ||
        horse.breed.toLowerCase().includes(q) ||
        horse.coatLabel.toLowerCase().includes(q)
      );
    });
  }, [horses, effectiveScope, stable, healthFilter, searchQuery]);

  const openNoteModal = (horse: Horse) => {
    setNoteTargetHorse(horse);
    setNoteCategory('ideg');
    setNoteText('');
    setNoteError('');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTargetHorse) return;
    const trimmed = noteText.trim();
    if (trimmed.length < 5) {
      setNoteError('Bellik azyndan 5 harpdan ybarat bolmalydyr.');
      return;
    }
    setIsSavingNote(true);
    try {
      await addHorseNote({
        horseId: noteTargetHorse.id,
        authorName: session.fullName,
        category: noteCategory,
        note: trimmed,
      });
      setRecentNoteSavedHorseId(noteTargetHorse.id);
      setNoteTargetHorse(null);
      setNoteText('');
      setNoteError('');
      window.setTimeout(() => setRecentNoteSavedHorseId(null), 4000);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ekran başlygy */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#059669]">
            Jogapkär Athana we Bedewler Hasaby
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0F241D]">
            Athanadaky Atlar
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            {session.stableName ?? stable?.name ?? 'Athana №1'} bedewleriniň animasiýaly
            awatarlary, saglyk ýagdaýy, gözegçilik bellikleri we doly QR-Pasport sahypalary.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-white border border-[#DCE6E1] self-start shrink-0">
          <button
            type="button"
            onClick={() => setScope('stable')}
            disabled={stableHorsesCount === 0}
            className={[
              'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed',
              effectiveScope === 'stable'
                ? 'bg-[#064E3B] text-white'
                : 'text-[#415850] hover:text-[#064E3B]',
            ].join(' ')}
          >
            Meniň athanam ({stableHorsesCount})
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={[
              'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer',
              effectiveScope === 'all'
                ? 'bg-[#064E3B] text-white'
                : 'text-[#415850] hover:text-[#064E3B]',
            ].join(' ')}
          >
            Ähli bedewler ({horses.length})
          </button>
        </div>
      </div>

      {/* Athana KPI görkezijileri */}
      {stable && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="space-y-1 bg-white">
            <p className="text-xs font-medium text-[#6B8078]">Boks dolulygy</p>
            <p className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {stable.occupiedBoxes} / {stable.boxCount}
            </p>
            <p className="text-xs text-[#415850] tabular-nums">
              Kod: <span className="font-mono">{stable.code}</span>
            </p>
          </Card>

          <Card padding="sm" className="space-y-1 bg-white">
            <p className="text-xs font-medium text-[#6B8078] flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
              Gün energiýaly üçek
            </p>
            <p className="text-xl font-bold text-[#064E3B]">
              {stable.solarRoofEnabled ? 'Işjeň' : 'Meýilleşdirilen'}
            </p>
            <p className="text-xs text-[#059669]">«Ýaşyl Athana» standarty</p>
          </Card>

          <Card padding="sm" className="space-y-1 bg-white">
            <p className="text-xs font-medium text-[#6B8078] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
              Ýagyş suwy gory
            </p>
            <p className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {stable.rainwaterHarvestingLiters.toLocaleString('en-US').replace(/,/g, ' ')} L
            </p>
            <p className="text-xs text-[#415850]">Süzülen gaýtadan ulanyş</p>
          </Card>

          <Card padding="sm" className="space-y-1 bg-white">
            <p className="text-xs font-medium text-[#6B8078] flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              Howa arassalygy (AQI)
            </p>
            <p className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {stable.airQualityIndex}{' '}
              <span className="text-xs font-normal text-[#059669]">(Arassa)</span>
            </p>
            <p className="text-xs text-[#415850] font-mono tabular-nums">
              {stable.temperatureC}°C · {stable.humidityPercent}% çyglylyk
            </p>
          </Card>
        </div>
      )}

      {/* Gözleg we saglyk süzgüji */}
      <div className="bg-white border border-[#DCE6E1] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-[#6B8078] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bedewiň ady, QR kody ýa-da tohumy boýunça gözle..."
            aria-label="Athanadaky bedewleri gözle"
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F241D] placeholder:text-[#6B8078] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Gözlegi arassala"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#6B8078] hover:bg-[#EEF3F1] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ýagdaý süzgüji">
          {(
            [
              { id: 'all', label: 'Ählisi' },
              { id: 'healthy', label: 'Kadaly' },
              { id: 'monitoring', label: 'Gözegçilikde' },
            ] as { id: HealthFilter; label: string }[]
          ).map((item) => {
            const active = healthFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setHealthFilter(item.id)}
                className={[
                  'min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-[#064E3B] text-white'
                    : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40',
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bellik ýatda saklandy habarnamasy */}
      {recentNoteSavedHorseId && (
        <div
          role="status"
          className="rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#065F46]"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
            Täze gözegçilik belligi ýatda saklandy.
          </span>
          <Link
            to={`/staff/horses/${encodeURIComponent(recentNoteSavedHorseId)}`}
            className="font-bold text-[#064E3B] hover:underline"
          >
            Atyň doly sahypasynda gör →
          </Link>
        </div>
      )}

      {/* Bedewleriň sanawy */}
      {isHydrating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
      ) : visibleHorses.length === 0 ? (
        <Card padding="lg" className="text-center bg-white">
          <h2 className="text-lg font-bold text-[#0F241D]">Süzgüje laýyk bedew tapylmady</h2>
          <p className="mt-1 text-sm text-[#415850]">
            Gözlegi arassalap ýa-da «Ähli bedewler» görnüşine geçip bilersiňiz.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setHealthFilter('all');
                setScope('all');
              }}
            >
              Ähli bedewleri görkez
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleHorses.map((horse) => {
            const health = STAFF_HEALTH_META[horse.healthStatus];
            const sensor = sensorByHorse.get(horse.id);
            const notesCount = noteCountByHorse.get(horse.id) ?? 0;

            return (
              <Card
                key={horse.id}
                padding="md"
                className="bg-white flex flex-col justify-between gap-4 hover:border-[#064E3B]/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Link
                    to={`/staff/horses/${encodeURIComponent(horse.id)}`}
                    className="shrink-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
                    aria-label={`${horse.name} doly sahypasyna geç`}
                  >
                    <AnimatedHorseAvatar
                      src={horse.animatedAvatarUrl}
                      alt={`${horse.name} animasiýaly awatary`}
                      size="lg"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/staff/horses/${encodeURIComponent(horse.id)}`}
                        className="font-display text-lg font-bold text-[#0F241D] hover:text-[#064E3B] truncate"
                      >
                        {horse.name}
                      </Link>
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold shrink-0',
                          health.badgeBg,
                          health.textColor,
                        ].join(' ')}
                      >
                        <span
                          className={['w-1.5 h-1.5 rounded-full', health.dotColor].join(' ')}
                          aria-hidden="true"
                        />
                        {health.label}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs font-mono text-[#6B8078] tabular-nums">
                      {horse.qrCodeId} · {horse.coatLabel}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B8078]">
                      <span className="tabular-nums">{horse.ageYears} ýaş</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{horse.heightCm} sm</span>
                      <span aria-hidden="true">·</span>
                      <span>{GENDER_LABELS[horse.gender]}</span>
                      {sensor && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[#064E3B] font-semibold tabular-nums">
                            {sensor.heartRateBpm} bpm · {sensor.bodyTemperatureC.toFixed(1)}°C
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-[#415850] leading-relaxed line-clamp-2">
                      {horse.healthSummary}
                    </p>
                  </div>
                </div>

                {/* Amallar zolagy */}
                <div className="pt-3.5 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openNoteModal(horse)}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#0F241D] hover:border-[#064E3B]/40 hover:bg-[#ECFDF5] hover:text-[#064E3B] transition-colors cursor-pointer"
                    >
                      <ClipboardPlus className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                      <span>Täze bellik goş</span>
                      {notesCount > 0 && (
                        <span className="font-mono text-[11px] text-[#059669] tabular-nums">
                          ({notesCount})
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPassportHorse(horse)}
                      aria-label={`${horse.name} QR-pasporty`}
                      className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#415850] hover:border-[#064E3B]/40 hover:text-[#064E3B] transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>QR</span>
                    </button>

                    {onJumpToIoT && (
                      <button
                        type="button"
                        onClick={() => onJumpToIoT(horse.id)}
                        className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#415850] hover:border-[#064E3B]/40 hover:text-[#059669] transition-colors cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                        <span>IoT</span>
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/staff/horses/${encodeURIComponent(horse.id)}`}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B] transition-colors whitespace-nowrap"
                  >
                    <span>Doly sahypa</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Täze At Belligi Goşmak Modaly */}
      <Modal
        isOpen={Boolean(noteTargetHorse)}
        onClose={() => setNoteTargetHorse(null)}
        title={noteTargetHorse ? `${noteTargetHorse.name} — Täze bellik goş` : ''}
        subtitle="Gözegçilik ýazgysy localStorage-da saklanyp, bedewiň doly sahypasynda görkeziler."
        size="md"
      >
        {noteTargetHorse && (
          <form onSubmit={handleSaveNote} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#415850]">Bellik ugry</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NOTE_CATEGORIES.map((cat) => {
                  const active = noteCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNoteCategory(cat.id)}
                      className={[
                        'min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                        active
                          ? 'bg-[#064E3B] text-white'
                          : 'bg-[#F8FAF9] border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
                      ].join(' ')}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-horse-note" className="text-xs font-semibold text-[#415850] flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Gözegçilik / ideg belligi
              </label>
              <textarea
                id="modal-horse-note"
                rows={4}
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  if (noteError) setNoteError('');
                }}
                placeholder="Meselem: Irki türgenleşikden soň toýnaklary barlandy, suw içişi we işdäsi örän gowy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors"
              />
              {noteError && <p className="text-xs font-medium text-[#DC2626]">{noteError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEF3F1]">
              <Button variant="ghost" size="sm" type="button" onClick={() => setNoteTargetHorse(null)}>
                Ýatyr
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSavingNote}
                leftIcon={<ClipboardPlus className="w-4 h-4" />}
              >
                {isSavingNote ? 'Saklanýar...' : 'Belligi ýatda sakla'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Çalt QR-Pasport Modaly */}
      <Modal
        isOpen={Boolean(passportHorse)}
        onClose={() => setPassportHorse(null)}
        title={passportHorse ? `${passportHorse.name} — Sanly QR-Pasport` : ''}
        subtitle={
          passportHorse
            ? `${passportHorse.breed} · ${passportHorse.coatLabel} · Doglan ýyly: ${passportHorse.birthYear}`
            : undefined
        }
        size="md"
        footer={
          passportHorse ? (
            <div className="w-full flex items-center justify-between gap-3">
              <Link
                to={`/staff/horses/${encodeURIComponent(passportHorse.id)}`}
                onClick={() => setPassportHorse(null)}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B]"
              >
                <span>Doly sahypany aç</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              <Button variant="outline" size="sm" onClick={() => setPassportHorse(null)}>
                Ýapmak
              </Button>
            </div>
          ) : undefined
        }
      >
        {passportHorse && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <div className="w-28 h-28 rounded-xl overflow-hidden bg-[#064E3B] shrink-0">
                <HorsePortrait src={passportHorse.portraitUrl} alt={passportHorse.name} />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                <p className="text-xs font-semibold text-[#059669]">Resmi QR-Pasport Belgisi</p>
                <p className="text-lg font-bold font-mono text-[#064E3B] tabular-nums">
                  {passportHorse.qrCodeId}
                </p>
                <p className="text-xs text-[#415850]">
                  Şejere: <strong className="text-[#0F241D]">{passportHorse.lineage}</strong>
                </p>
                <p className="text-xs text-[#647A72]">Seýis: {passportHorse.seisName}</p>
              </div>
              <QrCodeGraphic code={passportHorse.qrCodeId} size="md" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
