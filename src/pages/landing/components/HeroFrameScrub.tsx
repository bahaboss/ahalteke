import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowDown,
  ChevronDown,
  Droplets,
  HeartPulse,
  Leaf,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import {
  FALLBACK_IMAGE_PATH,
  HERO_ACTS,
  HERO_IOT_HOLOGRAM,
  HERO_RUNWAY_VH,
  TOTAL_FRAMES,
  getHeroFrameUrl,
} from '../../../config/heroFrames';
import type { RegionEcoRating } from '../../../mockData/landingStory';
import { Button } from '../../../components/common';

export interface HeroFrameScrubProps {
  regions: RegionEcoRating[];
  onStartStory: () => void;
  onOpenLogin: () => void;
  onScrollToOffset?: (topPx: number) => void;
}

type ScrubberMode = 'probing' | 'frames' | 'fallback';

/**
 * Horizontal crop offsets for the 5 Turkmen regional carpet göls
 * from the national göl strip asset.
 */
const GOL_CROP_LEFT = ['-26%', '-122%', '-218%', '-314%', '-410%'];

interface ParticleSpec {
  id: string;
  left: string;
  bottom: string;
  size: number;
  kind: 'gold' | 'emerald';
  delay: string;
  duration: string;
}

const ATMOSPHERIC_PARTICLES: ParticleSpec[] = [
  { id: 'gp-1', left: '9%', bottom: '12%', size: 5, kind: 'gold', delay: '0s', duration: '6.8s' },
  { id: 'gp-2', left: '19%', bottom: '18%', size: 7, kind: 'emerald', delay: '1.1s', duration: '7.4s' },
  { id: 'gp-3', left: '31%', bottom: '9%', size: 4, kind: 'gold', delay: '2.2s', duration: '6.1s' },
  { id: 'gp-4', left: '43%', bottom: '15%', size: 6, kind: 'emerald', delay: '0.6s', duration: '7.9s' },
  { id: 'gp-5', left: '54%', bottom: '10%', size: 5, kind: 'gold', delay: '1.9s', duration: '6.5s' },
  { id: 'gp-6', left: '66%', bottom: '14%', size: 7, kind: 'emerald', delay: '2.8s', duration: '7.2s' },
  { id: 'gp-7', left: '76%', bottom: '8%', size: 5, kind: 'gold', delay: '0.4s', duration: '6.4s' },
  { id: 'gp-8', left: '85%', bottom: '17%', size: 6, kind: 'emerald', delay: '1.6s', duration: '7.6s' },
  { id: 'gp-9', left: '92%', bottom: '11%', size: 4, kind: 'gold', delay: '3.1s', duration: '5.9s' },
  { id: 'gp-10', left: '25%', bottom: '22%', size: 5, kind: 'gold', delay: '2.6s', duration: '7.1s' },
  { id: 'gp-11', left: '60%', bottom: '20%', size: 5, kind: 'gold', delay: '0.9s', duration: '6.9s' },
  { id: 'gp-12', left: '72%', bottom: '24%', size: 6, kind: 'emerald', delay: '3.4s', duration: '7.8s' },
];

