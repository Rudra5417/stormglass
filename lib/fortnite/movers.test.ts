import { expect, test } from "vitest";
import { previousHourIso, rankMovers } from "./movers";

const current = [
  { islandCode: "aaa", rank: 1 },
  { islandCode: "bbb", rank: 2 },
  { islandCode: "ccc", rank: 3 },
  { islandCode: "ddd", rank: 4 },
];

const previous = [
  { islandCode: "bbb", rank: 1 },
  { islandCode: "aaa", rank: 4 },
  { islandCode: "ccc", rank: 2 },
  { islandCode: "eee", rank: 3 },
];

test("previousHourIso subtracts one hour", () => {
  expect(previousHourIso("2026-09-07T15:00:00.000Z")).toBe(
    "2026-09-07T14:00:00.000Z",
  );
});

test("rankMovers treats lower rank number as a climb", () => {
  const { climbed, fell } = rankMovers(current, previous);
  const up = climbed.filter((m) => m.kind === "climbed");
  expect(up.map((m) => m.islandCode)).toEqual(["aaa"]);
  expect(up[0]).toMatchObject({
    currentRank: 1,
    previousRank: 4,
    delta: 3,
    kind: "climbed",
  });
  expect(fell.map((m) => m.islandCode)).toEqual(["bbb", "ccc"]);
  expect(fell[0]).toMatchObject({
    islandCode: "bbb",
    currentRank: 2,
    previousRank: 1,
    delta: -1,
    kind: "fell",
  });
});

test("rankMovers labels new top-24 islands as entered without a fake delta", () => {
  const { climbed } = rankMovers(current, previous);
  const entered = climbed.filter((m) => m.kind === "entered");
  expect(entered).toEqual([
    {
      islandCode: "ddd",
      currentRank: 4,
      previousRank: null,
      delta: null,
      kind: "entered",
    },
  ]);
});
