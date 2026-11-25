import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Award,
  BatteryCharging,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Copy,
  Droplets,
  HeartPulse,
  Leaf,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  UserCheck,
  Utensils,
  Wind,
} from 'lucide-react';
import { fetchHorseById } from '../../services';
import { useAppStore } from '../../store';
import type { Horse, StaffHorseNoteCategory, TrainingLog, VetScheduleItem } from '../../types';
import { Button, Card, SkeletonLoader } from '../common';
import {
  ACTIVITY_LABELS,
  AnimatedHorseAvatar,
  GENDER_LABELS,
  HEALTH_STATUS_META,
  HorsePortrait,
  QrCodeGraphic,
} from '../user';

const NOTE_CATEGORY_META: Record<
  StaffHorseNoteCategory,
  { label: string; className: string }
> = {
  saglyk: {
    label: 'Saglyk',
    className: 'bg-[#ECFDF5] text-[#065F46] border-[#10B981]/30',
  },
  ideg: {
    label: 'Ideg we arassaçylyk',
    className: 'bg-[#FFFBEB] text-[#92400E] border-[#D4AF37]/40',
  },
  türgenleşik: {
    label: 'Türgenleşik',
    className: 'bg-[#F0F9FF] text-[#075985] border-[#38BDF8]/35',
  },
  iýmit: {
    label: 'Iýmitlendiriş',
    className: 'bg-[#F5F3FF] text-[#5B21B6] border-[#A78BFA]/35',
  },
};

const VET_CATEGORY_LABELS: Record<VetScheduleItem['category'], string> = {
  waksina: 'Waksina',
  barlag: 'Umumy barlag',
  diş_idegi: 'Diş idegi',
  toýnak_idegi: 'Toýnak idegi',
};

const VET_STATUS_META: Record<
  VetScheduleItem['status'],
  { label: string; className: string }
> = {
  tamamlandy: {
    label: 'Tamamlandy',
    className: 'text-[#065F46] bg-[#ECFDF5] border-[#10B981]/30',
  },
  ýakynlaşýar: {
    label: 'Ýakynlaşýar',
    className: 'text-[#92400E] bg-[#FFFBEB] border-[#D4AF37]/45',
  },
  meýilleşdirilen: {
    label: 'Meýilleşdirilen',
    className: 'text-[#415850] bg-[#F8FAF9] border-[#DCE6E1]',
  },
};

const SESSION_TYPE_LABELS: Record<TrainingLog['sessionType'], string> = {
  ýöriş: 'Ýöriş',
  çapyşyk: 'Çapyşyk türgenleşigi',
  gözellik_türgenleşigi: 'Gözellik türgenleşigi',
  dikeldiliş: 'Dikeldiliş gezelenji',
};

const MEAL_PERIOD_LABELS = {
  irden: 'Irden',
  günortan: 'Günortan',
  agşam: 'Agşam',
};

function formatDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const StaffHorseDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    session,
    horses,
    complexes,
    stables,
    iotTelemetry,
    feedingPlans,
    vetSchedule,
    trainingLogs,
    horseNotes,
    addHorseNote,
  } = useAppStore();

  const [horse, setHorse] = useState<Horse | null>(
    () => horses.find((item) => item.id === id) ?? null
  );
  const [loading, setLoading] = useState(!horse);
  const [copiedCode, setCopiedCode] = useState(false);

  // Täze işgär belligi formasy
  const [noteCategory, setNoteCategory] = useState<StaffHorseNoteCategory>('ideg');
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    const cached = horses.find((item) => item.id === id);
    if (cached) {
      setHorse(cached);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchHorseById(id)
      .then((res) => {
        if (active) setHorse(res.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, horses]);

  const horseFeedings = useMemo(
    () => (horse ? feedingPlans.filter((item) => item.horseId === horse.id) : []),
    [feedingPlans, horse]
  );

  const horseVetItems = useMemo(
    () => (horse ? vetSchedule.filter((item) => item.horseId === horse.id) : []),
    [vetSchedule, horse]
  );

  const horseTrainings = useMemo(
    () => (horse ? trainingLogs.filter((item) => item.horseId === horse.id) : []),
    [trainingLogs, horse]
  );

  const currentHorseNotes = useMemo(
    () => (horse ? horseNotes.filter((item) => item.horseId === horse.id) : []),
    [horseNotes, horse]
  );

  const handleCopyCode = async () => {
    if (!horse) return;
    try {
      await navigator.clipboard.writeText(horse.qrCodeId);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horse) return;
    const trimmed = noteText.trim();
    if (trimmed.length < 5) {
      setNoteError('Bellik azyndan 5 harpdan ybarat bolmalydyr.');
      return;
    }
    setNoteError('');
    setIsSavingNote(true);
    try {
      await addHorseNote({
        horseId: horse.id,
        authorName: session?.fullName ?? 'Baş Seýis',
        category: noteCategory,
        note: trimmed,
      });
      setNoteText('');
      setNoteSavedFeedback(true);
      window.setTimeout(() => setNoteSavedFeedback(false), 3000);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return <SkeletonLoader variant="profile" />;
  }

  if (!horse) {
    return (
      <Card padding="lg" className="bg-white text-center space-y-4">
        <p className="font-display text-xl font-bold text-[#0F241D]">Bedew tapylmady</p>
        <p className="text-sm text-[#415850]">
          Saýlanan bedew hasapda tapylmady ýa-da başga athana geçirilen bolup biler.
        </p>
        <div>
          <Link
            to="/staff/horses"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#04392B]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Athanadaky atlara dolan
          </Link>
        </div>
      </Card>
    );
  }

  const telemetry = iotTelemetry.find((t) => t.horseId === horse.id);
  const stable = stables.find((s) => s.id === horse.stableId);
  const complex = complexes.find((c) => c.id === horse.complexId);
  const health = HEALTH_STATUS_META[horse.healthStatus];

  const totalDailyKg = horseFeedings.reduce((acc, item) => acc + item.quantityKg, 0);
  const totalSavedKg = horseFeedings.reduce((acc, item) => acc + item.savedForageKg, 0);
  const completedMeals = horseFeedings.filter((item) => item.completedToday).length;

  return (
    <div className="space-y-6">
      {/* Ýokarky gaýdyş we çalt geçiş zolagy */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/staff/horses"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#064E3B] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Athanadaky atlara dolan
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/staff/iot?horseId=${encodeURIComponent(horse.id)}`}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#04392B] transition-colors"
          >
            <Activity className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            Janly IoT gözegçiligi
          </Link>
          <Link
            to="/staff/feeding"
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE6E1] text-xs sm:text-sm font-semibold text-[#0F241D] inline-flex items-center gap-2 hover:border-[#064E3B]/40 transition-colors"
          >
            <Utensils className="w-4 h-4 text-[#059669]" aria-hidden="true" />
            Rasion dolandyryşy
          </Link>
        </div>
      </div>

      {/* Profil we Resmi Sanly QR-Pasport */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5">
        <Card padding="lg" className="bg-white space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full sm:w-48 h-52 rounded-2xl overflow-hidden bg-[#064E3B] border border-[#DCE6E1] shrink-0">
              <HorsePortrait src={horse.portraitUrl} alt={horse.name} />
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-[#064E3B]/90 px-2.5 py-1.5 rounded-xl border border-[#D4AF37]/40">
                <AnimatedHorseAvatar
                  src={horse.animatedAvatarUrl}
                  alt={horse.name}
                  size="sm"
                />
                <span className="text-[11px] font-semibold text-[#FDE68A]">GIF Nyşan</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#059669]">{horse.breed}</span>
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold',
                    health.surfaceBg,
                    health.textColor,
                  ].join(' ')}
                >
                  <span className={['w-1.5 h-1.5 rounded-full', health.dotColor].join(' ')} />
                  {horse.healthStatus === 'healthy' ? 'Kadaly' : health.label}
                </span>
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight">
                  {horse.name}
                </h1>
                <p className="mt-1 text-xs text-[#415850]">
                  Şejere: <strong className="text-[#0F241D]">{horse.lineage}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#EEF3F1] text-xs">
                <div>
                  <span className="text-[#647A72] block">Reňki</span>
                  <span className="font-semibold text-[#064E3B]">{horse.coatLabel}</span>
                </div>
                <div>
                  <span className="text-[#647A72] block">Ýaşy / Ýyly</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                    {horse.ageYears} ýaş ({horse.birthYear})
                  </span>
                </div>
                <div>
                  <span className="text-[#647A72] block">Boýy</span>
                  <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                    {horse.heightCm} sm
                  </span>
                </div>
                <div>
                  <span className="text-[#647A72] block">Jynsy</span>
                  <span className="font-semibold text-[#0F241D]">
                    {GENDER_LABELS[horse.gender]}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#415850] leading-relaxed">{horse.healthSummary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#EEF3F1] text-xs">
                <div className="flex items-center gap-2 text-[#415850]">
                  <UserCheck className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                  <span>
                    Jogapkär seýis: <strong className="text-[#0F241D]">{horse.seisName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#415850]">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    Athana:{' '}
                    <strong className="text-[#0F241D]">
                      {stable?.name ?? session?.stableName ?? 'Athana №1'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {horse.achievements.length > 0 && (
            <div className="pt-4 border-t border-[#EEF3F1] space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#064E3B] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                Sport we gözellik üstünlikleri
              </h2>
              <div className="flex flex-wrap gap-2">
                {horse.achievements.map((ach) => (
                  <span
                    key={ach}
                    className="text-xs px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-[#0F241D]"
                  >
                    {ach}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Resmi Sanly QR-Pasport Kartoçkasy */}
        <Card
          padding="lg"
          className="bg-[#064E3B] text-white border-[#D4AF37]/45 flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                Sanly QR-Pasport
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-white">{horse.name}</h2>
              <p className="text-xs text-white/75 mt-0.5 truncate">
                {complex?.name ?? session?.complexName ?? 'Ahalteke Atçylyk Toplumy'}
              </p>
            </div>
            <QrCodeGraphic code={horse.qrCodeId} size="md" />
          </div>

          <div className="rounded-xl bg-white/8 border border-white/12 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/70">Pasport ID</span>
              <span className="font-mono font-bold text-[#FDE68A] tabular-nums">
                {horse.qrCodeId}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/70">Eýeçiligi</span>
              <span className="font-medium text-white text-right truncate max-w-[65%]">
                {horse.ownerName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/70">Boks / Athana kody</span>
              <span className="font-mono text-white tabular-nums">{stable?.code ?? 'AT-01'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0F241D] text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-[#E2C25B] transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>QR-Pasport kody göçürildi</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>QR-Pasport koduny göçür</span>
              </>
            )}
          </button>
        </Card>
      </div>

      {/* Bedewiň soňky IoT telemetriýa görkezijileri */}
      {telemetry && (
        <Card padding="md" className="bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#EEF3F1]">
            <h2 className="text-sm font-bold text-[#0F241D] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#059669]" aria-hidden="true" />
              IoT Boýun Halkasy we Boks Telemetriýasy
            </h2>
            <Link
              to={`/staff/iot?horseId=${encodeURIComponent(horse.id)}`}
              className="text-xs font-semibold text-[#064E3B] hover:underline"
            >
              Real-wagt grafiklere geç →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Ýürek urşy
              </span>
              <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {telemetry.heartRateBpm} bpm
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                Beden gyzgyny
              </span>
              <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {telemetry.bodyTemperatureC.toFixed(1)} °C
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Işjeňlik
              </span>
              <p className="mt-1 text-sm font-bold text-[#0F241D]">
                {ACTIVITY_LABELS[telemetry.activityLevel]}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Ammiak (NH₃)
              </span>
              <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {telemetry.ammoniaPpm.toFixed(1)} ppm
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                Suw derejesi
              </span>
              <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {telemetry.waterLevelPercent}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]">
              <span className="text-[#647A72] flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                Batareýa
              </span>
              <p className="mt-1 text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {telemetry.batteryPercent}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Işgär Gözegçilik Bellikleri (localStorage + AppStoreContext) */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F241D] flex items-center gap-2">
              <ClipboardPlus className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
              Işgär Gözegçilik we Ideg Bellikleri
            </h2>
            <p className="text-xs text-[#647A72] mt-0.5">
              Seýis we weterinar tarapyndan goşulýan ähli bellikler awtomatiki ýatda saklanýar.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#064E3B] tabular-nums">
            Jemi: {currentHorseNotes.length} bellik
          </span>
        </div>

        <form onSubmit={handleSaveNote} className="rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0F241D]">Täze bellik goş</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bellik görnüşi">
              {(Object.keys(NOTE_CATEGORY_META) as StaffHorseNoteCategory[]).map((cat) => {
                const active = noteCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNoteCategory(cat)}
                    className={[
                      'min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                      active
                        ? 'bg-[#064E3B] text-white'
                        : 'bg-white border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
                    ].join(' ')}
                  >
                    {NOTE_CATEGORY_META[cat].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="staff-horse-note-input" className="sr-only">
              Bedew barada gözegçilik belligi
            </label>
            <textarea
              id="staff-horse-note-input"
              rows={2}
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                if (noteError) setNoteError('');
              }}
              placeholder={`${horse.name} üçin ideg, saglyk ýa-da türgenleşik belligini ýazyň...`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] transition-colors resize-none"
            />
            {noteError && <p className="mt-1 text-xs font-medium text-[#DC2626]">{noteError}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {noteSavedFeedback ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                Bellik üstünlikli ýatda saklandy.
              </span>
            ) : (
              <span className="text-xs text-[#647A72]">
                Awtor: <strong className="text-[#0F241D]">{session?.fullName ?? 'Baş Seýis'}</strong>
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingNote}
              leftIcon={<ClipboardPlus className="w-4 h-4" />}
            >
              {isSavingNote ? 'Ýatda saklanýar...' : 'Belligi ýaz'}
            </Button>
          </div>
        </form>

        {currentHorseNotes.length === 0 ? (
          <p className="text-sm text-[#647A72] text-center py-4">
            Bu bedew üçin heniz bellik goşulmady. Ýokardaky formadan ilkinji belligi ýazyp bilersiňiz.
          </p>
        ) : (
          <div className="space-y-2.5">
            {currentHorseNotes.map((item) => {
              const catMeta = NOTE_CATEGORY_META[item.category];
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-[#EEF3F1] bg-[#F8FAF9]/60 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'px-2.5 py-0.5 rounded-lg border font-semibold',
                          catMeta.className,
                        ].join(' ')}
                      >
                        {catMeta.label}
                      </span>
                      <span className="font-semibold text-[#0F241D]">{item.authorName}</span>
                    </div>
                    <span className="font-mono tabular-nums text-[#647A72] inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#0F241D] leading-relaxed">{item.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Rasion Taryhy + Saglyk we Türgenleşik Taryhy (2 sütünli) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rasion (Iýmitlendiriş) Taryhy */}
        <Card padding="lg" className="bg-white space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F241D] flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#059669]" aria-hidden="true" />
                Günlük Rasion Taryhy
              </h2>
              <p className="text-xs text-[#647A72] font-mono tabular-nums mt-0.5">
                {completedMeals}/{horseFeedings.length} tapgyr · Jemi {totalDailyKg.toFixed(1)} kg ·
                Tygşytlanan {totalSavedKg.toFixed(1)} kg
              </p>
            </div>
            <Link
              to="/staff/feeding"
              className="text-xs font-semibold text-[#064E3B] hover:underline shrink-0"
            >
              Rasiona geç →
            </Link>
          </div>

          {horseFeedings.length === 0 ? (
            <p className="text-sm text-[#647A72]">
              Bu bedew üçin aýratyn gündelik rasion tapgyry heniz bellenilmedi.
            </p>
          ) : (
            <div className="space-y-3">
              {horseFeedings.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3.5 rounded-xl border border-[#EEF3F1] bg-[#F8FAF9] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#064E3B] tabular-nums">
                        {plan.mealTime}
                      </span>
                      <span className="text-xs font-semibold text-[#0F241D]">
                        {MEAL_PERIOD_LABELS[plan.mealPeriod]} · {plan.mealName}
                      </span>
                    </div>
                    <span
                      className={[
                        'text-[11px] font-semibold px-2 py-0.5 rounded-md',
                        plan.completedToday
                          ? 'bg-[#ECFDF5] text-[#065F46]'
                          : 'bg-[#FFFBEB] text-[#92400E]',
                      ].join(' ')}
                    >
                      {plan.completedToday ? 'Berildi' : 'Garaşylýar'}
                    </span>
                  </div>
                  <p className="text-xs text-[#415850]">
                    {plan.forageType} ·{' '}
                    <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                      {plan.quantityKg} kg
                    </span>{' '}
                    · Suw:{' '}
                    <span className="font-mono tabular-nums font-semibold text-[#0F241D]">
                      {plan.waterLiters} L
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#059669]">
                    {plan.organicCertified && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Leaf className="w-3 h-3" aria-hidden="true" />
                        Organiki
                      </span>
                    )}
                    <span className="font-mono tabular-nums text-[#647A72]">
                      Isripsiz tygşyt: +{plan.savedForageKg} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Saglyk, Weterinar we Türgenleşik Taryhy */}
        <Card padding="lg" className="bg-white space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F241D] flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
                Saglyk we Türgenleşik Taryhy
              </h2>
              <p className="text-xs text-[#647A72] font-mono tabular-nums mt-0.5">
                {horseVetItems.length} weterinar ýazgysy · {horseTrainings.length} türgenleşik
              </p>
            </div>
            <Link
              to="/staff/health-training"
              className="text-xs font-semibold text-[#064E3B] hover:underline shrink-0"
            >
              Doly žurnal →
            </Link>
          </div>

          <div className="space-y-3">
            {horseVetItems.map((vet) => {
              const statusMeta = VET_STATUS_META[vet.status];
              return (
                <div
                  key={vet.id}
                  className="p-3.5 rounded-xl border border-[#EEF3F1] bg-[#F8FAF9] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F241D]">{vet.title}</span>
                    <span
                      className={[
                        'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                        statusMeta.className,
                      ].join(' ')}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#647A72] flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {vet.scheduledDate}
                    </span>
                    <span>·</span>
                    <span>{VET_CATEGORY_LABELS[vet.category]}</span>
                    <span>·</span>
                    <span>{vet.veterinarian}</span>
                  </p>
                  {vet.notes && <p className="text-xs text-[#415850]">{vet.notes}</p>}
                </div>
              );
            })}

            {horseTrainings.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-[#DCE6E1] bg-white space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#064E3B]">
                    {SESSION_TYPE_LABELS[log.sessionType]}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-[#647A72]">{log.date}</span>
                </div>
                <p className="text-xs text-[#415850] font-mono tabular-nums">
                  {log.durationMinutes} min · {log.distanceKm} km · Maks. ýürek urşy:{' '}
                  {log.maxHeartRateBpm} bpm
                </p>
                {log.notes && <p className="text-xs text-[#415850]">{log.notes}</p>}
              </div>
            ))}

            {horseVetItems.length === 0 && horseTrainings.length === 0 && (
              <p className="text-sm text-[#647A72]">
                Bu bedew üçin weterinar ýa-da türgenleşik ýazgysy tapylmady.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
