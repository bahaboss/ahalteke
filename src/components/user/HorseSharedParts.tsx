import React, { useEffect, useMemo, useState } from 'react';
import type { Horse, HorseHealthStatus, IoTSensorData } from '../../types';
import { AnimatedHorseLogo } from '../common';

export const HEALTH_STATUS_META: Record<
  HorseHealthStatus,
  { label: string; textColor: string; dotColor: string; surfaceBg: string }
> = {
  healthy: {
    label: 'Sagdyn we işjeň',
    textColor: 'text-[#065F46]',
    dotColor: 'bg-[#10B981]',
    surfaceBg: 'bg-[#ECFDF5] border-[#10B981]/30',
  },
  monitoring: {
    label: 'Gözegçilik astynda',
    textColor: 'text-[#92400E]',
    dotColor: 'bg-[#D4AF37]',
    surfaceBg: 'bg-[#FFFBEB] border-[#D4AF37]/40',
  },
  attention: {
    label: 'Lukman barlagy zerur',
    textColor: 'text-[#991B1B]',
    dotColor: 'bg-[#EF4444]',
    surfaceBg: 'bg-[#FEF2F2] border-[#EF4444]/35',
  },
};

export const GENDER_LABELS: Record<Horse['gender'], string> = {
  aýgyr: 'Aýgyr',
  baýtal: 'Baýtal',
  taý: 'Taý',
};

export const ACTIVITY_LABELS: Record<IoTSensorData['activityLevel'], string> = {
  dynç: 'Dynç alyşda',
  ýöriş: 'Ýörişde',
  türgenleşik: 'Türgenleşikde',
  çapyşyk: 'Çapyşyk tertibinde',
};

/** Bedewiň şejere ýazgysyndan tohum liniýasyny aýryp alýar (meselem: "Gelşikli liniýasy") */
export function extractLineageLine(lineage: string): string {
  const parenMatch = lineage.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }
  return 'Arassa ganly Ahalteke';
}

export interface HorsePedigreeTree {
  sire: {
    name: string;
    role: string;
    paternalGrandsire: string;
    paternalGranddam: string;
  };
  dam: {
    name: string;
    role: string;
    maternalGrandsire: string;
    maternalGranddam: string;
  };
  foundationLine: string;
  originNote: string;
}

const LINE_ANCESTOR_MAP: Record<
  string,
  {
    pGrandsire: string;
    pGranddam: string;
    mGrandsire: string;
    mGranddam: string;
    originNote: string;
  }
> = {
  'Gelşikli liniýasy': {
    pGrandsire: 'Gelşikli (1975)',
    pGranddam: 'Güljemal',
    mGrandsire: 'Gundogar',
    mGranddam: 'Altynçaç',
    originNote: 'Köpetdag seýisçilik mekdebiniň iň meşhur altyn öwüşginli nesil ugry.',
  },
  'Gyr Sakar liniýasy': {
    pGrandsire: 'Gyr Sakar (1972)',
    pGranddam: 'Aýsoltan',
    mGrandsire: 'Akbelek',
    mGranddam: 'Merjen',
    originNote: 'Ak-merjen reňki, inçe boýun gurluşy we uzak aralyk çydamlylygy bilen tanalýar.',
  },
  'Arap liniýasy': {
    pGrandsire: 'Arap (1930)',
    pGranddam: 'Garaýel',
    mGrandsire: 'Garlawuç',
    mGranddam: 'Gülbahar',
    originNote: '1935-nji ýyldaky Aşgabat–Moskwa ýörişiniň gahrymany Arap bedewiniň nesli.',
  },
  'Fakirpelwan liniýasy': {
    pGrandsire: 'Fakirpelwan (1951)',
    pGranddam: 'Meleguş',
    mGrandsire: 'Bürgüt',
    mGranddam: 'Aýgül',
    originNote: 'Ýokary tizlik, böküş ukyby we sport çapyşyklarynda ýeňişleri bilen meşhur ugur.',
  },
  'Sere liniýasy': {
    pGrandsire: 'Sere (1976)',
    pGranddam: 'Murgapgül',
    mGrandsire: 'Altynşöhle',
    mGranddam: 'Bahargül',
    originNote: 'Murgap jülgesiniň sary-gula altyn reňkli we sazlaşykly ýörişli nesil şejeresi.',
  },
  'Kaplan liniýasy': {
    pGrandsire: 'Kaplan (1955)',
    pGranddam: 'Deňizgül',
    mGrandsire: 'Ýyldyrym',
    mGranddam: 'Sadaf',
    originNote: 'Güýçli aýak gurluşy, konkur we marafon çydamlylygy bilen tapawutlanýan şejere.',
  },
};

