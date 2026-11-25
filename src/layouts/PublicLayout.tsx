import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F241D]">
      <Outlet />
    </div>
  );
};
