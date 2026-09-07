import {
  getEcosystemHourMetrics,
  getGenreRankings,
  getGenres,
  getIslandMetadataMany,
  getNewestIslands,
  isoRangeHours,
} from "./client";
import { FortniteNotFoundError, FortniteRateLimitError } from "./errors";
import { selectHomeGenres } from "./genres";
import { previousHourIso, rankMovers, type Mover } from "./movers";
import type { Genre, IslandMetadata, MetricPoint } from "./types";

export type HomeMover = Mover & { island: IslandMetadata; genre: Genre };

export type HomePageData = {
  stale: boolean;
  inMatchPeakCCU: number | null;
  boards: {
    genre: Genre;
    items: { rank: number; island: IslandMetadata }[];
  }[];
  newest: IslandMetadata[];
  climbers: HomeMover[];
  fallers: HomeMover[];
};

export function collectHomeCodes(
  rankingLists: string[][],
  newest: string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of rankingLists) {
    for (const code of list.slice(0, 8)) {
      if (seen.has(code)) continue;
      seen.add(code);
      out.push(code);
    }
  }
  for (const code of newest) {
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.slice(0, 36);
}

function lastNonNullValue(points: MetricPoint[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const value = points[i]?.value;
    if (value != null) return value;
  }
  return null;
}

function takeUnique(movers: HomeMover[], limit: number): HomeMover[] {
  const seen = new Set<string>();
  const out: HomeMover[] = [];
  for (const mover of movers) {
    if (seen.has(mover.islandCode)) continue;
    seen.add(mover.islandCode);
    out.push(mover);
    if (out.length >= limit) break;
  }
  return out;
}

export async function loadHome(): Promise<HomePageData> {
  const hourRange = isoRangeHours(24);
  const [ecosystem, genresResult, newestResult] = await Promise.all([
    getEcosystemHourMetrics(hourRange.from, hourRange.to),
    getGenres(),
    getNewestIslands(12),
  ]);

  const homeGenres = selectHomeGenres(genresResult.data);
  const rankingPages = await Promise.all(
    homeGenres.map((genre) => getGenreRankings(genre.slug, 24)),
  );

  const previousPages = await Promise.all(
    homeGenres.map(async (genre, index) => {
      const snapshot = rankingPages[index]?.data.snapshot;
      if (!snapshot || rankingPages[index]?.data.snapshotAvailable === false) {
        return null;
      }
      try {
        return await getGenreRankings(
          genre.slug,
          24,
          previousHourIso(snapshot),
        );
      } catch (error) {
        if (
          error instanceof FortniteNotFoundError ||
          error instanceof FortniteRateLimitError
        ) {
          return null;
        }
        throw error;
      }
    }),
  );

  const rankingLists = rankingPages.map((page) =>
    page.data.items.map((item) => item.islandCode),
  );
  const newestCodes = newestResult.data.map((island) => island.code);
  const moverCodes = homeGenres.flatMap((genre, index) => {
    const current = rankingPages[index]?.data.items ?? [];
    const previous = previousPages[index]?.data.items ?? [];
    const { climbed, fell } = rankMovers(current, previous);
    return [...climbed, ...fell].map((mover) => mover.islandCode);
  });
  const codes = [
    ...new Set([...collectHomeCodes(rankingLists, newestCodes), ...moverCodes]),
  ];
  const metadata = await getIslandMetadataMany(codes);

  const byCode = new Map(metadata.data.map((island) => [island.code, island]));

  const boards = homeGenres.map((genre, index) => ({
    genre,
    items: (rankingPages[index]?.data.items ?? [])
      .slice(0, 8)
      .flatMap((item) => {
        const island = byCode.get(item.islandCode);
        return island ? [{ rank: item.rank, island }] : [];
      }),
  }));

  const newest = newestResult.data
    .slice(0, 12)
    .map((island) => byCode.get(island.code) ?? island);

  const allClimbed: HomeMover[] = [];
  const allFell: HomeMover[] = [];
  for (const [index, genre] of homeGenres.entries()) {
    const { climbed, fell } = rankMovers(
      rankingPages[index]?.data.items ?? [],
      previousPages[index]?.data.items ?? [],
    );
    for (const mover of climbed) {
      const island = byCode.get(mover.islandCode);
      if (island) allClimbed.push({ ...mover, island, genre });
    }
    for (const mover of fell) {
      const island = byCode.get(mover.islandCode);
      if (island) allFell.push({ ...mover, island, genre });
    }
  }
  allClimbed.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "climbed" ? -1 : 1;
    return (b.delta ?? 0) - (a.delta ?? 0);
  });
  allFell.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));

  const stale =
    ecosystem.stale ||
    genresResult.stale ||
    newestResult.stale ||
    metadata.stale ||
    rankingPages.some((page) => page.stale) ||
    previousPages.some((page) => page?.stale);

  return {
    stale,
    inMatchPeakCCU: lastNonNullValue(ecosystem.data.inMatchPeakCCU ?? []),
    boards,
    newest,
    climbers: takeUnique(allClimbed, 5),
    fallers: takeUnique(allFell, 5),
  };
}
