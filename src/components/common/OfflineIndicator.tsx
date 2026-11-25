import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-xl bg-[#78350F] px-4 py-2.5 text-xs font-medium text-white shadow-lg border border-[#D97706]/40"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-[#FDE68A]" aria-hidden="true" />
      <span>Oflaýn tertip — Keşlenen maglumatlar görkezilýär</span>
    </div>
  );
};
