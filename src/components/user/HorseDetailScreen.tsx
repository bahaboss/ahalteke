import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BatteryCharging,
  Calendar,
  Check,
  Copy,
  Droplets,
  GitBranch,
  HeartPulse,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Trophy,
  UserCheck,
  Wind,
} from 'lucide-react';
import { fetchHorseById } from '../../services';
import { useAppStore } from '../../store';
import type { Horse } from '../../types';
import { Button, Card, SkeletonLoader } from '../common';
import { AnimatedHorseAvatar } from './AnimatedHorseAvatar';
import {
  ACTIVITY_LABELS,
  GENDER_LABELS,
  HEALTH_STATUS_META,
  HorsePortrait,
  parseHorsePedigree,
  QrCodeGraphic,
} from './HorseSharedParts';

export const HorseDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { horses, complexes, stables, iotTelemetry, competitions, isHydrating } = useAppStore();

  const [fetchedHorse, setFetchedHorse] = useState<Horse | null>(null);
  const [fetchingFallback, setFetchingFallback] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const storeHorse = useMemo(() => horses.find((h) => h.id === id) ?? null, [horses, id]);
  const horse = storeHorse ?? fetchedHorse;

  useEffect(() => {
    setCopiedCode(false);
    if (!id || storeHorse) {
      setFetchingFallback(false);
      return;
    }
    let active = true;
    setFetchingFallback(true);
    fetchHorseById(id)
      .then((res) => {
        if (active) setFetchedHorse(res.data);
      })
      .finally(() => {
        if (active) setFetchingFallback(false);
      });
    return () => {
      active = false;
    };
  }, [id, storeHorse]);

  const complex = useMemo(
    () => (horse ? complexes.find((c) => c.id === horse.complexId) : undefined),
    [complexes, horse]
  );

  const stable = useMemo(
    () => (horse ? stables.find((s) => s.id === horse.stableId) : undefined),
    [stables, horse]
  );

  const sensor = useMemo(
    () => (horse ? iotTelemetry.find((t) => t.horseId === horse.id) : undefined),
    [iotTelemetry, horse]
  );

  const horseCompetitions = useMemo(
    () =>
      horse
        ? competitions.filter((comp) => comp.registeredHorseIds.includes(horse.id))
        : [],
    [competitions, horse]
  );

  const otherHorses = useMemo(
    () => horses.filter((h) => h.id !== horse?.id).slice(0, 3),
    [horses, horse?.id]
  );

  const handleCopyQrCode = async () => {
    if (!horse) return;
    try {
      await navigator.clipboard.writeText(horse.qrCodeId);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2400);
    } catch {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2400);
    }
  };

  if ((isHydrating && !horse) || fetchingFallback) {
    return <SkeletonLoader variant="profile" />;
  }

  if (!horse) {
    return (
      <Card padding="lg" className="bg-white text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EEF3F1] flex items-center justify-center text-[#064E3B]">
          <QrCode className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Bedew tapylmady</h1>
        <p className="text-sm text-[#415850] max-w-md mx-auto">
          Görkezilen belgi (<span className="font-mono text-[#064E3B]">{id}</span>) boýunça sanly
          bedew pasporty tapylmady.
        </p>
        <div className="pt-1">
          <Link
            to="/user/horses"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#04392B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Atlar dünýäsine dolan
          </Link>
        </div>
      </Card>
    );
  }

  const healthMeta = HEALTH_STATUS_META[horse.healthStatus];
  const pedigree = parseHorsePedigree(horse);

  return (
    <div className="space-y-6">
      {/* Yza dolanmak zolagy */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/user/horses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#064E3B] hover:text-[#04392B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Atlar dünýäsine dolan
        </Link>
        <span className="text-xs font-mono tabular-nums text-[#647A72]">
          Pasport ID: <strong className="text-[#064E3B]">{horse.qrCodeId}</strong>
        </span>
      </div>

      {/* 1. Esasy Bedew Profili we Sanly QR-Pasport */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-stretch">
        {/* Çep tarap: Portret, animasiýaly awatar we esasy görkezijiler */}
        <Card padding="none" className="bg-white overflow-hidden flex flex-col">
          <div className="relative h-64 sm:h-72 bg-[#064E3B]">
            <HorsePortrait src={horse.portraitUrl} alt={`${horse.name} — ${horse.breed}`} />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#064E3B]/90 via-[#064E3B]/20 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
              <span
                className={[
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold bg-white/95',
                  healthMeta.textColor,
                  healthMeta.surfaceBg,
                ].join(' ')}
              >
                <span
                  className={['w-2 h-2 rounded-full', healthMeta.dotColor].join(' ')}
                  aria-hidden="true"
                />
                {healthMeta.label}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#064E3B]/85 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono tabular-nums">
                {horse.birthYear} ý.
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              <AnimatedHorseAvatar
                src={horse.animatedAvatarUrl}
                alt={`${horse.name} animasiýaly awatary`}
                size="lg"
              />
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                  {horse.breed}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight truncate mt-0.5">
                  {horse.name}
                </h1>
                <p className="text-xs text-white/85 truncate mt-1">{horse.lineage}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
                  Reňki
                </p>
                <p className="mt-1 text-sm font-bold text-[#0F172A]">{horse.coatLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
                  Ýaşy
                </p>
                <p className="mt-1 text-sm font-bold font-mono tabular-nums text-[#0F172A]">
                  {horse.ageYears} ýaş
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
                  Boýy
                </p>
                <p className="mt-1 text-sm font-bold font-mono tabular-nums text-[#0F172A]">
                  {horse.heightCm} sm
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
                  Jynsy
                </p>
                <p className="mt-1 text-sm font-bold text-[#0F172A]">
                  {GENDER_LABELS[horse.gender]}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EEF3F1] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[#647A72] font-medium">Atçylyk sport toplumy</p>
                <p className="mt-1 font-semibold text-[#0F172A] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{complex?.name ?? horse.ownerName}</span>
                </p>
                {complex && <p className="text-[#647A72] mt-0.5 pl-5">{complex.region}</p>}
              </div>
              <div>
                <p className="text-[#647A72] font-medium">Athana we seýis</p>
                <p className="mt-1 font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" aria-hidden="true" />
                  <span>{horse.seisName}</span>
                </p>
                {stable && (
                  <p className="text-[#647A72] mt-0.5 pl-5">
                    {stable.name} ({stable.code})
                  </p>
                )}
              </div>
              <div>
                <p className="text-[#647A72] font-medium">Eýeçiligi</p>
                <p className="mt-1 font-semibold text-[#0F172A]">{horse.ownerName}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sag tarap: Resmi Sanly QR-Pasport kartoçkasy */}
        <Card
          padding="lg"
          className="bg-[#064E3B] text-white border-[#064E3B] flex flex-col justify-between gap-5"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                  Resmi Sanly Şahadatnama
                </p>
                <h2 className="font-display text-xl font-bold text-white mt-1">
                  Sanly QR-Pasport
                </h2>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#10B981] shrink-0" aria-hidden="true" />
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 p-4 rounded-2xl bg-white/8 border border-white/15">
              <QrCodeGraphic code={horse.qrCodeId} size="lg" />
              <div className="text-center sm:text-left lg:text-center xl:text-left min-w-0 flex-1 space-y-1.5">
                <p className="text-[11px] uppercase tracking-wider text-white/65">
                  Tohum Hasaba Alyş Belgisi
                </p>
                <p className="text-lg font-bold font-mono tabular-nums text-[#D4AF37] break-all">
                  {horse.qrCodeId}
                </p>
                <p className="text-xs text-white/80 leading-relaxed">
                  QR-kody skanirlemek arkaly bedewiň şejeresini, weterinar ýagdaýyny we ýaryş
                  netijelerini tassyklap bilersiňiz.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/15">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Tohum arassalygy</span>
              <span className="font-semibold text-[#10B981]">Tassyklanan · 100%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Athana kody</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {stable?.code ?? 'ATH-TM'}
              </span>
            </div>

            <Button
              variant="gold"
              size="md"
              fullWidth
              onClick={handleCopyQrCode}
              leftIcon={
                copiedCode ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )
              }
            >
              {copiedCode ? 'Pasport kody göçürildi' : 'Pasport koduny göçür'}
            </Button>
          </div>
        </Card>
      </div>

      {/* 2. 3 Nesilli Wizual «Nesil Daragty» (Pedigree Tree) */}
      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[#EEF3F1]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669] flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
              Tohum Şejeresi · 3 Nesil
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
              Nesil daragty
            </h2>
          </div>
          <p className="text-xs font-semibold text-[#856510] bg-[#FEF9E7] border border-[#D4AF37]/35 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {pedigree.foundationLine}
          </p>
        </div>

        {/* 3 sütünli şejere gurluşy */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1.2fr] gap-4 items-center">
          {/* 1-nji nesil: Häzirki Bedew */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
              1-nji nesil · Bedew
            </p>
            <div className="p-4 rounded-2xl bg-[#064E3B] text-white border border-[#064E3B] flex items-center gap-3.5">
              <AnimatedHorseAvatar
                src={horse.animatedAvatarUrl}
                alt={horse.name}
                size="sm"
              />
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-white truncate">{horse.name}</p>
                <p className="text-xs text-[#D4AF37] font-mono tabular-nums mt-0.5">
                  {horse.birthYear} ý. · {GENDER_LABELS[horse.gender]}
                </p>
                <p className="text-[11px] text-white/75 truncate mt-0.5">{horse.coatLabel}</p>
              </div>
            </div>
          </div>

          {/* 2-nji nesil: Atasy we Enesi */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
              2-nji nesil · Ene-atasy
            </p>
            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#059669] uppercase tracking-wide">
                  {pedigree.sire.role}
                </p>
                <p className="font-display text-base font-bold text-[#0F172A] truncate mt-0.5">
                  {pedigree.sire.name}
                </p>
              </div>
              <span className="text-xs font-mono text-[#647A72] shrink-0">♂</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#856510] uppercase tracking-wide">
                  {pedigree.dam.role}
                </p>
                <p className="font-display text-base font-bold text-[#0F172A] truncate mt-0.5">
                  {pedigree.dam.name}
                </p>
              </div>
              <span className="text-xs font-mono text-[#647A72] shrink-0">♀</span>
            </div>
          </div>

          {/* 3-nji nesil: Ata-babalary we gadymy şejere */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#647A72]">
              3-nji nesil · Gadymy Şejere
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE6E1] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#647A72]">Ata tarapyndan atasy</span>
                <span className="font-semibold text-[#064E3B]">{pedigree.sire.paternalGrandsire}</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE6E1] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#647A72]">Ata tarapyndan enesi</span>
                <span className="font-semibold text-[#0F172A]">{pedigree.sire.paternalGranddam}</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE6E1] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#647A72]">Ene tarapyndan atasy</span>
                <span className="font-semibold text-[#064E3B]">{pedigree.dam.maternalGrandsire}</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE6E1] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#647A72]">Ene tarapyndan enesi</span>
                <span className="font-semibold text-[#0F172A]">{pedigree.dam.maternalGranddam}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#415850] pt-3 border-t border-[#EEF3F1]">
          <strong className="text-[#064E3B]">Liniýa aýratynlygy:</strong> {pedigree.originNote}
        </p>
      </Card>

      {/* 3. Bedewiň Taryhy we Sport Üstünlikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg" className="bg-white space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
            Bedewiň taryhy we häsiýeti
          </h2>
          <p className="text-sm text-[#334155] leading-relaxed">
            {horse.story ?? horse.healthSummary}
          </p>
          <div className="pt-4 border-t border-[#EEF3F1] space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
              Weterinar we saglyk jemlemesi
            </p>
            <p className="text-sm text-[#415850] leading-relaxed">{horse.healthSummary}</p>
          </div>
        </Card>

        <Card padding="lg" className="bg-white space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
            Sport üstünlikleri we baýraklary
          </h2>
          {horse.achievements.length > 0 ? (
            <ul className="space-y-2.5">
              {horse.achievements.map((achievement, index) => (
                <li
                  key={achievement}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A]"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#064E3B] text-[#D4AF37] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="leading-snug pt-0.5">{achievement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#647A72]">
              Häzirki wagtda hasaba alnan resmi sport baýraklary ýok.
            </p>
          )}

          {horseCompetitions.length > 0 && (
            <div className="pt-3 border-t border-[#EEF3F1] space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#647A72] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                Hasaba alnan öňdäki ýaryşlar
              </p>
              <div className="space-y-2">
                {horseCompetitions.map((comp) => (
                  <Link
                    key={comp.id}
                    to="/user/competitions"
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[#DCE6E1] hover:border-[#064E3B]/50 hover:bg-[#F8FAF9] transition-colors text-xs"
                  >
                    <span className="font-semibold text-[#0F172A] truncate">{comp.title}</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#059669] shrink-0">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      {comp.date}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Janly IoT Saglyk we Athana Mikroklimat Ýagdaýy */}
      {sensor && (
        <Card padding="lg" className="bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EEF3F1]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669]">
                Smart IoT Gözegçilik
              </p>
              <h2 className="font-display text-xl font-bold text-[#0F172A] mt-0.5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#10B981]" aria-hidden="true" />
                Janly IoT saglyk we athana ýagdaýy
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#647A72]">
              <span className="font-semibold text-[#064E3B]">
                Işjeňlik: {ACTIVITY_LABELS[sensor.activityLevel]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <BatteryCharging className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                {sensor.batteryPercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Ýürek urşy
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.heartRateBpm}{' '}
                <span className="text-xs font-normal text-[#647A72]">bpm</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                Beden gyzgyny
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.bodyTemperatureC.toFixed(1)} °C
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Gündelik ädim
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.dailySteps.toLocaleString('en-US')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                Athana howasy
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.stableTempC}°C · {sensor.stableHumidityPercent}%
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Ammiak (NH₃)
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.ammoniaPpm} <span className="text-xs font-normal text-[#647A72]">ppm</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-[11px] font-medium text-[#647A72] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Suw derejesi
              </p>
              <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#0F172A]">
                {sensor.waterLevelPercent}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 5. Beýleki bedewlere çalt geçiş */}
      {otherHorses.length > 0 && (
        <section className="space-y-3" aria-label="Beýleki ahalteke bedewleri">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0F172A]">Beýleki bedewler</h2>
            <Link
              to="/user/horses"
              className="text-xs font-semibold text-[#064E3B] hover:underline"
            >
              Ählisini gör
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherHorses.map((item) => (
              <Link
                key={item.id}
                to={`/user/horses/${item.id}`}
                className="group p-3.5 rounded-2xl bg-white border border-[#DCE6E1] hover:border-[#064E3B]/50 transition-colors flex items-center gap-3"
              >
                <AnimatedHorseAvatar
                  src={item.animatedAvatarUrl}
                  alt={item.name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-[#0F172A] group-hover:text-[#064E3B] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#647A72] truncate">{item.coatLabel}</p>
                </div>
                <ArrowUpRight
                  className="w-4 h-4 text-[#647A72] group-hover:text-[#064E3B] shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
