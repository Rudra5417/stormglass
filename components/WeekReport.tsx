import {
  formatCount,
  formatDerived,
  formatRetention,
} from "@/lib/fortnite/metrics";
import type { WeekReport as WeekReportData } from "@/lib/fortnite/trajectory";

export default function WeekReport({ report }: { report: WeekReportData }) {
  const items = [
    { label: "Plays", value: formatCount(report.plays) },
    { label: "Minutes played", value: formatCount(report.minutesPlayed) },
    { label: "Peak CCU (max)", value: formatCount(report.maxPeakCCU) },
    {
      label: "Best-day unique players",
      value: formatCount(report.bestUniquePlayers),
    },
    {
      label: "Minutes per play",
      value: formatDerived(report.minutesPerPlay),
    },
    { label: "D1 retention", value: formatRetention(report.d1) },
    { label: "D7 retention", value: formatRetention(report.d7) },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-3xl text-sg-ink">Last 7 complete UTC days</h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sg-plate p-5 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-sm text-sg-mute">{item.label}</dt>
            <dd className="sg-kpi sg-display mt-1 text-2xl text-sg-ink">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}