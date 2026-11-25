/**
 * Smart & Green Ahalteke — Umumy Design System Tokenleri
 *
 * Bu faýl DOM-a garaşsyz arassa TypeScript konstantalaryndan ybarat bolup,
 * geljekde React Native (iOS / Android) goşundysyna göni geçirilip bilner.
 */

export const brandColors = {
  /** Goýy zümrüt ýaşyl — esasy brend, sözbaşylar we ýokary urguly düwmeler */
  emeraldDeep: '#064E3B',
  /** Has goýy zümrüt — hover we basyş ýagdaýlary üçin */
  emeraldForest: '#04392B',
  /** Ýaşyl ekologiýa aksenti — «Smart & Green» işjeň görkezijiler */
  emeraldAccent: '#10B981',
  /** Ýumşak zümrüt fon — saýlanan tablar we ekologiýa bellikleri */
  emeraldSoft: '#ECFDF5',
  /** Milli Ahalteke altynsow reňki — baýraklar, premium çyzyklar we nagyşlar */
  goldAkhal: '#D4AF37',
  /** Goýy altynsow — tekst we ýokary kontrastly altyn aksentler */
  goldWarm: '#9A7814',
  /** Ýumşak altyn fon — ýörite bellikler */
  goldSoft: '#FBF7E9',
} as const;

export const neutralColors = {
  /** 60% esasy sahypa fony */
  canvas: '#F8FAF9',
  /** Arassa ak kartoçka we panel ýüzi */
  surface: '#FFFFFF',
  /** 30% gurluş ýüzleri we ikinji derejeli bölekler */
  surfaceMuted: '#EEF3F1',
  /** Inçe 1px bölüji we serhet çyzygy */
  borderHairline: '#DCE6E1',
  /** Esasy ýazgy reňki (WCAG AAA kontrast) */
  inkPrimary: '#0F241D',
  /** Goýy tekst standarty (tablisalar we dashboardlar üçin) */
  inkSlate: '#0F172A',
  /** Ikinji derejeli düşündiriş teksti */
  inkSecondary: '#415850',
  /** Ýumşak metadata we kömekçi ýazgylar */
  inkMuted: '#647A72',
} as const;

export const semanticColors = {
  healthy: {
    hex: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Kadaly',
  },
  warning: {
    hex: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Üns bermeli',
  },
  critical: {
    hex: '#DC2626',
    alertRed: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Gyssagly',
  },
  info: {
    hex: '#0F766E',
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Maglumat',
  },
} as const;

export const glassSurface = {
  light: 'rgba(255, 255, 255, 0.86)',
  emerald: 'rgba(6, 78, 59, 0.88)',
  borderGold: 'rgba(212, 175, 55, 0.35)',
  borderEmerald: 'rgba(16, 185, 129, 0.25)',
  blurPx: 14,
} as const;

export const typography = {
  fontFamily: {
    display: '"Playfair Display", Georgia, serif',
    body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  },
  scale: {
    hero: { size: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.12, weight: 700, tracking: '-0.02em' },
    h1: { size: '2rem', lineHeight: 1.2, weight: 700, tracking: '-0.015em' },
    h2: { size: '1.5rem', lineHeight: 1.28, weight: 600, tracking: '-0.01em' },
    h3: { size: '1.125rem', lineHeight: 1.35, weight: 600, tracking: '0em' },
    body: { size: '0.9375rem', lineHeight: 1.6, weight: 400, tracking: '0em' },
    small: { size: '0.8125rem', lineHeight: 1.5, weight: 500, tracking: '0em' },
    metric: { size: '1.75rem', lineHeight: 1.1, weight: 600, tracking: '-0.02em' },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  /** Mobil ergonomika üçin iň kiçi basyş meýdany (px) */
  minTouchTarget: 44,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const elevation = {
  /** Diňe bir derejeli ýumşak kölege — kartoçka içinde kartoçka gadagan */
  none: 'none',
  subtle: '0 1px 2px rgba(6, 78, 59, 0.05), 0 4px 14px rgba(6, 78, 59, 0.04)',
  modal: '0 20px 48px rgba(6, 78, 59, 0.16), 0 4px 12px rgba(6, 78, 59, 0.06)',
} as const;

export const gridSystem = {
  desktopMaxWidth: 1280,
  desktopBaseline: 1440,
  mobileBaseline: 390,
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  gutter: {
    mobile: 16,
    desktop: 24,
  },
  containerPadding: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
  },
  /** Mobil berkitilen (sticky) elementleriň jemi belentlik çägi */
  mobileStickyCapPercent: 15,
} as const;

export const motionTokens = {
  fastMs: 150,
  normalMs: 200,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const designTokens = {
  colors: {
    brand: brandColors,
    neutral: neutralColors,
    semantic: semanticColors,
  },
  glass: glassSurface,
  typography,
  spacing,
  radii,
  elevation,
  grid: gridSystem,
  motion: motionTokens,
} as const;

export type DesignTokens = typeof designTokens;
