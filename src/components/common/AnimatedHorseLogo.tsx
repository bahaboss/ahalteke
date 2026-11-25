import React from 'react';

export interface AnimatedHorseLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emerald' | 'light' | 'gold';
  animated?: boolean;
  className?: string;
}

const dimensionMap = {
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const paletteMap = {
  emerald: {
    bg: '#064E3B',
    ring: '#D4AF37',
    horse: '#D4AF37',
    leaf: '#10B981',
  },
  light: {
    bg: '#FFFFFF',
    ring: '#064E3B',
    horse: '#064E3B',
    leaf: '#10B981',
  },
  gold: {
    bg: '#FBF7E9',
    ring: '#D4AF37',
    horse: '#064E3B',
    leaf: '#B89122',
  },
};

export const AnimatedHorseLogo: React.FC<AnimatedHorseLogoProps> = ({
  size = 'md',
  variant = 'emerald',
  animated = true,
  className = '',
}) => {
  const palette = paletteMap[variant];

  return (
    <span
      className={['inline-flex items-center justify-center shrink-0', dimensionMap[size], className].join(' ')}
      aria-label="Smart & Green Ahalteke nyşany"
    >
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" role="img" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={palette.bg} />
        <rect
          x="3.5"
          y="3.5"
          width="57"
          height="57"
          rx="13"
          stroke={palette.ring}
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        {/* Turkmen diamond accent */}
        <path d="M32 8L35 11L32 14L29 11L32 8Z" fill={palette.leaf} />
        {/* Stylized Akhal-Teke profile */}
        <g className={animated ? 'animate-ahalteke-stride' : ''}>
          <path
            d="M19 48C20.5 40.5 23.5 34 26.8 29C28.2 26.8 28.6 23.5 27.6 20L31 14.5L34.5 18C37.2 17.5 40.6 18.5 43.8 21.4L49.2 26C50.2 26.9 50.1 28.6 48.8 29.4L44 31.8C41.1 33.1 38.2 31.8 36.8 30C35.8 33.8 37.6 39 43 42C45.4 43.3 47 45.6 47.6 48H19Z"
            fill={palette.horse}
          />
          <path
            className={animated ? 'animate-ahalteke-mane' : ''}
            d="M22.2 29.2C19.2 25.2 20.1 19.6 25 17.2C25.8 22 25 26.4 22.2 29.2Z"
            fill={palette.leaf}
          />
        </g>
      </svg>
    </span>
  );
};
