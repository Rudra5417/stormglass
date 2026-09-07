import "server-only";
import {
  FortniteApiError,
  FortniteNotFoundError,
  FortniteRateLimitError,
} from "./errors";
import { parseIslandCode } from "./normalize";
import type {
  Genre,
  GenreRankingPage,
  IslandGenreRank,
  IslandMetadata,
  IslandMetricsBundle,
  MetricPoint,
} from "./types";

export const FORTNITE_API_BASE = "https://api.fortnite.com/ecosystem/v1";

export type FetchResult<T> = { data: T; stale: boolean };

const lastSuccess = new Map<string, unknown>();

export function isoRangeDays(
  days: number,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

export function isoRangeHours(
  hours: number,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now.toISOString();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  return { from, to };
}

function revalidateFor(path: string): number {
  if (/^\/islands\/[^/]+$/.test(path)) return 300;
  if (/^\/islands\/[^/]+\/metrics$/.test(path)) return 300;
  return 60;
}

async function apiGet<T>(
  path: string,
  query?: Record<string, string>,
): Promise<FetchResult<T>> {
  const url = new URL(`${FORTNITE_API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  const key = url.toString();
  const response = await fetch(key, {
    next: { revalidate: revalidateFor(path) },
  } as RequestInit);
  if (response.status === 404) {
    throw new FortniteNotFoundError(path);
  }
  if (response.status === 429) {
    if (lastSuccess.has(key)) {
      return { data: lastSuccess.get(key) as T, stale: true };
    }
    throw new FortniteRateLimitError(false);
  }
  if (!response.ok) {
    throw new FortniteApiError(
      response.status,
      `Fortnite API ${response.status} for ${path}`,
    );
  }
  const data = (await response.json()) as T;
  lastSuccess.set(key, data);
  return { data, stale: false };
}

function requireCode(code: string): string {
  const parsed = parseIslandCode(code);
  if (!parsed) {
    throw new FortniteNotFoundError(`/islands/${code}`);
  }
  return parsed;
}

export async function getIsland(code: string): Promise<FetchResult<IslandMetadata>> {
  return apiGet<IslandMetadata>(`/islands/${requireCode(code)}`);
}

export async function getIslandDayMetrics(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandMetricsBundle>> {
  return apiGet<IslandMetricsBundle>(`/islands/${requireCode(code)}/metrics`, {
    from,
    to,
  });
}

export async function getIslandHourMetrics(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandMetricsBundle>> {
  return apiGet<IslandMetricsBundle>(
    `/islands/${requireCode(code)}/metrics/hour`,
    { from, to },
  );
}

export async function getIslandRankings(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandGenreRank[]>> {
  const result = await apiGet<{ data: IslandGenreRank[] }>(
    `/islands/${requireCode(code)}/rankings`,
    { from, to },
  );
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getGenres(): Promise<FetchResult<Genre[]>> {
  const result = await apiGet<{ data: Genre[] }>("/genres");
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getGenreRankings(
  slug: string,
): Promise<FetchResult<GenreRankingPage>> {
  const result = await apiGet<{
    data: { islandCode: string; rank: number }[];
    meta: {
      total?: number;
      snapshotAvailable?: boolean;
      snapshot?: string | null;
    };
  }>(`/genres/${slug}/rankings`);
  return {
    stale: result.stale,
    data: {
      items: result.data.data ?? [],
      total: result.data.meta?.total ?? 0,
      snapshotAvailable: result.data.meta?.snapshotAvailable ?? false,
      snapshot: result.data.meta?.snapshot ?? null,
    },
  };
}

export async function getNewestIslands(
  size: number,
): Promise<FetchResult<IslandMetadata[]>> {
  const result = await apiGet<{ data: IslandMetadata[] }>("/islands", {
    size: String(size),
  });
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getEcosystemHourMetrics(
  from: string,
  to: string,
): Promise<FetchResult<{ inMatchPeakCCU: MetricPoint[] }>> {
  return apiGet("/metrics/hour", { from, to });
}

export async function getIslandMetadataMany(
  codes: string[],
): Promise<FetchResult<IslandMetadata[]>> {
  const unique = [...new Set(codes)];
  const islands: IslandMetadata[] = [];
  let stale = false;
  for (let i = 0; i < unique.length; i += 8) {
    const chunk = unique.slice(i, i + 8);
    const results = await Promise.all(
      chunk.map(async (code) => {
        try {
          return await getIsland(code);
        } catch (error) {
          if (error instanceof FortniteNotFoundError) return null;
          throw error;
        }
      }),
    );
    for (const result of results) {
      if (!result) continue;
      stale = stale || result.stale;
      islands.push(result.data);
    }
  }
  return { data: islands, stale };
}
