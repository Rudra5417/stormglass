import Link from "next/link";
import IslandTile from "@/components/IslandTile";
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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl text-sg-ink sm:text-3xl">{genre.displayName}</h2>
        <Link
          href={`/rankings/${encodeURIComponent(genre.slug)}`}
          className="shrink-0 text-sm text-sg-cyan"
        >
          Full ranking
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ol className="sg-rail">
          {items.map((item) => (
            <li key={item.island.code}>
              <IslandTile
                island={item.island}
                rank={item.rank}
                genre={genre.slug}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
