import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#064E3B] text-white hover:bg-[#04392B] active:scale-[0.98] border border-transparent shadow-xs',
  secondary:
    'bg-[#EEF3F1] text-[#064E3B] hover:bg-[#DCE6E1] active:scale-[0.98] border border-transparent',
  gold:
    'bg-[#D4AF37] text-[#0F241D] hover:bg-[#C39D27] active:scale-[0.98] border border-transparent shadow-xs',
  outline:
    'bg-white text-[#064E3B] border border-[#DCE6E1] hover:border-[#064E3B]/40 hover:bg-[#F8FAF9] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[#0F241D] hover:bg-[#EEF3F1] active:scale-[0.98] border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-4 py-2 text-xs gap-1.5 rounded-lg',
  md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 cursor-pointer',
        'transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981]',
        'disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
