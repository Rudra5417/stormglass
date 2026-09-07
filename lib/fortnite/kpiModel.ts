import type { DayKpis } from "@/lib/fortnite/types";
import {
  favoritesPerThousand,
  formatCount,
  formatDerived,
  formatRetention,
  minutesPerPlay,
} from "@/lib/fortnite/metrics";

const EMPTY = "Not enough data";

export function kpiItems(kpis: DayKpis | null): { label: string; value: string }[] {
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
  return [
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
}
