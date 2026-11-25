import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { STAFF_POSITIONS, TURKMEN_REGIONS } from '../../mockData';
import {
  fetchComplexes,
  fetchStables,
  loginAdmin,
  loginDemoRole,
  loginStaff,
  loginUser,
  registerUser,
} from '../../services';
import type {
  AuthSession,
  AuthenticatedRole,
  EquestrianComplex,
  Stable,
  StaffPosition,
} from '../../types';
import { AnimatedHorseLogo, Button } from '../common';

export interface AuthPageProps {
  initialRole?: AuthenticatedRole;
  initialUserMode?: 'login' | 'register';
  embeddedInLayout?: boolean;
  currentSession?: AuthSession | null;
  onOpenActiveWorkspace?: () => void;
  onChangeUserMode?: (mode: 'login' | 'register') => void;
  onBackToLanding: () => void;
  onAuthenticated: (session: AuthSession) => void;
}

const ROLE_META: Record<
  AuthenticatedRole,
  {
    tabLabel: string;
    shortLabel: string;
    heading: string;
    description: string;
    highlights: string[];
  }
> = {
  user: {
    tabLabel: 'Ýönekeý Ulanyjy',
    shortLabel: 'Ulanyjy',
    heading: 'At Eýesi we Raýatlar Üçin Sanly Kabinet',
    description:
      'Ahalteke bedewleriniň QR-pasporty, bäsleşik hasaba alnyşy, milli kitaphana we Aba Annaýew akademiýasyna onlaýn ýüz tutmalar bir ýerde.',
    highlights: [
      'Bedewleriň şejeresini we saglyk pasportyny yzarlamak',
      'Bäsleşiklere we akademiýa onlaýn arza tabşyrmak',
      '«Ýaşyl Athana» ekologiýa görkezijilerini görmek',
    ],
  },
  staff: {
    tabLabel: 'Işgär (Atçylyk toplumy)',
    shortLabel: 'Işgär',
    heading: 'Atçylyk Sport Toplumlarynyň Işgär Girişi',
    description:
      'Degişli atçylyk sport toplumyňyzy, jogapkär athanaňyzy we wezipäňizi saýlap IoT datçik gözegçiligine hem-de gündelik ideg hasabatlaryna giriň.',
    highlights: [
      'Saýlanan toplum we athana boýunça 24/7 IoT gözegçilik',
      'Gündelik iýmitlendiriş, türgenleşik we weterinar bellikleri',
      'Gün energiýasy, ýagyş suwy we bio-kompost hasabatlary',
    ],
  },
  admin: {
    tabLabel: 'Admin',
    shortLabel: 'Admin',
    heading: 'Merkezi Admin Dolandyryş Paneli',
    description:
      'Ähli welaýat atçylyk sport toplumlarynyň «Ýaşyl Reýtingi», täze athanalary we işgärleri bellemek, ýaryş/kitaphana kontenti hem-de akademiýa anketalarynyň eksporty.',
    highlights: [
      'Ähli toplumlaryň we athanalaryň «Ýaşyl Reýting» statistikasy',
      'Täze athana goşmak we işgärleri toplum/athana berkidip dolandyrmak',
      'Ýaryşlar, kitaphana kontenti we akademiýa anketalaryny CSV eksport etmek',
    ],
  },
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialRole = 'user',
  initialUserMode = 'login',
  embeddedInLayout = false,
  currentSession = null,
  onOpenActiveWorkspace,
  onChangeUserMode,
  onBackToLanding,
  onAuthenticated,
}) => {
  const [activeRole, setActiveRole] = useState<AuthenticatedRole>(initialRole);
  const [userMode, setUserMode] = useState<'login' | 'register'>(initialUserMode);

  // User login form state
  const [userIdentifier, setUserIdentifier] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  // User register form state
  const [regFullName, setRegFullName] = useState('');
  const [regRegion, setRegRegion] = useState(TURKMEN_REGIONS[1]);
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Staff login form state
  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);
  const [stables, setStables] = useState<Stable[]>([]);
  const [selectedComplexId, setSelectedComplexId] = useState('');
  const [selectedStableId, setSelectedStableId] = useState('');
  const [staffPosition, setStaffPosition] = useState<StaffPosition>('Baş Seýis / Seýis');
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Admin login form state
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Async submission states
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    setUserMode(initialUserMode);
  }, [initialUserMode]);

  // Load complexes catalog asynchronously via complexService
  useEffect(() => {
    let active = true;
    const loadComplexCatalog = async () => {
      const res = await fetchComplexes();
      if (!active) return;
      setComplexes(res.data);
      if (res.data.length > 0) {
        setSelectedComplexId((prev) => prev || res.data[0].id);
      }
    };
    loadComplexCatalog();
    return () => {
      active = false;
    };
  }, []);

  // Dynamically load stables when selected complex changes
  useEffect(() => {
    if (!selectedComplexId) return;
    let active = true;
    const loadStablesForComplex = async () => {
      const res = await fetchStables(selectedComplexId);
      if (!active) return;
      setStables(res.data);
      setSelectedStableId(res.data[0]?.id ?? '');
    };
    loadStablesForComplex();
    return () => {
      active = false;
    };
  }, [selectedComplexId]);

  const handleRoleSwitch = (nextRole: AuthenticatedRole) => {
    setActiveRole(nextRole);
    setErrorMsg(null);
    if (nextRole !== 'user' && userMode === 'register') {
      setUserMode('login');
      onChangeUserMode?.('login');
    }
  };

  const handleUserModeSwitch = (nextMode: 'login' | 'register') => {
    setUserMode(nextMode);
    setErrorMsg(null);
    onChangeUserMode?.(nextMode);
  };

  const handleUserLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginUser({
        emailOrPhone: userIdentifier,
        password: userPassword,
      });
      onAuthenticated(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Girişde säwlik ýüze çykdy.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await registerUser({
        fullName: regFullName,
        region: regRegion,
        emailOrPhone: regIdentifier,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });
      onAuthenticated(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Hasap açmakda säwlik ýüze çykdy.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginStaff({
        complexId: selectedComplexId,
        stableId: selectedStableId,
        staffPosition,
        staffIdentifier,
        password: staffPassword,
      });
      onAuthenticated(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Işgär girişinde säwlik ýüze çykdy.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginAdmin({
        emailOrPhone: adminIdentifier,
        password: adminPassword,
      });
      onAuthenticated(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Admin girişinde säwlik ýüze çykdy.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: AuthenticatedRole) => {
    setErrorMsg(null);
    setDemoLoading(true);
    try {
      const res = await loginDemoRole(
        role,
        role === 'staff'
          ? {
              complexId: selectedComplexId || undefined,
              stableId: selectedStableId || undefined,
              staffPosition,
            }
          : undefined
      );
      onAuthenticated(res.data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Synag girişinde säwlik ýüze çykdy.');
    } finally {
      setDemoLoading(false);
    }
  };

  const currentMeta = ROLE_META[activeRole];
  const selectedComplexObj = complexes.find((c) => c.id === selectedComplexId);

  return (
    <div
      className={
        embeddedInLayout
          ? 'flex-1 bg-[#F8FAF9] text-[#0F172A] flex flex-col'
          : 'min-h-screen bg-[#F8FAF9] text-[#0F172A] flex flex-col'
      }
    >
      {/* Top Bar (Rendered only when AuthPage is used standalone outside AuthLayout) */}
      {!embeddedInLayout && (
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

            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBackToLanding}
              className="border-[#D4AF37]/55 text-white hover:bg-[#D4AF37]/15"
            >
              Baş sahypa dolan
            </Button>
          </div>
        </header>
      )}

      {/* Main Split Editorial Auth Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT COLUMN: Emerald-Gold Editorial Role Context Panel */}
          <section className="lg:col-span-5 relative rounded-3xl bg-[#064E3B] text-white border border-[#D4AF37]/40 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-[0_24px_56px_rgba(6,78,59,0.2)]">
            {/* Subtle Turkmen Geometric Watermark */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="auth-gol-bg" width="84" height="84" patternUnits="userSpaceOnUse">
                  <polygon
                    points="42,8 72,42 42,76 12,42"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="1.1"
                  />
                  <circle cx="42" cy="42" r="3.5" fill="#D4AF37" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#auth-gol-bg)" />
            </svg>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-[#D4AF37]">
                <span>Awtorizasiýa we Rol Saýlawy</span>
                <span aria-hidden="true">·</span>
                <span>Smart &amp; Green Ahalteke</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-white">
                    {currentMeta.heading}
                  </h1>
                  <p className="text-sm text-white/85 leading-relaxed">{currentMeta.description}</p>

                  <ul className="pt-2 space-y-3">
                    {currentMeta.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                        <CheckCircle2
                          className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Quiet Trust Info */}
            <div className="relative z-10 mt-8 pt-5 border-t border-white/15 space-y-2 text-xs text-white/75">
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Sessiýa howpsuzlygy we PWA goldawy</span>
              </div>
              <p className="leading-relaxed">
                Giriş sessiýasy brauzeriň ýadynda (<code className="font-mono text-white/90">localStorage</code>)
                parolsyz profil görnüşinde saklanýar we sahypa täzelenende awtomatik dikeldilýär.
              </p>
            </div>
          </section>

          {/* RIGHT COLUMN: Role Switcher & Interactive Forms */}
          <section className="lg:col-span-7 bg-white rounded-3xl border border-[#DCE6E1] p-6 sm:p-8 shadow-[0_14px_38px_rgba(6,78,59,0.06)] flex flex-col justify-between gap-6">
            <div className="space-y-6">
              {/* Active Session Shortcut (when user is already signed in) */}
              {currentSession && onOpenActiveWorkspace && (
                <div className="rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-[#064E3B]">
                    <span className="font-semibold">{currentSession.fullName}</span>{' '}
                    <span className="text-[#415850]">
                      ({ROLE_META[currentSession.role].tabLabel}) hökmünde işjeň sessiýa bar.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onOpenActiveWorkspace}
                    className="whitespace-nowrap shrink-0"
                  >
                    Panelime geç →
                  </Button>
                </div>
              )}

              {/* 3-Role Segmented Switcher */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#647A72]">1. Roluňyzy saýlaň</p>
                <div
                  role="tablist"
                  aria-label="Giriş rollary"
                  className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#EEF3F1] rounded-2xl"
                >
                  {(
                    [
                      {
                        id: 'user' as AuthenticatedRole,
                        label: 'Ýönekeý Ulanyjy',
                        short: 'Ulanyjy',
                        icon: <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />,
                      },
                      {
                        id: 'staff' as AuthenticatedRole,
                        label: 'Işgär (Atçylyk toplumy)',
                        short: 'Işgär',
                        icon: <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />,
                      },
                      {
                        id: 'admin' as AuthenticatedRole,
                        label: 'Admin',
                        short: 'Admin',
                        icon: <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />,
                      },
                    ]
                  ).map((tab) => {
                    const isSelected = activeRole === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleRoleSwitch(tab.id)}
                        className={[
                          'min-h-[44px] px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap overflow-hidden',
                          isSelected
                            ? 'bg-white text-[#064E3B] shadow-xs ring-1 ring-[#064E3B]/15'
                            : 'text-[#415850] hover:text-[#0F172A]',
                        ].join(' ')}
                      >
                        {tab.icon}
                        <span className="hidden md:inline truncate">{tab.label}</span>
                        <span className="md:hidden">{tab.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inline Error Alert */}
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 flex items-start gap-2.5 text-sm text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Dynamic Role Form Area */}
              <AnimatePresence mode="wait">
                {/* ================================================= */}
                {/* TAB 1: ÝÖNEKEÝ ULANYJY (Giriş + Täze hasap açmak) */}
                {/* ================================================= */}
                {activeRole === 'user' && (
                  <motion.div
                    key="panel-user"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    {/* Login vs Register Sub-tabs */}
                    <div className="flex items-center justify-between gap-3 border-b border-[#EEF3F1] pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUserModeSwitch('login')}
                          className={[
                            'min-h-[40px] px-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer',
                            userMode === 'login'
                              ? 'bg-[#ECFDF5] text-[#064E3B]'
                              : 'text-[#647A72] hover:text-[#0F172A]',
                          ].join(' ')}
                        >
                          Giriş
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUserModeSwitch('register')}
                          className={[
                            'min-h-[40px] px-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer',
                            userMode === 'register'
                              ? 'bg-[#ECFDF5] text-[#064E3B]'
                              : 'text-[#647A72] hover:text-[#0F172A]',
                          ].join(' ')}
                        >
                          Täze hasap açmak
                        </button>
                      </div>
                      <span className="hidden sm:inline text-xs text-[#647A72]">
                        Ýönekeý Ulanyjy
                      </span>
                    </div>

                    {userMode === 'login' ? (
                      <form onSubmit={handleUserLoginSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="user-identifier"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            E-poçta ýa-da telefon belgisi
                          </label>
                          <input
                            id="user-identifier"
                            type="text"
                            autoComplete="username"
                            value={userIdentifier}
                            onChange={(e) => setUserIdentifier(e.target.value)}
                            placeholder="mysal@ahalteke.tm ýa-da +993 65 000000"
                            className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="user-password"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            Parol
                          </label>
                          <div className="relative">
                            <input
                              id="user-password"
                              type={showUserPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              value={userPassword}
                              onChange={(e) => setUserPassword(e.target.value)}
                              placeholder="Azyndan 6 nyşan"
                              className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowUserPassword((p) => !p)}
                              aria-label={showUserPassword ? 'Paroly gizle' : 'Paroly görkez'}
                              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#647A72] hover:text-[#064E3B] cursor-pointer"
                            >
                              {showUserPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col sm:flex-row gap-3">
                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            fullWidth
                            loading={loading}
                            leftIcon={<LogIn className="w-4 h-4" />}
                          >
                            Ulgama gir
                          </Button>
                          <Button
                            type="button"
                            variant="gold"
                            size="md"
                            fullWidth
                            loading={demoLoading}
                            leftIcon={<Sparkles className="w-4 h-4" />}
                            onClick={() => handleDemoLogin('user')}
                          >
                            Synag Ulanyjy hökmünde gir
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleUserRegisterSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-fullname"
                              className="block text-xs font-semibold text-[#415850]"
                            >
                              Doly adyňyz we familiýaňyz
                            </label>
                            <input
                              id="reg-fullname"
                              type="text"
                              autoComplete="name"
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              placeholder="Mysal: Kerim Amanow"
                              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-region"
                              className="block text-xs font-semibold text-[#415850]"
                            >
                              Welaýat / Şäher
                            </label>
                            <select
                              id="reg-region"
                              value={regRegion}
                              onChange={(e) => setRegRegion(e.target.value)}
                              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
                            >
                              {TURKMEN_REGIONS.map((region) => (
                                <option key={region} value={region}>
                                  {region}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="reg-identifier"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            E-poçta ýa-da telefon belgisi
                          </label>
                          <input
                            id="reg-identifier"
                            type="text"
                            autoComplete="email"
                            value={regIdentifier}
                            onChange={(e) => setRegIdentifier(e.target.value)}
                            placeholder="kerim@ahalteke.tm ýa-da +993 65 123456"
                            className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-password"
                              className="block text-xs font-semibold text-[#415850]"
                            >
                              Parol
                            </label>
                            <div className="relative">
                              <input
                                id="reg-password"
                                type={showRegPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="Azyndan 6 nyşan"
                                className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPassword((p) => !p)}
                                aria-label={showRegPassword ? 'Paroly gizle' : 'Paroly görkez'}
                                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#647A72] hover:text-[#064E3B] cursor-pointer"
                              >
                                {showRegPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label
                              htmlFor="reg-confirm-password"
                              className="block text-xs font-semibold text-[#415850]"
                            >
                              Paroly tassyklaň
                            </label>
                            <input
                              id="reg-confirm-password"
                              type={showRegPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="Paroly gaýtalaň"
                              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                              required
                            />
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col sm:flex-row gap-3">
                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            fullWidth
                            loading={loading}
                            leftIcon={<UserPlus className="w-4 h-4" />}
                          >
                            Hasap aç we gir
                          </Button>
                          <Button
                            type="button"
                            variant="gold"
                            size="md"
                            fullWidth
                            loading={demoLoading}
                            leftIcon={<Sparkles className="w-4 h-4" />}
                            onClick={() => handleDemoLogin('user')}
                          >
                            Synag Ulanyjy hökmünde gir
                          </Button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* TAB 2: IŞGÄR (Toplum -> Athana -> Wezipe + Giriş) */}
                {/* ================================================= */}
                {activeRole === 'staff' && (
                  <motion.div
                    key="panel-staff"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
                      {/* Complex / Institution Select */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="staff-complex"
                          className="block text-xs font-semibold text-[#415850]"
                        >
                          Atçylyk sport toplumy / Edara
                        </label>
                        <select
                          id="staff-complex"
                          value={selectedComplexId}
                          onChange={(e) => setSelectedComplexId(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
                          required
                        >
                          {complexes.map((cmp) => (
                            <option key={cmp.id} value={cmp.id}>
                              {cmp.name} ({cmp.region})
                            </option>
                          ))}
                        </select>
                        {selectedComplexObj && (
                          <p className="text-[11px] text-[#647A72] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                            <span>
                              {selectedComplexObj.address} · {selectedComplexObj.ecoCertificationLevel}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Responsible Stable Select (Dynamically Filtered) */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="staff-stable"
                          className="block text-xs font-semibold text-[#415850]"
                        >
                          Jogapkär athana («Athana №1», «Athana №2»)
                        </label>
                        <select
                          id="staff-stable"
                          value={selectedStableId}
                          onChange={(e) => setSelectedStableId(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
                          required
                        >
                          {stables.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Staff Position Selector */}
                      <div className="space-y-1.5">
                        <span className="block text-xs font-semibold text-[#415850]">
                          Wezipe / Hünär ugry
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {STAFF_POSITIONS.map((pos) => {
                            const isSelected = staffPosition === pos.value;
                            return (
                              <button
                                key={pos.value}
                                type="button"
                                onClick={() => setStaffPosition(pos.value)}
                                className={[
                                  'min-h-[44px] px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer',
                                  isSelected
                                    ? 'bg-[#ECFDF5] border-[#064E3B] text-[#064E3B]'
                                    : 'bg-[#F8FAF9] border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
                                ].join(' ')}
                              >
                                <span className="block text-xs font-semibold">{pos.shortLabel}</span>
                                <span className="block text-[11px] text-[#647A72] truncate">
                                  {pos.value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Staff Credentials */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="staff-id"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            Işgär ID ýa-da gulluk e-poçtasy
                          </label>
                          <input
                            id="staff-id"
                            type="text"
                            autoComplete="username"
                            value={staffIdentifier}
                            onChange={(e) => setStaffIdentifier(e.target.value)}
                            placeholder="SEIS-014 ýa-da seis@ahalteke.tm"
                            className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="staff-password"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            Parol
                          </label>
                          <div className="relative">
                            <input
                              id="staff-password"
                              type={showStaffPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              value={staffPassword}
                              onChange={(e) => setStaffPassword(e.target.value)}
                              placeholder="Azyndan 6 nyşan"
                              className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowStaffPassword((p) => !p)}
                              aria-label={showStaffPassword ? 'Paroly gizle' : 'Paroly görkez'}
                              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#647A72] hover:text-[#064E3B] cursor-pointer"
                            >
                              {showStaffPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          fullWidth
                          loading={loading}
                          leftIcon={<LogIn className="w-4 h-4" />}
                        >
                          Işgär hökmünde gir
                        </Button>
                        <Button
                          type="button"
                          variant="gold"
                          size="md"
                          fullWidth
                          loading={demoLoading}
                          leftIcon={<Sparkles className="w-4 h-4" />}
                          onClick={() => handleDemoLogin('staff')}
                        >
                          Synag Işgär hökmünde gir
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ================================================= */}
                {/* TAB 3: ADMIN (Giriş + Synag Admin hökmünde gir)   */}
                {/* ================================================= */}
                {activeRole === 'admin' && (
                  <motion.div
                    key="panel-admin"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1] p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Merkezi Admin Girişi
                          </h2>
                          <p className="text-xs text-[#647A72]">
                            Ähli toplumlar, athanalar, kontent we akademiýa anketalaryny dolandyrmak
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="admin-identifier"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            Admin gulluk e-poçtasy
                          </label>
                          <input
                            id="admin-identifier"
                            type="text"
                            autoComplete="username"
                            value={adminIdentifier}
                            onChange={(e) => setAdminIdentifier(e.target.value)}
                            placeholder="admin@ahalteke.tm"
                            className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="admin-password"
                            className="block text-xs font-semibold text-[#415850]"
                          >
                            Parol
                          </label>
                          <div className="relative">
                            <input
                              id="admin-password"
                              type={showAdminPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="Azyndan 6 nyşan"
                              className="w-full min-h-[44px] pl-3.5 pr-11 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPassword((p) => !p)}
                              aria-label={showAdminPassword ? 'Paroly gizle' : 'Paroly görkez'}
                              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#647A72] hover:text-[#064E3B] cursor-pointer"
                            >
                              {showAdminPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          fullWidth
                          loading={loading}
                          leftIcon={<LogIn className="w-4 h-4" />}
                        >
                          Admin hökmünde gir
                        </Button>
                        <Button
                          type="button"
                          variant="gold"
                          size="md"
                          fullWidth
                          loading={demoLoading}
                          leftIcon={<ShieldCheck className="w-4 h-4" />}
                          onClick={() => handleDemoLogin('admin')}
                        >
                          Synag Admin hökmünde gir
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2 text-xs text-[#647A72]">
              <span>Sessiýa awtomatik saklanýar · Parolsyz profil goragy</span>
              <span>Smart &amp; Green Ahalteke PWA</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
