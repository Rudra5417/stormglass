import GenreBoard from "@/components/GenreBoard";
import IslandTile from "@/components/IslandTile";
import Lookup from "@/components/Lookup";
import MoversBoard from "@/components/MoversBoard";
import StaleBanner from "@/components/StaleBanner";
import { FortniteApiError, FortniteRateLimitError } from "@/lib/fortnite/errors";
import { loadHome } from "@/lib/fortnite/home";
import { formatCount } from "@/lib/fortnite/metrics";
import { tileShift } from "@/lib/ui/tileShift";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data = null;
  let catalogError: string | null = null;
  try {
    data = await loadHome();
  } catch (error) {
    if (
      error instanceof FortniteRateLimitError ||
      error instanceof FortniteApiError
    ) {
      catalogError = error.message;
    } else {
      throw error;
    }
  }

  const ccuArt = tileShift("ecosystem-ccu");

  return (
    <div className="flex flex-col gap-16">
      {data?.stale ? <StaleBanner /> : null}
      {catalogError ? (
        <p className="sg-plate px-4 py-3 text-sm text-sg-mute">
          {catalogError}. Lookup still works.
        </p>
      ) : null}
      <section className="grid min-w-0 items-stretch gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)]">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl leading-tight text-sg-ink sm:text-5xl md:text-6xl">
            Enter an island code
          </h1>
          <p className="mt-3 max-w-prose text-sg-mute">
            Public Creative and UEFN analytics: how an island is playing, where
            it sits in genre rankings, and whether yesterday moved.
          </p>
          <div className="mt-8">
            <Lookup />
          </div>
        </div>
        <article className="relative min-h-56 overflow-hidden sg-plate">
          <div
            className="sg-tile-art"
            style={{
              ["--tile-x" as string]: ccuArt.x,
              ["--tile-y" as string]: ccuArt.y,
            }}
          />
          <div className="relative flex h-full flex-col justify-between p-5">
            <p className="text-sm text-sg-mute">In matches now</p>
            <p className="sg-display sg-kpi break-all text-5xl leading-none text-sg-gold sm:text-6xl">
              {formatCount(data?.inMatchPeakCCU ?? null)}
            </p>
            <p className="text-sm text-sg-mute">Fortnite-wide peak CCU</p>
          </div>
        </article>
      </section>
      {data ? (
        <>
          <MoversBoard climbers={data.climbers} fallers={data.fallers} />
          {data.boards.map((board) => (
            <GenreBoard
              key={board.genre.slug}
              genre={board.genre}
              items={board.items}
            />
          ))}
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl text-sg-ink sm:text-3xl">Newest</h2>
            {data.newest.length === 0 ? (
              <p className="text-sm text-sg-mute">Not enough data</p>
            ) : (
              <ul className="sg-rail">
                {data.newest.map((island) => (
                  <li key={island.code}>
                    <IslandTile island={island} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
