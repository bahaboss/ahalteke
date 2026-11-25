import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  Boxes,
  Building2,
  ChevronRight,
  GraduationCap,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { AnimatedHorseLogo, Modal, PWAInstallButton } from '../components/common';
import { useAppStore } from '../store';

interface AdminNavItem {
  to: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface QuickSearchResult {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  to: string;
}

const SIDEBAR_COLLAPSE_KEY = 'smart_green_ahalteke_admin_sidebar_collapsed_v1';

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin/dashboard',
    label: 'Umumy Gözegçilik',
    shortLabel: 'Gözegçilik',
    description: 'Jemleýji statistika, eko-grafik we Ýaşyl Reýting',
    icon: BarChart3,
  },
  {
    to: '/admin/complexes',
    label: 'Toplumlar we Athanalar',
    shortLabel: 'Toplumlar',
    description: 'Atçylyk sport toplumlary we athanalar (CRUD)',
    icon: Building2,
  },
  {
    to: '/admin/staff',
    label: 'Işgär Bellemeleri',
    shortLabel: 'Işgärler',
    description: 'Seýisler, weterinarlar we eko-inženerler (CRUD)',
    icon: Users,
  },
  {
    to: '/admin/content',
    label: 'Ýaryşlar we Kitaphana',
    shortLabel: 'Kontent',
    description: 'Ulanyjy panelindäki ýaryşlar we kitaplar (CRUD)',
    icon: BookMarked,
  },
  {
    to: '/admin/applications',
    label: 'Akademiýa Anketalary',
    shortLabel: 'Anketalar',
    description: 'Dalaşgärlik anketalary, 4 status we CSV eksport',
    icon: GraduationCap,
  },
];

