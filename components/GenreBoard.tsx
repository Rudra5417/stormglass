import Link from "next/link";
import IslandCard from "@/components/IslandCard";
import type { Genre, IslandMetadata } from "@/lib/fortnite/types";

export default function GenreBoard({
  genre,
  items,
}: {
  genre: Genre;
  items: { rank: number; island: IslandMetadata }[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-3xl text-sg-ink">{genre.displayName}</h2>
        <Link
          href={`/rankings/${encodeURIComponent(genre.slug)}`}
          className="text-sm text-sg-cyan"
        >
          Full ranking
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ol className="flex gap-6 overflow-x-auto pb-2">
          {items.map((item) => (
            <li key={item.island.code} className="w-64 shrink-0">
              <p className="sg-kpi text-sm text-sg-gold">#{item.rank}</p>
              <IslandCard island={item.island} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
