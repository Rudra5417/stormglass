import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyCode from "@/components/CopyCode";
import ErrorPanel from "@/components/ErrorPanel";
import IslandDesk from "@/components/IslandDesk";
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
import { pulseKpiItems } from "@/lib/fortnite/kpiModel";
import {
  lastCompleteUtcDay,
  pickDayKpis,
  toChartPoints,
} from "@/lib/fortnite/metrics";
import { parseIslandCode } from "@/lib/fortnite/normalize";
import {
  healthReport,
  rankHold,
  retentionChartPoints,
  weekReport,
} from "@/lib/fortnite/trajectory";
import type { ChartPoint, IslandGenreRank } from "@/lib/fortnite/types";
import { pageTitle } from "@/lib/ui/pageTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const code = parseIslandCode((await params).code);
  if (!code) return { title: pageTitle("Island not found") };
  try {
    const island = await getIsland(code);
    return {
      title: pageTitle(island.data.title, island.data.code),
      description: `Public analytics for ${island.data.title} (${island.data.code}) by ${island.data.creatorCode}.`,
    };
  } catch {
    return { title: pageTitle("Island not found") };
  }
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
  const kpis = pickDayKpis(day.data);
  const prior = pickDayKpis(day.data, new Date(lastCompleteUtcDay()));
  const report = weekReport(day.data, rankings.data);
  const deltas = prior
    ? {
        uniquePlayers: prior.uniquePlayers,
        plays: prior.plays,
        peakCCU: prior.peakCCU,
      }
    : null;

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
      <IslandDesk
        kpis={pulseKpiItems(kpis, deltas)}
        health={healthReport(kpis, prior)}
        report={report}
        holds={rankHold(rankings.data)}
        spans={report.ranks}
        rankSeries={toRankSeries(rankings.data)}
        playSeries={[
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
        hourSeries={[
          { name: "Peak CCU", points: toChartPoints(hour.data.peakCCU) },
        ]}
        retentionSeries={[
          { name: "D1", points: retentionChartPoints(day.data.retention, "d1") },
          { name: "D7", points: retentionChartPoints(day.data.retention, "d7") },
        ]}
        favSeries={[
          { name: "Favorites", points: toChartPoints(day.data.favorites) },
          {
            name: "Recommendations",
            points: toChartPoints(day.data.recommendations),
          },
        ]}
      />
    </div>
  );
}
