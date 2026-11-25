/**
 * Frame-by-Frame Hero Video Scrubbing Configuration
 *
 * Replace `TOTAL_FRAMES` or `FRAME_PATH` here whenever you drop new
 * OmniFlash WebP sequence frames into `public/frames/hero/`.
 */

export const TOTAL_FRAMES = 150;

/**
 * Pattern with `{index}` placeholder replaced by a zero-padded frame number
 * (e.g. `/frames/hero/frame_0001.webp` ... `/frames/hero/frame_0150.webp`).
 */
export const FRAME_PATH = '/frames/hero/frame_{index}.webp';

export const FRAME_INDEX_PAD = 4;

/**
 * Automatic cinematic fallback artwork used when `public/frames/hero/`
 * does not yet contain rendered frame files.
 */
export const FALLBACK_IMAGE_PATH = '/bedew.webp';

/**
 * Total runway height of the sticky Hero scrubber in viewport-height units.
 */
export const HERO_RUNWAY_VH = 450;

/**
 * Builds the public URL for a 1-based frame number (`1 .. TOTAL_FRAMES`).
 */
export function getHeroFrameUrl(frameNumber: number): string {
  const clamped = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameNumber)));
  const padded = String(clamped).padStart(FRAME_INDEX_PAD, '0');
  return FRAME_PATH.replace('{index}', padded);
}

export interface HeroActDefinition {
  id: string;
  index: number;
  label: string;
  rangeStart: number;
  rangeEnd: number;
  jumpProgress: number;
}

export const HERO_ACTS: HeroActDefinition[] = [
  {
    id: 'act-gols',
    index: 1,
    label: '01 · 5 Haly Göli',
    rangeStart: 0,
    rangeEnd: 0.25,
    jumpProgress: 0.06,
  },
  {
    id: 'act-headline',
    index: 2,
    label: '02 · Altyn Asyr',
    rangeStart: 0.25,
    rangeEnd: 0.5,
    jumpProgress: 0.36,
  },
  {
    id: 'act-iot',
    index: 3,
    label: '03 · IoT Gologramma',
    rangeStart: 0.5,
    rangeEnd: 0.75,
    jumpProgress: 0.62,
  },
  {
    id: 'act-handoff',
    index: 4,
    label: '04 · Hekaýa Geçişi',
    rangeStart: 0.75,
    rangeEnd: 1,
    jumpProgress: 0.92,
  },
];

export const HERO_IOT_HOLOGRAM = {
  horseName: 'Akhan Merjen',
  stableName: 'Arkadag Ýaşyl Athanasy №1',
  heartRateBpm: 38,
  waterSavedPercent: 22,
  ecoStableScore: 92,
};
