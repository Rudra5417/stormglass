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

const STROKE = "#8FCBBE";
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
      <div className="w-full sg-plate p-3">
        <p className="text-sm text-sg-mute">Not enough data</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden sg-plate p-3">
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 256 }}
        >
          <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#214246" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              stroke="#214246"
              tick={{ fill: "#8AA39C", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              reversed
              allowDecimals={false}
              domain={["dataMin", "dataMax"]}
              stroke="#214246"
              tick={{ fill: "#8AA39C", fontSize: 11 }}
              width={36}
            />
            <Tooltip
              labelFormatter={(label) => formatTick(String(label))}
              contentStyle={{
                background: "#173033",
                border: "1px solid #214246",
                borderRadius: 0,
                color: "#D8E6E2",
              }}
              formatter={(value) =>
                typeof value === "number" ? `#${value}` : String(value)
              }
            />
            {series.length > 1 ? (
              <Legend wrapperStyle={{ color: "#D8E6E2", fontSize: 12 }} />
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
