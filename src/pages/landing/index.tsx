import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DesignSystemShowcase, getRoleDefaultRoute } from '../../components/common';
import { LandingPage } from '../../components/landing';
import { useAppStore } from '../../store';
import type { AuthenticatedRole } from '../../types';

export const LandingRoutePage: React.FC = () => {
  const { session } = useAppStore();
  const navigate = useNavigate();

  const handleOpenAuth = (options?: {
    role?: AuthenticatedRole;
    userMode?: 'login' | 'register';
  }) => {
    const targetPath = options?.userMode === 'register' ? '/register' : '/login';
    navigate(targetPath, {
      state: {
        requestedRole: options?.role ?? 'user',
      },
    });
  };

  const handleOpenWorkspace = () => {
    if (!session) {
      navigate('/login', { state: { requestedRole: 'user' } });
      return;
    }
    navigate(getRoleDefaultRoute(session.role));
  };

  return (
    <LandingPage
      session={session}
      onOpenAuth={handleOpenAuth}
      onOpenWorkspace={handleOpenWorkspace}
      onOpenDesignSystem={() => navigate('/design-system')}
      onOpenAcademy={() => navigate('/user/academy')}
    />
  );
};

export const DesignSystemRoutePage: React.FC = () => {
  const navigate = useNavigate();
  return <DesignSystemShowcase onBackToLanding={() => navigate('/')} />;
};
