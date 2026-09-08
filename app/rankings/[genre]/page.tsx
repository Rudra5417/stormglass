import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ErrorPanel from "@/components/ErrorPanel";
import IslandTileGrid from "@/components/IslandTileGrid";
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
import { pageTitle } from "@/lib/ui/pageTitle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre: slug } = await params;
  try {
    const genres = await getGenres();
    const genre = genres.data.find((item) => item.slug === slug);
    if (!genre) return { title: pageTitle("Rankings") };
    return {
      title: pageTitle(genre.displayName, "Rankings"),
      description: `Public genre ranking for ${genre.displayName}.`,
    };
  } catch {
    return { title: pageTitle("Rankings") };
  }
}

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
      <h1 className="break-words text-3xl text-sg-ink sm:text-5xl">
        {genre.displayName}
      </h1>
      {items.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <IslandTileGrid
          items={items.map((item) => ({
            island: item.island,
            rank: item.rank,
            genre: slug,
          }))}
        />
      )}
    </div>
  );
}
