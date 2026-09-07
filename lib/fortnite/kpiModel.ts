import type { DayKpis } from "@/lib/fortnite/types";
import { formatCount, formatRetention } from "@/lib/fortnite/metrics";

export function kpiItems(kpis: DayKpis | null): { label: string; value: string }[] {
  if (!kpis) {
    const empty = "Not enough data";
    return [
      { label: "Unique players", value: empty },
      { label: "Plays", value: empty },
      { label: "Peak CCU", value: empty },
      { label: "Avg minutes / player", value: empty },
      { label: "D1 retention", value: empty },
      { label: "D7 retention", value: empty },
      { label: "Favorites", value: empty },
      { label: "Recommendations", value: empty },
    ];
  }
  return [
    { label: "Unique players", value: formatCount(kpis.uniquePlayers) },
    { label: "Plays", value: formatCount(kpis.plays) },
    { label: "Peak CCU", value: formatCount(kpis.peakCCU) },
    { label: "Avg minutes / player", value: formatCount(kpis.averageMinutesPerPlayer) },
    { label: "D1 retention", value: formatRetention(kpis.d1) },
    { label: "D7 retention", value: formatRetention(kpis.d7) },
    { label: "Favorites", value: formatCount(kpis.favorites) },
    { label: "Recommendations", value: formatCount(kpis.recommendations) },
  ];
}
