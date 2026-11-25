import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  Droplets,
  Leaf,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Weight,
} from 'lucide-react';
import {
  calculateRecommendedFeedingKg,
  calculateSavedForageKg,
  estimateHorseWeightKg,
} from '../../services';
import { useAppStore } from '../../store';
import type {
  FeedingPeriod,
  FeedingPlan,
  Horse,
  TrainingLoadLevel,
} from '../../types';
import { Button, Card, Modal } from '../common';
import { AnimatedHorseAvatar } from '../user';

type PeriodFilter = 'all' | FeedingPeriod;

const PERIOD_ORDER: Record<FeedingPeriod, number> = {
  irden: 0,
  günortan: 1,
  agşam: 2,
};

const PERIOD_META: Record<
  FeedingPeriod,
  { label: string; defaultTime: string; icon: React.ComponentType<{ className?: string }> }
> = {
  irden: { label: 'Irden', defaultTime: '06:30', icon: Sunrise },
  günortan: { label: 'Günortan', defaultTime: '13:00', icon: Sun },
  agşam: { label: 'Agşam', defaultTime: '18:30', icon: Sunset },
};

const LOAD_LABELS: Record<TrainingLoadLevel, string> = {
  ýeňil: 'Ýeňil ýük',
  orta: 'Orta ýük',
  ýokary: 'Ýokary ýük',
};

interface RationFormState {
  id?: string;
  horseId: string;
  mealPeriod: FeedingPeriod;
  mealTime: string;
  mealName: string;
  forageType: string;
  quantityKg: string;
  waterLiters: string;
  supplementsText: string;
  organicCertified: boolean;
  notes: string;
  horseWeightKg: string;
  trainingLoad: TrainingLoadLevel;
}

