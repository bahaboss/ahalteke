import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  fetchComplexes,
  fetchLandingStoryData,
  type LandingStoryPayload,
} from '../../services';
import type { AuthSession, AuthenticatedRole, EquestrianComplex } from '../../types';
import { HeroFrameScrub } from '../../pages/landing/components';
import { useLandingLenis } from '../../pages/landing/hooks/useLandingLenis';
import { AcademyComplexesScene } from './AcademyComplexesScene';
import { BooksStoryScene } from './BooksStoryScene';
import { CareAndIoTScene } from './CareAndIoTScene';
import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';
import { StatsEcoCalculatorScene } from './StatsEcoCalculatorScene';

export interface LandingPageProps {
  session: AuthSession | null;
  onOpenAuth: (options?: { role?: AuthenticatedRole; userMode?: 'login' | 'register' }) => void;
  onOpenWorkspace: () => void;
  onOpenDesignSystem: () => void;
  onOpenAcademy?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  session,
  onOpenAuth,
  onOpenWorkspace,
  onOpenDesignSystem,
  onOpenAcademy,
}) => {
  const [story, setStory] = useState<LandingStoryPayload | null>(null);
  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);

  // Active strictly on `/` — automatically destroyed on unmount so dashboard routes stay native
  const { scrollToTarget } = useLandingLenis();

  useEffect(() => {
    let active = true;
    const loadLandingData = async () => {
      const [storyRes, complexesRes] = await Promise.all([
        fetchLandingStoryData(),
        fetchComplexes(),
      ]);
      if (!active) return;
      setStory(storyRes.data);
      setComplexes(complexesRes.data);
    };
    loadLandingData();
    return () => {
      active = false;
    };
  }, []);

  const handleStartStory = () => {
    scrollToTarget('#scene-books', { offset: -64, duration: 1.25 });
  };

  const handleScrollToSection = (selector: string) => {
    const offset = selector === '#scene-hero' ? 0 : -64;
    scrollToTarget(selector, { offset, duration: 1.15 });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D]">
        <LandingHeader
          session={session}
          onOpenAuth={(mode) => onOpenAuth({ role: 'user', userMode: mode ?? 'login' })}
          onOpenWorkspace={onOpenWorkspace}
          onScrollToSection={handleScrollToSection}
        />

        <main>
          {/* 450vh Frame-by-Frame Canvas Scrubbing Hero (150 WebP Frames + Automatic bedew.webp Fallback) */}
          <HeroFrameScrub
            regions={story?.regions ?? []}
            onStartStory={handleStartStory}
            onOpenLogin={() =>
              session ? onOpenWorkspace() : onOpenAuth({ role: 'user', userMode: 'login' })
            }
            onScrollToOffset={(topPx) => scrollToTarget(topPx, { duration: 1.05 })}
          />

          <BooksStoryScene books={story?.heritageBooks ?? []} />

          <StatsEcoCalculatorScene />

          <CareAndIoTScene
            careLayers={story?.careLayers ?? []}
            onOpen3DStable={onOpenDesignSystem}
          />

          <AcademyComplexesScene
            programs={story?.academyPrograms ?? []}
            complexes={complexes.slice(0, 3)}
            onApplyAcademy={onOpenAcademy}
            onCreateAccount={() => onOpenAuth({ role: 'user', userMode: 'register' })}
          />
        </main>

        <LandingFooter onOpenDesignSystem={onOpenDesignSystem} />
      </div>
    </MotionConfig>
  );
};
