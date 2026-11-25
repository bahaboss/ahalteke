import React, { useState } from 'react';
import { Box, FileText, ShieldCheck } from 'lucide-react';
import { AnimatedHorseLogo, Button, Modal, PWAInstallButton } from '../common';
import aiAndSourcesDoc from '../../../docs/AI_AND_SOURCES.md?raw';

export interface LandingFooterProps {
  onOpenDesignSystem: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenDesignSystem }) => {
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  return (
    <footer className="bg-[#04392B] text-white border-t border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2.5">
              <AnimatedHorseLogo size="sm" variant="gold" animated={false} />
              <span className="font-display text-lg font-bold text-white">
                Smart &amp; Green <span className="text-[#D4AF37]">Ahalteke</span>
              </span>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Türkmenistanyň «Smart &amp; Green Technology Challenge» hakaton bäsleşigi üçin taýýarlanan
              sanly atçylyk we ekologik gözegçilik PWA platformasy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => setIsSourcesModalOpen(true)}
              className="border-[#D4AF37]/60 text-white hover:bg-[#D4AF37]/15"
            >
              Ulanylan Serişdeler we AI (Düzgünnama 4.4)
            </Button>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Box className="w-4 h-4" />}
              onClick={onOpenDesignSystem}
              className="text-white/85 hover:bg-white/10 hover:text-white"
            >
              3D Athana we Dizaýn Sergisi
            </Button>

            <PWAInstallButton />
          </div>
        </div>

        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/65">
          <p>© 2026 Smart &amp; Green Ahalteke · 5 Göl — 5 Bedew — 1 Ýaşyl Geljek</p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
            <span>PWA taýýar · React + TypeScript + Framer Motion</span>
          </p>
        </div>
      </div>

      {/* Regulation 4.4 Sources & AI Disclosure Modal */}
      <Modal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        title="Ulanylan Serişdeler we AI (Düzgünnama 4.4)"
        subtitle="docs/AI_AND_SOURCES.md resminamasyndan göni görkezilýär"
        size="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsSourcesModalOpen(false)}>
            Ýapmak
          </Button>
        }
      >
        <pre className="whitespace-pre-wrap font-sans text-sm text-[#415850] leading-relaxed max-h-[55vh] overflow-y-auto pr-2">
          {aiAndSourcesDoc}
        </pre>
      </Modal>
    </footer>
  );
};
