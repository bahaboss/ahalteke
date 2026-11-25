import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Boxes,
  CalendarDays,
  ChevronRight,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  UserCircle2,
} from 'lucide-react';
import type { AuthSession } from '../../types';
import { AnimatedHorseLogo, PWAInstallButton } from '../common';
import { AcademyApplyScreen } from './AcademyApplyScreen';
import { CompetitionsScreen } from './CompetitionsScreen';
import { HorsesWorldScreen } from './HorsesWorldScreen';
import { LibraryScreen } from './LibraryScreen';

export type UserPortalTab = 'horses' | 'competitions' | 'library' | 'academy';

export interface UserPortalLayoutProps {
  session: AuthSession;
  initialTab?: UserPortalTab;
  onBackToLanding: () => void;
  onOpenDesignSystem: () => void;
  onLogout: () => void;
}

interface NavItemConfig {
  id: UserPortalTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'horses',
    label: 'Atlar dünýäsi',
    shortLabel: 'Atlar',
    subtitle: 'Ahalteke bedewleri we QR-Pasportlar',
    icon: Compass,
  },
  {
    id: 'competitions',
    label: 'Geçiriljek ýaryşlar',
    shortLabel: 'Ýaryşlar',
    subtitle: 'At çapyşyklary we bäsleşik senenamasy',
    icon: CalendarDays,
  },
  {
    id: 'library',
    label: 'Kitaphana',
    shortLabel: 'Kitaphana',
    subtitle: 'Milli atçylyk eserleri we okaýyş',
    icon: BookOpen,
  },
  {
    id: 'academy',
    label: 'Akademiýa',
    shortLabel: 'Akademiýa',
    subtitle: 'Aba Annaýew Akademiýasyna dalaşgärlik',
    icon: GraduationCap,
  },
];

export const UserPortalLayout: React.FC<UserPortalLayoutProps> = ({
  session,
  initialTab = 'horses',
  onBackToLanding,
  onOpenDesignSystem,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<UserPortalTab>(initialTab);

  const activeNav = NAV_ITEMS.find((item) => item.id === activeTab) ?? NAV_ITEMS[0];

  const handleSelectTab = (tab: UserPortalTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D] flex flex-col lg:flex-row">
      {/* Desktop Çep Gapdal Panel (Sidebar) */}
      <aside
        aria-label="Ulanyjy paneli nawigasiýasy"
        className="hidden lg:flex lg:flex-col lg:w-[268px] lg:fixed lg:inset-y-0 lg:left-0 bg-[#064E3B] text-white border-r border-white/10 z-30"
      >
        {/* Brend başlygy */}
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
                Ahalteke · Ulanyjy
              </p>
            </div>
          </button>
        </div>

        {/* Profil blogy */}
        <div className="px-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-white/8 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
              <UserCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.fullName}</p>
              <p className="text-[11px] text-white/70 truncate">
                {session.region ?? 'Ýönekeý Ulanyjy'}
                {session.isDemo ? ' · Synag' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* 4 aýratyn ekran nawigasiýasy */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Esasy ekranlar">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Ulanyjy Ekranlary
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
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
                    : 'text-white/85 hover:bg-white/10 hover:text-white font-medium',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-[#0F241D]' : 'text-[#D4AF37]',
                  ].join(' ')}
                />
                <span className="text-sm truncate flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#0F241D]" />}
              </button>
            );
          })}
        </nav>

        {/* Aşaky goşmaça amallar */}
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

      {/* Esasy mazmun sütini */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[268px]">
        {/* Mobil ýokarky ykjam zolak (< lg, 56px) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#064E3B] text-white px-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            aria-label="Baş sahypa gaýtmak"
          >
            <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {activeNav.label}
              </p>
              <p className="text-[10px] text-[#D4AF37] truncate">{session.fullName}</p>
            </div>
          </button>

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

        {/* Desktop ýokarky ýol görkeziji (Breadcrumb Header) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1] px-8 items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-[#6B8078] font-medium">Ulanyjy Paneli</span>
            <ChevronRight className="w-4 h-4 text-[#DCE6E1] shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#064E3B] truncate">{activeNav.label}</span>
            <span className="text-[#DCE6E1] mx-1" aria-hidden="true">
              ·
            </span>
            <span className="text-xs text-[#6B8078] truncate">{activeNav.subtitle}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            <span className="text-xs font-medium text-[#415850]">
              {session.fullName}
            </span>
          </div>
        </header>

        {/* Işjeň ekran mazmuny */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'horses' && <HorsesWorldScreen />}
              {activeTab === 'competitions' && <CompetitionsScreen />}
              {activeTab === 'library' && <LibraryScreen />}
              {activeTab === 'academy' && <AcademyApplyScreen session={session} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobil aşaky 4-düwmeli nawigasiýa zolagy (Bottom Bar) */}
      <nav
        aria-label="Mobil aşaky menýu"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE6E1] shadow-[0_-4px_16px_rgba(6,78,59,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
          {NAV_ITEMS.map((item) => {
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
                  isActive ? 'text-[#064E3B] font-bold' : 'text-[#6B8078] font-medium',
                ].join(' ')}
              >
                {isActive && (
                  <span
                    className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-[#D4AF37]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={[
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-[#064E3B]' : 'text-[#6B8078]',
                  ].join(' ')}
                />
                <span className="text-[11px] leading-none truncate max-w-full px-1">
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