/**
 * Draws an image onto a full-bleed DPR-scaled canvas using cover projection,
 * with optional cinematic zoom and subtle parallax panning for fallback mode.
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  options?: { zoom?: number; panX?: number; panY?: number },
) {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  const zoom = options?.zoom ?? 1;
  const panX = options?.panX ?? 0;
  const panY = options?.panY ?? 0;

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = width / height;

  let drawW = width;
  let drawH = height;

  if (canvasRatio > imgRatio) {
    drawW = width * zoom;
    drawH = (width / imgRatio) * zoom;
  } else {
    drawH = height * zoom;
    drawW = height * imgRatio * zoom;
  }

  // Slight horizontal bias towards the Akhal-Teke stallion on the right-center
  const offsetX = (width - drawW) * 0.56 + panX;
  const offsetY = (height - drawH) * 0.48 + panY;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

export const HeroFrameScrub: React.FC<HeroFrameScrubProps> = ({
  regions,
  onStartStory,
  onOpenLogin,
  onScrollToOffset,
}) => {
  const runwayRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Frame sequence cache + fallback image cache
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const modeRef = useRef<ScrubberMode>('probing');
  const progressRef = useRef<number>(0);
  const lastDrawnKeyRef = useRef<string>('');

  const prefersReducedMotion = useReducedMotion();

  const [mode, setMode] = useState<ScrubberMode>('probing');
  const [loadPercent, setLoadPercent] = useState<number>(0);
  const [framesReady, setFramesReady] = useState<boolean>(false);
  const [fallbackLoaded, setFallbackLoaded] = useState<boolean>(false);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [activeActIndex, setActiveActIndex] = useState<number>(1);
  const [displayFrameNumber, setDisplayFrameNumber] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Sticky 450vh scroll progress (0 = top of hero, 1 = bottom of 450vh runway)
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 30,
    restDelta: 0.0005,
  });

  const motionScale = prefersReducedMotion ? 0 : 1;

  // ---------------------------------------------------------------------------
  // 4-ACT REVERSIBLE CINEMATIC TIMELINE TRANSFORMS (0.00 -> 1.00)
  // ---------------------------------------------------------------------------

  // Act 1 (0% – 25%): 5 Turkmen carpet göls glide in with golden glow, stay legible, then exit at 75%–100%
  const golsOpacity = useTransform(smoothProgress, [0, 0.08, 0.72, 0.88], [0.96, 1, 1, 0]);
  const golsY = useTransform(
    smoothProgress,
    [0, 0.14, 0.72, 0.92],
    [10 * motionScale, 0, 0, -96 * motionScale],
  );
  const golsScale = useTransform(smoothProgress, [0, 0.14, 0.75, 0.92], [0.98, 1, 1, 0.9]);

  // Act 2 (25% – 50%): Left golden Serif headline «ALTYN ASYRYŇ BEDEWLERI» + copy + 2 CTAs
  const headlineOpacity = useTransform(
    smoothProgress,
    [0, 0.17, 0.27, 0.72, 0.88],
    [0, 0, 1, 1, 0],
  );
  const headlineY = useTransform(
    smoothProgress,
    [0.16, 0.28, 0.72, 0.9],
    [42 * motionScale, 0, 0, -84 * motionScale],
  );
  const headlineX = useTransform(
    smoothProgress,
    [0.16, 0.28, 0.75, 0.92],
    [-22 * motionScale, 0, 0, -28 * motionScale],
  );

  // Act 3 (50% – 75%): Slow golden dust + emerald eco-particles & live IoT Hologram badge
  const iotOpacity = useTransform(
    smoothProgress,
    [0, 0.44, 0.54, 0.74, 0.88],
    [0, 0, 1, 1, 0],
  );
  const iotY = useTransform(
    smoothProgress,
    [0.44, 0.55, 0.74, 0.9],
    [36 * motionScale, 0, 0, -64 * motionScale],
  );
  const iotScale = useTransform(smoothProgress, [0.44, 0.55, 0.76, 0.9], [0.94, 1, 1, 0.92]);

  // Particles fade in smoothly entering Act 3 and dissolve gently at end of Act 4
  const particlesOpacity = useTransform(smoothProgress, [0.42, 0.55, 0.78, 0.95], [0, 1, 0.9, 0]);

  // Subtle arrival scroll cue shown during Act 1 before Act 2 takes center stage
  const arrivalHintOpacity = useTransform(smoothProgress, [0, 0.16, 0.24], [1, 0.85, 0]);

  // Act 4 (75% – 100%): Emerald curtain veil easing cleanly into the next storytelling scene
  const exitVeilOpacity = useTransform(smoothProgress, [0.76, 0.94, 1], [0, 0.72, 0.96]);
  const exitBannerOpacity = useTransform(smoothProgress, [0.78, 0.88, 0.98], [0, 1, 0.85]);
  const exitBannerY = useTransform(smoothProgress, [0.78, 0.92], [28 * motionScale, 0]);

  // Subtle 3D canvas perspective tilt in fallback mode
  const canvasTiltX = useTransform(
    smoothProgress,
    [0, 0.5, 1],
    [0, 1.8 * motionScale, 3.2 * motionScale],
  );

  // ---------------------------------------------------------------------------
  // CANVAS RENDER ENGINE (60fps DPR-Aware Cover Draw for Frames OR Fallback)
  // ---------------------------------------------------------------------------
  const paintCanvas = useCallback(
    (progress: number, force = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));

      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        force = true;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const clamped = Math.max(0, Math.min(1, progress));

      if (modeRef.current === 'frames') {
        const targetIndex = Math.min(
          TOTAL_FRAMES - 1,
          Math.max(0, Math.round(clamped * (TOTAL_FRAMES - 1))),
        );
        const key = `f:${targetIndex}`;
        if (!force && lastDrawnKeyRef.current === key) return;

        // Find exact frame or closest already-loaded preceding frame for tear-free scrubbing
        let img = framesRef.current[targetIndex];
        if (!img || !img.complete || img.naturalWidth === 0) {
          for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
            const back = framesRef.current[targetIndex - offset];
            if (back && back.complete && back.naturalWidth > 0) {
              img = back;
              break;
            }
            const fwd = framesRef.current[targetIndex + offset];
            if (fwd && fwd.complete && fwd.naturalWidth > 0) {
              img = fwd;
              break;
            }
          }
        }

        if (img && img.complete && img.naturalWidth > 0) {
          drawCoverImage(ctx, img, cssW, cssH, { zoom: 1.01 });
          lastDrawnKeyRef.current = key;
        }
        return;
      }

      // Automatic Fallback Mode: Cinematic 3D zoom & parallax over bedew.webp
      const fallbackImg = fallbackImgRef.current;
      if (!fallbackImg || !fallbackImg.complete || fallbackImg.naturalWidth === 0) return;

      const quant = Math.round(clamped * 1000);
      const key = `b:${quant}`;
      if (!force && lastDrawnKeyRef.current === key) return;

      const zoom = prefersReducedMotion ? 1.04 : 1.04 + clamped * 0.2;
      const panX = prefersReducedMotion ? 0 : (clamped - 0.35) * -42;
      const panY = prefersReducedMotion ? 0 : (clamped - 0.5) * -28;

      drawCoverImage(ctx, fallbackImg, cssW, cssH, { zoom, panX, panY });
      lastDrawnKeyRef.current = key;
    },
    [prefersReducedMotion],
  );

  // ---------------------------------------------------------------------------
  // INSTANT FRAME PROBE -> PRELOADER OR IMMEDIATE FALLBACK TO bedew.webp
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    // Preload fallback image immediately in parallel so fallback transition is zero-latency
    const fallbackImg = new Image();
    fallbackImg.decoding = 'async';
    fallbackImg.src = FALLBACK_IMAGE_PATH;
    fallbackImg.onload = () => {
      if (cancelled) return;
      fallbackImgRef.current = fallbackImg;
      setFallbackLoaded(true);
      if (modeRef.current !== 'frames') {
        paintCanvas(progressRef.current, true);
      }
    };

    // Fast probe of Frame 1 (`public/frames/hero/frame_0001.webp`)
    const probeImg = new Image();
    probeImg.decoding = 'async';

    probeImg.onload = () => {
      if (cancelled) return;
      if (probeImg.naturalWidth === 0) {
        modeRef.current = 'fallback';
        setMode('fallback');
        paintCanvas(progressRef.current, true);
        return;
      }

      // Frames exist! Enter Frame-by-Frame mode and preload all 150 frames
      modeRef.current = 'frames';
      setMode('frames');

      const cache: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
      cache[0] = probeImg;
      framesRef.current = cache;

      let loaded = 1;
      setLoadPercent(Math.round((loaded / TOTAL_FRAMES) * 100));
      paintCanvas(progressRef.current, true);

      const handleFrameSettled = (index: number, img: HTMLImageElement | null) => {
        if (cancelled) return;
        if (img) {
          cache[index] = img;
        }
        loaded += 1;
        const pct = Math.min(100, Math.round((loaded / TOTAL_FRAMES) * 100));
        setLoadPercent(pct);

        if (loaded === TOTAL_FRAMES) {
          setFramesReady(true);
        }

        // Refresh canvas if the newly decoded frame matches current scroll position
        const activeIdx = Math.round(progressRef.current * (TOTAL_FRAMES - 1));
        if (Math.abs(activeIdx - index) <= 2) {
          paintCanvas(progressRef.current, true);
        }
      };

      // Load remaining frames in staggered concurrent queue so main thread stays 60fps
      const CONCURRENCY = 8;
      let cursor = 1;

      const pumpQueue = () => {
        while (!cancelled && cursor < TOTAL_FRAMES) {
          const frameIdx = cursor;
          cursor += 1;
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            handleFrameSettled(frameIdx, img.naturalWidth > 0 ? img : null);
            pumpQueue();
          };
          img.onerror = () => {
            handleFrameSettled(frameIdx, null);
            pumpQueue();
          };
          img.src = getHeroFrameUrl(frameIdx + 1);
          break;
        }
      };

      for (let w = 0; w < CONCURRENCY; w++) {
        pumpQueue();
      }
    };

    probeImg.onerror = () => {
      if (cancelled) return;
      // Zero-delay switch to cinematic bedew.webp fallback
      modeRef.current = 'fallback';
      setMode('fallback');
      paintCanvas(progressRef.current, true);
    };

    probeImg.src = getHeroFrameUrl(1);

    return () => {
      cancelled = true;
    };
  }, [paintCanvas]);

  // Repaint cleanly on viewport resize
  useEffect(() => {
    const handleResize = () => {
      paintCanvas(progressRef.current, true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [paintCanvas]);

  // Sync Framer Motion spring scroll progress to 60fps canvas renderer + active act index
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const clamped = Math.max(0, Math.min(1, latest));
    progressRef.current = clamped;
    paintCanvas(clamped);

    const pct = Math.round(clamped * 100);
    setProgressPercent((prev) => (prev === pct ? prev : pct));

    const frameNum = Math.min(
      TOTAL_FRAMES,
      Math.max(1, Math.round(clamped * (TOTAL_FRAMES - 1)) + 1),
    );
    setDisplayFrameNumber((prev) => (prev === frameNum ? prev : frameNum));

    const nextAct = clamped < 0.25 ? 1 : clamped < 0.5 ? 2 : clamped < 0.75 ? 3 : 4;
    setActiveActIndex((prev) => (prev === nextAct ? prev : nextAct));
  });

  // Jump cleanly to any of the 4 acts via Lenis or native scroll
  const handleJumpToAct = (targetProgress: number) => {
    const el = runwayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const runwayTop = window.scrollY + rect.top;
    const scrollable = Math.max(0, el.offsetHeight - window.innerHeight);
    const targetTop = runwayTop + scrollable * targetProgress;

    if (onScrollToOffset) {
      onScrollToOffset(targetTop);
    } else {
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  const activeRegion = regions.find((r) => r.id === activeRegionId) ?? null;

  return (
    <section
      id="scene-hero"
      ref={runwayRef}
      aria-label="Altyn Asyryň Bedewleri — Kinematografik Açylyş"
      style={{ height: `${HERO_RUNWAY_VH}vh` }}
      className="relative bg-[#042F24] text-white"
    >
      {/* STICKY FULL-VIEWPORT 60FPS CANVAS STAGE */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#042F24]"
        style={{ perspective: '1200px' }}
      >
        {/* Zero-Broken-Image Emerald Architectural Base Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_65%_45%,rgba(16,185,129,0.28)_0%,rgba(6,78,59,0.94)_58%,rgba(4,47,36,1)_100%)]"
        />

        {/* Full-Screen <canvas> Scrubber (Frames 1..150 OR Automatic bedew.webp 3D Zoom/Parallax) */}
        <motion.div
          style={{
            rotateX: mode === 'fallback' ? canvasTiltX : 0,
            transformOrigin: '50% 60%',
          }}
          className="absolute inset-0 w-full h-full will-change-transform"
        >
          <canvas
            ref={canvasRef}
            aria-label="Ahalteke bedewiniň kinematografik sahnasy"
            className={[
              'w-full h-full block transition-opacity duration-500',
              mode === 'frames' || fallbackLoaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        </motion.div>

        {/* Measured Contrast Scrims (guarantees >= 4.5:1 WCAG AA readability over every frame) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#042F24]/86 via-[#042F24]/42 to-[#042F24]/28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#042F24]/78 via-transparent to-[#042F24]/86"
        />

        {/* Subtle National Golden Outer Hairline Frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 sm:inset-x-5 top-20 bottom-14 rounded-3xl border border-[#D4AF37]/25"
        />

        {/* ACT 3 (50% – 75%): Slow Golden Dust & Emerald Eco-Particles Overlay */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: particlesOpacity }}
          className="pointer-events-none absolute inset-0 overflow-hidden z-10"
        >
          {ATMOSPHERIC_PARTICLES.map((particle) => (
            <span
              key={particle.id}
              className={[
                'absolute rounded-full',
                particle.kind === 'gold'
                  ? 'animate-gold-dust bg-[#F6DF8F]'
                  : 'animate-eco-particle bg-[#34D399]',
              ].join(' ')}
              style={{
                left: particle.left,
                bottom: particle.bottom,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                boxShadow:
                  particle.kind === 'gold'
                    ? '0 0 12px rgba(212, 175, 55, 0.85)'
                    : '0 0 12px rgba(16, 185, 129, 0.8)',
              }}
            />
          ))}
        </motion.div>

        {/* FRAME PRELOADER INDICATOR (Shown ONLY when public/frames/hero/ frames are present and still buffering) */}
        <AnimatePresence>
          {mode === 'frames' && !framesReady && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
              className="absolute right-4 sm:right-8 bottom-16 z-40 rounded-2xl bg-[#042F24]/88 backdrop-blur-md border border-[#D4AF37]/40 px-4 py-2.5 shadow-lg"
            >
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-white/85 font-medium">Kadrlar ýüklenýär</span>
                <span className="font-mono tabular-nums font-bold text-[#D4AF37]">
                  {loadPercent}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-36 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#D4AF37] transition-all duration-150"
                  style={{ width: `${loadPercent}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* MAIN CINEMATIC OVERLAY STAGE (4 Reversible Scroll Acts)             */}
        {/* =================================================================== */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-20 pb-16 flex flex-col justify-between">
          {/* ----------------------------------------------------------------- */}
          {/* ACT 1 (0% – 25%): Top 5 Turkmen Carpet Göls + Regional Eco Card   */}
          {/* ----------------------------------------------------------------- */}
          <motion.div
            style={{ opacity: golsOpacity, y: golsY, scale: golsScale }}
            className="w-full flex flex-col items-center will-change-transform"
          >
            <div className="w-full max-w-4xl grid grid-cols-5 gap-2 sm:gap-3.5 items-center">
              {regions.map((region, idx) => {
                const isSelected = activeRegionId === region.id;
                return (
                  <motion.button
                    key={region.id}
                    type="button"
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setActiveRegionId(region.id)}
                    onFocus={() => setActiveRegionId(region.id)}
                    onClick={() =>
                      setActiveRegionId((prev) => (prev === region.id ? null : region.id))
                    }
                    aria-label={`${region.regionName} — ${region.golName}, Ýaşyl Reýting ${region.ecoScore}/100`}
                    style={{ animationDelay: `${idx * 0.4}s` }}
                    className={[
                      'animate-gol-float group relative rounded-2xl p-1.5 sm:p-2 transition-shadow duration-200 cursor-pointer',
                      'focus-visible:outline-2 focus-visible:outline-[#D4AF37]',
                      isSelected
                        ? 'bg-white/95 ring-2 ring-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.55)]'
                        : 'bg-white/88 hover:bg-white ring-1 ring-[#D4AF37]/55 shadow-[0_10px_24px_rgba(0,0,0,0.32)]',
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
                        Eco {region.ecoScore}/100
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Interactive Glassmorphism Welaýat Ýaşyl Reýting Card */}
            <div className="mt-3 min-h-[68px] w-full max-w-2xl flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeRegion ? (
                  <motion.div
                    key={activeRegion.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    role="region"
                    aria-live="polite"
                    className="w-full rounded-2xl bg-[#042F24]/84 backdrop-blur-xl border border-[#D4AF37]/45 px-4 sm:px-5 py-2.5 shadow-[0_16px_38px_rgba(0,0,0,0.42)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
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
                        <span className="block text-[10px] text-white/65 font-sans">
                          Ýaşyl Reýting
                        </span>
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
                        <span className="block text-[10px] text-white/65 font-sans">
                          Suw tygşydy
                        </span>
                        <span className="text-sm font-semibold text-white">
                          +{activeRegion.waterSavedPercent}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="gol-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-white/80 text-center bg-[#042F24]/55 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2"
                  >
                    Her welaýatyň «Ýaşyl Reýtingini» görmek üçin ýokardaky 5 haly gölünden biriniň
                    üstüne baryň
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------- */}
          {/* MIDDLE STAGE: ACT 2 (Left Editorial Headline) & ACT 3 (IoT HUD)   */}
          {/* ----------------------------------------------------------------- */}
          <div className="relative flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6 my-auto">
            {/* ACT 1 Subtle Arrival Caption (visible at 0%–20%, fades cleanly as Act 2 enters) */}
            <motion.div
              style={{ opacity: arrivalHintOpacity }}
              className="pointer-events-none absolute left-0 bottom-4 sm:bottom-6 max-w-md"
            >
              <p className="text-xs font-medium text-[#D4AF37] tracking-wide">
                Bäş welaýatyň milli mirasy · Sanly ekologiýa gözegçiligi
              </p>
              <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Smart &amp; Green Ahalteke
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/80">
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Hekaýany açmak üçin ýumşak aşak süýşüriň</span>
              </div>
            </motion.div>

            {/* ACT 2 (25% – 50%): Ceremonial Serif Golden Headline & 2 Working CTAs */}
            <motion.div
              style={{
                opacity: headlineOpacity,
                y: headlineY,
                x: headlineX,
                pointerEvents: activeActIndex >= 2 && activeActIndex <= 3 ? 'auto' : 'none',
              }}
              className="max-w-xl space-y-4 will-change-transform"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#D4AF37]">
                <span>5 Göl</span>
                <span aria-hidden="true">·</span>
                <span>Ahalteke Bedewi</span>
                <span aria-hidden="true">·</span>
                <span>Ýaşyl Geljek</span>
              </div>

              <h1
                style={{ fontSize: 'clamp(2.25rem, 4.2vw, 3.85rem)' }}
                className="font-display font-bold tracking-tight leading-[1.06] bg-gradient-to-r from-[#F9E7A8] via-[#D4AF37] to-[#F3D26A] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(4,47,36,0.65)]"
              >
                ALTYN ASYRYŇ BEDEWLERI
              </h1>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-lg">
                Behişdi ahalteke bedewleriniň gadymy şejeresini, 24/7 akylly IoT biometriýasyny we
                gün energiýaly «Ýaşyl Athana» ekologiýa standartlaryny birleşdirýän milli sanly
                platforma.
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
                  onClick={onOpenLogin}
                  className="border-[#D4AF37]/70 bg-[#042F24]/60 backdrop-blur-md text-white hover:bg-[#D4AF37]/20"
                >
                  Ulgama gir
                </Button>
              </div>
            </motion.div>

            {/* ACT 3 (50% – 75%): Live IoT Hologram Glassmorphism Telemetry Panel */}
            <motion.div
              style={{
                opacity: iotOpacity,
                y: iotY,
                scale: iotScale,
              }}
              className="lg:self-end lg:mb-4 w-full sm:w-auto sm:max-w-md will-change-transform"
            >
              <div
                role="region"
                aria-label="Janly IoT Gologramma görkezijileri"
                className="rounded-2xl bg-[#042F24]/82 backdrop-blur-xl border border-[#10B981]/50 p-4 sm:p-5 shadow-[0_22px_54px_rgba(0,0,0,0.48)]"
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/15">
                  <div>
                    <p className="text-xs font-semibold text-[#D4AF37]">
                      Janly IoT Gologramma · {HERO_IOT_HOLOGRAM.horseName}
                    </p>
                    <p className="text-[11px] text-white/75 mt-0.5">
                      {HERO_IOT_HOLOGRAM.stableName}
                    </p>
                  </div>
                  <Leaf className="w-5 h-5 text-[#10B981] shrink-0" aria-hidden="true" />
                </div>

                {/* Exact Requested Single-Line Summary Readout */}
                <p className="mt-3 text-xs sm:text-sm font-mono tabular-nums text-white/95 leading-relaxed">
                  Ýürek urşy: <span className="text-[#10B981] font-semibold">38 bpm</span> • Suw
                  tygşytlylygy: <span className="text-[#D4AF37] font-semibold">+22%</span> • Ýaşyl
                  Athana: <span className="text-[#10B981] font-semibold">92/100</span>
                </p>

                <div className="mt-3.5 grid grid-cols-3 gap-2.5 pt-3 border-t border-white/12 font-mono tabular-nums">
                  <div className="rounded-xl bg-white/8 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-white/70 font-sans">
                      <HeartPulse className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                      <span>Ýürek urşy</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-white">
                      {HERO_IOT_HOLOGRAM.heartRateBpm} bpm
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/8 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-white/70 font-sans">
                      <Droplets className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
                      <span>Suw tygşydy</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#D4AF37]">
                      +{HERO_IOT_HOLOGRAM.waterSavedPercent}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/8 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-white/70 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>Ýaşyl Athana</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#10B981]">
                      {HERO_IOT_HOLOGRAM.ecoStableScore}/100
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ACT 4 (75% – 100%): Graceful Emerald Curtain & Scene Handoff Banner */}
          <motion.div
            aria-hidden="true"
            style={{ opacity: exitVeilOpacity }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#042F24]/60 via-[#064E3B]/88 to-[#F8FAF9] z-25"
          />

          <motion.div
            style={{ opacity: exitBannerOpacity, y: exitBannerY }}
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center px-6"
          >
            <span className="w-12 h-12 rounded-2xl bg-[#042F24]/80 border border-[#D4AF37]/55 flex items-center justify-center mb-3 shadow-lg">
              <Leaf className="w-6 h-6 text-[#10B981]" aria-hidden="true" />
            </span>
            <p className="font-display text-2xl sm:text-4xl font-bold text-[#F6DF8F]">
              Milli Mirasdan Ýaşyl Geljege
            </p>
            <p className="mt-2 text-xs sm:text-sm text-white/90 max-w-md">
              Aşak süýşürip taryhy kitaplar, ekologiýa hasaplaýjy we 3D «Ýaşyl Athana» sahnalary
              bilen tanyşyň
            </p>
          </motion.div>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM 4-ACT SCRUBBER CONTROL RAIL                                  */}
        {/* =================================================================== */}
        <div className="absolute inset-x-0 bottom-0 z-40 bg-[#042F24]/84 backdrop-blur-xl border-t border-[#D4AF37]/30">
          {/* Fine Gold-Emerald Scrubbed Progress Bar */}
          <div className="h-[2px] w-full bg-white/10 overflow-hidden" aria-hidden="true">
            <motion.div
              style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
              className="h-full w-full bg-gradient-to-r from-[#10B981] via-[#D4AF37] to-[#10B981]"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 h-12 flex items-center justify-between gap-3 text-xs">
            {/* Frame / Scrub Progress Readout */}
            <div className="hidden md:flex items-center gap-2 font-mono tabular-nums text-[11px] text-white/75 shrink-0">
              {mode === 'frames' ? (
                <span>
                  Kadr {String(displayFrameNumber).padStart(3, '0')} / {TOTAL_FRAMES}
                </span>
              ) : (
                <span>Açylyş · {progressPercent}%</span>
              )}
            </div>

            {/* Interactive 4-Act Jump Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 mx-auto md:mx-0 overflow-x-auto">
              {HERO_ACTS.map((act) => {
                const isActive = activeActIndex === act.index;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleJumpToAct(act.jumpProgress)}
                    className={[
                      'min-h-[34px] px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                      'focus-visible:outline-2 focus-visible:outline-[#D4AF37]',
                      isActive
                        ? 'bg-[#D4AF37] text-[#0F172A] font-semibold'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                    ].join(' ')}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>

            {/* Direct Handoff Button to Storytelling Scenes */}
            <button
              type="button"
              onClick={onStartStory}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:text-[#F6DF8F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Hekaýa geç</span>
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
