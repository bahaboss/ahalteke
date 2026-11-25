import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Box, Cpu, Leaf, ShieldCheck, Wheat } from 'lucide-react';
import type { CareLayerStep } from '../../mockData/landingStory';
import { Button } from '../common';

export interface CareAndIoTSceneProps {
  careLayers: CareLayerStep[];
  onOpen3DStable: () => void;
}

const LAYER_ICONS = [
  <Wheat key="wheat" className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />,
  <Cpu key="cpu" className="w-5 h-5 text-[#10B981]" aria-hidden="true" />,
  <Leaf key="leaf" className="w-5 h-5 text-[#059669]" aria-hidden="true" />,
];

const LAYER_FLOW_LABELS = ['Ideg Medeniýeti', 'Smart IoT Datçikler', '«Ýaşyl Athana»'];

export const CareAndIoTScene: React.FC<CareAndIoTSceneProps> = ({
  careLayers,
  onOpen3DStable,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(1);
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

  // Bidirectional 3D layered depth separation (cards fan out cleanly on scroll down, gather on scroll up)
  const layer0Y = useTransform(smooth, [0, 0.3, 0.72, 1], [54 * m, 0, 0, -28 * m]);
  const layer1Y = useTransform(smooth, [0, 0.3, 0.72, 1], [86 * m, 0, 0, -44 * m]);
  const layer2Y = useTransform(smooth, [0, 0.3, 0.72, 1], [118 * m, 0, 0, -60 * m]);

  const layer0RotateX = useTransform(smooth, [0, 0.3, 0.72, 1], [22 * m, 0, 0, -14 * m]);
  const layer1RotateX = useTransform(smooth, [0, 0.3, 0.72, 1], [16 * m, 0, 0, -10 * m]);
  const layer2RotateX = useTransform(smooth, [0, 0.3, 0.72, 1], [12 * m, 0, 0, -8 * m]);

  const layer0RotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [-16 * m, 0, 0, 10 * m]);
  const layer1RotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [0, 0, 0, 0]);
  const layer2RotateY = useTransform(smooth, [0, 0.3, 0.72, 1], [16 * m, 0, 0, -10 * m]);

  const stackScale = useTransform(smooth, [0, 0.28, 0.74, 1], [1 - 0.06 * m, 1, 1, 1 - 0.04 * m]);
  const stackOpacity = useTransform(smooth, [0, 0.2, 0.8, 1], [0.25, 1, 1, 0.35]);

  const yTransforms = [layer0Y, layer1Y, layer2Y];
  const rotXTransforms = [layer0RotateX, layer1RotateX, layer2RotateX];
  const rotYTransforms = [layer0RotateY, layer1RotateY, layer2RotateY];

  const activeLayer = careLayers[focusedIndex] ?? careLayers[0];

  return (
    <section
      id="scene-care"
      ref={sectionRef}
      className="scroll-mt-20 py-20 sm:py-28 bg-[#F8FAF9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#059669]">
              Sahna 04 · Atlara Ideg Medeniýeti we Smart IoT
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#064E3B] leading-tight">
              Ideg Medeniýeti, Isripsiz Iýmitlendiriş we Smart IoT Baglanyşygy
            </h2>
            <p className="text-base text-[#415850] leading-relaxed">
              Däp-dessurly organiki iýmitlendiriş, 24/7 IoT biometrika we gün-suw aýlanyşykly «Ýaşyl
              Athana» ulgamy bir bitewi 3D gatlakda sazlaşykly işleýär.
            </p>
          </div>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Box className="w-4 h-4" />}
            onClick={onOpen3DStable}
          >
            Interaktiw 3D «Ýaşyl Athana» gör
          </Button>
        </div>

        {/* Interactive 3-Stage Linkage Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {LAYER_FLOW_LABELS.map((label, idx) => {
            const isSelected = focusedIndex === idx;
            return (
              <React.Fragment key={label}>
                <button
                  type="button"
                  onClick={() => setFocusedIndex(idx)}
                  className={[
                    'min-h-[38px] px-3.5 rounded-xl border transition-colors whitespace-nowrap cursor-pointer',
                    isSelected
                      ? 'bg-[#064E3B] text-white border-[#D4AF37]'
                      : 'bg-white text-[#415850] border-[#DCE6E1] hover:border-[#064E3B]/45',
                  ].join(' ')}
                >
                  0{idx + 1}. {label}
                </button>
                {idx < LAYER_FLOW_LABELS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#647A72] shrink-0" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 3-Layer Bidirectional 3D Perspective Cards */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
            style={{ scale: stackScale, transformStyle: 'preserve-3d' }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {careLayers.map((layer, index) => {
              const isFocused = focusedIndex === index;
              return (
                <motion.button
                  key={layer.id}
                  type="button"
                  onClick={() => setFocusedIndex(index)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  style={{
                    y: yTransforms[index % yTransforms.length],
                    rotateX: rotXTransforms[index % rotXTransforms.length],
                    rotateY: rotYTransforms[index % rotYTransforms.length],
                    opacity: stackOpacity,
                    transformStyle: 'preserve-3d',
                  }}
                  className={[
                    'text-left rounded-2xl p-6 border transition-colors duration-200 flex flex-col justify-between gap-6 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981]',
                    isFocused
                      ? 'bg-[#064E3B] text-white border-[#D4AF37] shadow-[0_24px_48px_rgba(6,78,59,0.22)]'
                      : 'bg-white text-[#0F241D] border-[#DCE6E1] shadow-[0_10px_28px_rgba(6,78,59,0.06)] hover:border-[#064E3B]/45',
                  ].join(' ')}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'w-11 h-11 rounded-xl flex items-center justify-center',
                          isFocused ? 'bg-white/12' : 'bg-[#ECFDF5]',
                        ].join(' ')}
                      >
                        {LAYER_ICONS[index % LAYER_ICONS.length]}
                      </span>
                      <span
                        className={[
                          'font-mono tabular-nums text-xs font-semibold',
                          isFocused ? 'text-[#D4AF37]' : 'text-[#647A72]',
                        ].join(' ')}
                      >
                        GATLAK {layer.indexLabel}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={[
                          'font-display text-xl font-bold leading-snug',
                          isFocused ? 'text-white' : 'text-[#064E3B]',
                        ].join(' ')}
                      >
                        {layer.title}
                      </h3>
                      <p
                        className={[
                          'mt-1.5 text-xs font-medium',
                          isFocused ? 'text-[#34D399]' : 'text-[#059669]',
                        ].join(' ')}
                      >
                        {layer.subtitle}
                      </p>
                      <p
                        className={[
                          'mt-3 text-sm leading-relaxed',
                          isFocused ? 'text-white/85' : 'text-[#415850]',
                        ].join(' ')}
                      >
                        {layer.description}
                      </p>
                    </div>
                  </div>

                  {/* Layer Metrics */}
                  <div
                    className={[
                      'pt-4 border-t grid grid-cols-1 gap-2.5 text-xs',
                      isFocused ? 'border-white/15' : 'border-[#EEF3F1]',
                    ].join(' ')}
                  >
                    {layer.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between gap-2">
                        <span className={isFocused ? 'text-white/75' : 'text-[#647A72]'}>
                          {metric.label}
                        </span>
                        <span
                          className={[
                            'font-mono tabular-nums font-semibold',
                            isFocused ? 'text-[#D4AF37]' : 'text-[#064E3B]',
                          ].join(' ')}
                        >
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Focused Layer Architecture Summary Strip */}
        {activeLayer && (
          <div className="rounded-2xl bg-white border border-[#DCE6E1] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <span className="font-semibold text-[#064E3B]">
                  Saýlanan gatlak ({activeLayer.indexLabel}):
                </span>{' '}
                <span className="text-[#415850]">{activeLayer.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#647A72] font-mono">
              <span>IoT Telemetriýa</span>
              <span aria-hidden="true">·</span>
              <span>QR Pasport</span>
              <span aria-hidden="true">·</span>
              <span>PWA Offline</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
