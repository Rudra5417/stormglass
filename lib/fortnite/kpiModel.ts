import type { DayKpis } from "@/lib/fortnite/types";
import {
  favoritesPerThousand,
  formatCount,
  formatDerived,
  formatRetention,
  minutesPerPlay,
} from "@/lib/fortnite/metrics";
import { deltaPct, formatDeltaPct } from "@/lib/fortnite/trajectory";

const EMPTY = "Not enough data";

export type KpiItem = {
  label: string;
  value: string;
  delta?: string | null;
};

export type KpiDeltas = {
  uniquePlayers: number | null;
  plays: number | null;
  peakCCU: number | null;
};

const PULSE_LABELS = [
  "Unique players",
  "Plays",
  "Peak CCU",
  "Minutes per play",
  "D1 retention",
  "D7 retention",
];

export function pulseKpiItems(
  kpis: DayKpis | null,
  previous?: KpiDeltas | null,
): KpiItem[] {
  const wanted = new Set(PULSE_LABELS);
  return kpiItems(kpis, previous).filter((item) => wanted.has(item.label));
}

export function kpiItems(
  kpis: DayKpis | null,
  previous?: KpiDeltas | null,
): KpiItem[] {
  if (!kpis) {
    return [
      { label: "Unique players", value: EMPTY },
      { label: "Plays", value: EMPTY },
      { label: "Peak CCU", value: EMPTY },
      { label: "Avg minutes / player", value: EMPTY },
      { label: "Minutes per play", value: EMPTY },
      { label: "D1 retention", value: EMPTY },
      { label: "D7 retention", value: EMPTY },
      { label: "Favorites", value: EMPTY },
      { label: "Favorites per 1,000 players", value: EMPTY },
      { label: "Recommendations", value: EMPTY },
    ];
  }
  const items: KpiItem[] = [
    { label: "Unique players", value: formatCount(kpis.uniquePlayers) },
    { label: "Plays", value: formatCount(kpis.plays) },
    { label: "Peak CCU", value: formatCount(kpis.peakCCU) },
    { label: "Avg minutes / player", value: formatCount(kpis.averageMinutesPerPlayer) },
    {
      label: "Minutes per play",
      value: formatDerived(minutesPerPlay(kpis.minutesPlayed, kpis.plays)),
    },
    { label: "D1 retention", value: formatRetention(kpis.d1) },
    { label: "D7 retention", value: formatRetention(kpis.d7) },
    { label: "Favorites", value: formatCount(kpis.favorites) },
    {
      label: "Favorites per 1,000 players",
      value: formatDerived(
        favoritesPerThousand(kpis.favorites, kpis.uniquePlayers),
      ),
    },
    { label: "Recommendations", value: formatCount(kpis.recommendations) },
  ];
  if (!previous) return items;
  return items.map((item) => {
    if (item.label === "Unique players") {
      return {
        ...item,
        delta: formatDeltaPct(deltaPct(kpis.uniquePlayers, previous.uniquePlayers)),
      };
    }
    if (item.label === "Plays") {
      return {
        ...item,
        delta: formatDeltaPct(deltaPct(kpis.plays, previous.plays)),
      };
    }
    if (item.label === "Peak CCU") {
      return {
        ...item,
        delta: formatDeltaPct(deltaPct(kpis.peakCCU, previous.peakCCU)),
      };
    }
    return item;
  });
}
