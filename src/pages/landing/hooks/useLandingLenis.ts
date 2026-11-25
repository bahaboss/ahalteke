import { useCallback, useEffect, useRef } from 'react';
import Lenis from 'lenis';

export interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
}

/**
 * Route-scoped Lenis smooth scrolling strictly for the Landing Page (`/`).
 * Cleans up completely on unmount so dashboard routes (`/user/*`, `/staff/*`, `/admin/*`)
 * keep pure native scrolling without any scroll-hijacking overhead.
 */
export function useLandingLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) {
      return;
    }

    const htmlEl = document.documentElement;
    const prevScrollBehavior = htmlEl.style.scrollBehavior;
    // Prevent native CSS smooth-scroll from fighting Lenis rAF interpolation
    htmlEl.style.scrollBehavior = 'auto';

    const lenis = new Lenis({
      lerp: 0.085,
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.25,
    });

    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      htmlEl.style.scrollBehavior = prevScrollBehavior;
    };
  }, []);

  const scrollToTarget = useCallback(
    (target: string | number | HTMLElement, options?: ScrollToOptions) => {
      const lenis = lenisRef.current;

      if (lenis) {
        lenis.scrollTo(target, {
          offset: options?.offset ?? 0,
          duration: options?.duration ?? 1.2,
          immediate: options?.immediate ?? false,
        });
        return;
      }

      if (typeof target === 'number') {
        window.scrollTo({
          top: target,
          behavior: options?.immediate ? 'auto' : 'smooth',
        });
        return;
      }

      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (element) {
        const rect = element.getBoundingClientRect();
        const top = window.scrollY + rect.top + (options?.offset ?? 0);
        window.scrollTo({
          top,
          behavior: options?.immediate ? 'auto' : 'smooth',
        });
      }
    },
    [],
  );

  return { lenisRef, scrollToTarget };
}
