import IslandTile from "@/components/IslandTile";
import type { HomeMover } from "@/lib/fortnite/home";

function badge(mover: HomeMover): string {
  if (mover.kind === "entered") return "entered";
  const n = mover.delta ?? 0;
  return n > 0 ? `+${n}` : String(n);
}

function Row({
  title,
  movers,
}: {
  title: string;
  movers: HomeMover[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xl text-sg-ink">{title}</h3>
      {movers.length === 0 ? (
        <p className="text-sm text-sg-mute">No movement this hour</p>
      ) : (
        <ul className="flex gap-4 overflow-x-auto pb-2">
          {movers.map((mover) => (
            <li
              key={`${mover.genre.slug}-${mover.islandCode}`}
              className="w-72 shrink-0"
            >
              <p className="mb-1 text-sm text-sg-mute">{mover.genre.displayName}</p>
              <IslandTile
                island={mover.island}
                rank={mover.currentRank}
                badge={badge(mover)}
                genre={mover.genre.slug}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MoversBoard({
  climbers,
  fallers,
}: {
  climbers: HomeMover[];
  fallers: HomeMover[];
}) {
  if (climbers.length === 0 && fallers.length === 0) return null;
  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-3xl text-sg-ink">Movers this hour</h2>
      <Row title="Climbed" movers={climbers} />
      <Row title="Fell" movers={fallers} />
    </section>
  );
}
