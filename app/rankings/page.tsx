import type { Metadata } from "next";
import ErrorPanel from "@/components/ErrorPanel";
import GenreTile from "@/components/GenreTile";
import StaleBanner from "@/components/StaleBanner";
import { getGenres } from "@/lib/fortnite/client";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { pageTitle } from "@/lib/ui/pageTitle";

export const dynamic = "force-dynamic";

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
      <h1 className="text-3xl text-sg-ink sm:text-5xl">Rankings</h1>
      {genres.data.length === 0 ? (
        <p className="text-sm text-sg-mute">Not enough data</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
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
