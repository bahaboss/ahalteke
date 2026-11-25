import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminApplicationsScreen,
  AdminComplexesScreen,
  AdminContentScreen,
  AdminOverviewScreen,
  AdminStaffScreen,
} from '../../components/admin';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AdminOverviewScreen
      onNavigateTab={(tab) => {
        if (tab === 'complexes' || tab === 'assignments') navigate('/admin/complexes');
        if (tab === 'staff') navigate('/admin/staff');
        if (tab === 'content') navigate('/admin/content');
        if (tab === 'applications') navigate('/admin/applications');
      }}
    />
  );
};

export const AdminComplexesPage: React.FC = () => {
  return <AdminComplexesScreen />;
};

export const AdminStaffPage: React.FC = () => {
  return <AdminStaffScreen />;
};

export const AdminContentPage: React.FC = () => {
  return <AdminContentScreen />;
};

export const AdminApplicationsPage: React.FC = () => {
  return <AdminApplicationsScreen />;
};
