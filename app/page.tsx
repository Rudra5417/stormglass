import ErrorPanel from "@/components/ErrorPanel";
import GenreBoard from "@/components/GenreBoard";
import IslandCard from "@/components/IslandCard";
import Lookup from "@/components/Lookup";
import MoversBoard from "@/components/MoversBoard";
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
    <div className="flex flex-col gap-14">
      {data.stale ? <StaleBanner /> : null}
      <section className="max-w-xl">
        <h1 className="text-5xl leading-tight text-sg-ink">Look up an island</h1>
        <p className="mt-3 max-w-prose text-sg-mute">
          Public Creative and UEFN islands, by code. See how many people are
          actually playing.
        </p>
        <div className="mt-6">
          <Lookup />
        </div>
        <p className="mt-6 text-sm text-sg-mute">
          Players in matches right now{" "}
          <span className="sg-kpi text-sg-ink">
            {formatCount(data.inMatchPeakCCU)}
          </span>
        </p>
      </section>
      <MoversBoard climbers={data.climbers} fallers={data.fallers} />
      {data.boards.map((board) => (
        <GenreBoard
          key={board.genre.slug}
          genre={board.genre}
          items={board.items}
        />
      ))}
      <section className="flex flex-col gap-3">
        <h2 className="text-3xl text-sg-ink">Newest</h2>
        {data.newest.length === 0 ? (
          <p className="text-sm text-sg-mute">Not enough data</p>
        ) : (
          <ul className="flex flex-col">
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
