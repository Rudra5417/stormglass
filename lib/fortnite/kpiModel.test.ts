import { expect, test } from "vitest";
import { kpiItems, pulseKpiItems } from "./kpiModel";

const empty = "Not enough data";
const labels = [
  "Unique players",
  "Plays",
  "Peak CCU",
  "Avg minutes / player",
  "Minutes per play",
  "D1 retention",
  "D7 retention",
  "Favorites",
  "Favorites per 1,000 players",
  "Recommendations",
];

test("null kpis are ten not-enough-data rows", () => {
  expect(kpiItems(null).every((i) => i.value === empty)).toBe(true);
  expect(kpiItems(null)).toHaveLength(10);
});

test("null kpis keep the island labels including derived metrics", () => {
  expect(kpiItems(null).map((i) => i.label)).toEqual(labels);
});

test("pulseKpiItems keeps six creator-facing rows and drops favorites", () => {
  const labels = pulseKpiItems(null).map((i) => i.label);
  expect(labels).toEqual([
    "Unique players",
    "Plays",
    "Peak CCU",
    "Minutes per play",
    "D1 retention",
    "D7 retention",
  ]);
  expect(labels).not.toContain("Favorites");
});

test("kpiItems attach day-over-day percents only when a previous value exists", () => {
  const items = kpiItems(
    {
      timestamp: "2026-09-06T00:00:00.000Z",
      uniquePlayers: 120,
      plays: 80,
      peakCCU: 10,
      averageMinutesPerPlayer: 1,
      minutesPlayed: 80,
      d1: 0.5,
      d7: 0.2,
      favorites: 1,
      recommendations: 1,
    },
    {
      uniquePlayers: 100,
      plays: 100,
      peakCCU: null,
    },
  );
  expect(items.find((i) => i.label === "Unique players")?.delta).toBe("+20%");
  expect(items.find((i) => i.label === "Plays")?.delta).toBe("-20%");
  expect(items.find((i) => i.label === "Peak CCU")?.delta).toBeNull();
  expect(items.find((i) => i.label === "Favorites")?.delta).toBeUndefined();
});

test("populated kpis format counts, retention, and derived ratios", () => {
  expect(
    kpiItems({
      timestamp: "2026-09-06T00:00:00.000Z",
      uniquePlayers: 273541,
      plays: 1812309,
      peakCCU: 154444,
      averageMinutesPerPlayer: 116.21,
      minutesPlayed: 31786868,
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
    { label: "Minutes per play", value: "17.5" },
    { label: "D1 retention", value: "85%" },
    { label: "D7 retention", value: "68%" },
    { label: "Favorites", value: "2,501" },
    { label: "Favorites per 1,000 players", value: "9.1" },
    { label: "Recommendations", value: "7,212" },
  ]);
});
