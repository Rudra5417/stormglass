import Link from "next/link";
import RankSpanValue from "@/components/RankSpanValue";
import type { RankHold, RankSpan } from "@/lib/fortnite/trajectory";
import { tileShift } from "@/lib/ui/tileShift";

export default function PlacementTiles({
  holds,
  spans,
}: {
  holds: RankHold[];
  spans: RankSpan[];
}) {
  if (holds.length === 0) {
    return <p className="text-sm text-sg-mute">Not enough data</p>;
  }
  const spanBySlug = new Map(spans.map((s) => [s.genreSlug, s]));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        {holds.map((hold) => {
          const art = tileShift(hold.genreSlug);
          const fill =
            hold.hours === 0 ? 0 : Math.round((hold.hoursInTop8 / hold.hours) * 100);
          return (
            <article key={hold.genreSlug} className="sg-plate sg-tile sg-tile-short">
              <div
                className="sg-tile-art"
                style={{
                  ["--tile-x" as string]: art.x,
                  ["--tile-y" as string]: art.y,
                }}
              />
              <p className="sg-display pointer-events-none absolute -bottom-3 right-2 text-[4.5rem] leading-none text-sg-gold/25 sm:text-[7.5rem]">
                #{hold.currentRank}
              </p>
              <div className="relative flex h-full min-w-0 flex-col justify-between p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <Link
                    href={`/rankings/${encodeURIComponent(hold.genreSlug)}`}
                    className="text-sg-cyan"
                  >
                    {hold.genre}
                  </Link>
                  {spanBySlug.get(hold.genreSlug) ? (
                    <RankSpanValue span={spanBySlug.get(hold.genreSlug)!} />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm text-sg-mute">
                    Best #{hold.best}
                    {" · "}
                    Worst #{hold.worst}
                  </p>
                  <p className="mt-1 sg-kpi text-sm text-sg-ink">
                    {hold.hoursInTop8} of {hold.hours} hours in top 8
                  </p>
                  <div className="mt-2 h-1 bg-sg-canvas">
                    <div
                      className="h-1 bg-sg-gold"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}