export const AdminLayout: React.FC = () => {
  const {
    session,
    logout,
    complexes,
    stables,
    staffAssignments,
    competitions,
    books,
    academyApplications,
  } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
        } catch {
          // Storage quota fallback ignored
        }
      }
      return next;
    });
  };

  const activeNav =
    ADMIN_NAV_ITEMS.find((item) => pathname.startsWith(item.to)) ?? ADMIN_NAV_ITEMS[0];

  const pendingApplicationsCount = academyApplications.filter(
    (app) => app.status === 'garalýar'
  ).length;

  const searchResults = useMemo<QuickSearchResult[]>(() => {
    const q = quickQuery.trim().toLowerCase();

    const routeResults: QuickSearchResult[] = ADMIN_NAV_ITEMS.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.to.toLowerCase().includes(q)
    ).map((item) => ({
      id: `route-${item.to}`,
      category: 'Admin Bölümleri',
      title: item.label,
      subtitle: item.description,
      to: item.to,
    }));

    if (!q) {
      return routeResults;
    }

    const complexResults: QuickSearchResult[] = complexes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((c) => ({
        id: `cmp-${c.id}`,
        category: 'Sport Toplumlary',
        title: c.name,
        subtitle: `${c.region} · ${c.ecoCertificationLevel}`,
        to: '/admin/complexes',
      }));

    const stableResults: QuickSearchResult[] = stables
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.headSeisName.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((s) => ({
        id: `stb-${s.id}`,
        category: 'Athanalar',
        title: `${s.name} (${s.code})`,
        subtitle: `Baş seýis: ${s.headSeisName} · ${s.occupiedBoxes}/${s.boxCount} boks`,
        to: '/admin/complexes',
      }));

    const staffResults: QuickSearchResult[] = staffAssignments
      .filter(
        (st) =>
          st.fullName.toLowerCase().includes(q) ||
          st.position.toLowerCase().includes(q) ||
          st.emailOrPhone.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((st) => ({
        id: `stf-${st.id}`,
        category: 'Işgärler',
        title: st.fullName,
        subtitle: `${st.position} · ${st.emailOrPhone}`,
        to: '/admin/staff',
      }));

    const compResults: QuickSearchResult[] = competitions
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((c) => ({
        id: `comp-${c.id}`,
        category: 'Ýaryşlar',
        title: c.title,
        subtitle: `${c.date} · ${c.location}`,
        to: '/admin/content',
      }));

    const bookResults: QuickSearchResult[] = books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((b) => ({
        id: `book-${b.id}`,
        category: 'Kitaphana',
        title: b.title,
        subtitle: `${b.author} · ${b.publishYear}`,
        to: '/admin/content',
      }));

    const appResults: QuickSearchResult[] = academyApplications
      .filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.programName.toLowerCase().includes(q) ||
          a.region.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((a) => ({
        id: `app-${a.id}`,
        category: 'Akademiýa Anketalary',
        title: a.applicantName,
        subtitle: `${a.programName} · ${a.region}`,
        to: '/admin/applications',
      }));

    return [
      ...routeResults,
      ...complexResults,
      ...stableResults,
      ...staffResults,
      ...compResults,
      ...bookResults,
      ...appResults,
    ];
  }, [quickQuery, complexes, stables, staffAssignments, competitions, books, academyApplications]);

  const handleSelectSearchResult = (to: string) => {
    setSearchOpen(false);
    setQuickQuery('');
    navigate(to);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F172A] flex flex-col lg:flex-row">
      {/* Desktop Çep Gapdal Panel (Ýygnalýan Sidebar) */}
      <aside
        aria-label="Admin paneli nawigasiýasy"
        className={[
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#064E3B] text-white border-r border-white/10 z-30 transition-[width] duration-200',
          sidebarCollapsed ? 'lg:w-[80px]' : 'lg:w-[268px]',
        ].join(' ')}
      >
        <div
          className={[
            'py-5 border-b border-white/10 flex items-center',
            sidebarCollapsed ? 'px-3 justify-center' : 'px-5 justify-between gap-2',
          ].join(' ')}
        >
          <Link
            to="/"
            title="Baş sahypa"
            className="flex items-center gap-3 text-left min-w-0 group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          >
            <AnimatedHorseLogo size="sm" variant="gold" animated />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight truncate group-hover:text-[#D4AF37] transition-colors">
                  Smart &amp; Green
                </p>
                <p className="text-[11px] font-medium text-[#D4AF37] tracking-wider uppercase">
                  Merkezi Admin
                </p>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label="Gapdal menýuny ýygna"
              title="Menýuny ýygna"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white/75 hover:bg-white/10 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <div className="px-3 pt-3 flex justify-center">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label="Gapdal menýuny giňelt"
              title="Menýuny giňelt"
              className="w-11 h-10 rounded-xl flex items-center justify-center text-[#D4AF37] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Admin profil kartasy */}
        {session && !sidebarCollapsed && (
          <div className="px-4 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/8 border border-[#D4AF37]/30 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{session.fullName}</p>
                  <p className="text-[11px] text-[#D4AF37] truncate">{session.emailOrPhone}</p>
                </div>
              </div>
              <p className="pt-2 border-t border-white/10 text-[11px] text-white/80">
                Ähli 5 welaýat · Aşgabat · Arkadag
              </p>
            </div>
          </div>
        )}

        {/* 5 arassa URL marşrutly Admin modullary */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Admin ekranlary">
          {!sidebarCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Admin Modullary
            </p>
          )}
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'w-full min-h-[46px] rounded-xl flex items-center transition-all duration-150 relative',
                    sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5 gap-3 text-left',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]',
                    isActive
                      ? 'bg-[#D4AF37] text-[#0F241D] font-bold shadow-xs'
                      : 'text-white/85 hover:bg-white/10 hover:text-white font-medium',
                  ].join(' ')
                }
              >
                {({ isActive }) => {
                  const isApplications = item.to === '/admin/applications';
                  return (
                    <>
                      <Icon
                        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#0F241D]' : 'text-[#D4AF37]'}`}
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="text-sm truncate flex-1">{item.label}</span>
                          {isApplications && pendingApplicationsCount > 0 && (
                            <span
                              aria-label={`${pendingApplicationsCount} garaşylýan anketa`}
                              className={[
                                'font-mono tabular-nums text-xs font-bold shrink-0 px-1.5 py-0.5 rounded-md',
                                isActive
                                  ? 'bg-[#064E3B] text-white'
                                  : 'bg-[#D4AF37]/20 text-[#D4AF37]',
                              ].join(' ')}
                            >
                              {pendingApplicationsCount}
                            </span>
                          )}
                          {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#0F241D]" />}
                        </>
                      )}
                      {sidebarCollapsed && isApplications && pendingApplicationsCount > 0 && (
                        <span
                          aria-label={`${pendingApplicationsCount} garaşylýan anketa`}
                          className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-md bg-[#EF4444] text-white font-mono tabular-nums text-[9px] font-bold flex items-center justify-center leading-none"
                        >
                          {pendingApplicationsCount}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/login"
            title="Rol çalyş (Ulanyjy / Işgär)"
            className={[
              'w-full min-h-[42px] rounded-xl flex items-center text-xs font-medium text-white/85 hover:bg-white/10 hover:text-white transition-colors',
              sidebarCollapsed ? 'justify-center px-2' : 'px-3.5 py-2 gap-2.5',
            ].join(' ')}
          >
            <RefreshCw className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Rol çalyş (Ulanyjy / Işgär)</span>}
          </Link>
          <Link
            to="/"
            title="Baş sahypa gaýt"
            className={[
              'w-full min-h-[42px] rounded-xl flex items-center text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors',
              sidebarCollapsed ? 'justify-center px-2' : 'px-3.5 py-2 gap-2.5',
            ].join(' ')}
          >
            <Home className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Baş sahypa gaýt</span>}
          </Link>
          <Link
            to="/design-system"
            title="3D «Ýaşyl Athana»"
            className={[
              'w-full min-h-[42px] rounded-xl flex items-center text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors',
              sidebarCollapsed ? 'justify-center px-2' : 'px-3.5 py-2 gap-2.5',
            ].join(' ')}
          >
            <Boxes className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>3D «Ýaşyl Athana»</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Ulgamdan çyk"
            className={[
              'w-full min-h-[42px] rounded-xl flex items-center text-xs font-semibold text-[#FCA5A5] hover:bg-white/10 transition-colors cursor-pointer',
              sidebarCollapsed ? 'justify-center px-2' : 'px-3.5 py-2 gap-2.5',
            ].join(' ')}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Ulgamdan çyk</span>}
          </button>
        </div>
      </aside>

      {/* Esasy iş meýdany */}
      <div
        className={[
          'flex-1 flex flex-col min-w-0 transition-[padding] duration-200',
          sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[268px]',
        ].join(' ')}
      >
        {/* Mobil ýokarky kontekst zoly */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#064E3B] text-white px-3.5 flex items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <AnimatedHorseLogo size="sm" variant="gold" animated={false} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">
                {session?.fullName ?? 'Admin'}
              </p>
              <p className="text-[10px] text-[#D4AF37] truncate">
                Merkezi Admin · {activeNav.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Çalt gözleg"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/10 cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              to="/login"
              aria-label="Rol çalyş"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#D4AF37] hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Link>
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
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-[#DCE6E1] px-8 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
            <span className="font-bold text-[#0F172A] whitespace-nowrap shrink-0">
              Merkezi Admin Paneli
            </span>
            <span className="text-[#DCE6E1] shrink-0" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-[#064E3B] truncate">{activeNav.label}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Ähli Admin bölümlerinde çalt gözleg"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] hover:border-[#10B981] text-xs text-[#647A72] hover:text-[#0F172A] inline-flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
              <span>Çalt gözleg...</span>
              <kbd className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-[#DCE6E1] text-[#415850]">
                Ctrl K
              </kbd>
            </button>

            {pendingApplicationsCount > 0 && (
              <Link
                to="/admin/applications"
                className="text-xs font-semibold text-[#064E3B] hover:text-[#059669] transition-colors whitespace-nowrap font-mono tabular-nums"
              >
                Garaşylýan anketalar: {pendingApplicationsCount}
              </Link>
            )}
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

      {/* Mobil aşaky 5-düwmeli nawigasiýa zolagy */}
      <nav
        aria-label="Admin mobil aşaky menýusy"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE6E1] shadow-[0_-4px_16px_rgba(6,78,59,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
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
                {({ isActive }) => {
                  const isApplications = item.to === '/admin/applications';
                  return (
                    <>
                      {isActive && (
                        <span
                          className="absolute top-0 inset-x-2.5 h-0.5 rounded-full bg-[#D4AF37]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative inline-flex items-center justify-center">
                        <Icon
                          className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#064E3B]' : 'text-[#647A72]'}`}
                        />
                        {isApplications && pendingApplicationsCount > 0 && (
                          <span
                            aria-label={`${pendingApplicationsCount} garaşylýan anketa`}
                            className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-md bg-[#EF4444] text-white font-mono tabular-nums text-[9px] font-bold flex items-center justify-center leading-none"
                          >
                            {pendingApplicationsCount}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] leading-none truncate max-w-full px-0.5">
                        {item.shortLabel}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Global Çalt Gözleg Modaly (Ctrl / Cmd + K) */}
      <Modal
        isOpen={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setQuickQuery('');
        }}
        title="Admin Çalt Gözleg"
        subtitle="Ähli 5 Admin bölümi, toplumlar, athanalar, işgärler, ýaryşlar, kitaplar we anketalar boýunça gözläň."
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              autoFocus
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Toplum, athana, işgär, kitap ýa-da dalaşgär adyny ýazyň..."
              aria-label="Global Admin gözlegi"
              className="w-full min-h-[46px] pl-10 pr-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
            />
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#EEF3F1] border border-[#DCE6E1] rounded-xl">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Warehouse className="w-7 h-7 text-[#647A72] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#0F172A]">
                  «{quickQuery}» boýunça netije tapylmady
                </p>
                <p className="text-xs text-[#647A72]">
                  Başga söz ýa-da athana kody bilen synanyşyň.
                </p>
              </div>
            ) : (
              searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res.to)}
                  className="w-full px-4 py-3 text-left hover:bg-[#ECFDF5] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[11px] font-semibold text-[#059669]">{res.category}</p>
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{res.title}</p>
                    <p className="text-xs text-[#647A72] truncate">{res.subtitle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#064E3B] shrink-0" aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
