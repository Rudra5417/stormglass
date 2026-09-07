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
    <div className="flex max-w-prose flex-col gap-8">
      {genres.stale ? <StaleBanner /> : null}
      <h1 className="text-5xl text-sg-ink">Rankings</h1>
      {genres.data.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ul className="flex flex-col">
          {genres.data.map((genre) => (
            <li key={genre.slug} className="border-b border-sg-panel-2 py-3">
              <Link
                href={`/rankings/${encodeURIComponent(genre.slug)}`}
                className="text-xl text-sg-ink hover:text-sg-cyan"
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