export const StaffFeedingScreen: React.FC = () => {
  const {
    session,
    horses,
    feedingPlans,
    trainingLogs,
    isHydrating,
    toggleFeedingComplete,
    saveFeedingPlan,
  } = useAppStore();

  const [selectedHorseId, setSelectedHorseId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  // Rasion goşmak / üýtgetmek modaly
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState<RationFormState | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const horseMap = useMemo(() => {
    const map = new Map<string, Horse>();
    horses.forEach((h) => map.set(h.id, h));
    return map;
  }, [horses]);

  const latestLoadByHorse = useMemo(() => {
    const map = new Map<string, TrainingLoadLevel>();
    trainingLogs.forEach((log) => {
      if (!map.has(log.horseId)) {
        map.set(log.horseId, log.loadLevel);
      }
    });
    return map;
  }, [trainingLogs]);

  const resolveHorseProfile = (horseId: string, plansForHorse: FeedingPlan[]) => {
    const horse = horseMap.get(horseId);
    const planWithWeight = plansForHorse.find((p) => typeof p.horseWeightKg === 'number');
    const planWithLoad = plansForHorse.find((p) => Boolean(p.trainingLoad));

    const weightKg =
      planWithWeight?.horseWeightKg ??
      (horse ? estimateHorseWeightKg(horse.heightCm, horse.ageYears) : 465);
    const trainingLoad: TrainingLoadLevel =
      planWithLoad?.trainingLoad ?? latestLoadByHorse.get(horseId) ?? 'orta';

    return { weightKg, trainingLoad };
  };

  const horsesWithPlans = useMemo(() => {
    const ids = new Set(feedingPlans.map((p) => p.horseId));
    return horses.filter((h) => ids.has(h.id));
  }, [horses, feedingPlans]);

  const filteredPlans = useMemo(() => {
    return feedingPlans.filter((plan) => {
      if (selectedHorseId !== 'all' && plan.horseId !== selectedHorseId) return false;
      if (selectedPeriod !== 'all' && plan.mealPeriod !== selectedPeriod) return false;
      return true;
    });
  }, [feedingPlans, selectedHorseId, selectedPeriod]);

  // Bedewler boýunça toparlanan Rasion Kartalary
  const groupedHorseCards = useMemo(() => {
    const groups = new Map<string, FeedingPlan[]>();
    filteredPlans.forEach((plan) => {
      const list = groups.get(plan.horseId) ?? [];
      list.push(plan);
      groups.set(plan.horseId, list);
    });

    return Array.from(groups.entries()).map(([horseId, plans]) => {
      const sortedPlans = [...plans].sort(
        (a, b) =>
          PERIOD_ORDER[a.mealPeriod] - PERIOD_ORDER[b.mealPeriod] ||
          a.mealTime.localeCompare(b.mealTime)
      );
      const allHorsePlans = feedingPlans.filter((p) => p.horseId === horseId);
      const { weightKg, trainingLoad } = resolveHorseProfile(horseId, allHorsePlans);
      const { dailyKg: recommendedDailyKg } = calculateRecommendedFeedingKg(
        weightKg,
        trainingLoad,
        'irden'
      );
      const plannedDailyKg = allHorsePlans.reduce((acc, p) => acc + p.quantityKg, 0);
      const plannedSavedKg = allHorsePlans.reduce((acc, p) => acc + p.savedForageKg, 0);
      const completedCount = allHorsePlans.filter((p) => p.completedToday).length;

      return {
        horseId,
        horse: horseMap.get(horseId),
        plans: sortedPlans,
        totalPlansCount: allHorsePlans.length,
        completedCount,
        weightKg,
        trainingLoad,
        recommendedDailyKg,
        plannedDailyKg,
        plannedSavedKg,
      };
    });
  }, [filteredPlans, feedingPlans, horseMap, latestLoadByHorse]);

  const metrics = useMemo(() => {
    const completed = feedingPlans.filter((p) => p.completedToday);
    const savedKg = completed.reduce((acc, p) => acc + p.savedForageKg, 0);
    const totalPlannedSavedKg = feedingPlans.reduce((acc, p) => acc + p.savedForageKg, 0);
    const totalForageKg = feedingPlans.reduce((acc, p) => acc + p.quantityKg, 0);
    const totalWaterL = completed.reduce((acc, p) => acc + p.waterLiters, 0);
    const totalPlannedWaterL = feedingPlans.reduce((acc, p) => acc + p.waterLiters, 0);
    const wasteReductionPct =
      totalForageKg > 0
        ? Math.round((totalPlannedSavedKg / (totalForageKg + totalPlannedSavedKg)) * 100)
        : 0;
    const completionPct =
      feedingPlans.length > 0 ? Math.round((completed.length / feedingPlans.length) * 100) : 0;

    return {
      completedCount: completed.length,
      totalCount: feedingPlans.length,
      completionPct,
      savedKg,
      totalPlannedSavedKg,
      totalWaterL,
      totalPlannedWaterL,
      wasteReductionPct,
    };
  }, [feedingPlans]);

  const handleTogglePlan = async (plan: FeedingPlan) => {
    setBusyPlanId(plan.id);
    try {
      await toggleFeedingComplete(plan.id, !plan.completedToday);
    } finally {
      setBusyPlanId(null);
    }
  };

  const openCreateModal = (presetHorseId?: string) => {
    const targetHorseId =
      presetHorseId ??
      (selectedHorseId !== 'all' ? selectedHorseId : horses[0]?.id ?? 'hrs-001');
    const existingForHorse = feedingPlans.filter((p) => p.horseId === targetHorseId);
    const { weightKg, trainingLoad } = resolveHorseProfile(targetHorseId, existingForHorse);

    // Ilki ýok bolan nahar wagtyny saýla
    const usedPeriods = new Set(existingForHorse.map((p) => p.mealPeriod));
    const defaultPeriod: FeedingPeriod = !usedPeriods.has('irden')
      ? 'irden'
      : !usedPeriods.has('günortan')
        ? 'günortan'
        : 'agşam';

    const { mealKg, recommendedWaterL } = calculateRecommendedFeedingKg(
      weightKg,
      trainingLoad,
      defaultPeriod
    );

    setFormState({
      horseId: targetHorseId,
      mealPeriod: defaultPeriod,
      mealTime: PERIOD_META[defaultPeriod].defaultTime,
      mealName: `${PERIOD_META[defaultPeriod].label} deňagramly rasiony`,
      forageType: 'Ýokary hilli ýorunja we arassa arpa',
      quantityKg: mealKg.toFixed(1),
      waterLiters: String(recommendedWaterL),
      supplementsText: 'Tebigy duz daşy, Elektrolit',
      organicCertified: true,
      notes: 'Takyk dozator ölçegi bilen taýýarlandy.',
      horseWeightKg: String(weightKg),
      trainingLoad,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (plan: FeedingPlan) => {
    const existingForHorse = feedingPlans.filter((p) => p.horseId === plan.horseId);
    const { weightKg, trainingLoad } = resolveHorseProfile(plan.horseId, existingForHorse);

    setFormState({
      id: plan.id,
      horseId: plan.horseId,
      mealPeriod: plan.mealPeriod,
      mealTime: plan.mealTime,
      mealName: plan.mealName,
      forageType: plan.forageType,
      quantityKg: plan.quantityKg.toFixed(1),
      waterLiters: String(plan.waterLiters),
      supplementsText: plan.supplements.join(', '),
      organicCertified: plan.organicCertified,
      notes: plan.notes,
      horseWeightKg: String(plan.horseWeightKg ?? weightKg),
      trainingLoad: plan.trainingLoad ?? trainingLoad,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleModalHorseChange = (nextHorseId: string) => {
    setFormState((prev) => {
      if (!prev) return prev;
      const existing = feedingPlans.filter((p) => p.horseId === nextHorseId);
      const { weightKg, trainingLoad } = resolveHorseProfile(nextHorseId, existing);
      if (prev.id) {
        return { ...prev, horseId: nextHorseId };
      }
      const { mealKg, recommendedWaterL } = calculateRecommendedFeedingKg(
        weightKg,
        trainingLoad,
        prev.mealPeriod
      );
      return {
        ...prev,
        horseId: nextHorseId,
        horseWeightKg: String(weightKg),
        trainingLoad,
        quantityKg: mealKg.toFixed(1),
        waterLiters: String(recommendedWaterL),
      };
    });
  };

  const handleModalPeriodChange = (nextPeriod: FeedingPeriod) => {
    setFormState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mealPeriod: nextPeriod,
        mealTime: prev.id ? prev.mealTime : PERIOD_META[nextPeriod].defaultTime,
      };
    });
  };

  const liveRecommendation = useMemo(() => {
    if (!formState) return null;
    const weight = Number(formState.horseWeightKg);
    const qty = Number(formState.quantityKg);
    const rec = calculateRecommendedFeedingKg(
      Number.isFinite(weight) && weight > 0 ? weight : 465,
      formState.trainingLoad,
      formState.mealPeriod
    );
    const previewSavedKg = calculateSavedForageKg(
      Number.isFinite(qty) && qty > 0 ? qty : rec.mealKg,
      rec.mealKg,
      formState.organicCertified
    );
    return { ...rec, previewSavedKg };
  }, [formState]);

  const applyRecommendedToForm = () => {
    if (!formState || !liveRecommendation) return;
    setFormState({
      ...formState,
      quantityKg: liveRecommendation.mealKg.toFixed(1),
      waterLiters: String(liveRecommendation.recommendedWaterL),
    });
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    const quantityKg = Number(formState.quantityKg);
    const waterLiters = Number(formState.waterLiters);
    const horseWeightKg = Number(formState.horseWeightKg);

    if (formState.mealName.trim().length < 2) {
      setFormError('Naharyň ady azyndan 2 harpdan ybarat bolmalydyr.');
      return;
    }
    if (formState.forageType.trim().length < 2) {
      setFormError('Ot-iým görnüşini giriziň.');
      return;
    }
    if (!Number.isFinite(horseWeightKg) || horseWeightKg < 250 || horseWeightKg > 700) {
      setFormError('Bedewiň agramy 250 bilen 700 kg aralygynda bolmalydyr.');
      return;
    }
    if (!Number.isFinite(quantityKg) || quantityKg < 0.2 || quantityKg > 25) {
      setFormError('Ot-iým mukdary 0.2 bilen 25 kg aralygynda bolmalydyr.');
      return;
    }
    if (!Number.isFinite(waterLiters) || waterLiters < 1 || waterLiters > 60) {
      setFormError('Suw mukdary 1 bilen 60 litr aralygynda bolmalydyr.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const supplements = formState.supplementsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const savedList = await saveFeedingPlan(session?.stableId ?? 'stb-01', {
        id: formState.id,
        horseId: formState.horseId,
        mealPeriod: formState.mealPeriod,
        mealTime: formState.mealTime,
        mealName: formState.mealName,
        forageType: formState.forageType,
        quantityKg,
        waterLiters,
        supplements,
        organicCertified: formState.organicCertified,
        notes: formState.notes,
        horseWeightKg,
        trainingLoad: formState.trainingLoad,
      });

      const horseName = horseMap.get(formState.horseId)?.name ?? 'Bedew';
      const totalSaved = savedList.reduce((acc, item) => acc + item.savedForageKg, 0);
      setStatusFeedback(
        formState.id
          ? `${horseName} üçin rasion täzelendi. Günlük meýilleşdirilen tygşyt: +${totalSaved.toFixed(2)} kg.`
          : `${horseName} üçin täze rasion goşuldy. Günlük meýilleşdirilen tygşyt: +${totalSaved.toFixed(2)} kg.`
      );
      setModalOpen(false);
      setFormState(null);
      window.setTimeout(() => setStatusFeedback(null), 5000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Rasiony ýatda saklap bolmady.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ekran başlygy we ýeke-täk esasy CTA */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-[#059669]">
            Isripsiz Organiki Iýmitlendiriş Ulgamy
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
            Isripsiz Iýmitlendiriş (Rasion)
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl leading-relaxed">
            Her bedewiň agramyna we türgenleşik ýüküne görä ölçeglenen irden, günortan we agşam
            rasion kartalary. Üýtgeşmeler tygşytlanan ot-iým mukdaryny awtomatiki täzeleýär.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => openCreateModal()}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
          className="self-start md:self-auto whitespace-nowrap shrink-0"
        >
          Täze rasion goş
        </Button>
      </div>

      {/* 4 Eko-KPI görkezijisi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="emerald" padding="sm" className="space-y-1">
          <p className="text-xs text-white/80 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
            Tygşytlanan ot-iým (şu gün)
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#D4AF37]">
            {metrics.savedKg.toFixed(2)} kg
          </p>
          <p className="text-xs text-white/75 font-mono tabular-nums">
            Günlük meýilnama: {metrics.totalPlannedSavedKg.toFixed(2)} kg
          </p>
        </Card>

        <Card padding="sm" className="bg-white space-y-1">
          <p className="text-xs text-[#6B8078] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
            Isrip azaldyş derejesi
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
            -{metrics.wasteReductionPct}%
          </p>
          <p className="text-xs text-[#059669]">Agram we ýük boýunça dozator</p>
        </Card>

        <Card padding="sm" className="bg-white space-y-1">
          <p className="text-xs text-[#6B8078] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
            Rasion çek-listi
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
            {metrics.completedCount} / {metrics.totalCount}
            <span className="ml-1.5 text-xs font-semibold text-[#059669]">
              ({metrics.completionPct}%)
            </span>
          </p>
          <div className="mt-1 h-1.5 rounded-full bg-[#EEF3F1] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${metrics.completionPct}%` }}
            />
          </div>
        </Card>

        <Card padding="sm" className="bg-white space-y-1">
          <p className="text-xs text-[#6B8078] flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
            Berlen arassa suw
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#064E3B]">
            {metrics.totalWaterL} L
          </p>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            Günlük jemi: {metrics.totalPlannedWaterL} L
          </p>
        </Card>
      </div>

      {/* Üstünlik habarnamasy */}
      {statusFeedback && (
        <div
          role="status"
          className="rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#065F46]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Bedew we nahar wagty süzgüçleri */}
      <div className="bg-white border border-[#DCE6E1] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bedew saýlawy">
          <button
            type="button"
            onClick={() => setSelectedHorseId('all')}
            className={[
              'min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
              selectedHorseId === 'all'
                ? 'bg-[#064E3B] text-white'
                : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40',
            ].join(' ')}
          >
            Ähli bedewler ({horsesWithPlans.length})
          </button>
          {horsesWithPlans.map((horse) => {
            const active = selectedHorseId === horse.id;
            return (
              <button
                key={horse.id}
                type="button"
                onClick={() => setSelectedHorseId(horse.id)}
                className={[
                  'min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-[#064E3B] text-white'
                    : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40',
                ].join(' ')}
              >
                {horse.name}
              </button>
            );
          })}
        </div>

        <div
          className="inline-flex p-1 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] self-start shrink-0"
          role="group"
          aria-label="Nahar wagty"
        >
          {(
            [
              { id: 'all', label: 'Ähli wagtlar' },
              { id: 'irden', label: 'Irden' },
              { id: 'günortan', label: 'Günortan' },
              { id: 'agşam', label: 'Agşam' },
            ] as { id: PeriodFilter; label: string }[]
          ).map((tab) => {
            const active = selectedPeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPeriod(tab.id)}
                className={[
                  'min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-[#D4AF37] text-[#0F241D]'
                    : 'text-[#415850] hover:text-[#064E3B]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Her At Üçin Rasion Kartalary */}
      {isHydrating ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
      ) : groupedHorseCards.length === 0 ? (
        <Card padding="lg" className="bg-white text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0F241D]">
            Saýlanan süzgüç boýunça rasion tapylmady
          </h2>
          <p className="text-sm text-[#415850]">
            Süzgüji arassalap ýa-da bu bedew üçin täze rasion tapgyryny goşup bilersiňiz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedHorseId('all');
                setSelectedPeriod('all');
              }}
            >
              Süzgüji arassala
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openCreateModal()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Täze rasion goş
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {groupedHorseCards.map((group) => {
            const deltaKg = Math.round((group.plannedDailyKg - group.recommendedDailyKg) * 10) / 10;

            return (
              <Card key={group.horseId} padding="none" className="bg-white overflow-hidden">
                {/* Bedewiň Rasion Kartasynyň başlygy */}
                <div className="px-5 py-4 bg-[#F8FAF9] border-b border-[#DCE6E1] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {group.horse && (
                      <AnimatedHorseAvatar
                        src={group.horse.animatedAvatarUrl}
                        alt={group.horse.name}
                        size="md"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          to={`/staff/horses/${encodeURIComponent(group.horseId)}`}
                          className="font-display text-lg font-bold text-[#0F241D] hover:text-[#064E3B] truncate"
                        >
                          {group.horse?.name ?? group.horseId}
                        </Link>
                        {group.horse && (
                          <span className="text-xs font-mono text-[#6B8078] tabular-nums">
                            {group.horse.qrCodeId}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#415850]">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-[#0F241D]">
                          <Weight className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                          {group.weightKg} kg
                        </span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          ·
                        </span>
                        <span className="font-semibold text-[#064E3B]">
                          {LOAD_LABELS[group.trainingLoad]}
                        </span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          ·
                        </span>
                        <span className="font-mono tabular-nums text-[#6B8078]">
                          Çek-list: {group.completedCount}/{group.totalPlansCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agram/ýük boýunça maslahat + çalt goşmak */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono tabular-nums">
                      <div>
                        <span className="block font-sans text-[11px] text-[#6B8078]">
                          Maslahat (günlük)
                        </span>
                        <span className="font-bold text-[#0F241D]">
                          {group.recommendedDailyKg.toFixed(1)} kg
                        </span>
                      </div>
                      <div>
                        <span className="block font-sans text-[11px] text-[#6B8078]">
                          Häzirki rasion
                        </span>
                        <span className="font-bold text-[#064E3B]">
                          {group.plannedDailyKg.toFixed(1)} kg
                          {deltaKg !== 0 && (
                            <span className="ml-1 text-[11px] font-normal text-[#6B8078]">
                              ({deltaKg > 0 ? `+${deltaKg}` : deltaKg})
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="block font-sans text-[11px] text-[#6B8078]">
                          Isrip tygşydy
                        </span>
                        <span className="font-bold text-[#059669]">
                          +{group.plannedSavedKg.toFixed(2)} kg
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCreateModal(group.horseId)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#DCE6E1] text-xs font-semibold text-[#064E3B] hover:border-[#064E3B]/50 hover:bg-[#ECFDF5] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Nahar goş</span>
                    </button>
                  </div>
                </div>

                {/* Irden / Günortan / Agşam nahar çek-list setirleri */}
                <div className="divide-y divide-[#EEF3F1]">
                  {group.plans.map((plan) => {
                    const periodInfo = PERIOD_META[plan.mealPeriod];
                    const PeriodIcon = periodInfo.icon;

                    return (
                      <div
                        key={plan.id}
                        className={[
                          'px-5 py-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors',
                          plan.completedToday ? 'bg-[#F8FAF9]/75' : 'bg-white hover:bg-[#F8FAF9]/40',
                        ].join(' ')}
                      >
                        {/* Interaktiw çek-list düwmesi (≥ 44px) */}
                        <button
                          type="button"
                          disabled={busyPlanId === plan.id}
                          onClick={() => handleTogglePlan(plan)}
                          aria-pressed={plan.completedToday}
                          aria-label={`${group.horse?.name ?? 'Bedew'} — ${plan.mealName} berildi`}
                          className="min-h-[44px] min-w-[44px] self-start md:self-center flex items-center justify-center rounded-xl hover:bg-[#EEF3F1] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#10B981]"
                        >
                          {plan.completedToday ? (
                            <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                          ) : (
                            <Circle className="w-6 h-6 text-[#94A3B8]" />
                          )}
                        </button>

                        {/* Nahar maglumatlary (statik pill ýok — arassa tekst + · bölüji) */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-[#064E3B]">
                              <PeriodIcon className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                              {periodInfo.label}
                            </span>
                            <span aria-hidden="true" className="text-[#CBD5E1]">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#415850]">
                              <Clock className="w-3.5 h-3.5 text-[#6B8078]" aria-hidden="true" />
                              {plan.mealTime}
                            </span>
                            {plan.organicCertified && (
                              <>
                                <span aria-hidden="true" className="text-[#CBD5E1]">
                                  ·
                                </span>
                                <span className="text-[#059669] font-medium">Organiki</span>
                              </>
                            )}
                            <span aria-hidden="true" className="text-[#CBD5E1]">
                              ·
                            </span>
                            <span
                              className={
                                plan.completedToday
                                  ? 'font-semibold text-[#059669]'
                                  : 'text-[#6B8078]'
                              }
                            >
                              {plan.completedToday ? 'Berildi' : 'Garaşylýar'}
                            </span>
                          </div>

                          <h3
                            className={[
                              'text-sm sm:text-base font-bold',
                              plan.completedToday
                                ? 'text-[#647A72] line-through'
                                : 'text-[#0F241D]',
                            ].join(' ')}
                          >
                            {plan.mealName} — {plan.forageType}
                          </h3>

                          <p className="text-xs text-[#415850] leading-relaxed">
                            Goşundylar:{' '}
                            <span className="font-medium text-[#0F241D]">
                              {plan.supplements.join(', ')}
                            </span>
                            {plan.notes ? ` · ${plan.notes}` : ''}
                          </p>
                        </div>

                        {/* Mukdar, Tygşyt we Üýtgetmek düwmesi */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#EEF3F1] shrink-0">
                          <div className="text-left md:text-right font-mono tabular-nums">
                            <div className="text-sm font-bold text-[#064E3B]">
                              {plan.quantityKg.toFixed(1)} kg{' '}
                              <span className="text-xs font-normal text-[#6B8078]">
                                · {plan.waterLiters} L suw
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#059669]">
                              Tygşyt: +{plan.savedForageKg.toFixed(2)} kg
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openEditModal(plan)}
                            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#0F241D] hover:border-[#064E3B]/45 hover:text-[#064E3B] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Üýtget</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rasion Goşmak / Üýtgetmek Modaly */}
      <Modal
        isOpen={modalOpen && Boolean(formState)}
        onClose={() => {
          setModalOpen(false);
          setFormState(null);
          setFormError('');
        }}
        title={formState?.id ? 'Rasion tapgyryny üýtgetmek' : 'Täze rasion tapgyryny goşmak'}
        subtitle="Bedewiň agramyna we türgenleşik ýüküne görä awtomatiki teklip hasaplanýar; isleseňiz el bilen düzedip bilersiňiz."
        size="lg"
      >
        {formState && liveRecommendation && (
          <form onSubmit={handleSubmitModal} className="space-y-4">
            {/* Bedew, Nahar wagty we Sagat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1 space-y-1">
                <label htmlFor="feeding-horse-select" className="text-xs font-semibold text-[#415850]">
                  Bedew
                </label>
                <select
                  id="feeding-horse-select"
                  value={formState.horseId}
                  onChange={(e) => handleModalHorseChange(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                >
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.qrCodeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="feeding-period-select" className="text-xs font-semibold text-[#415850]">
                  Nahar wagty
                </label>
                <select
                  id="feeding-period-select"
                  value={formState.mealPeriod}
                  onChange={(e) => handleModalPeriodChange(e.target.value as FeedingPeriod)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                >
                  <option value="irden">Irden</option>
                  <option value="günortan">Günortan</option>
                  <option value="agşam">Agşam</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="feeding-time-input" className="text-xs font-semibold text-[#415850]">
                  Sagady
                </label>
                <input
                  id="feeding-time-input"
                  type="time"
                  value={formState.mealTime}
                  onChange={(e) => setFormState({ ...formState, mealTime: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>
            </div>

            {/* Agram we Türgenleşik Ýüki */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="feeding-weight-input" className="text-xs font-semibold text-[#415850]">
                  Bedewiň agramy (kg)
                </label>
                <input
                  id="feeding-weight-input"
                  type="number"
                  min={250}
                  max={700}
                  step={1}
                  value={formState.horseWeightKg}
                  onChange={(e) => setFormState({ ...formState, horseWeightKg: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#415850] block">
                  Türgenleşik ýüki
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ýeňil', 'orta', 'ýokary'] as TrainingLoadLevel[]).map((load) => {
                    const active = formState.trainingLoad === load;
                    return (
                      <button
                        key={load}
                        type="button"
                        onClick={() => setFormState({ ...formState, trainingLoad: load })}
                        className={[
                          'min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                          active
                            ? 'bg-[#064E3B] text-white'
                            : 'bg-[#F8FAF9] border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
                        ].join(' ')}
                      >
                        {load === 'ýeňil' ? 'Ýeňil' : load === 'orta' ? 'Orta' : 'Ýokary'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Awtomatiki Teklip we Bir Basyşda Ulanmak */}
            <div className="rounded-xl bg-[#ECFDF5]/80 border border-[#10B981]/35 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-[#065F46] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                  Agram we ýük boýunça awtomatiki teklip
                </p>
                <p className="text-[#065F46]/90 font-mono tabular-nums">
                  Günlük: <strong>{liveRecommendation.dailyKg.toFixed(1)} kg</strong> · Şu nahar:{' '}
                  <strong>{liveRecommendation.mealKg.toFixed(1)} kg</strong> · Suw:{' '}
                  <strong>{liveRecommendation.recommendedWaterL} L</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={applyRecommendedToForm}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-center"
              >
                Teklibi ulan
              </button>
            </div>

            {/* Nahar ady we ot-iým görnüşi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="feeding-name-input" className="text-xs font-semibold text-[#415850]">
                  Naharyň ady
                </label>
                <input
                  id="feeding-name-input"
                  type="text"
                  value={formState.mealName}
                  onChange={(e) => setFormState({ ...formState, mealName: e.target.value })}
                  placeholder="Meselem: Irki energiýa rasiony"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="feeding-forage-input" className="text-xs font-semibold text-[#415850]">
                  Ot-iým görnüşi
                </label>
                <input
                  id="feeding-forage-input"
                  type="text"
                  value={formState.forageType}
                  onChange={(e) => setFormState({ ...formState, forageType: e.target.value })}
                  placeholder="Meselem: Ýorunja, arpa we süle"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>
            </div>

            {/* El bilen düzedilýän mukdar (kg) we suw (L) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="feeding-qty-input" className="text-xs font-semibold text-[#415850]">
                  Ot-iým mukdary (kg) — el bilen düzedip bolýar
                </label>
                <input
                  id="feeding-qty-input"
                  type="number"
                  min={0.2}
                  max={25}
                  step={0.1}
                  value={formState.quantityKg}
                  onChange={(e) => setFormState({ ...formState, quantityKg: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="feeding-water-input" className="text-xs font-semibold text-[#415850]">
                  Suw mukdary (litr)
                </label>
                <input
                  id="feeding-water-input"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={formState.waterLiters}
                  onChange={(e) => setFormState({ ...formState, waterLiters: e.target.value })}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>
            </div>

            {/* Goşundylar we bellik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label htmlFor="feeding-supplements-input" className="text-xs font-semibold text-[#415850]">
                  Goşundylar (otur bilen bölünýär)
                </label>
                <input
                  id="feeding-supplements-input"
                  type="text"
                  value={formState.supplementsText}
                  onChange={(e) => setFormState({ ...formState, supplementsText: e.target.value })}
                  placeholder="Elektrolit, E witamini"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="feeding-notes-input" className="text-xs font-semibold text-[#415850]">
                  Seýis belligi
                </label>
                <input
                  id="feeding-notes-input"
                  type="text"
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  placeholder="Suw temperaturasy, işdäsi we ş.m."
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:outline-none focus:border-[#064E3B] focus:bg-white"
                />
              </div>
            </div>

            {/* Organiki belligi + awtomatiki tygşyt hasaby */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EEF3F1]">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F241D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.organicCertified}
                  onChange={(e) =>
                    setFormState({ ...formState, organicCertified: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#064E3B] rounded cursor-pointer"
                />
                Organiki tassyklanan ot-iým
              </label>

              <p className="text-xs font-semibold text-[#059669] font-mono tabular-nums">
                Isripden tygşytlanjak mukdar: +{liveRecommendation.previewSavedKg.toFixed(2)} kg
              </p>
            </div>

            {formError && <p className="text-xs font-semibold text-[#DC2626]">{formError}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEF3F1]">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setFormState(null);
                  setFormError('');
                }}
              >
                Ýatyr
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Ýatda saklanýar...'
                  : formState.id
                    ? 'Üýtgeşmeleri ýatda sakla'
                    : 'Rasiony goş'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
