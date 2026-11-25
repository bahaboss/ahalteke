// TODO: [BACKEND_API] GET /api/v1/horses — Ahalteke bedewleriniň sanawyny, gözlegini we QR-kod pasportyny almak.

import { mockHorses } from '../mockData';
import type { ApiResponse, Horse, HorseHealthStatus } from '../types';
import { mockRequest } from './apiClient';

export interface HorseFilterParams {
  search?: string;
  healthStatus?: HorseHealthStatus | 'all';
  complexId?: string;
}

export async function fetchHorses(filters?: HorseFilterParams): Promise<ApiResponse<Horse[]>> {
  return mockRequest(() => {
    let result = [...mockHorses];

    if (filters?.complexId && filters.complexId !== 'all') {
      result = result.filter((horse) => horse.complexId === filters.complexId);
    }

    if (filters?.healthStatus && filters.healthStatus !== 'all') {
      result = result.filter((horse) => horse.healthStatus === filters.healthStatus);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (horse) =>
          horse.name.toLowerCase().includes(q) ||
          horse.qrCodeId.toLowerCase().includes(q) ||
          horse.lineage.toLowerCase().includes(q) ||
          horse.coatLabel.toLowerCase().includes(q)
      );
    }

    return result;
  });
}

// TODO: [BACKEND_API] GET /api/v1/horses/qr/:qrCodeId — QR-kod arkaly bedewiň sanly pasportyny çagyrmak.
export async function fetchHorseByQrCode(qrCodeId: string): Promise<ApiResponse<Horse | null>> {
  return mockRequest(() => mockHorses.find((horse) => horse.qrCodeId === qrCodeId) ?? null, 150);
}

// TODO: [BACKEND_API] GET /api/v1/horses/:id — Bedewiň ID-si boýunça doly pasport we şejere maglumatyny almak.
export async function fetchHorseById(horseId: string): Promise<ApiResponse<Horse | null>> {
  return mockRequest(() => mockHorses.find((horse) => horse.id === horseId) ?? null, 120);
}

