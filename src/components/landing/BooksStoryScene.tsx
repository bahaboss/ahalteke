import React, { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import type { HeritageBook } from '../../mockData/landingStory';
import { Button, Modal } from '../common';

export interface BooksStorySceneProps {
  books: HeritageBook[];
}

export const BooksStoryScene: React.FC<BooksStorySceneProps> = ({ books }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedBook, setSelectedBook] = useState<HeritageBook | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const m = prefersReducedMotion ? 0 : 1;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    restDelta: 0.001,
  });

  // Bidirectional 3D book shelf fan-in / fold-back (reversible on scroll up & down)
  const shelfRotateX = useTransform(smooth, [0, 0.28, 0.72, 1], [22 * m, 0, 0, -14 * m]);
  const shelfScale = useTransform(smooth, [0, 0.28, 0.72, 1], [1 - 0.08 * m, 1, 1, 1 - 0.05 * m]);
  const shelfOpacity = useTransform(smooth, [0, 0.2, 0.8, 1], [0.25, 1, 1, 0.35]);

  // Individual card 3D Y-rotation and stepped depth for sculptural book-opening reveal
  const leftCardRotateY = useTransform(smooth, [0, 0.3, 0.7, 1], [-28 * m, 0, 0, 18 * m]);
  const midLeftRotateY = useTransform(smooth, [0, 0.3, 0.7, 1], [-14 * m, 0, 0, 10 * m]);
  const midRightRotateY = useTransform(smooth, [0, 0.3, 0.7, 1], [14 * m, 0, 0, -10 * m]);
  const rightCardRotateY = useTransform(smooth, [0, 0.3, 0.7, 1], [28 * m, 0, 0, -18 * m]);

  const outerY = useTransform(smooth, [0, 0.3, 0.7, 1], [44 * m, 0, 0, -24 * m]);
  const innerY = useTransform(smooth, [0, 0.3, 0.7, 1], [24 * m, 0, 0, -14 * m]);

  const cardRotations = [leftCardRotateY, midLeftRotateY, midRightRotateY, rightCardRotateY];
  const cardOffsetsY = [outerY, innerY, innerY, outerY];

  return (
    <section
      id="scene-books"
      ref={sectionRef}
      className="scroll-mt-20 py-20 sm:py-28 bg-[#F8FAF9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-[#059669]">
            Sahna 02 · Ruhy Miras we Ylmy Çeşme
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#064E3B] leading-tight">
            Hormatly Prezidentimiziň we Gahryman Arkadagymyzyň Kitaplary
          </h2>
          <p className="text-base text-[#415850] leading-relaxed">
            Ahalteke bedewleriniň taryhy, milli seýisçilik sungaty we ýaşyl geljek baradaky gymmatly
            eserler — sahypa aşak-ýokary süýşürilende 3D perspektiwada öwrülip öňe çykýar.
          </p>
        </div>

        {/* Scrubbed 3D Book Cards Grid */}
        <div style={{ perspective: '1200px' }}>
          <motion.div
            style={{
              rotateX: shelfRotateX,
              scale: shelfScale,
              opacity: shelfOpacity,
              transformStyle: 'preserve-3d',
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {books.map((book, index) => (
              <motion.button
                key={book.id}
                type="button"
                onClick={() => setSelectedBook(book)}
                style={{
                  rotateY: cardRotations[index % cardRotations.length],
                  y: cardOffsetsY[index % cardOffsetsY.length],
                  transformStyle: 'preserve-3d',
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="group text-left rounded-2xl bg-white border border-[#DCE6E1] overflow-hidden shadow-[0_14px_34px_rgba(6,78,59,0.08)] hover:border-[#D4AF37] hover:shadow-[0_22px_46px_rgba(6,78,59,0.16)] flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981]"
              >
                {/* Sculpted Book Cover Header */}
                <div
                  className="relative p-5 min-h-[172px] flex flex-col justify-between text-white overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${book.accentColor} 0%, #042F24 100%)`,
                  }}
                >
                  {/* Golden Spine Line */}
                  <span
                    aria-hidden="true"
                    className="absolute left-3 top-0 bottom-0 w-[2px] bg-[#D4AF37]/45"
                  />
                  <div className="pl-3 flex items-center justify-between text-[11px] font-mono text-[#D4AF37]">
                    <span>{book.year}</span>
                    <span>{book.pages} sahypa</span>
                  </div>
                  <div className="pl-3 pt-4">
                    <p className="text-[11px] text-white/75 font-medium">{book.author}</p>
                    <h3 className="mt-1 font-display text-lg font-bold leading-snug text-white group-hover:text-[#F6DF8F] transition-colors">
                      {book.title}
                    </h3>
                  </div>
                </div>

                {/* Book Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#059669]">{book.category}</p>
                    <p className="text-sm text-[#415850] leading-relaxed line-clamp-3">
                      {book.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EEF3F1] flex items-center justify-between text-xs font-semibold text-[#064E3B]">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      Gysgaça mazmuny
                    </span>
                    <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Book Detail Modal */}
      <Modal
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        title={selectedBook?.title ?? ''}
        subtitle={
          selectedBook
            ? `${selectedBook.author} · ${selectedBook.year} · ${selectedBook.pages} sahypa`
            : ''
        }
        size="md"
        footer={
          <Button variant="primary" size="sm" onClick={() => setSelectedBook(null)}>
            Ýapmak
          </Button>
        }
      >
        {selectedBook && (
          <div className="space-y-5">
            <div className="rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>{selectedBook.category}</span>
              </div>
              <p className="text-sm text-[#415850] leading-relaxed">{selectedBook.excerpt}</p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#647A72]">
                Esasy mowzuklar
              </h4>
              <ul className="space-y-2">
                {selectedBook.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#0F241D]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};
