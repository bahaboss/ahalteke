import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'default' | 'muted' | 'emerald' | 'elevated';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  variant?: CardVariant;
  interactive?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white border border-[#DCE6E1]',
  muted: 'bg-[#EEF3F1] border border-[#DCE6E1]',
  emerald: 'bg-[#064E3B] text-white border border-[#064E3B]',
  elevated: 'bg-white shadow-[0_1px_2px_rgba(6,78,59,0.05),0_4px_14px_rgba(6,78,59,0.05)]',
};

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  variant = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={[
        'rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        variantClasses[variant],
        paddingClasses[padding],
        interactive
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#10B981]/60 hover:shadow-[0_6px_20px_rgba(6,78,59,0.08)]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};
