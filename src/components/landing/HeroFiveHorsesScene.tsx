import React, { useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Activity,
  ArrowDown,
  Droplets,
  HeartPulse,
  Leaf,
  LogIn,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import type { HeroHorseLayer, RegionEcoRating } from '../../mockData/landingStory';
import { Button } from '../common';

export interface HeroFiveHorsesSceneProps {
  regions: RegionEcoRating[];
  heroHorses: HeroHorseLayer[];
  onStartStory: () => void;
  onOpenAuthModal: () => void;
}

/**
 * Horizontal crop offsets for each of the 5 Turkmen carpet göls
 * from the top strip of /assets/aistudio/bedew_20e11c72.webp when img width = 535%.
 */
const GOL_CROP_LEFT = ['-26%', '-122%', '-218%', '-314%', '-410%'];

const ECO_PARTICLES = [
  { id: 'p1', left: '12%', bottom: '8%', size: 6, delay: '0s', duration: '6.2s' },
  { id: 'p2', left: '26%', bottom: '12%', size: 8, delay: '1.2s', duration: '7.1s' },
  { id: 'p3', left: '40%', bottom: '6%', size: 5, delay: '2.4s', duration: '5.8s' },
  { id: 'p4', left: '54%', bottom: '10%', size: 7, delay: '0.7s', duration: '6.8s' },
  { id: 'p5', left: '68%', bottom: '9%', size: 6, delay: '3.0s', duration: '6.4s' },
  { id: 'p6', left: '82%', bottom: '14%', size: 8, delay: '1.8s', duration: '7.4s' },
  { id: 'p7', left: '48%', bottom: '4%', size: 5, delay: '3.8s', duration: '6.0s' },
  { id: 'p8', left: '62%', bottom: '16%', size: 6, delay: '2.1s', duration: '6.9s' },
];

const CAMERA_STOPS = [
  { id: 'stop-gols', label: '01 · 5 Haly Göli', progress: 0 },
  { id: 'stop-horses', label: '02 · 5 Bedew Perdesi', progress: 0.52 },
  { id: 'stop-portal', label: '03 · 1 Ýaşyl Portal', progress: 0.94 },
];

/**
 * 5-Layer Sticky 3D Camera Journey Hero ("5 Göl — 5 Bedew — 1 Ýaşyl Geljek")
 *
 * Layer 1 (z: -240px): Emerald Energy Portal + Carpet Watermark + Eco-Particles
 * Layer 2 (z: -120px): Outer 2 Dor/Sary Steeds (wide 3D curtain wing)
 * Layer 3 (z:  -40px): Middle 2 Gara Steeds (mid 3D curtain wing)
 * Layer 4 (z:  +40px): Center Ak Steed (front focus) + Live IoT Hologram
 * Layer 5 (z: +110px): Top 5 Floating Interactive Carpet Göls + Golden Headline
 */
export const HeroFiveHorsesScene: React.FC<HeroFiveHorsesSceneProps> = ({
  regions,
  heroHorses,
  onStartStory,
  onOpenAuthModal,
}) => {
  const runwayRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [activeHorseId, setActiveHorseId] = useState<string>('hero-horse-3');

  // Sticky runway scroll progress (0 = top of hero, 1 = end of pinned camera journey)
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 135,
    damping: 26,
    restDelta: 0.001,
  });

  const motionScale = prefersReducedMotion ? 0 : 1;

  // --- LAYER 1 (z: -240px): Emerald Energy Portal + Watermark + Eco-Particles ---
  const portalScale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1.12, 1.32]);
  const portalWatermarkScale = useTransform(smoothProgress, [0, 1], [1, 1.14]);
  const portalMessageOpacity = useTransform(smoothProgress, [0, 0.35, 0.72, 1], [0.1, 0.4, 0.96, 1]);
  const portalMessageScale = useTransform(smoothProgress, [0, 0.55, 1], [0.88, 0.98, 1.06]);
  const sideArchSpread = useTransform(smoothProgress, [0, 1], [1, 1.12]);

  // --- LAYER 2 (z: -120px): Outer 2 Dor/Sary Horses (Wide 3D Curtain) ---
  const outerLeftX = useTransform(smoothProgress, [0, 0.25, 0.95], [0, -32 * motionScale, -185 * motionScale]);
  const outerLeftRotateY = useTransform(smoothProgress, [0, 0.95], [0, 34 * motionScale]);
  const outerLeftScale = useTransform(smoothProgress, [0, 0.95], [1, 0.86]);

  const outerRightX = useTransform(smoothProgress, [0, 0.25, 0.95], [0, 32 * motionScale, 185 * motionScale]);
  const outerRightRotateY = useTransform(smoothProgress, [0, 0.95], [0, -34 * motionScale]);
  const outerRightScale = useTransform(smoothProgress, [0, 0.95], [1, 0.86]);

  const outerOpacity = useTransform(smoothProgress, [0, 0.65, 1], [1, 0.85, 0.16]);

  // --- LAYER 3 (z: -40px): Middle 2 Gara Horses (Mid 3D Curtain) ---
  const innerLeftX = useTransform(smoothProgress, [0, 0.25, 0.95], [0, -18 * motionScale, -108 * motionScale]);
  const innerLeftRotateY = useTransform(smoothProgress, [0, 0.95], [0, 22 * motionScale]);
  const innerLeftScale = useTransform(smoothProgress, [0, 0.95], [1, 0.93]);

  const innerRightX = useTransform(smoothProgress, [0, 0.25, 0.95], [0, 18 * motionScale, 108 * motionScale]);
  const innerRightRotateY = useTransform(smoothProgress, [0, 0.95], [0, -22 * motionScale]);
  const innerRightScale = useTransform(smoothProgress, [0, 0.95], [1, 0.93]);

  const middleOpacity = useTransform(smoothProgress, [0, 0.72, 1], [1, 0.9, 0.22]);

  // --- LAYER 4 (z: +40px): Center Ak Bedew (Front Camera Push) + Stage Camera Tilt ---
  const centerScale = useTransform(smoothProgress, [0, 0.55, 1], [1, 1.12, 1.24]);
  const centerY = useTransform(smoothProgress, [0, 0.55, 1], [0, -12 * motionScale, -32 * motionScale]);
  const centerOpacity = useTransform(smoothProgress, [0, 0.7, 0.98], [1, 0.96, 0.2]);
  const stageRotateX = useTransform(smoothProgress, [0, 0.5, 1], [0, 3.5 * motionScale, 7 * motionScale]);
  const stageScale = useTransform(smoothProgress, [0, 0.55, 1], [1, 1.03, 1.07]);

  // --- LAYER 5 (z: +110px): Top 5 Floating Carpet Göls + Golden Left Copy ---
  const golsY = useTransform(smoothProgress, [0, 0.42, 0.88], [0, -28 * motionScale, -118 * motionScale]);
  const golsRotateX = useTransform(smoothProgress, [0, 0.85], [0, 30 * motionScale]);
  const golsScale = useTransform(smoothProgress, [0, 0.35, 0.88], [1, 1.04, 0.86]);
  const golsOpacity = useTransform(smoothProgress, [0, 0.52, 0.9], [1, 0.82, 0.1]);

  const copyX = useTransform(smoothProgress, [0, 0.45, 0.95], [0, -14 * motionScale, -56 * motionScale]);
  const copyY = useTransform(smoothProgress, [0, 0.95], [0, -24 * motionScale]);
  const copyOpacity = useTransform(smoothProgress, [0, 0.62, 0.96], [1, 0.88, 0.22]);

  const activeRegion = regions.find((r) => r.id === activeRegionId) ?? null;
  const activeHorse = heroHorses.find((h) => h.id === activeHorseId) ?? heroHorses[2] ?? null;

  const getHorseLayerMotion = (side: HeroHorseLayer['side']) => {
    switch (side) {
      case 'outer-left':
        return { x: outerLeftX, rotateY: outerLeftRotateY, scale: outerLeftScale, opacity: outerOpacity };
      case 'inner-left':
        return { x: innerLeftX, rotateY: innerLeftRotateY, scale: innerLeftScale, opacity: middleOpacity };
      case 'center':
        return { scale: centerScale, y: centerY, opacity: centerOpacity };
      case 'inner-right':
        return { x: innerRightX, rotateY: innerRightRotateY, scale: innerRightScale, opacity: middleOpacity };
      case 'outer-right':
        return { x: outerRightX, rotateY: outerRightRotateY, scale: outerRightScale, opacity: outerOpacity };
    }
  };

  const getLayerZIndex = (layer: HeroHorseLayer['layer'], isActive: boolean) => {
    if (isActive) return 38;
    if (layer === 'front') return 30;
    if (layer === 'middle') return 20;
    return 10;
  };

  const handleJumpCameraStop = (targetProgress: number) => {
    const el = runwayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const runwayTop = window.scrollY + rect.top;
    const scrollableDistance = Math.max(0, el.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: runwayTop + scrollableDistance * targetProgress,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="scene-hero"
      ref={runwayRef}
      className="relative bg-[#064E3B] text-white min-h-[150vh] lg:h-[225vh]"
    >
      {/* STICKY 3D CAMERA STAGE */}
      <div className="sticky top-16 min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-x-clip lg:overflow-hidden flex flex-col justify-between bg-[#064E3B]">
        {/* ============================================================ */}
        {/* LAYER 1 (z: -240px): Emerald Energy Portal & Carpet Watermark */}
        {/* ============================================================ */}
        <motion.div
          aria-hidden="true"
          style={{ scale: portalWatermarkScale }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 64% 48%, rgba(16,185,129,0.3) 0%, rgba(6,78,59,0.92) 55%, rgba(4,47,36,1) 100%)',
            }}
          />

          {/* Turkmen Geometric Carpet Watermark */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="turkmen-gol-watermark" width="96" height="96" patternUnits="userSpaceOnUse">
                <polygon
                  points="48,10 82,48 48,86 14,48"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.2"
                />
                <polygon
                  points="48,24 68,48 48,72 28,48"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="0.9"
                />
                <circle cx="48" cy="48" r="4" fill="#D4AF37" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#turkmen-gol-watermark)" />
          </svg>
        </motion.div>

        {/* Thin Golden Architectural Outer Frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 sm:inset-4 rounded-3xl border border-[#D4AF37]/35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3.5 sm:inset-5 rounded-[22px] border border-[#D4AF37]/15"
        />

        {/* Curved White-Gold Side Architectural Arches */}
        <motion.svg
          aria-hidden="true"
          style={{ scaleX: sideArchSpread }}
          viewBox="0 0 1440 760"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
        >
          <path d="M 0 0 L 145 0 Q 34 380 155 760 L 0 760 Z" fill="url(#sideArchGradL)" />
          <path d="M 1440 0 L 1295 0 Q 1406 380 1285 760 L 1440 760 Z" fill="url(#sideArchGradR)" />
          <path d="M 145 0 Q 34 380 155 760" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <path d="M 1295 0 Q 1406 380 1285 760" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <defs>
            <linearGradient id="sideArchGradL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="sideArchGradR" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.06" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* MAIN PINNED HERO CONTENT */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 pt-4 pb-4 sm:pt-5 lg:py-4 flex-1 flex flex-col justify-center gap-4 lg:gap-5">
          {/* ============================================================ */}
          {/* LAYER 5 (z: +110px): 5 Floating Interactive Carpet Göls       */}
          {/* ============================================================ */}
          <div style={{ perspective: '1200px' }} className="relative z-30">
            <motion.div
              style={{
                y: golsY,
                rotateX: golsRotateX,
                scale: golsScale,
                opacity: golsOpacity,
                transformStyle: 'preserve-3d',
              }}
              className="flex flex-col items-center"
            >
              <div className="w-full max-w-4xl grid grid-cols-5 gap-2 sm:gap-3.5 items-center">
                {regions.map((region, index) => {
                  const isSelected = activeRegionId === region.id;
                  return (
                    <motion.button
                      key={region.id}
                      type="button"
                      whileHover={{ y: -4, scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => setActiveRegionId(region.id)}
                      onFocus={() => setActiveRegionId(region.id)}
                      onClick={() =>
                        setActiveRegionId((prev) => (prev === region.id ? null : region.id))
                      }
                      aria-label={`${region.regionName} — ${region.golName}, Ýaşyl Reýting ${region.ecoScore}/100`}
                      style={{ animationDelay: `${index * 0.45}s` }}
                      className={[
                        'animate-gol-float group relative rounded-2xl p-1.5 sm:p-2 transition-shadow duration-200 cursor-pointer',
                        'focus-visible:outline-2 focus-visible:outline-[#D4AF37]',
                        isSelected
                          ? 'bg-white/96 ring-2 ring-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.52)]'
                          : 'bg-white/90 hover:bg-white ring-1 ring-[#D4AF37]/55 shadow-[0_8px_22px_rgba(0,0,0,0.28)]',
                      ].join(' ')}
                    >
                      <div className="relative w-full aspect-[1.42/1] overflow-hidden rounded-xl bg-white">
                        <img
                          src="/assets/aistudio/bedew_20e11c72.webp"
                          alt={region.golName}
                          referrerPolicy="no-referrer"
                          className="absolute max-w-none pointer-events-none select-none"
                          style={{
                            width: '535%',
                            height: 'auto',
                            left: GOL_CROP_LEFT[region.stripIndex] ?? '-26%',
                            top: '-13%',
                          }}
                        />
                      </div>
                      <div className="mt-1 text-center">
                        <p className="text-[10px] sm:text-xs font-semibold text-[#064E3B] truncate">
                          {region.regionName}
                        </p>
                        <p className="hidden sm:block font-mono tabular-nums text-[10px] font-semibold text-[#059669]">
                          Eko {region.ecoScore}/100
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Glassmorphism Welaýat «Ýaşyl Reýtingi» Card (AnimatePresence) */}
              <div className="mt-2.5 min-h-[64px] w-full max-w-2xl flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {activeRegion ? (
                    <motion.div
                      key={activeRegion.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      role="region"
                      aria-live="polite"
                      className="w-full rounded-2xl bg-[#042F24]/84 backdrop-blur-md border border-[#D4AF37]/45 px-4 sm:px-5 py-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.34)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold">
                          <span>{activeRegion.golName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{activeRegion.regionName}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/90 leading-snug">
                          {activeRegion.highlight}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/15 pt-2 sm:pt-0 sm:pl-4 font-mono tabular-nums text-xs">
                        <div>
                          <span className="block text-[10px] text-white/65 font-sans">Ýaşyl Reýting</span>
                          <span className="text-sm font-bold text-[#10B981]">
                            {activeRegion.ecoScore}/100
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/65 font-sans">Gün paýy</span>
                          <span className="text-sm font-semibold text-[#D4AF37]">
                            {activeRegion.solarSharePercent}%
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/65 font-sans">Suw tygşydy</span>
                          <span className="text-sm font-semibold text-white">
                            +{activeRegion.waterSavedPercent}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="gol-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-white/75 text-center"
                    >
                      Welaýatyň «Ýaşyl Reýtingini» görmek üçin ýokardaky 5 haly gölünden birini saýlaň
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* MAIN SPLIT: Left Golden Headline (Layer 5) + Right/Center 5-Horse 3D Curtain (Layers 1–4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* LEFT COLUMN: Golden Headline & CTAs */}
            <motion.div
              style={{ x: copyX, y: copyY, opacity: copyOpacity }}
              className="lg:col-span-5 space-y-4 relative z-20"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#D4AF37]/90">
                <span>5 Göl</span>
                <span aria-hidden="true">·</span>
                <span>5 Bedew</span>
                <span aria-hidden="true">·</span>
                <span>1 Ýaşyl Geljek</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.08] bg-gradient-to-r from-[#F6DF8F] via-[#D4AF37] to-[#F4D573] bg-clip-text text-transparent">
                  ALTYN ASYRYŇ BEDEWLERI
                </h1>
                <p className="font-display text-base sm:text-lg font-semibold text-[#10B981] tracking-wide">
                  Smart &amp; Green Ahalteke
                </p>
              </div>

              <p className="text-sm text-white/85 leading-relaxed max-w-lg">
                Türkmenistanyň bäş welaýatynyň miras ruhuny, behişdi ahalteke bedewleriniň sanly IoT
                gözegçiligini we «Ýaşyl Athana» ekologiýa ülňülerini birleşdirýän milli sanly platforma.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="gold"
                  size="md"
                  rightIcon={<ArrowDown className="w-4 h-4" />}
                  onClick={onStartStory}
                >
                  Hekaýany başla
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<LogIn className="w-4 h-4" />}
                  onClick={onOpenAuthModal}
                  className="border-[#D4AF37]/65 text-white hover:bg-[#D4AF37]/15"
                >
                  Giriş
                </Button>
              </div>

              <div className="pt-3 border-t border-white/15 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-mono tabular-nums text-lg font-bold text-[#D4AF37]">32</p>
                  <p className="text-white/70">Ýaşyl athana</p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-lg font-bold text-[#10B981]">84%</p>
                  <p className="text-white/70">Gün energiýasy</p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-lg font-bold text-white">24/7</p>
                  <p className="text-white/70">IoT gözegçilik</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT/CENTER STAGE: Layers 1–4 (Portal + 3 Horse Depth Planes + IoT Hologram) */}
            <div className="lg:col-span-7 relative z-20" style={{ perspective: '1200px' }}>
              <motion.div
                style={{
                  rotateX: stageRotateX,
                  scale: stageScale,
                  transformStyle: 'preserve-3d',
                }}
                className="relative rounded-3xl border border-[#D4AF37]/45 bg-gradient-to-b from-[#085E47]/90 via-[#064E3B]/95 to-[#04392B] p-2.5 sm:p-3.5 shadow-[0_28px_70px_rgba(0,0,0,0.45)] overflow-hidden"
              >
                {/* LAYER 1 Portal Glow + Rising Eco-Particles */}
                <motion.div
                  aria-hidden="true"
                  style={{ scale: portalScale }}
                  className="pointer-events-none absolute inset-x-8 top-4 bottom-12 rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(16,185,129,0.52),rgba(212,175,55,0.2)_48%,transparent_72%)] blur-xl"
                />

                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  {ECO_PARTICLES.map((particle) => (
                    <span
                      key={particle.id}
                      className="animate-eco-particle absolute rounded-full bg-[#34D399]"
                      style={{
                        left: particle.left,
                        bottom: particle.bottom,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDelay: particle.delay,
                        animationDuration: particle.duration,
                        boxShadow: '0 0 10px rgba(52, 211, 153, 0.78)',
                      }}
                    />
                  ))}
                </div>

                {/* 5-Layer 3D Camera Curtain Stage */}
                <div
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative w-full aspect-[1.55/1] rounded-2xl overflow-hidden bg-gradient-to-b from-[#E9F5EE] via-[#DCEEE4] to-[#D4DAD7] shadow-inner"
                >
                  {/* LAYER 1 Center Portal Reveal (Illuminates as 5 horses part on scroll) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#064E3B] via-[#07664D] to-[#04392B] text-center px-6"
                  >
                    <motion.div
                      style={{ opacity: portalMessageOpacity, scale: portalMessageScale }}
                      className="flex flex-col items-center"
                    >
                      <span className="w-12 h-12 rounded-2xl bg-[#10B981]/20 border border-[#D4AF37]/50 flex items-center justify-center mb-3">
                        <Leaf className="w-6 h-6 text-[#34D399]" />
                      </span>
                      <p className="font-display text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                        1 Ýaşyl Geljek
                      </p>
                      <p className="mt-1.5 text-xs sm:text-sm text-white/85 max-w-xs leading-relaxed">
                        Milli miras we akylly ekologiýa portaly açyldy — aşak süýşürip hekaýany dowam ediň
                      </p>
                    </motion.div>
                  </div>

                  {/* LAYERS 2, 3, 4: 5 Clipped Horse Depth Planes */}
                  {heroHorses.map((horse, idx) => {
                    const isActive = activeHorse?.id === horse.id;
                    const motionStyle = getHorseLayerMotion(horse.side);

                    return (
                      <motion.div
                        key={horse.id}
                        style={{
                          ...motionStyle,
                          zIndex: getLayerZIndex(horse.layer, isActive),
                          transformStyle: 'preserve-3d',
                        }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div
                          className="w-full h-full transition-transform duration-300 ease-out"
                          style={{
                            transform: isActive
                              ? 'translateY(-6px) scale(1.035)'
                              : 'translateY(0px) scale(1)',
                            filter: isActive
                              ? 'drop-shadow(0 12px 24px rgba(6, 78, 59, 0.45))'
                              : 'drop-shadow(0 6px 12px rgba(6, 78, 59, 0.22))',
                          }}
                        >
                          <div
                            className="animate-horse-breathe w-full h-full"
                            style={{ animationDelay: `${idx * 0.65}s` }}
                          >
                            <img
                              src="/assets/aistudio/bedew_20e11c72.webp"
                              alt={`${horse.name} — ${horse.coatLabel}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-auto -mt-[21.5%] select-none"
                              style={{ clipPath: horse.clipPath }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Silver & Gold Jewelry Light Shimmer Sweep */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
                  >
                    <div className="animate-jewelry-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-[#FBF7E9]/65 to-transparent" />
                  </div>

                  {/* Interactive Hover / Tap Zones for Each of the 5 Horses */}
                  <div className="absolute inset-0 z-40 grid grid-cols-5">
                    {heroHorses.map((horse) => {
                      const isActive = activeHorse?.id === horse.id;
                      return (
                        <button
                          key={`hit-${horse.id}`}
                          type="button"
                          onMouseEnter={() => setActiveHorseId(horse.id)}
                          onFocus={() => setActiveHorseId(horse.id)}
                          onClick={() => setActiveHorseId(horse.id)}
                          aria-label={`${horse.name} (${horse.coatLabel}) — IoT görkezijilerini görmek`}
                          className="relative h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D4AF37]"
                        >
                          <span
                            className={[
                              'absolute bottom-2.5 left-1/2 -translate-x-1/2 h-1.5 rounded-full transition-all duration-200',
                              isActive ? 'w-7 bg-[#D4AF37]' : 'w-2 bg-[#064E3B]/45',
                            ].join(' ')}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* LAYER 4 Live IoT Hologram Overlay (AnimatePresence) */}
                  <AnimatePresence mode="wait">
                    {activeHorse && (
                      <motion.div
                        key={activeHorse.id}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        role="status"
                        aria-live="polite"
                        className="pointer-events-none absolute top-2.5 left-2.5 right-2.5 sm:right-auto sm:max-w-[335px] z-50 rounded-2xl bg-[#042F24]/88 backdrop-blur-md border border-[#10B981]/50 px-3.5 py-2.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.38)]"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-[#D4AF37] truncate">
                            {activeHorse.name} · {activeHorse.coatLabel}
                          </span>
                          <span className="text-white/70 shrink-0">{activeHorse.region}</span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-mono tabular-nums text-white/95">
                          <span className="inline-flex items-center gap-1">
                            <HeartPulse className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                            Ýürek urşy: {activeHorse.heartRateBpm} bpm
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
                            Suw: +{activeHorse.waterSavedPercent}%
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#D4AF37] font-sans font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Ýaşyl Athana: {activeHorse.stableStatus}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Stone Terrace Horse Selector Strip */}
                <div className="mt-2.5 rounded-xl bg-white/10 border border-white/15 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {heroHorses.map((horse) => {
                      const isSelected = activeHorse?.id === horse.id;
                      return (
                        <button
                          key={`chip-${horse.id}`}
                          type="button"
                          onClick={() => setActiveHorseId(horse.id)}
                          className={[
                            'min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0F241D] font-semibold'
                              : 'text-white/80 hover:bg-white/10 hover:text-white',
                          ].join(' ')}
                        >
                          {horse.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-white/75 pr-1">
                    <Activity className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                    <span>5-gatlakly 3D kamera · Aşak süýşüriň</span>
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Stone Terrace + Sticky 3D Camera Journey Stops Bar */}
        <div className="relative z-20 border-t border-[#D4AF37]/40 bg-gradient-to-b from-[#DCE5E1] to-[#F8FAF9] text-[#0F241D]">
          <div className="h-[3px] w-full bg-[#DCE6E1] overflow-hidden" aria-hidden="true">
            <motion.div
              style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
              className="h-full w-full bg-gradient-to-r from-[#064E3B] via-[#D4AF37] to-[#10B981]"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[#064E3B] font-semibold">
              <Sun className="w-3.5 h-3.5 text-[#B89122]" aria-hidden="true" />
              3D KAMERA SYÝAHATY
            </span>

            <div className="flex items-center gap-1 sm:gap-2 mx-auto sm:mx-0">
              {CAMERA_STOPS.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => handleJumpCameraStop(stop.progress)}
                  className="min-h-[32px] px-2.5 py-0.5 rounded-lg font-medium text-[#415850] hover:text-[#064E3B] hover:bg-[#064E3B]/8 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {stop.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onStartStory}
              className="hidden md:inline-flex items-center gap-1 font-semibold text-[#064E3B] hover:text-[#10B981] transition-colors cursor-pointer"
            >
              <span>Indiki sahna</span>
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
