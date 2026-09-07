"use client";

import { useMemo } from "react";
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

function formatTick(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function RankChart({
  series,
}: {
  series: { name: string; points: ChartPoint[] }[];
}) {
  const data = useMemo(() => {
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
  }, [series]);

  if (series.every((s) => s.points.length === 0)) {
    return (
      <div className="w-full rounded-sm border border-sg-panel-2 bg-sg-panel p-3 shadow-none">
        <p className="text-sm text-[#8b95a8]">Not enough data</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-sm border border-sg-panel-2 bg-sg-panel p-3 shadow-none">
      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 256 }}
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
              reversed
              allowDecimals={false}
              domain={["dataMin", "dataMax"]}
              stroke="#152A4A"
              tick={{ fill: "#8b95a8", fontSize: 12 }}
              width={48}
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
                typeof value === "number" ? `#${value}` : String(value)
              }
            />
            {series.length > 1 ? (
              <Legend wrapperStyle={{ color: "#d5dbe8", fontSize: 12 }} />
            ) : null}
            {series.map((s, index) => (
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
    </div>
  );
}
