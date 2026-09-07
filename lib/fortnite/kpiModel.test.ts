import { expect, test } from "vitest";
import { kpiItems } from "./kpiModel";

test("null kpis are eight not-enough-data rows", () => {
  expect(kpiItems(null).every((i) => i.value === "Not enough data")).toBe(true);
  expect(kpiItems(null)).toHaveLength(8);
});

test("null kpis keep the eight island labels", () => {
  expect(kpiItems(null).map((i) => i.label)).toEqual([
    "Unique players",
    "Plays",
    "Peak CCU",
    "Avg minutes / player",
    "D1 retention",
    "D7 retention",
    "Favorites",
    "Recommendations",
  ]);
});

test("populated kpis format counts and retention", () => {
  expect(
    kpiItems({
      timestamp: "2026-09-06T00:00:00.000Z",
      uniquePlayers: 273541,
      plays: 1812309,
      peakCCU: 154444,
      averageMinutesPerPlayer: 116.21,
      d1: 0.85,
      d7: 0.68,
      favorites: 2501,
      recommendations: 7212,
    }),
  ).toEqual([
    { label: "Unique players", value: "273,541" },
    { label: "Plays", value: "1,812,309" },
    { label: "Peak CCU", value: "154,444" },
    { label: "Avg minutes / player", value: "116.21" },
    { label: "D1 retention", value: "85%" },
    { label: "D7 retention", value: "68%" },
    { label: "Favorites", value: "2,501" },
    { label: "Recommendations", value: "7,212" },
  ]);
});
