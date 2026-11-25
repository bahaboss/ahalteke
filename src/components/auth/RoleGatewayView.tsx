import React from 'react';
import {
  ArrowLeft,
  Box,
  Building2,
  CalendarClock,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Leaf,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import type { AuthSession } from '../../types';
import { AnimatedHorseLogo, Button, Card } from '../common';

export interface RoleGatewayViewProps {
  session: AuthSession;
  onBackToLanding: () => void;
  onOpenDesignSystem: () => void;
  onSwitchRole: () => void;
  onLogout: () => void;
}

const USER_UPCOMING_MODULES = [
  {
    title: 'Bedewiň Sanly QR-Pasporty',
    desc: 'Şahsy bedewleriň şejeresini, saglyk ýagdaýyny we QR koduny göni yzarlamak.',
    icon: <QrCode className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: 'Bäsleşikler we Milli Kitaphana',
    desc: 'Ahalteke bäsleşiklerine onlaýn ýazylmak we sanly kitaphanadan peýdalanmak.',
    icon: <GraduationCap className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: 'Aba Annaýew Akademiýasy Ýüz Tutmasy',
    desc: 'Ýaş seýis dalaşgärlik arzasyny tabşyrmak we ýagdaýyny yzarlamak.',
    icon: <Leaf className="w-5 h-5 text-[#059669]" aria-hidden="true" />,
  },
];

const STAFF_UPCOMING_MODULES = [
  {
    title: '24/7 IoT Biometrika we Howa Gözegçiligi',
    desc: 'Jogapkär athanaňyzdaky her bedewiň ýürek urşy, beden temperaturasy we NH₃ derejesi.',
    icon: <Cpu className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: 'Gündelik Iýmitlendiriş we Türgenleşik',
    desc: 'Organiki ot-iým rasiony, suw ölçegi we seýis türgenleşik belliklerini ýöretmek.',
    icon: <Stethoscope className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: '«Ýaşyl Athana» Eko-Hasabatlar',
    desc: 'Gün panelleriniň öndürijiligi, ýagyş suwy süzgüji we bio-kompost hasabaty.',
    icon: <Leaf className="w-5 h-5 text-[#059669]" aria-hidden="true" />,
  },
];

export const RoleGatewayView: React.FC<RoleGatewayViewProps> = ({
  session,
  onBackToLanding,
  onOpenDesignSystem,
  onSwitchRole,
  onLogout,
}) => {
  const isStaff = session.role === 'staff';
  const upcomingModules = isStaff ? STAFF_UPCOMING_MODULES : USER_UPCOMING_MODULES;
  const formattedTime = new Date(session.loggedInAt).toLocaleString('tk-TM', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#04392B] text-white border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <AnimatedHorseLogo size="sm" variant="gold" animated />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
              Smart &amp; Green <span className="text-[#D4AF37]">Ahalteke</span>
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBackToLanding}
              className="border-[#D4AF37]/55 text-white hover:bg-[#D4AF37]/15"
            >
              Baş sahypa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={onLogout}
              className="text-white/85 hover:bg-white/10 hover:text-white"
            >
              Çykyş
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Active Session Welcome Banner */}
        <section className="rounded-3xl bg-[#064E3B] text-white border border-[#D4AF37]/40 p-6 sm:p-8 shadow-[0_22px_54px_rgba(6,78,59,0.2)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#D4AF37]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                <span>Sessiýa üstünlikli açyldy</span>
                <span aria-hidden="true">·</span>
                <span>{session.isDemo ? 'Synag profili' : 'Şahsy hasap'}</span>
                <span aria-hidden="true">·</span>
                <span>{isStaff ? 'Işgär (Atçylyk toplumy)' : 'Ýönekeý Ulanyjy'}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white leading-tight">
                Hoş geldiňiz, {session.fullName}!
              </h1>

              <p className="text-sm sm:text-base text-white/85 max-w-2xl leading-relaxed">
                {isStaff
                  ? 'Işgär sessiýaňyz saýlanan atçylyk sport toplumy we jogapkär athana bilen baglanyşdyrylyp ýatda saklandy. Doly Işgär IoT we Eko-Athana dolandyryş paneli indiki tapgyrda işjeňleşdiriler.'
                  : 'Ulanyjy sessiýaňyz üstünlikli döredildi we brauzerde saklandy. Doly Ulanyjy (At Eýesi) kabineti indiki tapgyrda (4-nji ädimde) açylar.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="gold"
                size="md"
                leftIcon={<Box className="w-4 h-4" />}
                onClick={onOpenDesignSystem}
              >
                3D «Ýaşyl Athana» gör
              </Button>
              <Button
                variant="outline"
                size="md"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={onSwitchRole}
                className="border-[#D4AF37]/60 text-white hover:bg-[#D4AF37]/15"
              >
                Başga rol saýla
              </Button>
            </div>
          </div>
        </section>

        {/* Session Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
              {isStaff ? (
                <Stethoscope className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              )}
              <span>Işjeň Rol</span>
            </div>
            <p className="font-semibold text-base text-[#064E3B]">
              {isStaff ? session.staffPosition ?? 'Işgär' : 'Ýönekeý Ulanyjy'}
            </p>
            <p className="font-mono text-xs text-[#647A72] truncate">{session.emailOrPhone}</p>
          </Card>

          {isStaff ? (
            <>
              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
                  <Building2 className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                  <span>Atçylyk Toplumy</span>
                </div>
                <p className="font-semibold text-sm text-[#0F241D] leading-snug">
                  {session.complexName ?? 'Saýlanan toplum'}
                </p>
                <p className="text-xs text-[#647A72]">{session.region}</p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                  <span>Jogapkär Athana</span>
                </div>
                <p className="font-semibold text-sm text-[#064E3B]">
                  {session.stableName ?? 'Athana №1'}
                </p>
                <p className="font-mono text-xs text-[#647A72]">{session.stableId}</p>
              </Card>
            </>
          ) : (
            <>
              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
                  <MapPin className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                  <span>Welaýat / Şäher</span>
                </div>
                <p className="font-semibold text-base text-[#0F241D]">
                  {session.region ?? 'Türkmenistan'}
                </p>
                <p className="text-xs text-[#647A72]">Şahsy ulanyjy profili</p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                  <span>Ulanyjy ID</span>
                </div>
                <p className="font-mono text-sm font-semibold text-[#064E3B]">{session.userId}</p>
                <p className="text-xs text-[#647A72]">localStorage sessiýasy</p>
              </Card>
            </>
          )}

          <Card padding="sm" className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#647A72]">
              <CalendarClock className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              <span>Giriş wagty</span>
            </div>
            <p className="font-mono tabular-nums text-sm font-semibold text-[#0F241D]">
              {formattedTime}
            </p>
            <p className="text-xs text-[#059669]">Sessiýa işjeň saklanýar</p>
          </Card>
        </div>

        {/* Upcoming Portal Modules Preview */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                {isStaff ? 'Indiki tapgyr · Işgär Kabineti' : 'Indiki tapgyr · Ulanyjy Kabineti'}
              </p>
              <h2 className="mt-0.5 font-display text-2xl font-bold text-[#0F241D]">
                Bu rol üçin taýýarlanýan esasy modullar
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {upcomingModules.map((mod) => (
              <Card key={mod.title} padding="md" className="space-y-3">
                <span className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
                  {mod.icon}
                </span>
                <h3 className="font-display text-lg font-bold text-[#0F241D]">{mod.title}</h3>
                <p className="text-sm text-[#415850] leading-relaxed">{mod.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
