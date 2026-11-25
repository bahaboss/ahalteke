import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Building2, GraduationCap, MapPin, Sun, UserPlus } from 'lucide-react';
import type { AcademyProgramHighlight } from '../../mockData/landingStory';
import type { EquestrianComplex } from '../../types';
import { Card } from '../common';

export interface AcademyComplexesSceneProps {
  programs: AcademyProgramHighlight[];
  complexes: EquestrianComplex[];
  onApplyAcademy?: () => void;
  onCreateAccount?: () => void;
}

export const AcademyComplexesScene: React.FC<AcademyComplexesSceneProps> = ({
  programs,
  complexes,
  onApplyAcademy,
  onCreateAccount,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const m = prefersReducedMotion ? 0 : 1;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 145,
    damping: 26,
    restDelta: 0.001,
  });

  const cardsRotateX = useTransform(smooth, [0, 0.28, 0.74, 1], [16 * m, 0, 0, -10 * m]);
  const cardsScale = useTransform(smooth, [0, 0.28, 0.74, 1], [1 - 0.06 * m, 1, 1, 1 - 0.04 * m]);
  const cardsOpacity = useTransform(smooth, [0, 0.22, 0.8, 1], [0.3, 1, 1, 0.45]);

  const leftColRotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [-14 * m, 0, 0, 10 * m]);
  const centerColRotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [0, 0, 0, 0]);
  const rightColRotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [14 * m, 0, 0, -10 * m]);

  const colRotations = [leftColRotateY, centerColRotateY, rightColRotateY];

  return (
    <section
      id="scene-academy"
      ref={sectionRef}
      className="scroll-mt-20 py-20 sm:py-28 bg-white border-t border-[#DCE6E1] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header & Direct Route Navigation Buttons (/user/academy & /register) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#059669]">
              Sahna 05 · Bilim we Sport Infrastrukturasy
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#064E3B] leading-tight">
              Aba Annaýew Akademiýasy we Atçylyk Sport Toplumlary
            </h2>
            <p className="text-base text-[#415850] leading-relaxed">
              Geljekki seýisler, weterinar lukmanlar we «Ýaşyl Athana» inženerleri üçin halkara
              derejeli bilim maksatnamalary hem-de döwrebap atçylyk sport toplumlary.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/user/academy"
              onClick={(e) => {
                if (onApplyAcademy) {
                  e.preventDefault();
                  onApplyAcademy();
                }
              }}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C39E2A] text-sm font-semibold text-[#0F172A] shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#064E3B]"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Akademiýa dalaşgärligi</span>
            </Link>

            <Link
              to="/register"
              onClick={(e) => {
                if (onCreateAccount) {
                  e.preventDefault();
                  onCreateAccount();
                }
              }}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-sm font-semibold text-white shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#10B981]"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Hasap açmak</span>
            </Link>
          </div>
        </div>

        {/* 3D Perspective Grid: Academy Programs + Complexes */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
            style={{
              rotateX: cardsRotateX,
              scale: cardsScale,
              opacity: cardsOpacity,
              transformStyle: 'preserve-3d',
            }}
            className="space-y-10"
          >
            {/* Academy Programs Row */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#064E3B]">
                <GraduationCap className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Aba Annaýew adyndaky Halkara atçylyk akademiýasy — Ugurlar</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {programs.map((program, idx) => (
                  <motion.div
                    key={program.id}
                    style={{
                      rotateY: colRotations[idx % colRotations.length],
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <Card
                      padding="md"
                      className="h-full bg-[#F8FAF9] border-[#DCE6E1] hover:border-[#D4AF37] transition-colors flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-[#647A72]">
                          <span>{program.duration}</span>
                          <span className="font-mono tabular-nums font-semibold text-[#064E3B]">
                            {program.seats} orun
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#0F241D] leading-snug">
                          {program.title}
                        </h3>
                        <p className="text-sm text-[#415850] leading-relaxed">{program.focus}</p>
                      </div>

                      <div className="pt-3 border-t border-[#DCE6E1]/70">
                        <Link
                          to="/user/academy"
                          onClick={(e) => {
                            if (onApplyAcademy) {
                              e.preventDefault();
                              onApplyAcademy();
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#064E3B] hover:text-[#10B981] transition-colors"
                        >
                          <span>Dalaşgärlik üçin saýla →</span>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Equestrian Sport Complexes Row */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#064E3B]">
                <Building2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                <span>Döwrebap Atçylyk Sport Toplumlary</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {complexes.map((cmp, idx) => (
                  <motion.div
                    key={cmp.id}
                    style={{
                      rotateY: colRotations[idx % colRotations.length],
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <Card
                      padding="md"
                      className="h-full bg-white border-[#DCE6E1] hover:border-[#064E3B]/45 transition-colors flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#647A72]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                            {cmp.region}
                          </span>
                          <span className="font-semibold text-[#B89122]">
                            {cmp.ecoCertificationLevel}
                          </span>
                        </div>

                        <h3 className="font-display text-lg font-bold text-[#0F241D] leading-snug">
                          {cmp.name}
                        </h3>

                        <p className="text-sm text-[#415850] leading-relaxed">{cmp.description}</p>
                      </div>

                      <div className="pt-3 border-t border-[#EEF3F1] flex items-center justify-between text-xs font-mono tabular-nums text-[#064E3B]">
                        <span>{cmp.totalStables} athana</span>
                        <span>{cmp.totalHorses} bedew</span>
                        <span className="inline-flex items-center gap-1 text-[#059669]">
                          <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                          {cmp.solarCapacityKw} kW
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
