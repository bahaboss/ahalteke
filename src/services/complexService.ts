// TODO: [BACKEND_API] GET /api/v1/complexes — Atçylyk toplumlarynyň, athanalaryň we ulanyjy rollarynyň sanawyny almak.

import { mockComplexes, mockRoleDefinitions, mockStables } from '../mockData';
import type { ApiResponse, EquestrianComplex, RoleDefinition, Stable } from '../types';
import { mockRequest } from './apiClient';

const ADMIN_CUSTOM_STABLES_KEY = 'smart_green_ahalteke_admin_stables_v1';

function readCustomStables(): Stable[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_CUSTOM_STABLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Stable =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.complexId === 'string' &&
        typeof item.name === 'string'
    );
  } catch {
    return [];
  }
}

export function getAllStablesSync(): Stable[] {
  const custom = readCustomStables();
  const baseIds = new Set(mockStables.map((s) => s.id));
  const uniqueCustom = custom.filter((s) => !baseIds.has(s.id));
  return [...uniqueCustom, ...mockStables];
}

export function getAllComplexesSync(): EquestrianComplex[] {
  const customStables = readCustomStables();
  const extraCountByComplex = new Map<string, number>();
  const extraHorsesByComplex = new Map<string, number>();

  for (const stable of customStables) {
    extraCountByComplex.set(
      stable.complexId,
      (extraCountByComplex.get(stable.complexId) ?? 0) + 1
    );
    extraHorsesByComplex.set(
      stable.complexId,
      (extraHorsesByComplex.get(stable.complexId) ?? 0) + stable.occupiedBoxes
    );
  }

  return mockComplexes.map((complex) => ({
    ...complex,
    totalStables: complex.totalStables + (extraCountByComplex.get(complex.id) ?? 0),
    totalHorses: complex.totalHorses + (extraHorsesByComplex.get(complex.id) ?? 0),
  }));
}

export function addCustomStableToStore(newStable: Stable): Stable[] {
  const existing = readCustomStables();
  const updated = [newStable, ...existing];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_CUSTOM_STABLES_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota fallback ignored cleanly
    }
  }
  return getAllStablesSync();
}

export async function fetchComplexes(): Promise<ApiResponse<EquestrianComplex[]>> {
  return mockRequest(() => getAllComplexesSync());
}

// TODO: [BACKEND_API] GET /api/v1/stables?complexId=:id — Belli bir toplumyň athanalaryny almak.
export async function fetchStables(complexId?: string): Promise<ApiResponse<Stable[]>> {
  return mockRequest(() => {
    const all = getAllStablesSync();
    return complexId ? all.filter((stable) => stable.complexId === complexId) : all;
  });
}

// TODO: [BACKEND_API] GET /api/v1/auth/roles — Ulgamdaky rollary we rugsatlary almak.
export async function fetchRoleDefinitions(): Promise<ApiResponse<RoleDefinition[]>> {
  return mockRequest(() => [...mockRoleDefinitions], 120);
}
