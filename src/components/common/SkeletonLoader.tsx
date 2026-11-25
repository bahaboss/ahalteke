import React from 'react';

export interface SkeletonLoaderProps {
  variant?: 'card' | 'kpi' | 'table' | 'profile' | 'page';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 3,
  className = '',
}) => {
  if (variant === 'kpi') {
    return (
      <div
        aria-busy="true"
        aria-label="Görkezijiler ýüklenýär"
        className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="h-32 rounded-2xl bg-white border border-[#DCE6E1] p-5 space-y-3 animate-pulse"
          >
            <div className="h-3.5 w-28 rounded-md bg-[#E6EFEA]" />
            <div className="h-8 w-24 rounded-lg bg-[#DCE6E1]" />
            <div className="h-3 w-36 rounded-md bg-[#EEF3F1]" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        aria-busy="true"
        aria-label="Tablisa ýüklenýär"
        className={`rounded-2xl bg-white border border-[#DCE6E1] overflow-hidden animate-pulse ${className}`}
      >
        <div className="h-14 px-6 border-b border-[#DCE6E1] flex items-center justify-between">
          <div className="h-4 w-48 rounded-md bg-[#E6EFEA]" />
          <div className="h-9 w-40 rounded-xl bg-[#EEF3F1]" />
        </div>
        <div className="divide-y divide-[#EEF3F1]">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-56 rounded-md bg-[#E6EFEA]" />
                <div className="h-3 w-36 rounded-md bg-[#EEF3F1]" />
              </div>
              <div className="h-4 w-20 rounded-md bg-[#E6EFEA]" />
              <div className="h-8 w-24 rounded-lg bg-[#EEF3F1]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div
        aria-busy="true"
        aria-label="Profil ýüklenýär"
        className={`rounded-2xl bg-white border border-[#DCE6E1] p-6 space-y-5 animate-pulse ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#E6EFEA] shrink-0" />
          <div className="space-y-2.5 flex-1">
            <div className="h-6 w-48 rounded-lg bg-[#DCE6E1]" />
            <div className="h-4 w-64 rounded-md bg-[#EEF3F1]" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#F8FAF9] border border-[#EEF3F1]" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div aria-busy="true" aria-label="Sahypa ýüklenýär" className={`space-y-6 ${className}`}>
        <div className="space-y-2 animate-pulse">
          <div className="h-3.5 w-40 rounded-md bg-[#E6EFEA]" />
          <div className="h-8 w-72 rounded-xl bg-[#DCE6E1]" />
          <div className="h-4 w-96 max-w-full rounded-md bg-[#EEF3F1]" />
        </div>
        <SkeletonLoader variant="kpi" count={4} />
        <SkeletonLoader variant="table" count={4} />
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-label="Kartoçkalar ýüklenýär"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-white border border-[#DCE6E1] p-5 space-y-3 animate-pulse"
        >
          <div className="h-4 w-24 rounded-md bg-[#E6EFEA]" />
          <div className="h-6 w-3/4 rounded-lg bg-[#DCE6E1]" />
          <div className="h-3.5 w-full rounded-md bg-[#EEF3F1]" />
          <div className="h-3.5 w-5/6 rounded-md bg-[#EEF3F1]" />
        </div>
      ))}
    </div>
  );
};
