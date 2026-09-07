import ErrorPanel from "@/components/ErrorPanel";
import GenreBoard from "@/components/GenreBoard";
import IslandCard from "@/components/IslandCard";
import Lookup from "@/components/Lookup";
import StaleBanner from "@/components/StaleBanner";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { loadHome } from "@/lib/fortnite/home";
import { formatCount } from "@/lib/fortnite/metrics";

export default async function Home() {
  let data;
  try {
    data = await loadHome();
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
      {data.stale ? <StaleBanner /> : null}
      <section className="flex flex-col gap-3 rounded-sm border border-sg-panel-2 bg-sg-panel px-4 py-5">
        <h1 className="text-2xl font-semibold text-sg-gold">
          Island-code lookup
        </h1>
        <p className="text-sm text-[#8b95a8]">
          Look up a public Fortnite Creative or UEFN island by code.
        </p>
        <Lookup />
      </section>
      <section className="rounded-sm border border-sg-panel-2 bg-sg-panel px-4 py-4 shadow-none">
        <p className="text-sm text-[#8b95a8]">In-match peak CCU</p>
        <p className="sg-kpi mt-1 text-3xl font-semibold text-sg-gold tabular-nums">
          {formatCount(data.inMatchPeakCCU)}
        </p>
      </section>
      {data.boards.map((board) => (
        <GenreBoard
          key={board.genre.slug}
          genre={board.genre}
          items={board.items}
        />
      ))}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Newest islands</h2>
        {data.newest.length === 0 ? (
          <p className="text-sm text-[#8b95a8]">Not enough data</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.newest.map((island) => (
              <li key={island.code}>
                <IslandCard island={island} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
