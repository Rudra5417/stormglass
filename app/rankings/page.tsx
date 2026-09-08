import type { Metadata } from "next";
import ErrorPanel from "@/components/ErrorPanel";
import GenreTile from "@/components/GenreTile";
import StaleBanner from "@/components/StaleBanner";
import { getGenres } from "@/lib/fortnite/client";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { pageTitle } from "@/lib/ui/pageTitle";

export const metadata: Metadata = {
  title: pageTitle("Rankings"),
  description: "Public Fortnite Creative and UEFN genre rankings.",
};

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
      <h1 className="text-5xl text-sg-ink">Rankings</h1>
      {genres.data.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {genres.data.map((genre) => (
            <li key={genre.slug}>
              <GenreTile genre={genre} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
