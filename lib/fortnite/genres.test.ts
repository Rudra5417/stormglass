import { expect, test } from "vitest";
import { selectHomeGenres } from "./genres";
import type { Genre } from "./types";

const catalog: Genre[] = [
  { slug: "horror", displayName: "Horror" },
  { slug: "shooter", displayName: "Shooter" },
  { slug: "simulation-tycoon", displayName: "Simulation & Tycoon" },
  { slug: "battle-royale", displayName: "Battle Royale" },
];

test("prefers the three spec slugs when present", () => {
  const home = selectHomeGenres(catalog);
  expect(home.map((g) => g.slug)).toEqual([
    "simulation-tycoon",
    "shooter",
    "battle-royale",
  ]);
});

test("falls back to first three when preferred missing", () => {
  const fallbackCatalog: Genre[] = [
    { slug: "a", displayName: "A" },
    { slug: "b", displayName: "B" },
    { slug: "c", displayName: "C" },
  ];
  expect(selectHomeGenres(fallbackCatalog).map((g) => g.slug)).toEqual([
    "a",
    "b",
    "c",
  ]);
});
