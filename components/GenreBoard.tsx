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
        <h2 className="text-lg font-semibold">{genre.displayName}</h2>
        <Link
          href={`/rankings/${encodeURIComponent(genre.slug)}`}
          className="text-sm text-sg-cyan"
        >
          Full ranking
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#8b95a8]">Not enough data</p>
      ) : (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.island.code} className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-sg-gold tabular-nums">
                {`#${item.rank}`}
              </span>
              <IslandCard island={item.island} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
