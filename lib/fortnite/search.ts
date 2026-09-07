import type { IslandMetadata } from "./types";

export function filterIslands(
  islands: IslandMetadata[],
  query: string,
): IslandMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return islands.filter((island) => {
    if (island.title.toLowerCase().includes(q)) return true;
    if (island.creatorCode.toLowerCase().includes(q)) return true;
    if (island.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (island.code.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function islandsForCreator(
  islands: IslandMetadata[],
  creatorCode: string,
): IslandMetadata[] {
  const key = creatorCode.trim().toLowerCase();
  return islands.filter((i) => i.creatorCode.toLowerCase() === key);
}
