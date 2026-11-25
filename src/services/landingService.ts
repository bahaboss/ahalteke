// TODO: [BACKEND_API] GET /api/v1/landing/overview — Baş sahypa üçin 5 welaýatyň «Ýaşyl Reýtingi», Hero bedew IoT görkezijileri, kitaplar, ideg gatlaklary we akademiýa maksatnamalaryny almak.

import {
  mockAcademyPrograms,
  mockCareLayers,
  mockHeritageBooks,
  mockHeroHorseLayers,
  mockRegionEcoRatings,
  type AcademyProgramHighlight,
  type CareLayerStep,
  type HeritageBook,
  type HeroHorseLayer,
  type RegionEcoRating,
} from '../mockData/landingStory';
import type { ApiResponse } from '../types';
import { mockRequest } from './apiClient';

export interface LandingStoryPayload {
  regions: RegionEcoRating[];
  heroHorses: HeroHorseLayer[];
  heritageBooks: HeritageBook[];
  careLayers: CareLayerStep[];
  academyPrograms: AcademyProgramHighlight[];
}

export async function fetchLandingStoryData(): Promise<ApiResponse<LandingStoryPayload>> {
  return mockRequest(
    () => ({
      regions: [...mockRegionEcoRatings],
      heroHorses: [...mockHeroHorseLayers],
      heritageBooks: [...mockHeritageBooks],
      careLayers: [...mockCareLayers],
      academyPrograms: [...mockAcademyPrograms],
    }),
    120
  );
}

// TODO: [BACKEND_API] GET /api/v1/eco/calculator?complexCount=:n&stablesPerComplex=:m — Saýlanan atçylyk toplumlarynyň we athanalaryň sany boýunça ýyllyk ekologiýa tygşytlylygyny hasaplamak.
export interface EcoCalculatorResult {
  complexCount: number;
  stablesPerComplex: number;
  totalStables: number;
  waterSavedLitersPerYear: number;
  solarEnergyKwhPerYear: number;
  organicForageSavedTonsPerYear: number;
  co2ReducedTonsPerYear: number;
}

export function calculateGreenImpact(
  complexCount: number,
  stablesPerComplex = 6,
): EcoCalculatorResult {
  const n = Math.max(1, Math.min(25, Math.round(complexCount)));
  const s = Math.max(2, Math.min(20, Math.round(stablesPerComplex)));
  const totalStables = n * s;

  return {
    complexCount: n,
    stablesPerComplex: s,
    totalStables,
    waterSavedLitersPerYear: totalStables * 85_200, // 7 100 L/aý/athana × 12
    solarEnergyKwhPerYear: totalStables * 56_900, // ~4 742 kWt·s/aý/athana × 12
    organicForageSavedTonsPerYear: Number((totalStables * 6.4).toFixed(1)),
    co2ReducedTonsPerYear: Number((totalStables * 29.83).toFixed(1)),
  };
}
