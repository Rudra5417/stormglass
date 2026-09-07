import Link from "next/link";
import type { IslandMetadata } from "@/lib/fortnite/types";

function creatorHref(creatorCode: string, genre?: string) {
  const path = `/creators/${encodeURIComponent(creatorCode)}`;
  return genre ? `${path}?genre=${encodeURIComponent(genre)}` : path;
}

export default function IslandCard({
  island,
  genre,
}: {
  island: IslandMetadata;
  genre?: string;
}) {
  return (
    <article className="sg-card rounded-sm border border-transparent bg-sg-panel p-3 shadow-none hover:border-sg-gold">
      <h3 className="text-base font-semibold">
        <Link
          href={`/islands/${encodeURIComponent(island.code)}`}
          className="text-sg-cyan"
        >
          {island.title}
        </Link>
      </h3>
      <p className="mt-1">
        <Link
          href={creatorHref(island.creatorCode, genre)}
          className="text-sm text-sg-cyan"
        >
          {island.creatorCode}
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-sm border border-sg-panel-2 bg-sg-panel-2 px-2 py-0.5 text-xs">
          {island.createdIn}
        </span>
        {island.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-sg-panel-2 bg-sg-panel px-2 py-0.5 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
