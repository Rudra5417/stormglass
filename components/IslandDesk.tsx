"use client";

import { useState } from "react";
import HealthPlates from "@/components/HealthPlates";
import KpiStrip from "@/components/KpiStrip";
import PlacementTiles from "@/components/PlacementTiles";
import RankChart from "@/components/RankChart";
import SeriesChart, { type ChartSeries } from "@/components/SeriesChart";
import WeekReport from "@/components/WeekReport";
import type { KpiItem } from "@/lib/fortnite/kpiModel";
import type {
  HealthReport,
  RankHold,
  RankSpan,
  WeekReport as WeekReportData,
} from "@/lib/fortnite/trajectory";

const TABS = ["Pulse", "Placement", "Sessions"] as const;
type Tab = (typeof TABS)[number];

export default function IslandDesk({
  kpis,
  health,
  report,
  holds,
  spans,
  rankSeries,
  playSeries,
  hourSeries,
  retentionSeries,
  favSeries,
}: {
  kpis: KpiItem[];
  health: HealthReport;
  report: WeekReportData;
  holds: RankHold[];
  spans: RankSpan[];
  rankSeries: ChartSeries[];
  playSeries: ChartSeries[];
  hourSeries: ChartSeries[];
  retentionSeries: ChartSeries[];
  favSeries: ChartSeries[];
}) {
  const [tab, setTab] = useState<Tab>("Pulse");
  return (
    <div className="flex flex-col gap-8">
      <div
        role="tablist"
        aria-label="Island analytics"
        className="flex gap-6 border-b border-sg-gold/30"
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={
              tab === name
                ? "border-b-2 border-sg-gold pb-2 text-sg-ink"
                : "pb-2 text-sg-mute"
            }
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "Pulse" ? (
        <div className="flex flex-col gap-8">
          <HealthPlates health={health} />
          <KpiStrip items={kpis} />
          <WeekReport report={report} />
        </div>
      ) : null}
      {tab === "Placement" ? (
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl text-sg-ink">Genre hold this week</h2>
          <PlacementTiles holds={holds} spans={spans} />
          <RankChart series={rankSeries} />
        </div>
      ) : null}
      {tab === "Sessions" ? (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-3xl text-sg-ink">Last 7 days</h2>
            <SeriesChart
              series={playSeries}
              toggleNames={["Plays", "Unique players", "Minutes played"]}
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-3xl text-sg-ink">Hourly peak CCU</h2>
            <SeriesChart series={hourSeries} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-3xl text-sg-ink">Retention</h2>
            <SeriesChart
              series={retentionSeries}
              toggleNames={["D1", "D7"]}
              percent
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-3xl text-sg-ink">Favorites vs recommendations</h2>
            <SeriesChart compact series={favSeries} />
          </section>
        </div>
      ) : null}
    </div>
  );
}