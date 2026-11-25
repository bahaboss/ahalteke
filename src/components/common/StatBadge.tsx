import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

export type StatTone = 'healthy' | 'warning' | 'critical' | 'gold' | 'neutral';

export interface StatBadgeProps {
  label: string;
  value?: string | number;
  unit?: string;
  tone?: StatTone;
  icon?: React.ReactNode;
  className?: string;
}

const toneStyles: Record<StatTone, { container: string; text: string; iconColor: string }> = {
  healthy: {
    container: 'bg-[#ECFDF5] border-[#A7F3D0]',
    text: 'text-[#064E3B]',
    iconColor: 'text-[#059669]',
  },
  warning: {
    container: 'bg-[#FFFBEB] border-[#FDE68A]',
    text: 'text-[#78350F]',
    iconColor: 'text-[#B45309]',
  },
  critical: {
    container: 'bg-[#FEF2F2] border-[#FECACA]',
    text: 'text-[#991B1B]',
    iconColor: 'text-[#DC2626]',
  },
  gold: {
    container: 'bg-[#FBF7E9] border-[#E7D497]',
    text: 'text-[#5C4507]',
    iconColor: 'text-[#B89122]',
  },
  neutral: {
    container: 'bg-[#EEF3F1] border-[#DCE6E1]',
    text: 'text-[#0F241D]',
    iconColor: 'text-[#415850]',
  },
};

function getDefaultIcon(tone: StatTone): React.ReactNode {
  switch (tone) {
    case 'healthy':
      return <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />;
    case 'critical':
      return <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />;
    default:
      return <Info className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
}

/**
 * Semantik ýagdaý we görkeziji belligi.
 * Hiç haçan diňe reňke daýanmaýar — hemişe tekst ýazgysy we statik nyşan bilen bile görkezilýär.
 */
export const StatBadge: React.FC<StatBadgeProps> = ({
  label,
  value,
  unit,
  tone = 'healthy',
  icon,
  className = '',
}) => {
  const styles = toneStyles[tone];

  return (
    <div
      className={[
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap',
        styles.container,
        styles.text,
        className,
      ].join(' ')}
    >
      <span className={styles.iconColor}>{icon ?? getDefaultIcon(tone)}</span>
      <span>{label}</span>
      {value !== undefined && (
        <span className="font-mono tabular-nums font-semibold pl-1 border-l border-current/20">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      )}
    </div>
  );
};
