import React from 'react';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Clock,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { AuthSession } from '../../types';
import { AnimatedHorseLogo, Button, Card } from '../common';

export interface AdminPlaceholderViewProps {
  session: AuthSession;
  onBackToLanding: () => void;
  onSwitchRole: () => void;
  onLogout: () => void;
}

const PLANNED_STEP_7_MODULES = [
  {
    title: 'Atçylyk Toplumlarynyň Merkezi Sanawy',
    description: 'Ähli welaýat toplumlaryny we täze «Ýaşyl Athana» bloklaryny hasaba almak.',
    icon: <Building2 className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: 'Ulanyjy we Işgär Rollaryny Dolandyrmak',
    description: 'Seýis, weterinar we eko-inžener rugsatlaryny toplum boýunça sazlamak.',
    icon: <Users className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    title: 'Döwlet Derejesindäki Eko-Audit we Hasabatlar',
    description: '5 welaýatyň suw, gün energiýasy we CO₂ görkezijileriniň bitewi eksporty.',
    icon: <BarChart3 className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
];

export const AdminPlaceholderView: React.FC<AdminPlaceholderViewProps> = ({
  session,
  onBackToLanding,
  onSwitchRole,
  onLogout,
}) => {
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {/* Main Step 7 Placeholder Hero Card */}
        <section className="rounded-3xl bg-[#064E3B] text-white border border-[#D4AF37]/45 p-7 sm:p-10 shadow-[0_24px_56px_rgba(6,78,59,0.22)] space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#D4AF37]">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>7-nji Ädim · Geljekki Tapgyr</span>
            <span aria-hidden="true">·</span>
            <span>Synag Admin Sessiýasy Işjeň</span>
          </div>

          <div className="flex items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-[#D4AF37]/18 border border-[#D4AF37]/45 flex items-center justify-center shrink-0">
              <Lock className="w-7 h-7 text-[#D4AF37]" aria-hidden="true" />
            </span>
            <div className="space-y-2.5">
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-white leading-tight">
                Admin paneli indiki tapgyrda işjeňleşdiriler
              </h1>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl">
                Siz häzir <strong>{session.fullName}</strong> ({session.emailOrPhone}) hökmünde
                ulgama girdiňiz. Tapgyrlaýyn arhitektura düzgünine laýyklykda, doly Merkezi Admin
                Dolandyryş Paneli 7-nji ädimde gurular.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="gold"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBackToLanding}
            >
              Baş sahypa dolan
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={onSwitchRole}
              className="border-[#D4AF37]/60 text-white hover:bg-[#D4AF37]/15"
            >
              Ulanyjy ýa-da Işgär roluna geç
            </Button>
            <Button
              variant="ghost"
              size="md"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={onLogout}
              className="text-white/85 hover:bg-white/10 hover:text-white"
            >
              Admin sessiýasyndan çyk
            </Button>
          </div>
        </section>

        {/* Planned Step 7 Architecture Overview */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>7-nji ädimde goşuljak Admin modullary (Arhitektura meýilnamasy)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANNED_STEP_7_MODULES.map((mod) => (
              <Card key={mod.title} padding="md" className="space-y-3 bg-white">
                <span className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
                  {mod.icon}
                </span>
                <h2 className="font-display text-lg font-bold text-[#0F241D]">{mod.title}</h2>
                <p className="text-sm text-[#415850] leading-relaxed">{mod.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
