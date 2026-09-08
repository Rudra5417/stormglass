import { lastCompleteUtcDay, minutesPerPlay } from "./metrics";
import type {
  ChartPoint,
  DayKpis,
  IslandGenreRank,
  IslandMetricsBundle,
  MetricPoint,
  RetentionPoint,
} from "./types";

export type HealthTone = "up" | "down" | "flat" | "unknown";

export type HealthReport = {
  volume: HealthTone;
  depth: HealthTone;
  return: HealthTone;
};

export type RankHold = {
  genreSlug: string;
  genre: string;
  currentRank: number;
  best: number;
  worst: number;
  hoursInTop8: number;
  hours: number;
};

export type RankSpan = {
  genreSlug: string;
  genre: string;
  currentRank: number;
  previousRank: number | null;
  delta: number | null;
  kind: "climbed" | "fell" | "entered" | "unchanged";
};

export type WeekReport = {
  from: string;
  to: string;
  plays: number | null;
  minutesPlayed: number | null;
  maxPeakCCU: number | null;
  bestUniquePlayers: number | null;
  minutesPerPlay: number | null;
  d1: number | null;
  d7: number | null;
  ranks: RankSpan[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function previousCompleteUtcDay(now: Date = new Date()): string {
  return new Date(
    new Date(lastCompleteUtcDay(now)).getTime() - DAY_MS,
  ).toISOString();
}

export function deltaPct(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatDeltaPct(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.round(value);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export function rankSpans(rankings: IslandGenreRank[]): RankSpan[] {
  if (rankings.length === 0) return [];
  const ordered = [...rankings].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const latest = ordered[ordered.length - 1];
  return latest.genres.map((genre) => {
    const first = ordered.find((snap) =>
      snap.genres.some((g) => g.genreSlug === genre.genreSlug),
    );
    const previousRank =
      first && first.timestamp !== latest.timestamp
        ? (first.genres.find((g) => g.genreSlug === genre.genreSlug)?.rank ??
          null)
        : null;
    if (previousRank === null) {
      return {
        genreSlug: genre.genreSlug,
        genre: genre.genre,
        currentRank: genre.rank,
        previousRank: null,
        delta: null,
        kind: "entered" as const,
      };
    }
    const delta = previousRank - genre.rank;
    const kind =
      delta > 0 ? "climbed" : delta < 0 ? "fell" : "unchanged";
    return {
      genreSlug: genre.genreSlug,
      genre: genre.genre,
      currentRank: genre.rank,
      previousRank,
      delta,
      kind,
    };
  });
}

function completeDayTimestamps(now: Date): string[] {
  const last = new Date(lastCompleteUtcDay(now)).getTime();
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(new Date(last - i * DAY_MS).toISOString());
  }
  return days;
}

function valueAt(series: MetricPoint[], timestamp: string): number | null {
  const hit = series.find((p) => p.timestamp === timestamp);
  return hit ? hit.value : null;
}

function sumWindow(series: MetricPoint[], days: string[]): number | null {
  let sum = 0;
  let any = false;
  for (const day of days) {
    const value = valueAt(series, day);
    if (value === null) continue;
    sum += value;
    any = true;
  }
  return any ? sum : null;
}

function maxWindow(series: MetricPoint[], days: string[]): number | null {
  let max: number | null = null;
  for (const day of days) {
    const value = valueAt(series, day);
    if (value === null) continue;
    max = max === null ? value : Math.max(max, value);
  }
  return max;
}

export function rankHold(rankings: IslandGenreRank[]): RankHold[] {
  if (rankings.length === 0) return [];
  const ordered = [...rankings].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const latest = ordered[ordered.length - 1];
  return latest.genres.map((genre) => {
    const ranks: number[] = [];
    for (const snap of ordered) {
      const hit = snap.genres.find((g) => g.genreSlug === genre.genreSlug);
      if (hit) ranks.push(hit.rank);
    }
    return {
      genreSlug: genre.genreSlug,
      genre: genre.genre,
      currentRank: genre.rank,
      best: Math.min(...ranks),
      worst: Math.max(...ranks),
      hoursInTop8: ranks.filter((rank) => rank <= 8).length,
      hours: ranks.length,
    };
  });
}

function healthTone(pct: number | null): HealthTone {
  if (pct === null) return "unknown";
  const rounded = Math.round(pct);
  if (rounded > 0) return "up";
  if (rounded < 0) return "down";
  return "flat";
}

export function healthReport(
  current: DayKpis | null,
  previous: DayKpis | null,
): HealthReport {
  if (!current || !previous) {
    return { volume: "unknown", depth: "unknown", return: "unknown" };
  }
  return {
    volume: healthTone(deltaPct(current.uniquePlayers, previous.uniquePlayers)),
    depth: healthTone(
      deltaPct(
        minutesPerPlay(current.minutesPlayed, current.plays),
        minutesPerPlay(previous.minutesPlayed, previous.plays),
      ),
    ),
    return: healthTone(deltaPct(current.d1, previous.d1)),
  };
}

export function retentionChartPoints(
  series: RetentionPoint[],
  key: "d1" | "d7",
): ChartPoint[] {
  return series
    .filter((p): p is RetentionPoint & { d1: number; d7: number | null } => {
      return p[key] !== null;
    })
    .map((p) => ({ timestamp: p.timestamp, value: (p[key] as number) * 100 }));
}

export function weekReport(
  bundle: IslandMetricsBundle,
  rankings: IslandGenreRank[],
  now: Date = new Date(),
): WeekReport {
  const days = completeDayTimestamps(now);
  const plays = sumWindow(bundle.plays, days);
  const minutesPlayed = sumWindow(bundle.minutesPlayed, days);
  const last = days[days.length - 1];
  const ret = bundle.retention.find((p) => p.timestamp === last);
  return {
    from: days[0],
    to: last,
    plays,
    minutesPlayed,
    maxPeakCCU: maxWindow(bundle.peakCCU, days),
    bestUniquePlayers: maxWindow(bundle.uniquePlayers, days),
    minutesPerPlay: minutesPerPlay(minutesPlayed, plays),
    d1: ret?.d1 ?? null,
    d7: ret?.d7 ?? null,
    ranks: rankSpans(rankings),
  };
}
