import React from 'react';
import { SkeletonLoader } from '../../components/common';
import {
  AcademyApplyScreen,
  CompetitionsScreen,
  HorseDetailScreen,
  HorsesWorldScreen,
  LibraryScreen,
} from '../../components/user';
import { useAppStore } from '../../store';

export const UserHorsesPage: React.FC = () => {
  return <HorsesWorldScreen />;
};

export const UserHorseDetailPage: React.FC = () => {
  return <HorseDetailScreen />;
};

export const UserCompetitionsPage: React.FC = () => {
  return <CompetitionsScreen />;
};

export const UserBooksPage: React.FC = () => {
  return <LibraryScreen />;
};

export const UserAcademyPage: React.FC = () => {
  const { session } = useAppStore();
  if (!session) return <SkeletonLoader variant="page" />;
  return <AcademyApplyScreen session={session} />;
};
