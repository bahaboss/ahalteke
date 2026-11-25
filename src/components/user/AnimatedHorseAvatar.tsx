import React, { useEffect, useState } from 'react';
import { AnimatedHorseLogo } from '../common';

export interface AnimatedHorseAvatarProps {
  /** Animasiýaly GIF ýa-da SVG salgysy */
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'w-11 h-11 rounded-xl', logo: 'sm' as const },
  md: { box: 'w-14 h-14 rounded-2xl', logo: 'md' as const },
  lg: { box: 'w-20 h-20 rounded-2xl', logo: 'lg' as const },
};

/**
 * Her bedew üçin animasiýaly awatar komponenti.
 * GIF ýa-da animasiýaly SVG salgysyny görkezýär; eger surat ýüklenmese ýa-da
 * oflaýn ýagdaýda bolsa, owadan animasiýaly zümrüt-altyn Ahalteke nyşanyna geçýär.
 */
export const AnimatedHorseAvatar: React.FC<AnimatedHorseAvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const config = sizeMap[size];
  const showImage = Boolean(src && src.trim().length > 0 && !hasError);

  if (!showImage) {
    return (
      <div
        className={[
          'relative inline-flex items-center justify-center overflow-hidden shrink-0',
          'bg-[#064E3B] ring-2 ring-[#D4AF37]/50 shadow-xs',
          config.box,
          className,
        ].join(' ')}
        title={`${alt} — animasiýaly nyşan`}
      >
        <AnimatedHorseLogo size={config.logo} variant="emerald" animated />
      </div>
    );
  }

  return (
    <div
      className={[
        'relative inline-flex items-center justify-center overflow-hidden shrink-0',
        'bg-[#064E3B] ring-2 ring-[#D4AF37]/55 shadow-xs',
        config.box,
        className,
      ].join(' ')}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
