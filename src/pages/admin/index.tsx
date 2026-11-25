import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminApplicationsScreen,
  AdminAssignmentsScreen,
  AdminContentScreen,
  AdminOverviewScreen,
} from '../../components/admin';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AdminOverviewScreen
      onNavigateTab={(tab) => {
        if (tab === 'assignments') navigate('/admin/complexes');
        if (tab === 'content') navigate('/admin/content');
        if (tab === 'applications') navigate('/admin/applications');
      }}
    />
  );
};

export const AdminComplexesPage: React.FC = () => {
  return <AdminAssignmentsScreen />;
};

export const AdminStaffPage: React.FC = () => {
  return <AdminAssignmentsScreen />;
};

export const AdminContentPage: React.FC = () => {
  return <AdminContentScreen />;
};

export const AdminApplicationsPage: React.FC = () => {
  return <AdminApplicationsScreen />;
};
