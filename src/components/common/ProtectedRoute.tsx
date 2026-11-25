import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import type { AuthenticatedRole } from '../../types';

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

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { session } = useAppStore();
  const location = useLocation();

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
    return <Navigate to={getRoleDefaultRoute(session.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
