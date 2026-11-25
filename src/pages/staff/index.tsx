import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Droplets,
  HeartPulse,
  Leaf,
  Stethoscope,
  Sun,
  Utensils,
  Warehouse,
  Wind,
} from 'lucide-react';
import { Card, SkeletonLoader } from '../../components/common';
import {
  StaffEcoMonitoringScreen,
  StaffFeedingScreen,
  StaffHealthTrainingScreen,
  StaffHorseDetailScreen,
  StaffIoTSensorsScreen,
  StaffStableHorsesScreen,
} from '../../components/staff';
import { computeDynamicEcoDashboard } from '../../services';
import { useAppStore } from '../../store';

export const StaffOverviewPage: React.FC = () => {
  const {
    session,
    stables,
    horses,
    iotTelemetry,
    feedingPlans,
    hygieneTasks,
    ecoMetrics,
    ecoRecommendations,
    wasteToGreenLogs,
    vetSchedule,
    iotAlertLogs,
    resolveIoTAlert,
    isHydrating,
  } = useAppStore();

  if (isHydrating || !session) {
    return <SkeletonLoader variant="page" />;
  }

  const assignedStable = stables.find((s) => s.id === session.stableId) ?? stables[0];
  const stableHorses = assignedStable
    ? horses.filter((h) => h.stableId === assignedStable.id)
    : [];
  const effectiveHorseCount = stableHorses.length > 0 ? stableHorses.length : horses.length;

  const completedFeedings = feedingPlans.filter((f) => f.completedToday).length;
  const feedingPercent =
    feedingPlans.length > 0 ? Math.round((completedFeedings / feedingPlans.length) * 100) : 100;
  const completedHygiene = hygieneTasks.filter((h) => h.completedToday).length;

  const dynamicEco = computeDynamicEcoDashboard({
    complexId: session.complexId,
    stableLabel: session.stableName,
    ecoMetrics,
    feedingPlans,
    hygieneTasks,
    iotAlertLogs,
    wasteLogs: wasteToGreenLogs,
    recommendations: ecoRecommendations,
  });
  const ecoScore = dynamicEco.ecoScore;
  const solarShare = dynamicEco.kpis.solarSharePercent;

  const stableSensors = assignedStable
    ? iotTelemetry.filter((t) => t.stableId === assignedStable.id)
    : iotTelemetry;
  const leadSensor = stableSensors[0] ?? iotTelemetry[0];

  const unresolvedIoTAlerts = iotAlertLogs.filter((a) => !a.resolved);
  const horsesNeedingWatch = horses.filter((h) => h.healthStatus !== 'healthy');
  const approachingVets = vetSchedule.filter((v) => v.status === 'ýakynlaşýar');

  const quickLinks = [
    {
      to: '/staff/stables',
      title: 'Athanam we Bokslar',
      desc: `${assignedStable?.occupiedBoxes ?? 21} / ${assignedStable?.boxCount ?? 24} boks işjeň`,
      icon: Warehouse,
    },
    {
      to: '/staff/horses',
      title: 'Athanadaky Atlar',
      desc: `${effectiveHorseCount} Ahalteke bedewi, bellikler we QR-Pasport`,
      icon: Compass,
    },
    {
      to: '/staff/iot',
      title: 'IoT Datçikler',
      desc:
        unresolvedIoTAlerts.length > 0
          ? `${unresolvedIoTAlerts.length} çözülmedik duýduryş · Her 3s live akym`
          : 'Ähli mikroklimat we gün paneli datçikleri kadaly',
      icon: Activity,
    },
    {
      to: '/staff/feeding',
      title: 'Isripsiz Rasion',
      desc: `${completedFeedings}/${feedingPlans.length} nahar tapgyry (${feedingPercent}%)`,
      icon: Utensils,
    },
    {
      to: '/staff/health-training',
      title: 'Saglyk we Türgenleşik',
      desc: `Arassaçylyk: ${completedHygiene}/${hygieneTasks.length} tabşyryk`,
      icon: HeartPulse,
    },
    {
      to: '/staff/green-eco',
      title: 'Ýaşyl Athana (Eco-Score)',
      desc: `Ýaşyl Reýting ${ecoScore}/100 · Gün energiýasy ${solarShare}%`,
      icon: Leaf,
      featured: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Başlyk */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#059669]">
          Işgär Dolandyryş Merkezi · {session.complexName}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
          Hoş geldiňiz, {session.fullName}
        </h1>
        <p className="text-sm text-[#415850]">
          Jogapkär athanaňyz: <strong className="text-[#064E3B]">{session.stableName}</strong> ·{' '}
          {session.staffPosition}
        </p>
      </div>

      {/* 4 Jemleýji KPI Kartoçkasy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Atlaryň sany */}
        <Card padding="md" className="bg-white space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#647A72]">
            <span>Atlaryň sany</span>
            <Compass className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#064E3B]">
            {effectiveHorseCount}{' '}
            <span className="text-xs font-sans font-medium text-[#647A72]">bedew</span>
          </p>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            Bokslar: {assignedStable?.occupiedBoxes ?? 21}/{assignedStable?.boxCount ?? 24} doly
          </p>
        </Card>

        {/* 2. Häzirki IoT ýagdaýy */}
        <Card
          padding="md"
          className={
            unresolvedIoTAlerts.length > 0
              ? 'bg-[#FEF2F2]/70 border-[#EF4444]/60 space-y-1.5'
              : 'bg-white space-y-1.5'
          }
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#647A72]">
            <span>Häzirki IoT ýagdaýy</span>
            <Activity
              className={`w-4 h-4 ${
                unresolvedIoTAlerts.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}
              aria-hidden="true"
            />
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
              unresolvedIoTAlerts.length > 0 ? 'text-[#EF4444]' : 'text-[#064E3B]'
            }`}
          >
            {unresolvedIoTAlerts.length > 0
              ? `${unresolvedIoTAlerts.length} duýduryş`
              : 'Kadaly'}
          </p>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            {assignedStable?.temperatureC ?? leadSensor?.stableTempC ?? 21.4}°C · NH₃{' '}
            {(leadSensor?.ammoniaPpm ?? 4.2).toFixed(1)} ppm
          </p>
        </Card>

        {/* 3. Günlük iýmitlendiriş göterimi */}
        <Card padding="md" className="bg-white space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#647A72]">
            <span>Günlük iýmitlendiriş</span>
            <Utensils className="w-4 h-4 text-[#059669]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#064E3B]">
            {feedingPercent}%
          </p>
          <div className="h-1.5 rounded-full bg-[#EEF3F1] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${feedingPercent}%` }}
            />
          </div>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            {completedFeedings}/{feedingPlans.length} rasion berildi
          </p>
        </Card>

        {/* 4. Ýaşyl Reýting (Eco-Score) */}
        <Card padding="md" className="bg-[#064E3B] text-white border-[#D4AF37]/45 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#FDE68A]">
            <span>Ýaşyl Reýting</span>
            <Leaf className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
            {ecoScore}
            <span className="text-sm font-normal text-white/70"> / 100</span>
          </p>
          <p className="text-xs text-white/80 font-mono tabular-nums">
            Gün energiýasy: {solarShare}% · Altyn Ýaşyl
          </p>
        </Card>
      </div>

      {/* Gyssagly Duýduryşlar (IoT Alert Log + Gözegçilikdäki atlar + Ýakynlaşýan weterinar) */}
      <Card padding="lg" className="bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF3F1]">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-5 h-5 ${
                unresolvedIoTAlerts.length > 0 ? 'text-[#EF4444]' : 'text-[#059669]'
              }`}
              aria-hidden="true"
            />
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F241D]">
                Gyssagly Duýduryşlar we Gündelik Üns
              </h2>
              <p className="text-xs text-[#647A72]">
                IoT Datçikler žurnaly, bedew saglygy we weterinar senenamasy bilen gönüden-göni
                sinhronlanan.
              </p>
            </div>
          </div>
          <Link
            to="/staff/iot"
            className="text-xs font-semibold text-[#064E3B] hover:underline"
          >
            IoT Duýduryş Žurnalyna geç →
          </Link>
        </div>

        <div className="space-y-3">
          {unresolvedIoTAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl bg-[#FEF2F2] border border-[#EF4444]/55 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-[#EF4444] text-white font-bold">
                    IoT Duýduryş
                  </span>
                  <span className="font-bold text-[#991B1B]">{alert.sensorLabel}</span>
                  <span className="font-mono tabular-nums text-[#991B1B]/80">
                    ({alert.measuredValue})
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0F241D]">{alert.message}</p>
                <p className="text-xs text-[#415850]">
                  <strong className="text-[#064E3B]">Maslahat:</strong> {alert.recommendation}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => resolveIoTAlert(alert.id, session.fullName)}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                  <span>Çözüldi diýip belle</span>
                </button>
              </div>
            </div>
          ))}

          {horsesNeedingWatch.map((horse) => (
            <div
              key={horse.id}
              className="rounded-xl bg-[#FFFBEB] border border-[#D4AF37]/50 p-3.5 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#92400E]">
                  Gözegçilikde duran bedew · {horse.name} ({horse.qrCodeId})
                </p>
                <p className="text-xs text-[#415850]">{horse.healthSummary}</p>
              </div>
              <Link
                to={`/staff/horses/${encodeURIComponent(horse.id)}`}
                className="text-xs font-bold text-[#064E3B] hover:underline whitespace-nowrap"
              >
                Atyň sahypasyny aç →
              </Link>
            </div>
          ))}

          {approachingVets.slice(0, 2).map((vet) => (
            <div
              key={vet.id}
              className="rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] p-3.5 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <Stethoscope className="w-4 h-4 text-[#059669] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-[#0F241D]">
                    Ýakynlaşýan weterinar barlagy: {vet.horseName} — {vet.title}
                  </p>
                  <p className="text-xs text-[#647A72] font-mono tabular-nums">
                    {vet.scheduledDate} · {vet.veterinarian}
                  </p>
                </div>
              </div>
              <Link
                to="/staff/health-training"
                className="text-xs font-semibold text-[#064E3B] hover:underline whitespace-nowrap"
              >
                Tertipnama →
              </Link>
            </div>
          ))}

          {unresolvedIoTAlerts.length === 0 &&
            horsesNeedingWatch.length === 0 &&
            approachingVets.length === 0 && (
              <div className="rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 p-4 flex items-center gap-2.5 text-sm text-[#065F46]">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Ähli ulgamlar kadaly — häzirki wagtda gyssagly duýduryş ýok.</span>
              </div>
            )}
        </div>
      </Card>

      {/* Çalt Dolandyryş Modullary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {quickLinks.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className={[
                'rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 group',
                card.featured
                  ? 'bg-[#064E3B] text-white border-[#D4AF37]/50 hover:bg-[#04392B]'
                  : 'bg-white text-[#0F241D] border-[#DCE6E1] hover:border-[#064E3B]/40',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={[
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    card.featured ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#ECFDF5] text-[#064E3B]',
                  ].join(' ')}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <ArrowRight
                  className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                    card.featured ? 'text-[#D4AF37]' : 'text-[#647A72]'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <h2
                  className={`font-display text-lg font-bold ${
                    card.featured ? 'text-white' : 'text-[#0F241D]'
                  }`}
                >
                  {card.title}
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-1 ${
                    card.featured ? 'text-white/80' : 'text-[#415850]'
                  }`}
                >
                  {card.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const StaffStablesPage: React.FC = () => {
  const { session, stables, complexes, horses, isHydrating } = useAppStore();
  if (isHydrating || !session) return <SkeletonLoader variant="page" />;

  const assignedStable = stables.find((s) => s.id === session.stableId) ?? stables[0];
  const otherComplexStables = stables.filter(
    (s) => s.complexId === session.complexId && s.id !== assignedStable?.id
  );
  const complex = complexes.find((c) => c.id === session.complexId);

  const assignedHorseCount = assignedStable
    ? horses.filter((h) => h.stableId === assignedStable.id).length
    : 0;
  const occupancyPercent = assignedStable
    ? Math.round((assignedStable.occupiedBoxes / Math.max(1, assignedStable.boxCount)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#059669]">
          {complex?.name ?? session.complexName}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D]">
          Athanam we Bokslaryň Ýagdaýy
        </h1>
        <p className="text-sm text-[#415850]">
          Jogapkär athanaňyzyň boks dolulygy, gün üçekleri, ýagyş suwy gory we howa arassalygy.
        </p>
      </div>

      {/* Jogapkär athananyň esasy kartoçkasy */}
      {assignedStable && (
        <Card padding="lg" className="bg-white border-[#D4AF37]/60 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[#EEF3F1]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#10B981]/30 text-[11px] font-bold text-[#065F46]">
                Jogapkär Athanaňyz · {assignedStable.code}
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#0F241D]">
                {assignedStable.name}
              </h2>
              <p className="text-xs text-[#415850] mt-1">
                Baş Seýis: <strong className="text-[#0F241D]">{assignedStable.headSeisName}</strong>{' '}
                · Hasapda duran bedewler:{' '}
                <strong className="font-mono text-[#064E3B]">{assignedHorseCount}</strong>
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <p className="text-xs text-[#647A72]">Boks dolulygy</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#064E3B]">
                {assignedStable.occupiedBoxes} / {assignedStable.boxCount}
              </p>
              <div className="w-40 h-2 rounded-full bg-[#EEF3F1] overflow-hidden sm:ml-auto">
                <div
                  className="h-full rounded-full bg-[#10B981]"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1] space-y-1">
              <p className="text-[#647A72] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                Gün energiýaly üçek
              </p>
              <p className="text-base font-bold text-[#064E3B]">
                {assignedStable.solarRoofEnabled ? 'Işjeň' : 'Meýilleşdirilen'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1] space-y-1">
              <p className="text-[#647A72] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                Ýagyş suwy gory
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {assignedStable.rainwaterHarvestingLiters.toLocaleString('en-US').replace(/,/g, ' ')} L
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1] space-y-1">
              <p className="text-[#647A72] flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                Howa arassalygy (AQI)
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-[#064E3B]">
                {assignedStable.airQualityIndex} (Örän arassa)
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1] space-y-1">
              <p className="text-[#647A72]">Mikroklimat</p>
              <p className="text-base font-bold font-mono tabular-nums text-[#0F241D]">
                {assignedStable.temperatureC} °C · {assignedStable.humidityPercent}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/staff/horses"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#04392B] transition-colors"
            >
              <span>Athanadaky atlara geç</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <Link
              to="/staff/iot"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#0F241D] hover:border-[#064E3B]/40 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              <span>IoT Datçiklerini aç</span>
            </Link>
            <Link
              to="/staff/green-eco"
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#10B981]/35 text-xs font-semibold text-[#065F46] hover:bg-[#D1FAE5] transition-colors"
            >
              <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ýaşyl Athana</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Toplumyň beýleki athanalary (goşmaça maglumat hökmünde) */}
      {otherComplexStables.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#415850]">
            Toplumyň beýleki athanalary ({otherComplexStables.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherComplexStables.map((stable) => (
              <Card key={stable.id} padding="md" className="bg-white space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-[#647A72]">{stable.code}</p>
                    <h3 className="font-display text-lg font-bold text-[#0F241D] mt-0.5">
                      {stable.name}
                    </h3>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-bold text-[#064E3B]">
                    {stable.occupiedBoxes}/{stable.boxCount} boks
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EEF3F1] text-xs">
                  <div>
                    <p className="text-[#647A72]">Temperatura</p>
                    <p className="font-mono tabular-nums font-semibold text-[#0F241D]">
                      {stable.temperatureC} °C
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647A72]">Çyglylyk</p>
                    <p className="font-mono tabular-nums font-semibold text-[#0F241D]">
                      {stable.humidityPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647A72]">Ýagyş suwy</p>
                    <p className="font-mono tabular-nums font-semibold text-[#064E3B]">
                      {stable.rainwaterHarvestingLiters.toLocaleString('en-US').replace(/,/g, ' ')} L
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StaffHorsesPage: React.FC = () => {
  const { session } = useAppStore();
  const navigate = useNavigate();
  if (!session) return <SkeletonLoader variant="page" />;

  return (
    <StaffStableHorsesScreen
      session={session}
      onJumpToIoT={(horseId) => navigate(`/staff/iot?horseId=${encodeURIComponent(horseId)}`)}
    />
  );
};

export const StaffHorseDetailPage: React.FC = () => {
  return <StaffHorseDetailScreen />;
};

export const StaffIoTPage: React.FC = () => {
  const { session } = useAppStore();
  const [searchParams] = useSearchParams();
  if (!session) return <SkeletonLoader variant="page" />;

  return (
    <StaffIoTSensorsScreen
      session={session}
      initialHorseId={searchParams.get('horseId') ?? undefined}
    />
  );
};

export const StaffFeedingPage: React.FC = () => {
  return <StaffFeedingScreen />;
};

export const StaffHealthTrainingPage: React.FC = () => {
  const { session } = useAppStore();
  if (!session) return <SkeletonLoader variant="page" />;
  return <StaffHealthTrainingScreen session={session} />;
};

export const StaffGreenEcoPage: React.FC = () => {
  const { session } = useAppStore();
  const navigate = useNavigate();
  if (!session) return <SkeletonLoader variant="page" />;
  return (
    <StaffEcoMonitoringScreen
      session={session}
      onOpen3DStable={() => navigate('/design-system')}
    />
  );
};
