import type { Metadata } from "next";
import ErrorPanel from "@/components/ErrorPanel";
import IslandTileGrid from "@/components/IslandTileGrid";
import Lookup from "@/components/Lookup";
import StaleBanner from "@/components/StaleBanner";
import { loadSeenCatalog } from "@/lib/fortnite/catalog";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { islandsForCreator } from "@/lib/fortnite/search";
import { pageTitle } from "@/lib/ui/pageTitle";

function queryOf(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creatorCode: string }>;
}): Promise<Metadata> {
  const { creatorCode } = await params;
  return { title: pageTitle(decodeURIComponent(creatorCode)) };
}

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ creatorCode: string }>;
  searchParams: Promise<{ genre?: string | string[] }>;
}) {
  const { creatorCode } = await params;
  const genre = queryOf((await searchParams).genre);

  let catalog;
  try {
    catalog = await loadSeenCatalog(genre || undefined);
  } catch (error) {
    if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      return <ErrorPanel message={error.message} />;
    }
    throw error;
  }

  const islands = islandsForCreator(catalog.data, creatorCode);

  return (
    <div className="flex flex-col gap-8">
      {catalog.stale ? <StaleBanner /> : null}
      <h1 className="break-words text-3xl text-sg-ink sm:text-5xl">
        {creatorCode}
      </h1>
      {islands.length === 0 ? (
        <>
          <p className="max-w-prose text-sg-mute">
            No islands from this creator in the current catalog. Look up a
            code to open one of theirs.
          </p>
          <Lookup />
        </>
      ) : (
        <IslandTileGrid
          items={islands.map((island) => ({
            island,
            genre: genre || undefined,
          }))}
        />
      )}
    </div>
  );
}
