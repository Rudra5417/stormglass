import ErrorPanel from "@/components/ErrorPanel";
import IslandCard from "@/components/IslandCard";
import Lookup from "@/components/Lookup";
import StaleBanner from "@/components/StaleBanner";
import { loadSeenCatalog } from "@/lib/fortnite/catalog";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { islandsForCreator } from "@/lib/fortnite/search";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ creatorCode: string }>;
}) {
  const { creatorCode } = await params;

  let catalog;
  try {
    catalog = await loadSeenCatalog();
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
      <h1 className="text-2xl font-semibold text-sg-gold">{creatorCode}</h1>
      {islands.length === 0 ? (
        <>
          <p className="text-sm text-[#8b95a8]">
            No islands from this creator in the current catalog.
          </p>
          <Lookup />
        </>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {islands.map((island) => (
            <li key={island.code}>
              <IslandCard island={island} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
