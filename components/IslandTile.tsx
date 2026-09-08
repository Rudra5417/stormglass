import Link from "next/link";
import { tileShift } from "@/lib/ui/tileShift";
import type { IslandMetadata } from "@/lib/fortnite/types";

function creatorHref(creatorCode: string, genre?: string) {
  const path = `/creators/${encodeURIComponent(creatorCode)}`;
  return genre ? `${path}?genre=${encodeURIComponent(genre)}` : path;
}

export default function IslandTile({
  island,
  rank,
  badge,
  genre,
}: {
  island: IslandMetadata;
  rank?: number;
  badge?: string;
  genre?: string;
}) {
  const art = tileShift(island.code);
  const mark = rank != null ? `#${rank}` : island.code.slice(-4);
  return (
    <article className="sg-plate sg-tile">
      <div
        className="sg-tile-art"
        style={{
          ["--tile-x" as string]: art.x,
          ["--tile-y" as string]: art.y,
        }}
      />
      <p className="sg-display pointer-events-none absolute -bottom-2 right-1 text-[5.5rem] leading-none text-sg-gold/25">
        {mark}
      </p>
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-2">
          {badge ? (
            <span className="sg-kpi text-sm text-sg-gold">{badge}</span>
          ) : (
            <span className="text-sm text-sg-mute">{island.createdIn}</span>
          )}
        </div>
        <div>
          <h3 className="text-lg leading-snug">
            <Link
              href={`/islands/${encodeURIComponent(island.code)}`}
              className="text-sg-ink hover:text-sg-cyan"
            >
              {island.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-sg-mute">
            <Link
              href={creatorHref(island.creatorCode, genre)}
              className="text-sg-cyan"
            >
              {island.creatorCode}
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}