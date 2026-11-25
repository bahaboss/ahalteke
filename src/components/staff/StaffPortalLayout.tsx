import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Boxes,
  Building2,
  ChevronRight,
  HeartPulse,
  Home,
  Leaf,
  LogOut,
  ShieldCheck,
  UserCheck,
  Utensils,
  Warehouse,
} from 'lucide-react';
import type { AuthSession } from '../../types';
import { AnimatedHorseLogo, PWAInstallButton } from '../common';
import { StaffEcoMonitoringScreen } from './StaffEcoMonitoringScreen';
import { StaffFeedingScreen } from './StaffFeedingScreen';
import { StaffHealthTrainingScreen } from './StaffHealthTrainingScreen';
import { StaffIoTSensorsScreen } from './StaffIoTSensorsScreen';
import { StaffStableHorsesScreen } from './StaffStableHorsesScreen';

export type StaffPortalTab =
  | 'stable-horses'
  | 'iot'
  | 'feeding'
  | 'health-training'
  | 'eco-stable';

export interface StaffPortalLayoutProps {
  session: AuthSession;
  initialTab?: StaffPortalTab;
  onBackToLanding: () => void;
  onOpenDesignSystem: () => void;
  onLogout: () => void;
}

interface StaffNavItem {
  id: StaffPortalTab;
  label: string;
  shortLabel: string;
  featured?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const STAFF_NAV_ITEMS: StaffNavItem[] = [
  {
    id: 'stable-horses',
    label: 'Athanam we Atlar',
    shortLabel: 'Athanam',
    icon: Warehouse,
  },
  {
    id: 'iot',
    label: 'IoT Datçikler',
    shortLabel: 'IoT',
    icon: Activity,
  },
  {
    id: 'feeding',
    label: 'Iýmitlendiriş',
    shortLabel: 'Rasion',
    icon: Utensils,
  },
  {
    id: 'health-training',
    label: 'Saglyk we Türgenleşik',
    shortLabel: 'Saglyk',
    icon: HeartPulse,
  },
  {
    id: 'eco-stable',
    label: 'Ýaşyl Athana',
    shortLabel: 'Ýaşyl',
    featured: true,
    icon: Leaf,
  },
];

export const StaffPortalLayout: React.FC<StaffPortalLayoutProps> = ({
  session,
  initialTab = 'stable-horses',
  onBackToLanding,
  onOpenDesignSystem,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<StaffPortalTab>(initialTab);
  const [focusedHorseId, setFocusedHorseId] = useState<string | undefined>(undefined);

  const complexLabel = session.complexName ?? 'Halkara Ahalteke Atçylyk Sport Toplumy';
  const stableLabel = session.stableName ?? 'Athana №1 — «Altyn Ganat»';
  const positionLabel = session.staffPosition ?? 'Baş Seýis / Seýis';

  const handleSelectTab = (tab: StaffPortalTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToIoT = (horseId: string) => {
    setFocusedHorseId(horseId);
    handleSelectTab('iot');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D] flex flex-col lg:flex-row">
      {/* Desktop Çep Gapdal Panel (Sidebar) */}
      <aside
        aria-label="Işgär paneli nawigasiýasy"
        className="hidden lg:flex lg:flex-col lg:w-[268px] lg:fixed lg:inset-y-0 lg:left-0 bg-[#064E3B] text-white border-r border-white/10 z-30"
      >
        <div className="px-5 py-5 border-b border-white/10">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-3 text-left w-full group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] rounded-xl"
          >
            <AnimatedHorseLogo size="sm" variant="emerald" animated />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate group-hover:text-[#D4AF37] transition-colors">
                Smart & Green
              </p>
              <p className="text-[11px] font-medium text-[#D4AF37] tracking-wider uppercase">
                Işgär Paneli
              </p>
            </div>
          </button>
        </div>

        {/* Işgär gysgaça profili */}
        <div className="px-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-white/8 border border-white/10 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{session.fullName}</p>
                <p className="text-[11px] text-[#D4AF37] truncate">{positionLabel}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-white/80">
              <p className="truncate flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" aria-hidden="true" />
                <span className="truncate">{complexLabel}</span>
              </p>
              <p className="truncate flex items-center gap-1.5 font-medium text-white">
                <Warehouse className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />
                <span className="truncate">{stableLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 5 aýratyn dolandyryş ekrany */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Işgär ekranlary">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Dolandyryş Modullary
          </p>
          {STAFF_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            const isFeaturedInactive = Boolean(item.featured && !isActive);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'w-full min-h-[46px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-left transition-all duration-150 cursor-pointer',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]',
                  isActive
                    ? 'bg-[#D4AF37] text-[#0F241D] font-bold shadow-xs'
                    : isFeaturedInactive
                      ? 'bg-[#D4AF37]/14 border border-[#D4AF37]/45 text-[#FDE68A] hover:bg-[#D4AF37]/24 font-semibold'
                      : 'text-white/85 hover:bg-white/10 hover:text-white font-medium',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'w-5 h-5 shrink-0',
                    isActive
                      ? 'text-[#0F241D]'
                      : item.featured
                        ? 'text-[#10B981]'
                        : 'text-[#D4AF37]',
                  ].join(' ')}
                />
                <span className="text-sm truncate flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#0F241D]" />}
              </button>
            );
          })}
        </nav>

        {/* Aşaky goşmaça geçelgeler */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            <span>Baş sahypa gaýt</span>
          </button>
          <button
            type="button"
            onClick={onOpenDesignSystem}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>3D «Ýaşyl Athana»</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-[#FCA5A5] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Ulgamdan çyk</span>
          </button>
        </div>
      </aside>

      {/* Esasy iş meýdany */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[268px]">
        {/* Mobil ýokarky kontekst zoly (Işgär ady + Toplum + Athana hemişe görünýär, 56px) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#064E3B] text-white px-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {session.fullName}
              </p>
              <p className="text-[10px] text-[#D4AF37] truncate">
                {complexLabel} · {stableLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onBackToLanding}
              aria-label="Baş sahypa"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/85 hover:bg-white/10 cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Ulgamdan çyk"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FCA5A5] hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop hemişe görünýän Işgär ýokarky paneli (Ady, Toplumy, Athanasy) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1] px-8 items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#0F241D] whitespace-nowrap shrink-0">
              {session.fullName}
            </span>
            <span className="text-[#DCE6E1] shrink-0" aria-hidden="true">
              ·
            </span>
            <span className="text-[#415850] truncate">{complexLabel}</span>
            <span className="text-[#DCE6E1] shrink-0" aria-hidden="true">
              ·
            </span>
            <span className="font-semibold text-[#064E3B] whitespace-nowrap shrink-0">
              {stableLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-[#6B8078] whitespace-nowrap">
              {positionLabel}
            </span>
            <PWAInstallButton />
          </div>
        </header>

        {/* Ekran mazmuny */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'stable-horses' && (
                <StaffStableHorsesScreen session={session} onJumpToIoT={handleJumpToIoT} />
              )}
              {activeTab === 'iot' && (
                <StaffIoTSensorsScreen session={session} initialHorseId={focusedHorseId} />
              )}
              {activeTab === 'feeding' && <StaffFeedingScreen />}
              {activeTab === 'health-training' && (
                <StaffHealthTrainingScreen session={session} />
              )}
              {activeTab === 'eco-stable' && (
                <StaffEcoMonitoringScreen
                  session={session}
                  onOpen3DStable={onOpenDesignSystem}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobil aşaky 5-düwmeli nawigasiýa zolagy (Bottom Bar) */}
      <nav
        aria-label="Işgär mobil aşaky menýusy"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE6E1] shadow-[0_-4px_16px_rgba(6,78,59,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {STAFF_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer relative',
                  isActive
                    ? 'text-[#064E3B] font-bold'
                    : item.featured
                      ? 'text-[#059669] font-semibold'
                      : 'text-[#6B8078] font-medium',
                ].join(' ')}
              >
                {isActive && (
                  <span
                    className="absolute top-0 inset-x-2.5 h-0.5 rounded-full bg-[#D4AF37]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={[
                    'w-5 h-5 shrink-0',
                    isActive
                      ? 'text-[#064E3B]'
                      : item.featured
                        ? 'text-[#10B981]'
                        : 'text-[#6B8078]',
                  ].join(' ')}
                />
                <span className="text-[10px] leading-none truncate max-w-full px-0.5">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
