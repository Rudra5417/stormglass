import { notFound } from "next/navigation";
import ErrorPanel from "@/components/ErrorPanel";
import IslandCard from "@/components/IslandCard";
import StaleBanner from "@/components/StaleBanner";
import {
  getGenreRankings,
  getGenres,
  getIslandMetadataMany,
} from "@/lib/fortnite/client";
import {
  FortniteApiError,
  FortniteNotFoundError,
  FortniteRateLimitError,
} from "@/lib/fortnite/errors";

export default async function RankingsGenrePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre: slug } = await params;

  let genres;
  let rankings;
  try {
    [genres, rankings] = await Promise.all([
      getGenres(),
      getGenreRankings(slug, 24),
    ]);
  } catch (error) {
    if (error instanceof FortniteNotFoundError) {
      notFound();
    }
    if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      return <ErrorPanel message={error.message} />;
    }
    throw error;
  }

  const genre = genres.data.find((item) => item.slug === slug);
  if (!genre) notFound();

  let meta;
  try {
    meta = await getIslandMetadataMany(
      rankings.data.items.map((item) => item.islandCode),
    );
  } catch (error) {
    if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      return <ErrorPanel message={error.message} />;
    }
    throw error;
  }

  const byCode = new Map(meta.data.map((island) => [island.code, island]));
  const items = rankings.data.items.flatMap((item) => {
    const island = byCode.get(item.islandCode);
    return island ? [{ rank: item.rank, island }] : [];
  });

  return (
    <div className="flex flex-col gap-8">
      {genres.stale || rankings.stale || meta.stale ? <StaleBanner /> : null}
      <h1 className="text-5xl text-sg-ink">{genre.displayName}</h1>
      {items.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item) => (
            <li key={item.island.code} className="flex gap-4">
              <span className="sg-kpi w-10 shrink-0 pt-3 text-sg-gold">
                {`#${item.rank}`}
              </span>
              <div className="min-w-0 flex-1">
                <IslandCard island={item.island} genre={slug} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
