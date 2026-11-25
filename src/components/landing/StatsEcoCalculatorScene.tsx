import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Droplets, Leaf, Sun, Wheat } from 'lucide-react';
import { calculateGreenImpact } from '../../services/landingService';
import { Card } from '../common';

const NATIONAL_STATS = [
  {
    label: 'Sanly pasportly bedewler',
    value: '4 820+',
    detail: 'QR we şejere hasabynda',
  },
  {
    label: 'Gün energiýaly athanalar',
    value: '32',
    detail: '5 welaýatda işjeň ulgam',
  },
  {
    label: 'Ortaça suw tygşytlylygy',
    value: '+26%',
    detail: 'Ýagyş suwy we damjalaýyn süzgüç',
  },
  {
    label: 'IoT gözegçilik takyklygy',
    value: '99.4%',
    detail: '24/7 saglyk we mikroklimat',
  },
];

const SCENARIO_PRESETS = [
  { label: 'Pilot (1 × 6)', complexes: 1, stables: 6 },
  { label: 'Welaýat (5 × 6)', complexes: 5, stables: 6 },
  { label: 'Milli Tor (12 × 8)', complexes: 12, stables: 8 },
  { label: 'Doly Gerim (25 × 12)', complexes: 25, stables: 12 },
];

export const StatsEcoCalculatorScene: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [complexCount, setComplexCount] = useState<number>(5);
  const [stablesPerComplex, setStablesPerComplex] = useState<number>(6);
  const prefersReducedMotion = useReducedMotion();
  const m = prefersReducedMotion ? 0 : 1;

  const impact = useMemo(
    () => calculateGreenImpact(complexCount, stablesPerComplex),
    [complexCount, stablesPerComplex],
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 145,
    damping: 26,
    restDelta: 0.001,
  });

  // Bidirectional 3D reveal for stats strip & calculator stage
  const statsRotateX = useTransform(smooth, [0, 0.26, 0.74, 1], [18 * m, 0, 0, -12 * m]);
  const statsY = useTransform(smooth, [0, 0.26, 0.74, 1], [44 * m, 0, 0, -28 * m]);
  const statsOpacity = useTransform(smooth, [0, 0.2, 0.8, 1], [0.25, 1, 1, 0.35]);

  const calcScale = useTransform(smooth, [0.05, 0.34, 0.74, 1], [1 - 0.06 * m, 1, 1, 1 - 0.04 * m]);
  const calcRotateX = useTransform(smooth, [0.05, 0.34, 0.74, 1], [15 * m, 0, 0, -10 * m]);
  const calcRotateY = useTransform(smooth, [0.05, 0.34, 0.74, 1], [-5 * m, 0, 0, 5 * m]);
  const calcOpacity = useTransform(smooth, [0.05, 0.24, 0.8, 1], [0.3, 1, 1, 0.4]);

  return (
    <section
      id="scene-stats"
      ref={sectionRef}
      className="scroll-mt-20 py-20 sm:py-28 bg-white border-y border-[#DCE6E1] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#059669]">
              Sahna 03 · Atlaryň Statistikasy we «Ýaşyl» Eko-Kalkulýator
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#064E3B] leading-tight">
              Sanlar Bilen Subut Edilýän Ekologik Täsir
            </h2>
            <p className="text-base text-[#415850] leading-relaxed">
              Atçylyk sport toplumlarynyň we athanalaryň sanyny üýtgedip, «Ýaşyl Athana» ulgamynyň
              bir ýylda tygşytlaýan suw, elektrik energiýasy we ot-iým mukdaryny göni hasaplaň.
            </p>
          </div>
        </div>

        {/* 4-Column 3D Scrubbed Statistics Strip */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
            style={{
              rotateX: statsRotateX,
              y: statsY,
              opacity: statsOpacity,
              transformStyle: 'preserve-3d',
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {NATIONAL_STATS.map((stat) => (
              <Card key={stat.label} padding="md" className="bg-[#F8FAF9] border-[#DCE6E1]">
                <p className="text-xs font-medium text-[#647A72]">{stat.label}</p>
                <p className="mt-2 font-mono tabular-nums text-3xl font-bold text-[#064E3B]">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-[#415850]">{stat.detail}</p>
              </Card>
            ))}
          </motion.div>
        </div>

        {/* Interactive 3D «Ýaşyl» Eco-Calculator */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
            style={{
              scale: calcScale,
              rotateX: calcRotateX,
              rotateY: calcRotateY,
              opacity: calcOpacity,
              transformStyle: 'preserve-3d',
            }}
            className="rounded-3xl bg-[#064E3B] text-white border border-[#D4AF37]/40 p-6 sm:p-8 lg:p-10 shadow-[0_24px_60px_rgba(6,78,59,0.22)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Dual Slider Controls (Complexes + Stables) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#D4AF37]">
                      Interaktiw «Ýaşyl» Eko-Kalkulýator
                    </span>
                    <span className="font-mono tabular-nums text-[#34D399] font-semibold">
                      Jemi: {impact.totalStables} athana
                    </span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                    {impact.complexCount} toplum · {impact.totalStables} ýaşyl athana
                  </h3>
                </div>

                {/* Slider 1: Equestrian Complexes */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-white/85">
                    <label htmlFor="eco-complex-slider" className="font-medium">
                      Atçylyk sport toplumlarynyň sany
                    </label>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#D4AF37]">
                      {complexCount} toplum
                    </span>
                  </div>

                  <input
                    id="eco-complex-slider"
                    type="range"
                    min={1}
                    max={25}
                    step={1}
                    value={complexCount}
                    onChange={(e) => setComplexCount(Number(e.target.value))}
                    className="w-full h-2.5 rounded-full appearance-none bg-white/20 accent-[#D4AF37] cursor-pointer"
                  />
                </div>

                {/* Slider 2: Stables per Complex */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-white/85">
                    <label htmlFor="eco-stables-slider" className="font-medium">
                      Her toplumdaky athanalaryň sany
                    </label>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#34D399]">
                      {stablesPerComplex} athana
                    </span>
                  </div>

                  <input
                    id="eco-stables-slider"
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={stablesPerComplex}
                    onChange={(e) => setStablesPerComplex(Number(e.target.value))}
                    className="w-full h-2.5 rounded-full appearance-none bg-white/20 accent-[#10B981] cursor-pointer"
                  />
                </div>

                {/* Quick Scenario Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 pt-1">
                  {SCENARIO_PRESETS.map((preset) => {
                    const isActive =
                      complexCount === preset.complexes && stablesPerComplex === preset.stables;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setComplexCount(preset.complexes);
                          setStablesPerComplex(preset.stables);
                        }}
                        className={[
                          'min-h-[40px] px-2.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer',
                          isActive
                            ? 'bg-[#D4AF37] text-[#0F172A]'
                            : 'bg-white/10 text-white/85 hover:bg-white/20',
                        ].join(' ')}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-white/75 leading-relaxed">
                  Hasaplama her «Ýaşyl Athana» üçin ýyllyk 85 200 L suw tygşydy, 56 900 kWt·sag gün
                  elektrik energiýasy we 6,4 t isripsiz ot-iým görkezijilerine esaslanýar.
                </p>
              </div>

              {/* 4 Live Calculated Eco-Output Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 border border-white/15 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/75">
                    <span>Tygşytlanjak suw</span>
                    <Droplets className="w-4 h-4 text-[#34D399]" aria-hidden="true" />
                  </div>
                  <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                    {impact.waterSavedLitersPerYear.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-xs text-[#34D399]">litr / ýyl · Ýagyş suwy + süzgüç</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/15 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/75">
                    <span>Elektrik energiýasy (Gün)</span>
                    <Sun className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  </div>
                  <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                    {impact.solarEnergyKwhPerYear.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-xs text-[#D4AF37]">kWt·sag / ýyl · Arassa öndürijilik</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/15 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/75">
                    <span>Tygşytlanjak ot-iým</span>
                    <Wheat className="w-4 h-4 text-[#F6DF8F]" aria-hidden="true" />
                  </div>
                  <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-white">
                    {impact.organicForageSavedTonsPerYear.toLocaleString('fr-FR')} t
                  </p>
                  <p className="text-xs text-white/75">tonna / ýyl · Isripsiz takyk rasion</p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/15 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/75">
                    <span>CO₂ azaldylyşy</span>
                    <Leaf className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                  </div>
                  <p className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#34D399]">
                    -{impact.co2ReducedTonsPerYear.toLocaleString('fr-FR')} t
                  </p>
                  <p className="text-xs text-white/75">tonna / ýyl · Karbon aýak yzy</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
