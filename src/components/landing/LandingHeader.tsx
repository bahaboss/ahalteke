import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { LogIn, Menu, UserCircle2, UserPlus, X } from 'lucide-react';
import type { AuthSession } from '../../types';
import { AnimatedHorseLogo, Button } from '../common';

export interface LandingHeaderProps {
  session: AuthSession | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenWorkspace: () => void;
  onScrollToSection?: (selector: string) => void;
}

const LANDING_SECTIONS = [
  { id: 'scene-hero', href: '#scene-hero', label: 'Açylyş' },
  { id: 'scene-books', href: '#scene-books', label: 'Kitaplar' },
  { id: 'scene-stats', href: '#scene-stats', label: 'Statistika' },
  { id: 'scene-care', href: '#scene-care', label: 'IoT & Eko' },
  { id: 'scene-academy', href: '#scene-academy', label: 'Akademiýa' },
];

function shortRoleLabel(role: AuthSession['role']): string {
  if (role === 'staff') return 'Işgär';
  if (role === 'admin') return 'Admin';
  return 'Ulanyjy';
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  session,
  onOpenAuth,
  onOpenWorkspace,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('scene-hero');
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  // Track active landing section + integer scroll progress for center progress indicator
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const pct = Math.min(100, Math.max(0, Math.round(v * 100)));
      setScrollPercent((prev) => (prev === pct ? prev : pct));
    });

    const elements = LANDING_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') {
      return () => unsubscribe();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-35% 0px -45% 0px',
        threshold: [0.05, 0.25, 0.5],
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, [scrollYProgress]);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setMobileMenuOpen(false);
    if (onScrollToSection) {
      onScrollToSection(href);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const firstName = session ? session.fullName.split(' ')[0] : '';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#042F24]/78 backdrop-blur-xl border-b border-[#D4AF37]/25 text-white shadow-[0_8px_32px_rgba(4,47,36,0.28)]">
      {/* Strict 3-Zone Single-Row Glassmorphism Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1 (Left): Animated Akhal-Teke Horse Logo + Brand Wordmark */}
        <a
          href="#scene-hero"
          onClick={(e) => handleNavClick(e, '#scene-hero')}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <AnimatedHorseLogo size="sm" variant="gold" animated />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
            Smart &amp; Green <span className="text-[#D4AF37]">Ahalteke</span>
          </span>
        </a>

        {/* Zone 2 (Center): Landing Sections Navigation + Progress Indicator */}
        <nav
          aria-label="Baş sahypa bölümleri we ösüş görkezijisi"
          className="hidden lg:flex items-center gap-6"
        >
          <div className="flex items-center gap-5 text-sm font-medium">
            {LANDING_SECTIONS.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <a
                  key={section.href}
                  href={section.href}
                  onClick={(e) => handleNavClick(e, section.href)}
                  className={[
                    'py-1 border-b-2 transition-colors whitespace-nowrap shrink-0',
                    isActive
                      ? 'text-[#D4AF37] border-[#D4AF37]'
                      : 'text-white/80 border-transparent hover:text-white hover:border-[#D4AF37]/50',
                  ].join(' ')}
                >
                  {section.label}
                </a>
              );
            })}
          </div>

          <div
            aria-label={`Sahypanyň geçilen bölegi: ${scrollPercent}%`}
            className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/15 shrink-0"
          >
            <div className="w-16 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
                className="h-full w-full bg-gradient-to-r from-[#10B981] to-[#D4AF37]"
              />
            </div>
            <span className="font-mono tabular-nums text-[11px] font-semibold text-[#D4AF37] w-8 text-right">
              {scrollPercent}%
            </span>
          </div>
        </nav>

        {/* Zone 3 (Right): Direct /login & /register Gold Actions (or Signed-in Workspace) */}
        <div className="flex items-center gap-2 shrink-0">
          {session ? (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<UserCircle2 className="w-4 h-4" />}
              onClick={onOpenWorkspace}
              className="whitespace-nowrap max-w-[210px]"
            >
              <span className="truncate">
                {firstName} · {shortRoleLabel(session.role)}
              </span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAuth('login');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/55 bg-white/5 hover:bg-[#D4AF37]/15 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                <span>Giriş</span>
              </Link>
              <Link
                to="/register"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenAuth('register');
                }}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C39E2A] text-xs font-semibold text-[#0F172A] shadow-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-white"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Hasap açmak</span>
                <span className="sm:hidden">Giriş</span>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Menýuny ýapmak' : 'Menýuny açmak'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-white/90 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Dropdown Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            aria-label="Mobil nawigasiýa"
            className="lg:hidden border-t border-[#D4AF37]/20 bg-[#042F24]/96 backdrop-blur-xl px-4 py-3 space-y-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {LANDING_SECTIONS.map((section) => {
                const isActive = activeSectionId === section.id;
                return (
                  <a
                    key={section.href}
                    href={section.href}
                    onClick={(e) => handleNavClick(e, section.href)}
                    className={[
                      'min-h-[44px] px-3.5 inline-flex items-center rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'text-white/90 hover:bg-white/10 hover:text-[#D4AF37]',
                    ].join(' ')}
                  >
                    {section.label}
                  </a>
                );
              })}
            </div>

            {!session && (
              <div className="pt-2 border-t border-white/15 flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D4AF37]/50 text-sm font-semibold text-white"
                >
                  <LogIn className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  <span>Giriş</span>
                </Link>
                <Link
                  to="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] text-sm font-semibold text-[#0F172A]"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Hasap açmak</span>
                </Link>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Bottom Edge Scroll Progress Track */}
      <div className="h-[2.5px] w-full bg-white/10 overflow-hidden" aria-hidden="true">
        <motion.div
          style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
          className="h-full w-full bg-gradient-to-r from-[#10B981] via-[#D4AF37] to-[#10B981]"
        />
      </div>
    </header>
  );
};
