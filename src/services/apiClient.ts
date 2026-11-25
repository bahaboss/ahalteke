// TODO: [BACKEND_API] ALL /api/v1/* — Geljekki REST/GraphQL backend üçin merkezi HTTP müşderisi we JWT awtorizasiýa gatlagy.

import type { ApiResponse } from '../types';

const DEFAULT_MOCK_DELAY_MS = 180;

/**
 * Asinhron API çagyryşyny imitasiýa edýän kömekçi funksiýa.
 * Geljekde backend birikdirilende diňe şu gatlak `fetch(API_BASE_URL + endpoint)` bilen çalşylar.
 */
export async function mockRequest<T>(
  resolver: () => T,
  delayMs: number = DEFAULT_MOCK_DELAY_MS
): Promise<ApiResponse<T>> {
  const started = Date.now();
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return {
    data: resolver(),
    timestamp: new Date().toISOString(),
    source: 'mock-service',
    latencyMs: Math.max(delayMs, Date.now() - started),
  };
}
