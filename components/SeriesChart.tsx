"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/fortnite/types";

const STROKE = "#5CE1E6";
const DASHES = [undefined, "4 4", "1 4", "8 4"] as const;

export type ChartSeries = { name: string; points: ChartPoint[] };

function formatTick(iso: string): string {
  const d = new Date(iso);
  const midnight =
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  if (midnight) {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function mergeSeries(series: ChartSeries[]) {
  const byTs = new Map<string, Record<string, string | number>>();
  for (const s of series) {
    for (const point of s.points) {
      const row = byTs.get(point.timestamp) ?? { timestamp: point.timestamp };
      row[s.name] = point.value;
      byTs.set(point.timestamp, row);
    }
  }
  return [...byTs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

export default function SeriesChart({
  series,
  toggleNames,
  compact,
}: {
  series: ChartSeries[];
  toggleNames?: string[];
  compact?: boolean;
}) {
  const [active, setActive] = useState(toggleNames?.[0] ?? series[0]?.name);
  const visible = useMemo(() => {
    if (!toggleNames?.length) return series;
    return series.filter((s) => s.name === active);
  }, [active, series, toggleNames]);
  const data = useMemo(() => mergeSeries(visible), [visible]);
  const empty = visible.every((s) => s.points.length === 0);

  return (
    <div className="rounded-sm border border-sg-panel-2 bg-sg-panel p-3">
      {toggleNames?.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {toggleNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className={
                name === active
                  ? "rounded-sm bg-sg-gold px-2 py-1 text-sm text-sg-canvas"
                  : "rounded-sm border border-sg-panel-2 bg-sg-panel-2 px-2 py-1 text-sm"
              }
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      {empty ? (
        <p className="text-sm text-[#8b95a8]">Not enough data</p>
      ) : (
        <div className={compact ? "h-48 w-full" : "h-64 w-full"}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 800, height: compact ? 192 : 256 }}
          >
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#152A4A" strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTick}
                stroke="#152A4A"
                tick={{ fill: "#8b95a8", fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#152A4A"
                tick={{ fill: "#8b95a8", fontSize: 12 }}
                tickFormatter={(value: number) => value.toLocaleString("en-US")}
                width={64}
              />
              <Tooltip
                labelFormatter={(label) => formatTick(String(label))}
                contentStyle={{
                  background: "#0E1A2E",
                  border: "1px solid #152A4A",
                  borderRadius: 2,
                  color: "#d5dbe8",
                }}
                formatter={(value) =>
                  typeof value === "number" ? value.toLocaleString("en-US") : String(value)
                }
              />
              {visible.length > 1 ? (
                <Legend wrapperStyle={{ color: "#d5dbe8", fontSize: 12 }} />
              ) : null}
              {visible.map((s, index) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={STROKE}
                  strokeWidth={2}
                  strokeDasharray={DASHES[index % DASHES.length]}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
