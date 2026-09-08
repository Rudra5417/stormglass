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
      <h2 className="text-2xl text-sg-ink sm:text-3xl">
        Last 7 complete UTC days
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sg-plate p-4 sm:p-5 md:grid-cols-4 md:gap-x-8">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-sm text-sg-mute">{item.label}</dt>
            <dd className="sg-kpi sg-display mt-1 break-words text-xl text-sg-ink sm:text-2xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}