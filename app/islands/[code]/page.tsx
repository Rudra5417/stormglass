import Link from "next/link";
import { notFound } from "next/navigation";
import CopyCode from "@/components/CopyCode";
import ErrorPanel from "@/components/ErrorPanel";
import KpiStrip from "@/components/KpiStrip";
import RankChart from "@/components/RankChart";
import SeriesChart from "@/components/SeriesChart";
import StaleBanner from "@/components/StaleBanner";
import {
  getIsland,
  getIslandDayMetrics,
  getIslandHourMetrics,
  getIslandRankings,
  isoRangeDays,
  isoRangeHours,
} from "@/lib/fortnite/client";
import { FortniteApiError, FortniteNotFoundError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { kpiItems } from "@/lib/fortnite/kpiModel";
import { pickDayKpis, toChartPoints } from "@/lib/fortnite/metrics";
import { parseIslandCode } from "@/lib/fortnite/normalize";
import type { ChartPoint, IslandGenreRank } from "@/lib/fortnite/types";

function latestRanks(rankings: IslandGenreRank[]) {
  if (rankings.length === 0) return [];
  return rankings.reduce((latest, snap) =>
    snap.timestamp > latest.timestamp ? snap : latest,
  ).genres;
}

function toRankSeries(rankings: IslandGenreRank[]): {
  name: string;
  points: ChartPoint[];
}[] {
  const byGenre = new Map<string, ChartPoint[]>();
  const ordered = [...rankings].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  for (const snap of ordered) {
    for (const g of snap.genres) {
      const points = byGenre.get(g.genre) ?? [];
      points.push({ timestamp: snap.timestamp, value: g.rank });
      byGenre.set(g.genre, points);
    }
  }
  return [...byGenre.entries()].map(([name, points]) => ({ name, points }));
}

export default async function IslandPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = parseIslandCode(rawCode);
  if (!code) notFound();

  const dayRange = isoRangeDays(7);
  const hourRange = isoRangeHours(24);

  let island;
  let day;
  let hour;
  let rankings;
  let missing = false;
  try {
    [island, day, hour, rankings] = await Promise.all([
      getIsland(code),
      getIslandDayMetrics(code, dayRange.from, dayRange.to),
      getIslandHourMetrics(code, hourRange.from, hourRange.to),
      getIslandRankings(code, dayRange.from, dayRange.to),
    ]);
  } catch (error) {
    if (error instanceof FortniteNotFoundError) {
      missing = true;
    } else if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      return <ErrorPanel message={error.message} />;
    } else {
      throw error;
    }
  }
  if (missing || !island || !day || !hour || !rankings) notFound();

  const stale = island.stale || day.stale || hour.stale || rankings.stale;
  const meta = island.data;
  const currentRanks = latestRanks(rankings.data);

  return (
    <div className="flex flex-col gap-8">
      {stale ? <StaleBanner /> : null}
      <header className="flex max-w-prose flex-col gap-3">
        <h1 className="text-5xl leading-tight text-sg-ink">{meta.title}</h1>
        <CopyCode code={meta.code} />
        <p className="text-sg-mute">
          <Link
            href={`/creators/${encodeURIComponent(meta.creatorCode)}`}
            className="text-sg-cyan"
          >
            {meta.creatorCode}
          </Link>
          {`, ${meta.createdIn}`}
          {meta.category ? `, ${meta.category}` : ""}
          {meta.tags.length > 0 ? `, ${meta.tags.join(", ")}` : ""}
        </p>
      </header>
      <KpiStrip items={kpiItems(pickDayKpis(day.data))} />
      <section className="flex flex-col gap-3">
        <h2 className="text-3xl text-sg-ink">Last 7 days</h2>
        <SeriesChart
          series={[
            { name: "Plays", points: toChartPoints(day.data.plays) },
            {
              name: "Unique players",
              points: toChartPoints(day.data.uniquePlayers),
            },
            {
              name: "Minutes played",
              points: toChartPoints(day.data.minutesPlayed),
            },
          ]}
          toggleNames={["Plays", "Unique players", "Minutes played"]}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-3xl text-sg-ink">Hourly peak CCU</h2>
        <SeriesChart
          series={[
            { name: "Peak CCU", points: toChartPoints(hour.data.peakCCU) },
          ]}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-3xl text-sg-ink">Genre ranks</h2>
        {currentRanks.length === 0 ? (
          <p className="text-sm text-sg-mute">Not enough data</p>
        ) : (
          <ul className="flex flex-col">
            {currentRanks.map((rank) => (
              <li
                key={rank.genreSlug}
                className="flex items-baseline justify-between border-b border-sg-panel-2 py-2"
              >
                <Link
                  href={`/rankings/${encodeURIComponent(rank.genreSlug)}`}
                  className="text-sg-cyan"
                >
                  {rank.genre}
                </Link>
                <span className="sg-kpi text-sg-gold">#{rank.rank}</span>
              </li>
            ))}
          </ul>
        )}
        <RankChart series={toRankSeries(rankings.data)} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-3xl text-sg-ink">Favorites vs recommendations</h2>
        <SeriesChart
          compact
          series={[
            { name: "Favorites", points: toChartPoints(day.data.favorites) },
            {
              name: "Recommendations",
              points: toChartPoints(day.data.recommendations),
            },
          ]}
        />
      </section>
    </div>
  );
}
