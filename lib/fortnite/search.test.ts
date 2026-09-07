import { expect, test } from "vitest";
import { filterIslands, islandsForCreator } from "./search";
import type { IslandMetadata } from "./types";

const islands: IslandMetadata[] = [
  {
    code: "6980-2761-9936",
    creatorCode: "neverty7",
    title: "Fight The Brainrot",
    createdIn: "UEFN",
    tags: ["tycoon"],
  },
  {
    code: "1111-2222-3333",
    creatorCode: "other",
    title: "Zone Wars",
    createdIn: "FNC",
    tags: ["pvp"],
  },
];

test("filters by title, creator, or tag", () => {
  expect(filterIslands(islands, "brainrot")).toHaveLength(1);
  expect(filterIslands(islands, "neverty7")).toHaveLength(1);
  expect(filterIslands(islands, "pvp")).toHaveLength(1);
});

test("empty query returns empty array", () => {
  expect(filterIslands(islands, "")).toEqual([]);
  expect(filterIslands(islands, "   ")).toEqual([]);
});

test("islandsForCreator is case-insensitive exact creatorCode", () => {
  expect(islandsForCreator(islands, "Neverty7")).toEqual([islands[0]]);
  expect(islandsForCreator(islands, "missing")).toEqual([]);
});
