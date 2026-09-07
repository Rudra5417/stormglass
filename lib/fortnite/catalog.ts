import {
  getGenreRankings,
  getGenres,
  getIslandMetadataMany,
  getNewestIslands,
  type FetchResult,
} from "./client";
import { selectHomeGenres } from "./genres";
import { collectHomeCodes } from "./home";
import type { IslandMetadata } from "./types";

export async function loadSeenCatalog(
  genre?: string,
): Promise<FetchResult<IslandMetadata[]>> {
  const extraGenre = genre?.trim() || undefined;
  const genres = await getGenres();
  const homeGenres = selectHomeGenres(genres.data);
  const [rankingPages, newest, extraRankings] = await Promise.all([
    Promise.all(homeGenres.map((g) => getGenreRankings(g.slug))),
    getNewestIslands(12),
    extraGenre ? getGenreRankings(extraGenre, 24) : Promise.resolve(undefined),
  ]);
  const codes = collectHomeCodes(
    rankingPages.map((p) => p.data.items.map((i) => i.islandCode)),
    newest.data.map((i) => i.code),
  );
  if (extraRankings) {
    const seen = new Set(codes);
    for (const item of extraRankings.data.items) {
      if (seen.has(item.islandCode)) continue;
      seen.add(item.islandCode);
      codes.push(item.islandCode);
    }
  }
  const meta = await getIslandMetadataMany(codes);
  return {
    data: meta.data,
    stale:
      genres.stale ||
      newest.stale ||
      meta.stale ||
      rankingPages.some((p) => p.stale) ||
      (extraRankings?.stale ?? false),
  };
}
