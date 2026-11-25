import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthPage } from '../../components/auth';
import { getRoleDefaultRoute } from '../../components/common';
import { useAppStore } from '../../store';
import type { AuthSession, AuthenticatedRole } from '../../types';

interface AuthLocationState {
  from?: string;
  requestedRole?: AuthenticatedRole;
}

export interface AuthRoutePageProps {
  mode: 'login' | 'register';
}

export const AuthRoutePage: React.FC<AuthRoutePageProps> = ({ mode }) => {
  const { session, setSession, refreshStore } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as AuthLocationState | null) ?? null;

  const initialRole: AuthenticatedRole =
    mode === 'register' ? 'user' : state?.requestedRole ?? 'user';

  const handleAuthenticated = (nextSession: AuthSession) => {
    setSession(nextSession);
    void refreshStore();

    const defaultTarget = getRoleDefaultRoute(nextSession.role);
    const requestedFrom = state?.from;
    const isFromAllowedForRole =
      typeof requestedFrom === 'string' &&
      ((nextSession.role === 'user' && requestedFrom.startsWith('/user')) ||
        (nextSession.role === 'staff' && requestedFrom.startsWith('/staff')) ||
        (nextSession.role === 'admin' && requestedFrom.startsWith('/admin')));

    navigate(isFromAllowedForRole ? requestedFrom : defaultTarget, { replace: true });
  };

  const handleChangeUserMode = (nextMode: 'login' | 'register') => {
    const target = nextMode === 'register' ? '/register' : '/login';
    if (location.pathname !== target) {
      navigate(target, { replace: true, state });
    }
  };

  return (
    <AuthPage
      initialRole={initialRole}
      initialUserMode={mode}
      embeddedInLayout
      currentSession={session}
      onOpenActiveWorkspace={
        session ? () => navigate(getRoleDefaultRoute(session.role)) : undefined
      }
      onChangeUserMode={handleChangeUserMode}
      onBackToLanding={() => navigate('/')}
      onAuthenticated={handleAuthenticated}
    />
  );
};
