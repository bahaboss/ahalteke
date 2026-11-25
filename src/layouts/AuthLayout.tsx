import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { AnimatedHorseLogo } from '../components/common';

export const AuthLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  const isRegister = pathname === '/register';

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F172A] flex flex-col">
      {/* Dedicated AuthLayout Glassmorphism Top Bar */}
      <header className="sticky top-0 z-30 bg-[#042F24]/92 backdrop-blur-xl text-white border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <AnimatedHorseLogo size="sm" variant="gold" animated />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
              Smart &amp; Green <span className="text-[#D4AF37]">Ahalteke</span>
            </span>
          </Link>

          <nav
            aria-label="Giriş sahypasy nawigasiýasy"
            className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-white/8 border border-white/10"
          >
            <Link
              to="/login"
              className={[
                'min-h-[36px] px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap',
                !isRegister
                  ? 'bg-[#D4AF37] text-[#0F172A]'
                  : 'text-white/80 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Giriş</span>
            </Link>
            <Link
              to="/register"
              className={[
                'min-h-[36px] px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap',
                isRegister
                  ? 'bg-[#D4AF37] text-[#0F172A]'
                  : 'text-white/80 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hasap açmak</span>
            </Link>
          </nav>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/55 text-xs font-semibold text-white hover:bg-[#D4AF37]/15 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span className="hidden sm:inline">Baş sahypa dolan</span>
            <span className="sm:hidden">Baş sahypa</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
