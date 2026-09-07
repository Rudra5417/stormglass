import type { Genre } from "./types";

export const PREFERRED_HOME_GENRES = [
  "simulation-tycoon",
  "shooter",
  "battle-royale",
] as const;

export function selectHomeGenres(genres: Genre[]): Genre[] {
  const bySlug = new Map(genres.map((g) => [g.slug, g]));
  const preferred = PREFERRED_HOME_GENRES.map((s) => bySlug.get(s)).filter(
    (g): g is Genre => Boolean(g),
  );
  if (preferred.length === 3) return preferred;
  return genres.slice(0, 3);
}
