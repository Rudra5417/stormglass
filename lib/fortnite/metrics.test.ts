import { expect, test } from "vitest";
import populated from "../../fixtures/island-metrics-populated.json";
import allNull from "../../fixtures/island-metrics-null.json";
import {
  favoritesPerThousand,
  formatCount,
  formatDerived,
  formatRetention,
  lastCompleteUtcDay,
  minutesPerPlay,
  pickDayKpis,
  toChartPoints,
} from "./metrics";
import type { IslandMetricsBundle } from "./types";

test("lastCompleteUtcDay is yesterday UTC", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  expect(lastCompleteUtcDay(now)).toBe("2026-09-06T00:00:00.000Z");
});

test("pickDayKpis uses last complete UTC day not today", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  const kpis = pickDayKpis(populated as IslandMetricsBundle, now);
  expect(kpis?.uniquePlayers).toBe(273541);
  expect(kpis?.plays).toBe(1812309);
  expect(kpis?.minutesPlayed).toBe(31786868);
  expect(kpis?.d1).toBe(0.85);
});

test("pickDayKpis keeps nulls as null", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  const kpis = pickDayKpis(allNull as IslandMetricsBundle, now);
  expect(kpis?.uniquePlayers).toBeNull();
  expect(kpis?.d1).toBeNull();
});

test("toChartPoints drops null buckets", () => {
  const points = toChartPoints([
    { value: 10, timestamp: "2026-09-05T00:00:00.000Z" },
    { value: null, timestamp: "2026-09-06T00:00:00.000Z" },
    { value: 12, timestamp: "2026-09-07T00:00:00.000Z" },
  ]);
  expect(points).toEqual([
    { timestamp: "2026-09-05T00:00:00.000Z", value: 10 },
    { timestamp: "2026-09-07T00:00:00.000Z", value: 12 },
  ]);
});

test("formatRetention renders ratios as percents", () => {
  expect(formatRetention(0.85)).toBe("85%");
  expect(formatRetention(null)).toBe("Not enough data");
});

test("formatCount renders null as not enough data", () => {
  expect(formatCount(273541)).toBe("273,541");
  expect(formatCount(null)).toBe("Not enough data");
});

test("minutesPerPlay divides minutes by plays", () => {
  expect(minutesPerPlay(31786868, 1812309)).toBeCloseTo(17.54, 2);
  expect(minutesPerPlay(null, 10)).toBeNull();
  expect(minutesPerPlay(100, 0)).toBeNull();
});

test("favoritesPerThousand scales favorites by unique players", () => {
  expect(favoritesPerThousand(2501, 273541)).toBeCloseTo(9.14, 2);
  expect(favoritesPerThousand(10, null)).toBeNull();
  expect(favoritesPerThousand(10, 0)).toBeNull();
});

test("formatDerived uses one decimal", () => {
  expect(formatDerived(17.54)).toBe("17.5");
  expect(formatDerived(null)).toBe("Not enough data");
});
