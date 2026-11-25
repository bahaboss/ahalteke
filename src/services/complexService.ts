// TODO: [BACKEND_API] GET /api/v1/complexes — Atçylyk toplumlarynyň, athanalaryň we ulanyjy rollarynyň sanawyny almak.

import { mockComplexes, mockRoleDefinitions, mockStables } from '../mockData';
import type { ApiResponse, EquestrianComplex, RoleDefinition, Stable } from '../types';
import { mockRequest } from './apiClient';

const ADMIN_CUSTOM_STABLES_KEY = 'smart_green_ahalteke_admin_stables_v1';
const ADMIN_CUSTOM_COMPLEXES_KEY = 'smart_green_ahalteke_admin_complexes_v1';

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

function writeCustomStables(items: Stable[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_CUSTOM_STABLES_KEY, JSON.stringify(items));
  } catch {
    // Storage quota fallback ignored cleanly
  }
}

function readCustomComplexes(): EquestrianComplex[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_CUSTOM_COMPLEXES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is EquestrianComplex =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string'
    );
  } catch {
    return [];
  }
}

function writeCustomComplexes(items: EquestrianComplex[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_CUSTOM_COMPLEXES_KEY, JSON.stringify(items));
  } catch {
    // Storage quota fallback ignored cleanly
  }
}

export function getAllStablesSync(): Stable[] {
  const custom = readCustomStables();
  const overridesById = new Map(custom.map((s) => [s.id, s]));
  const baseIds = new Set(mockStables.map((s) => s.id));
  const mergedBase = mockStables.map((s) => overridesById.get(s.id) ?? s);
  const newlyAdded = custom.filter((s) => !baseIds.has(s.id));
  return [...newlyAdded, ...mergedBase];
}

export function getAllComplexesSync(): EquestrianComplex[] {
  const customComplexes = readCustomComplexes();
  const customById = new Map(customComplexes.map((c) => [c.id, c]));
  const baseComplexIds = new Set(mockComplexes.map((c) => c.id));

  const customStables = readCustomStables();
  const baseStableIds = new Set(mockStables.map((s) => s.id));
  const newlyAddedStables = customStables.filter((s) => !baseStableIds.has(s.id));

  const extraCountByComplex = new Map<string, number>();
  const extraHorsesByComplex = new Map<string, number>();

  for (const stable of newlyAddedStables) {
    extraCountByComplex.set(
      stable.complexId,
      (extraCountByComplex.get(stable.complexId) ?? 0) + 1
    );
    extraHorsesByComplex.set(
      stable.complexId,
      (extraHorsesByComplex.get(stable.complexId) ?? 0) + stable.occupiedBoxes
    );
  }

  const mergedBase = mockComplexes.map((baseComplex) => {
    const complex = customById.get(baseComplex.id) ?? baseComplex;
    return {
      ...complex,
      totalStables: complex.totalStables + (extraCountByComplex.get(complex.id) ?? 0),
      totalHorses: complex.totalHorses + (extraHorsesByComplex.get(complex.id) ?? 0),
    };
  });

  const newlyAddedComplexes = customComplexes
    .filter((c) => !baseComplexIds.has(c.id))
    .map((complex) => ({
      ...complex,
      totalStables: extraCountByComplex.get(complex.id) ?? complex.totalStables,
      totalHorses: extraHorsesByComplex.get(complex.id) ?? complex.totalHorses,
    }));

  return [...newlyAddedComplexes, ...mergedBase];
}

export function upsertComplexInStore(complex: EquestrianComplex): EquestrianComplex[] {
  const existing = readCustomComplexes();
  const exists = existing.some((item) => item.id === complex.id);
  const updated = exists
    ? existing.map((item) => (item.id === complex.id ? complex : item))
    : [complex, ...existing];
  writeCustomComplexes(updated);
  return getAllComplexesSync();
}

export function upsertStableInStore(stable: Stable): Stable[] {
  const existing = readCustomStables();
  const exists = existing.some((item) => item.id === stable.id);
  const updated = exists
    ? existing.map((item) => (item.id === stable.id ? stable : item))
    : [stable, ...existing];
  writeCustomStables(updated);
  return getAllStablesSync();
}

export function addCustomStableToStore(newStable: Stable): Stable[] {
  return upsertStableInStore(newStable);
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
