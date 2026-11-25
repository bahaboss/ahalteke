import React from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store';
import type { AuthenticatedRole } from '../../types';
import { AnimatedHorseLogo } from './AnimatedHorseLogo';

export interface ProtectedRouteProps {
  allowedRoles: AuthenticatedRole[];
  children?: React.ReactNode;
}

export function getRoleDefaultRoute(role: AuthenticatedRole): string {
  switch (role) {
    case 'user':
      return '/user/horses';
    case 'staff':
      return '/staff/overview';
    case 'admin':
      return '/admin/dashboard';
  }
}

const ROLE_LABELS_TK: Record<AuthenticatedRole, string> = {
  user: 'Ýönekeý Ulanyjy',
  staff: 'Işgär / Seýis',
  admin: 'Merkezi Admin',
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { session } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          requestedRole: allowedRoles[0],
        }}
      />
    );
  }

  if (!allowedRoles.includes(session.role)) {
    const requiredLabels = allowedRoles.map((r) => ROLE_LABELS_TK[r]).join(' / ');
    const currentLabel = ROLE_LABELS_TK[session.role];
    const fallbackRoute = getRoleDefaultRoute(session.role);

    return (
      <div className="min-h-screen bg-[#F8FAF9] text-[#0F172A] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE6E1] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#EEF3F1] pb-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <AnimatedHorseLogo size="sm" variant="emerald" animated={false} />
              <div>
                <p className="text-sm font-bold text-[#064E3B] leading-tight">
                  Smart &amp; Green Ahalteke
                </p>
                <p className="text-[11px] font-medium text-[#647A72]">Rol Esasynda Gorag (RBAC)</p>
              </div>
            </Link>
            <div className="w-11 h-11 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#EF4444]">
              Rugsat çäklendirilen · 403
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight text-balance">
              Bu bölüme girmek üçin ygtyýaryňyz ýok
            </h1>
            <p className="text-sm text-[#415850] leading-relaxed">
              Siz häzir <strong>{currentLabel}</strong> hasaby bilen girdiňiz. Talap edilýän{' '}
              <span className="font-mono text-xs text-[#064E3B]">{location.pathname}</span>{' '}
              sahypasy diňe <strong>{requiredLabels}</strong> roly üçin elýeterlidir.
            </p>
          </div>

          <div className="rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] divide-y divide-[#EEF3F1] text-xs sm:text-sm">
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[#647A72]">Häzirki hasap</span>
              <span className="font-semibold text-[#0F172A] truncate">
                {session.fullName} ({currentLabel})
              </span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[#647A72]">Gerekli rol</span>
              <span className="font-semibold text-[#064E3B]">{requiredLabels}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(fallbackRoute, { replace: true })}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053D2E] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Öz panelime gaýt</span>
            </button>
            <button
              type="button"
              onClick={() =>
                navigate('/login', {
                  state: { from: location.pathname, requestedRole: allowedRoles[0] },
                })
              }
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFFBEB] border border-[#D4AF37]/60 text-[#064E3B] text-sm font-semibold hover:bg-[#FEF3C7] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Başga rol bilen gir</span>
            </button>
          </div>

          <div className="pt-2 text-center border-t border-[#EEF3F1]">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#647A72] hover:text-[#064E3B] transition-colors"
            >
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Baş sahypa dolan</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
