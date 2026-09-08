import { expect, test } from "vitest";
import type { IslandGenreRank, IslandMetricsBundle } from "./types";
import {
  deltaPct,
  formatDeltaPct,
  healthReport,
  previousCompleteUtcDay,
  rankHold,
  rankSpans,
  retentionChartPoints,
  weekReport,
} from "./trajectory";
import type { DayKpis } from "./types";

test("previousCompleteUtcDay is two UTC days before now", () => {
  expect(previousCompleteUtcDay(new Date("2026-09-07T15:00:00.000Z"))).toBe(
    "2026-09-05T00:00:00.000Z",
  );
});

test("deltaPct is null when either side is missing or previous is zero", () => {
  expect(deltaPct(12, null)).toBeNull();
  expect(deltaPct(null, 10)).toBeNull();
  expect(deltaPct(10, 0)).toBeNull();
});

test("deltaPct treats a lower value as a negative percent", () => {
  expect(deltaPct(80, 100)).toBe(-20);
  expect(deltaPct(120, 100)).toBe(20);
});

test("formatDeltaPct omits null and signs non-zero percents", () => {
  expect(formatDeltaPct(null)).toBeNull();
  expect(formatDeltaPct(12.4)).toBe("+12%");
  expect(formatDeltaPct(-4.1)).toBe("-4%");
  expect(formatDeltaPct(0)).toBe("0%");
});

const ranks: IslandGenreRank[] = [
  {
    timestamp: "2026-09-01T00:00:00.000Z",
    genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 12 }],
  },
  {
    timestamp: "2026-09-03T00:00:00.000Z",
    genres: [
      { genreSlug: "shooter", genre: "Shooter", rank: 8 },
      { genreSlug: "simulation-tycoon", genre: "Simulation & Tycoon", rank: 20 },
    ],
  },
  {
    timestamp: "2026-09-06T00:00:00.000Z",
    genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 4 }],
  },
];

test("rankSpans compares each current genre to its first snapshot in the window", () => {
  expect(rankSpans(ranks)).toEqual([
    {
      genreSlug: "shooter",
      genre: "Shooter",
      currentRank: 4,
      previousRank: 12,
      delta: 8,
      kind: "climbed",
    },
  ]);
});

test("rankSpans labels a genre with no earlier snapshot as entered", () => {
  expect(
    rankSpans([
      {
        timestamp: "2026-09-06T00:00:00.000Z",
        genres: [{ genreSlug: "horror", genre: "Horror", rank: 5 }],
      },
    ]),
  ).toEqual([
    {
      genreSlug: "horror",
      genre: "Horror",
      currentRank: 5,
      previousRank: null,
      delta: null,
      kind: "entered",
    },
  ]);
});

test("rankSpans treats a worse rank number as a fall", () => {
  expect(
    rankSpans([
      {
        timestamp: "2026-09-01T00:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 2 }],
      },
      {
        timestamp: "2026-09-06T00:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 9 }],
      },
    ])[0],
  ).toMatchObject({
    currentRank: 9,
    previousRank: 2,
    delta: -7,
    kind: "fell",
  });
});

test("rankSpans marks an unchanged rank without a fake entered label", () => {
  expect(
    rankSpans([
      {
        timestamp: "2026-09-01T00:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 4 }],
      },
      {
        timestamp: "2026-09-06T00:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 4 }],
      },
    ])[0].kind,
  ).toBe("unchanged");
});

function point(value: number | null, day: string) {
  return { value, timestamp: `${day}T00:00:00.000Z` };
}

function bundle(days: Record<string, Partial<{
  plays: number | null;
  minutesPlayed: number | null;
  peakCCU: number | null;
  uniquePlayers: number | null;
  d1: number | null;
  d7: number | null;
}>>): IslandMetricsBundle {
  const empty: IslandMetricsBundle = {
    averageMinutesPerPlayer: [],
    peakCCU: [],
    favorites: [],
    minutesPlayed: [],
    recommendations: [],
    plays: [],
    uniquePlayers: [],
    retention: [],
  };
  for (const [day, row] of Object.entries(days)) {
    if (row.plays !== undefined) empty.plays.push(point(row.plays, day));
    if (row.minutesPlayed !== undefined) {
      empty.minutesPlayed.push(point(row.minutesPlayed, day));
    }
    if (row.peakCCU !== undefined) empty.peakCCU.push(point(row.peakCCU, day));
    if (row.uniquePlayers !== undefined) {
      empty.uniquePlayers.push(point(row.uniquePlayers, day));
    }
    if (row.d1 !== undefined || row.d7 !== undefined) {
      empty.retention.push({
        d1: row.d1 ?? null,
        d7: row.d7 ?? null,
        timestamp: `${day}T00:00:00.000Z`,
      });
    }
  }
  return empty;
}

