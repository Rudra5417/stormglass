import Link from "next/link";
import ErrorPanel from "@/components/ErrorPanel";
import StaleBanner from "@/components/StaleBanner";
import { getGenres } from "@/lib/fortnite/client";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";

export default async function RankingsPage() {
  let genres;
  try {
    genres = await getGenres();
  } catch (error) {
    if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      return <ErrorPanel message={error.message} />;
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-8">
      {genres.stale ? <StaleBanner /> : null}
      <h1 className="text-2xl font-semibold text-sg-gold">Rankings</h1>
      {genres.data.length === 0 ? (
        <p className="text-sm text-[#8b95a8]">Not enough data</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {genres.data.map((genre) => (
            <li
              key={genre.slug}
              className="rounded-sm border border-sg-panel-2 bg-sg-panel px-3 py-2"
            >
              <Link
                href={`/rankings/${encodeURIComponent(genre.slug)}`}
                className="text-sg-cyan"
              >
                {genre.displayName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
