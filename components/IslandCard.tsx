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
    <article className="border-b border-sg-panel-2 py-3">
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
      <p className="text-sm text-sg-mute">
        {island.createdIn}
        {island.tags.length > 0 ? `, ${island.tags.slice(0, 3).join(", ")}` : ""}
      </p>
    </article>
  );
}