const now = new Date("2026-09-07T15:00:00.000Z");

test("weekReport sums additive metrics across last 7 complete UTC days and skips today", () => {
  const report = weekReport(
    bundle({
      "2026-08-31": { plays: 10, minutesPlayed: 100, peakCCU: 3, uniquePlayers: 4 },
      "2026-09-05": { plays: 20, minutesPlayed: 50, peakCCU: 8, uniquePlayers: 9 },
      "2026-09-06": {
        plays: 30,
        minutesPlayed: 90,
        peakCCU: 5,
        uniquePlayers: 7,
        d1: 0.4,
        d7: 0.2,
      },
      "2026-09-07": {
        plays: 999,
        minutesPlayed: 999,
        peakCCU: 999,
        uniquePlayers: 999,
        d1: 0.99,
        d7: 0.99,
      },
    }),
    ranks,
    now,
  );
  expect(report.plays).toBe(60);
  expect(report.minutesPlayed).toBe(240);
  expect(report.maxPeakCCU).toBe(8);
  expect(report.bestUniquePlayers).toBe(9);
  expect(report.minutesPerPlay).toBe(4);
  expect(report.d1).toBe(0.4);
  expect(report.d7).toBe(0.2);
  expect(report.from).toBe("2026-08-31T00:00:00.000Z");
  expect(report.to).toBe("2026-09-06T00:00:00.000Z");
  expect(report.ranks[0].delta).toBe(8);
});

test("rankHold reports best, worst, and observed hours in top 8 for current genres", () => {
  expect(
    rankHold([
      {
        timestamp: "2026-09-06T10:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 12 }],
      },
      {
        timestamp: "2026-09-06T11:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 3 }],
      },
      {
        timestamp: "2026-09-06T12:00:00.000Z",
        genres: [{ genreSlug: "shooter", genre: "Shooter", rank: 4 }],
      },
    ]),
  ).toEqual([
    {
      genreSlug: "shooter",
      genre: "Shooter",
      currentRank: 4,
      best: 3,
      worst: 12,
      hoursInTop8: 2,
      hours: 3,
    },
  ]);
});

test("healthReport reads volume, depth, and return against the previous day", () => {
  const current: DayKpis = {
    timestamp: "2026-09-06T00:00:00.000Z",
    uniquePlayers: 120,
    plays: 80,
    peakCCU: 10,
    averageMinutesPerPlayer: 1,
    minutesPlayed: 1200,
    d1: 0.4,
    d7: 0.2,
    favorites: 1,
    recommendations: 1,
  };
  const previous: DayKpis = {
    ...current,
    timestamp: "2026-09-05T00:00:00.000Z",
    uniquePlayers: 100,
    plays: 100,
    minutesPlayed: 1000,
    d1: 0.5,
  };
  expect(healthReport(current, previous)).toEqual({
    volume: "up",
    depth: "up",
    return: "down",
  });
});

test("healthReport is unknown when a side is missing", () => {
  expect(healthReport(null, null)).toEqual({
    volume: "unknown",
    depth: "unknown",
    return: "unknown",
  });
});

test("retentionChartPoints scales ratios to percents and drops nulls", () => {
  expect(
    retentionChartPoints(
      [
        { d1: 0.85, d7: null, timestamp: "2026-09-05T00:00:00.000Z" },
        { d1: 0.4, d7: 0.2, timestamp: "2026-09-06T00:00:00.000Z" },
      ],
      "d1",
    ),
  ).toEqual([
    { timestamp: "2026-09-05T00:00:00.000Z", value: 85 },
    { timestamp: "2026-09-06T00:00:00.000Z", value: 40 },
  ]);
});

test("weekReport does not treat null buckets as zero", () => {
  const report = weekReport(
    bundle({
      "2026-09-06": { plays: null, minutesPlayed: null, peakCCU: null, uniquePlayers: null },
    }),
    [],
    now,
  );
  expect(report.plays).toBeNull();
  expect(report.minutesPlayed).toBeNull();
  expect(report.maxPeakCCU).toBeNull();
  expect(report.bestUniquePlayers).toBeNull();
  expect(report.minutesPerPlay).toBeNull();
  expect(report.d1).toBeNull();
  expect(report.d7).toBeNull();
});