/** Bedewiň `lineage` setirinden 3 nesilli wizual şejere daragtyny döredýär */
export function parseHorsePedigree(horse: Horse): HorsePedigreeTree {
  const foundationLine = extractLineageLine(horse.lineage);
  const withoutParens = horse.lineage.replace(/\([^)]*\)/g, '').trim();
  const parts = withoutParens
    .split(/[×xX]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sireName = parts[0] || 'Milli Tohum Aýgyry';
  const damName = parts[1] || 'Arassa Ganly Baýtal';
  const preset = LINE_ANCESTOR_MAP[foundationLine];

  return {
    sire: {
      name: sireName,
      role: 'Atasy (Aýgyr)',
      paternalGrandsire: preset?.pGrandsire ?? `${foundationLine} · Baş Aýgyr`,
      paternalGranddam: preset?.pGranddam ?? 'Gülälek',
    },
    dam: {
      name: damName,
      role: 'Enesi (Baýtal)',
      maternalGrandsire: preset?.mGrandsire ?? 'Köpetdag',
      maternalGranddam: preset?.mGranddam ?? 'Altyngül',
    },
    foundationLine,
    originNote:
      preset?.originNote ??
      'Türkmenistanyň arassa ganly ahalteke tohum kitabynda hasaba alnan gadymy nesil şejeresi.',
  };
}

export interface QrCodeGraphicProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

const QR_SIZE_CLASSES = {
  sm: 'w-20 h-20 p-1.5',
  md: 'w-24 h-24 p-2',
  lg: 'w-36 h-36 p-2.5',
};

/** Bedewiň QR-koduny görkezýän deterministik SVG matriýasy */
export const QrCodeGraphic: React.FC<QrCodeGraphicProps> = ({ code, size = 'md' }) => {
  const cells = useMemo(() => {
    const grid: boolean[] = [];
    let hash = 0;
    for (let i = 0; i < code.length; i += 1) {
      hash = (hash * 31 + code.charCodeAt(i)) % 1000003;
    }
    for (let row = 0; row < 11; row += 1) {
      for (let col = 0; col < 11; col += 1) {
        const isTopLeft = row < 3 && col < 3;
        const isTopRight = row < 3 && col > 7;
        const isBottomLeft = row > 7 && col < 3;
        const isCenterAccent = row === 5 && col === 5;
        if (isTopLeft || isTopRight || isBottomLeft) {
          const r = row > 7 ? row - 8 : row;
          const c = col > 7 ? col - 8 : col;
          grid.push(r === 0 || r === 2 || c === 0 || c === 2 || (r === 1 && c === 1));
        } else if (isCenterAccent) {
          grid.push(true);
        } else {
          const bit = ((hash >> ((row * 3 + col) % 16)) ^ (row * 7 + col * 11)) & 1;
          grid.push(bit === 1);
        }
      }
    }
    return grid;
  }, [code]);

  return (
    <svg
      viewBox="0 0 110 110"
      className={[
        'rounded-xl bg-white border border-[#DCE6E1] shrink-0',
        QR_SIZE_CLASSES[size],
      ].join(' ')}
      role="img"
      aria-label={`QR-kod ${code}`}
    >
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const row = Math.floor(idx / 11);
        const col = idx % 11;
        const isCenter = row === 5 && col === 5;
        return (
          <rect
            key={idx}
            x={col * 10}
            y={row * 10}
            width={8.4}
            height={8.4}
            rx={1.6}
            fill={isCenter ? '#D4AF37' : '#064E3B'}
          />
        );
      })}
    </svg>
  );
};

export interface HorsePortraitProps {
  src: string;
  alt: string;
  className?: string;
}

export const HorsePortrait: React.FC<HorsePortraitProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={[
          'w-full h-full flex flex-col items-center justify-center gap-2 bg-[#064E3B] text-[#D4AF37]',
          className,
        ].join(' ')}
      >
        <AnimatedHorseLogo size="lg" variant="emerald" animated />
        <span className="text-xs font-medium text-white/80">Ahalteke bedewi</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={['w-full h-full object-cover', className].join(' ')}
    />
  );
};
