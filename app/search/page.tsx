import { redirect } from "next/navigation";
import ErrorPanel from "@/components/ErrorPanel";
import IslandCard from "@/components/IslandCard";
import StaleBanner from "@/components/StaleBanner";
import { loadSeenCatalog } from "@/lib/fortnite/catalog";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { parseIslandCode } from "@/lib/fortnite/normalize";
import { filterIslands } from "@/lib/fortnite/search";

function queryOf(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; genre?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = queryOf(params.q);
  const genre = queryOf(params.genre);
  const code = parseIslandCode(q);
  if (code) redirect(`/islands/${code}`);

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

  const matches = filterIslands(catalog.data, q);

  return (
    <div className="flex flex-col gap-8">
      {catalog.stale ? <StaleBanner /> : null}
      <h1 className="text-5xl text-sg-ink">Search</h1>
      {matches.length === 0 ? (
        <p className="max-w-prose text-sg-mute">
          No matches. Try an island code like 6980-2761-9936.
        </p>
      ) : (
        <ul className="flex max-w-prose flex-col">
          {matches.map((island) => (
            <li key={island.code}>
              <IslandCard island={island} genre={genre || undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
