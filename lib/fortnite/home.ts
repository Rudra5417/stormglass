import {
  getEcosystemHourMetrics,
  getGenreRankings,
  getGenres,
  getIslandMetadataMany,
  getNewestIslands,
  isoRangeHours,
} from "./client";
import { selectHomeGenres } from "./genres";
import type { Genre, IslandMetadata, MetricPoint } from "./types";

export type HomePageData = {
  stale: boolean;
  inMatchPeakCCU: number | null;
  boards: {
    genre: Genre;
    items: { rank: number; island: IslandMetadata }[];
  }[];
  newest: IslandMetadata[];
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

export async function loadHome(): Promise<HomePageData> {
  const hourRange = isoRangeHours(24);
  const [ecosystem, genresResult, newestResult] = await Promise.all([
    getEcosystemHourMetrics(hourRange.from, hourRange.to),
    getGenres(),
    getNewestIslands(12),
  ]);

  const homeGenres = selectHomeGenres(genresResult.data);
  const rankingPages = await Promise.all(
    homeGenres.map((genre) => getGenreRankings(genre.slug)),
  );

  const rankingLists = rankingPages.map((page) =>
    page.data.items.map((item) => item.islandCode),
  );
  const newestCodes = newestResult.data.map((island) => island.code);
  const codes = collectHomeCodes(rankingLists, newestCodes);
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

  const stale =
    ecosystem.stale ||
    genresResult.stale ||
    newestResult.stale ||
    metadata.stale ||
    rankingPages.some((page) => page.stale);

  return {
    stale,
    inMatchPeakCCU: lastNonNullValue(ecosystem.data.inMatchPeakCCU ?? []),
    boards,
    newest,
  };
}
