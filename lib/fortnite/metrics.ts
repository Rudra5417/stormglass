import type {
  ChartPoint,
  DayKpis,
  IslandMetricsBundle,
  MetricPoint,
} from "./types";

export function utcDayStart(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  ).toISOString();
}

export function lastCompleteUtcDay(now: Date = new Date()): string {
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return utcDayStart(y);
}

function valueAt(series: MetricPoint[], timestamp: string): number | null {
  const hit = series.find((p) => p.timestamp === timestamp);
  return hit ? hit.value : null;
}

export function pickDayKpis(
  bundle: IslandMetricsBundle,
  now: Date = new Date(),
): DayKpis | null {
  const timestamp = lastCompleteUtcDay(now);
  const ret = bundle.retention.find((p) => p.timestamp === timestamp);
  if (
    !bundle.uniquePlayers.some((p) => p.timestamp === timestamp) &&
    !ret
  ) {
    return null;
  }
  return {
    timestamp,
    uniquePlayers: valueAt(bundle.uniquePlayers, timestamp),
    plays: valueAt(bundle.plays, timestamp),
    peakCCU: valueAt(bundle.peakCCU, timestamp),
    averageMinutesPerPlayer: valueAt(
      bundle.averageMinutesPerPlayer,
      timestamp,
    ),
    minutesPlayed: valueAt(bundle.minutesPlayed, timestamp),
    d1: ret?.d1 ?? null,
    d7: ret?.d7 ?? null,
    favorites: valueAt(bundle.favorites, timestamp),
    recommendations: valueAt(bundle.recommendations, timestamp),
  };
}

export function toChartPoints(series: MetricPoint[]): ChartPoint[] {
  return series
    .filter((p): p is MetricPoint & { value: number } => p.value !== null)
    .map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

export function formatRetention(ratio: number | null): string {
  if (ratio === null) return "Not enough data";
  return `${Math.round(ratio * 100)}%`;
}

export function formatCount(value: number | null): string {
  if (value === null) return "Not enough data";
  return value.toLocaleString("en-US");
}

export function minutesPerPlay(
  minutesPlayed: number | null,
  plays: number | null,
): number | null {
  if (minutesPlayed === null || plays === null || plays === 0) return null;
  return minutesPlayed / plays;
}

export function favoritesPerThousand(
  favorites: number | null,
  uniquePlayers: number | null,
): number | null {
  if (favorites === null || uniquePlayers === null || uniquePlayers === 0) {
    return null;
  }
  return (favorites / uniquePlayers) * 1000;
}

export function formatDerived(value: number | null): string {
  if (value === null) return "Not enough data";
  return value.toFixed(1);
}
