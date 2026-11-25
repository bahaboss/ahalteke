import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={[
          'w-full bg-white rounded-2xl border border-[#DCE6E1] shadow-[0_20px_48px_rgba(6,78,59,0.2)]',
          'overflow-hidden flex flex-col max-h-[88vh]',
          sizeClasses[size],
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#DCE6E1]">
          <div className="min-w-0">
            <h3 id="modal-heading" className="text-xl font-bold text-[#0F241D]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-[#415850] leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Penjiräni ýapmak"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-[#415850] hover:bg-[#EEF3F1] hover:text-[#064E3B] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#10B981]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto text-sm text-[#0F241D] leading-relaxed">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 bg-[#F8FAF9] border-t border-[#DCE6E1] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
