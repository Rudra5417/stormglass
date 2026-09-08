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
        className="flex gap-1 overflow-x-auto border-b border-sg-gold/30 sm:gap-6"
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
                ? "min-h-11 shrink-0 border-b-2 border-sg-gold px-2 text-sg-ink first:pl-0 sm:px-0"
                : "min-h-11 shrink-0 px-2 text-sg-mute first:pl-0 sm:px-0"
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
          <h2 className="text-2xl text-sg-ink sm:text-3xl">Genre hold this week</h2>
          <PlacementTiles holds={holds} spans={spans} />
          <RankChart series={rankSeries} />
        </div>
      ) : null}
      {tab === "Sessions" ? (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl text-sg-ink sm:text-3xl">Last 7 days</h2>
            <SeriesChart
              series={playSeries}
              toggleNames={["Plays", "Unique players", "Minutes played"]}
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl text-sg-ink sm:text-3xl">Hourly peak CCU</h2>
            <SeriesChart series={hourSeries} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl text-sg-ink sm:text-3xl">Retention</h2>
            <SeriesChart
              series={retentionSeries}
              toggleNames={["D1", "D7"]}
              percent
            />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl text-sg-ink sm:text-3xl">
              Favorites vs recommendations
            </h2>
            <SeriesChart compact series={favSeries} />
          </section>
        </div>
      ) : null}
    </div>
  );
}