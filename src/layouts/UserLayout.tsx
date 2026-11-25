import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Boxes,
  ChevronRight,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import { AnimatedHorseLogo, PWAInstallButton } from '../components/common';
import { useAppStore } from '../store';

interface UserNavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const USER_NAV_ITEMS: UserNavItem[] = [
  { to: '/user/horses', label: 'Atlar dünýäsi', shortLabel: 'Atlar', icon: Compass },
  { to: '/user/competitions', label: 'Geçiriljek ýaryşlar', shortLabel: 'Ýaryşlar', icon: Trophy },
  { to: '/user/books', label: 'Kitaphana', shortLabel: 'Kitaphana', icon: BookOpen },
  { to: '/user/academy', label: 'Akademiýa', shortLabel: 'Akademiýa', icon: GraduationCap },
];

export const UserLayout: React.FC = () => {
  const { session, horses, competitionReminderIds, logout } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const activeNav =
    USER_NAV_ITEMS.find((item) => pathname.startsWith(item.to)) ?? USER_NAV_ITEMS[0];

  const horseDetailMatch = pathname.match(/^\/user\/horses\/([^/]+)$/);
  const activeHorseName = horseDetailMatch
    ? horses.find((h) => h.id === horseDetailMatch[1])?.name ?? 'Bedew pasporty'
    : null;
  const reminderCount = competitionReminderIds.length;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F172A] flex flex-col lg:flex-row">
      {/* Desktop Çep Gapdal Panel (Sidebar) */}
      <aside
        aria-label="Ulanyjy paneli nawigasiýasy"
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
                Ulanyjy Paneli
              </p>
            </div>
          </Link>
        </div>

        {/* Ulanyjy profili */}
        {session && (
          <div className="px-4 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/8 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                <UserCircle2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{session.fullName}</p>
                <p className="text-[11px] text-white/75 truncate">
                  {session.region ?? 'Türkmenistan'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ýakorsyz arassa URL nawigasiýasy */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Ulanyjy ekranlary">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Bölümler
          </p>
          {USER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showReminderCount = item.to === '/user/competitions' && reminderCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'w-full min-h-[46px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-left transition-all duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]',
                    isActive
                      ? 'bg-[#D4AF37] text-[#0F172A] font-bold shadow-xs'
                      : 'text-white/85 hover:bg-white/10 hover:text-white font-medium',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#0F172A]' : 'text-[#D4AF37]'}`}
                    />
                    <span className="text-sm truncate flex-1">{item.label}</span>
                    {showReminderCount && (
                      <span
                        aria-label={`${reminderCount} sany ýatlatma`}
                        className={[
                          'px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-bold shrink-0',
                          isActive
                            ? 'bg-[#064E3B] text-[#D4AF37]'
                            : 'bg-[#10B981]/25 text-[#D4AF37] border border-[#D4AF37]/30',
                        ].join(' ')}
                      >
                        {reminderCount}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#0F172A]" />}
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
        {/* Mobil ýokarky kontekst zoly */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#064E3B] text-white px-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {session?.fullName ?? 'Ulanyjy'}
              </p>
              <p className="text-[10px] text-[#D4AF37] truncate">
                {activeHorseName ? `${activeNav.shortLabel} / ${activeHorseName}` : activeNav.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/"
              aria-label="Baş sahypa"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/85 hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
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

        {/* Desktop ýokarky panel */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1] px-8 items-center justify-between gap-6">
          <nav aria-label="Ýol görkeziji" className="flex items-center gap-2.5 text-sm min-w-0">
            <span className="font-bold text-[#0F172A] whitespace-nowrap shrink-0">
              Ulanyjy Paneli
            </span>
            <span className="text-[#DCE6E1] shrink-0" aria-hidden="true">
              /
            </span>
            {activeHorseName ? (
              <>
                <Link
                  to="/user/horses"
                  className="font-medium text-[#647A72] hover:text-[#064E3B] whitespace-nowrap shrink-0 transition-colors"
                >
                  {activeNav.label}
                </Link>
                <span className="text-[#DCE6E1] shrink-0" aria-hidden="true">
                  /
                </span>
                <span className="font-semibold text-[#064E3B] truncate">{activeHorseName}</span>
              </>
            ) : (
              <span className="font-semibold text-[#064E3B] truncate">{activeNav.label}</span>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-[#647A72] whitespace-nowrap">
              {session?.fullName}
            </span>
            <PWAInstallButton />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobil aşaky 4-düwmeli nawigasiýa zolagy */}
      <nav
        aria-label="Ulanyjy mobil aşaky menýusy"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE6E1] shadow-[0_-4px_16px_rgba(6,78,59,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
          {USER_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const showReminderCount = item.to === '/user/competitions' && reminderCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors relative',
                    isActive ? 'text-[#064E3B] font-bold' : 'text-[#647A72] font-medium',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-[#D4AF37]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative inline-flex">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#064E3B]' : 'text-[#647A72]'}`}
                      />
                      {showReminderCount && (
                        <span
                          aria-label={`${reminderCount} ýatlatma`}
                          className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-md bg-[#D4AF37] text-[#0F172A] text-[10px] font-mono tabular-nums font-bold flex items-center justify-center leading-none"
                        >
                          {reminderCount}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] leading-none truncate max-w-full px-1">
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
