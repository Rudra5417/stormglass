import { getGenreRankings, getGenres, getIslandMetadataMany, getNewestIslands, type FetchResult } from "./client";
import { selectHomeGenres } from "./genres";
import { collectHomeCodes } from "./home";
import type { IslandMetadata } from "./types";

export async function loadSeenCatalog(): Promise<FetchResult<IslandMetadata[]>> {
  const genres = await getGenres();
  const homeGenres = selectHomeGenres(genres.data);
  const rankingPages = await Promise.all(
    homeGenres.map((g) => getGenreRankings(g.slug)),
  );
  const newest = await getNewestIslands(12);
  const codes = collectHomeCodes(
    rankingPages.map((p) => p.data.items.map((i) => i.islandCode)),
    newest.data.map((i) => i.code),
  );
  const meta = await getIslandMetadataMany(codes);
  return {
    data: meta.data,
    stale:
      genres.stale ||
      newest.stale ||
      meta.stale ||
      rankingPages.some((p) => p.stale),
  };
}
