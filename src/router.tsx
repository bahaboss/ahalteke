import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common';
import {
  AdminLayout,
  AuthLayout,
  PublicLayout,
  StaffLayout,
  UserLayout,
} from './layouts';
import {
  AdminApplicationsPage,
  AdminComplexesPage,
  AdminContentPage,
  AdminDashboardPage,
  AdminStaffPage,
} from './pages/admin';
import { AuthRoutePage } from './pages/auth';
import { DesignSystemRoutePage, LandingRoutePage } from './pages/landing';
import {
  StaffFeedingPage,
  StaffGreenEcoPage,
  StaffHealthTrainingPage,
  StaffHorseDetailPage,
  StaffHorsesPage,
  StaffIoTPage,
  StaffOverviewPage,
  StaffStablesPage,
} from './pages/staff';
import {
  UserAcademyPage,
  UserBooksPage,
  UserCompetitionsPage,
  UserHorseDetailPage,
  UserHorsesPage,
} from './pages/user';

/**
 * Smart & Green Ahalteke — Ýakorsyz arassa URL React Router (SPA mode)
 *
 * 5 aýratyn Layout gabygy we rol esasynda goralan (ProtectedRoute) marşrutlar:
 * - PublicLayout: / , /design-system
 * - AuthLayout:   /login , /register
 * - UserLayout:   /user/horses, /user/horses/:id, /user/competitions, /user/books, /user/academy
 * - StaffLayout:  /staff/overview, /staff/stables, /staff/horses, /staff/horses/:id,
 *                 /staff/iot, /staff/feeding, /staff/health-training, /staff/green-eco
 * - AdminLayout:  /admin/dashboard, /admin/complexes, /admin/staff, /admin/content, /admin/applications
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingRoutePage /> },
      { path: '/design-system', element: <DesignSystemRoutePage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <AuthRoutePage mode="login" /> },
      { path: '/register', element: <AuthRoutePage mode="register" /> },
    ],
  },
  {
    path: '/user',
    element: (
      <ProtectedRoute allowedRoles={['user']}>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/user/horses" replace /> },
      { path: 'horses', element: <UserHorsesPage /> },
      { path: 'horses/:id', element: <UserHorseDetailPage /> },
      { path: 'competitions', element: <UserCompetitionsPage /> },
      { path: 'books', element: <UserBooksPage /> },
      { path: 'academy', element: <UserAcademyPage /> },
    ],
  },
  {
    path: '/staff',
    element: (
      <ProtectedRoute allowedRoles={['staff']}>
        <StaffLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/staff/overview" replace /> },
      { path: 'overview', element: <StaffOverviewPage /> },
      { path: 'stables', element: <StaffStablesPage /> },
      { path: 'horses', element: <StaffHorsesPage /> },
      { path: 'horses/:id', element: <StaffHorseDetailPage /> },
      { path: 'iot', element: <StaffIoTPage /> },
      { path: 'feeding', element: <StaffFeedingPage /> },
      { path: 'health-training', element: <StaffHealthTrainingPage /> },
      { path: 'green-eco', element: <StaffGreenEcoPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'complexes', element: <AdminComplexesPage /> },
      { path: 'staff', element: <AdminStaffPage /> },
      { path: 'content', element: <AdminContentPage /> },
      { path: 'applications', element: <AdminApplicationsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
