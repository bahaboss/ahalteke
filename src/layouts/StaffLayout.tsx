import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Boxes,
  Building2,
  ChevronRight,
  Compass,
  HeartPulse,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  ShieldCheck,
  UserCheck,
  Utensils,
  Warehouse,
} from 'lucide-react';
import { AnimatedHorseLogo, PWAInstallButton } from '../components/common';
import { useAppStore } from '../store';

interface StaffNavItem {
  to: string;
  label: string;
  shortLabel: string;
  featured?: boolean;
  mobileBar?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const STAFF_NAV_ITEMS: StaffNavItem[] = [
  {
    to: '/staff/overview',
    label: 'Umumy Gözegçilik',
    shortLabel: 'Umumy',
    mobileBar: true,
    icon: LayoutDashboard,
  },
  {
    to: '/staff/stables',
    label: 'Athanam we Bokslar',
    shortLabel: 'Athana',
    icon: Warehouse,
  },
  {
    to: '/staff/horses',
    label: 'Athanadaky Atlar',
    shortLabel: 'Atlar',
    mobileBar: true,
    icon: Compass,
  },
  {
    to: '/staff/iot',
    label: 'IoT Datçikler',
    shortLabel: 'IoT',
    mobileBar: true,
    icon: Activity,
  },
  {
    to: '/staff/feeding',
    label: 'Iýmitlendiriş',
    shortLabel: 'Rasion',
    mobileBar: true,
    icon: Utensils,
  },
  {
    to: '/staff/health-training',
    label: 'Saglyk we Türgenleşik',
    shortLabel: 'Saglyk',
    icon: HeartPulse,
  },
  {
    to: '/staff/green-eco',
    label: 'Ýaşyl Athana',
    shortLabel: 'Ýaşyl',
    featured: true,
    mobileBar: true,
    icon: Leaf,
  },
];

export const StaffLayout: React.FC = () => {
  const { session, logout, horses, iotAlertLogs } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const complexLabel = session?.complexName ?? 'Halkara Ahalteke Atçylyk Sport Toplumy';
  const stableLabel = session?.stableName ?? 'Athana №1 — «Altyn Ganat»';
  const positionLabel = session?.staffPosition ?? 'Baş Seýis / Seýis';

  const unresolvedAlertCount = iotAlertLogs.filter((item) => !item.resolved).length;

  const horseDetailMatch = pathname.match(/^\/staff\/horses\/([^/]+)$/);
  const activeHorseName = horseDetailMatch
    ? horses.find((h) => h.id === decodeURIComponent(horseDetailMatch[1]))?.name
    : undefined;

  const mobilePrimaryItems = STAFF_NAV_ITEMS.filter((item) => item.mobileBar);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D] flex flex-col lg:flex-row">
      {/* Desktop Çep Gapdal Panel (Sidebar) */}
      <aside
        aria-label="Işgär paneli nawigasiýasy"
        className="hidden lg:flex lg:flex-col lg:w-[268px] lg:fixed lg:inset-y-0 lg:left-0 bg-[#064E3B] text-white border-r border-white/10 z-30"
      >
        <div className="px-5 py-5 border-b border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 text-left w-full group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          >
            <AnimatedHorseLogo size="sm" variant="emerald" animated />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate group-hover:text-[#D4AF37] transition-colors">
                Smart &amp; Green
              </p>
              <p className="text-[11px] font-medium text-[#D4AF37] tracking-wider uppercase">
                Işgär Paneli
              </p>
            </div>
          </Link>
        </div>

        {/* Işgär profili */}
        {session && (
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
        )}

        {/* Ýakorsyz arassa URL nawigasiýasy */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Işgär ekranlary">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Dolandyryş Modullary
          </p>
          {STAFF_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showAlertBadge = item.to === '/staff/iot' && unresolvedAlertCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'w-full min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-3 text-left transition-all duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]',
                    isActive
                      ? 'bg-[#D4AF37] text-[#0F241D] font-bold shadow-xs'
                      : item.featured
                        ? 'bg-[#D4AF37]/14 border border-[#D4AF37]/45 text-[#FDE68A] hover:bg-[#D4AF37]/24 font-semibold'
                        : 'text-white/85 hover:bg-white/10 hover:text-white font-medium',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive
                          ? 'text-[#0F241D]'
                          : item.featured
                            ? 'text-[#10B981]'
                            : 'text-[#D4AF37]'
                      }`}
                    />
                    <span className="text-sm truncate flex-1">{item.label}</span>
                    {showAlertBadge && (
                      <span
                        className={[
                          'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-mono font-bold tabular-nums inline-flex items-center justify-center shrink-0',
                          isActive
                            ? 'bg-[#0F241D] text-[#D4AF37]'
                            : 'bg-[#EF4444] text-white',
                        ].join(' ')}
                        aria-label={`${unresolvedAlertCount} çözülmedik IoT duýduryşy`}
                      >
                        {unresolvedAlertCount}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#0F241D]" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
            <span>Baş sahypa gaýt</span>
          </Link>
          <Link
            to="/design-system"
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Boxes className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>3D «Ýaşyl Athana»</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-[#FCA5A5] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Ulgamdan çyk</span>
          </button>
        </div>
      </aside>

      {/* Esasy iş meýdany */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[268px]">
        {/* Mobil ýokarky kontekst zoly (Işgär ady + Toplum + Athana hemişe görünýär) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#064E3B] text-white px-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {session?.fullName ?? 'Işgär'}
              </p>
              <p className="text-[10px] text-[#D4AF37] truncate">
                {complexLabel} · {stableLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/staff/health-training"
              aria-label="Saglyk we Türgenleşik"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/85 hover:bg-white/10"
            >
              <HeartPulse className="w-4 h-4" />
            </Link>
            <Link
              to="/staff/stables"
              aria-label="Athanam we Bokslar"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/85 hover:bg-white/10"
            >
              <Warehouse className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Ulgamdan çyk"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FCA5A5] hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop hemişe görünýän Işgär ýokarky paneli */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1] px-8 items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#0F241D] whitespace-nowrap shrink-0">
              {session?.fullName ?? 'Işgär'}
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
            {activeHorseName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
                <span className="font-semibold text-[#0F241D] truncate">{activeHorseName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-[#647A72] whitespace-nowrap">
              {positionLabel}
            </span>
            <PWAInstallButton />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#DCE6E1] text-xs font-semibold text-[#0F241D] hover:border-[#EF4444]/50 hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Çykyş</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobil aşaky 5-düwmeli nawigasiýa zolagy */}
      <nav
        aria-label="Işgär mobil aşaky menýusy"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE6E1] shadow-[0_-4px_16px_rgba(6,78,59,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            const showAlertBadge = item.to === '/staff/iot' && unresolvedAlertCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors relative',
                    isActive
                      ? 'text-[#064E3B] font-bold'
                      : item.featured
                        ? 'text-[#059669] font-semibold'
                        : 'text-[#647A72] font-medium',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute top-0 inset-x-2.5 h-0.5 rounded-full bg-[#D4AF37]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? 'text-[#064E3B]'
                            : item.featured
                              ? 'text-[#10B981]'
                              : 'text-[#647A72]'
                        }`}
                      />
                      {showAlertBadge && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-mono font-bold tabular-nums inline-flex items-center justify-center">
                          {unresolvedAlertCount}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] leading-none truncate max-w-full px-0.5">
                      {item.shortLabel}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
