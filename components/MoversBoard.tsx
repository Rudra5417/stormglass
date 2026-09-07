import IslandCard from "@/components/IslandCard";
import type { HomeMover } from "@/lib/fortnite/home";

function Delta({ mover }: { mover: HomeMover }) {
  if (mover.kind === "entered") {
    return <span className="text-sm text-sg-gold">entered</span>;
  }
  const n = mover.delta ?? 0;
  const label = n > 0 ? `+${n}` : String(n);
  return <span className="sg-kpi text-sm text-sg-gold">{label}</span>;
}

function Column({
  title,
  movers,
}: {
  title: string;
  movers: HomeMover[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className="text-xl text-sg-ink">{title}</h3>
      {movers.length === 0 ? (
        <p className="mt-2 text-sm text-sg-mute">No movement this hour</p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {movers.map((mover) => (
            <li key={`${mover.genre.slug}-${mover.islandCode}`}>
              <div className="flex items-baseline justify-between gap-3 pt-3">
                <p className="text-sm text-sg-mute">{mover.genre.displayName}</p>
                <Delta mover={mover} />
              </div>
              <IslandCard island={mover.island} genre={mover.genre.slug} />
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
    <section className="flex flex-col gap-6">
      <h2 className="text-3xl text-sg-ink">Movers this hour</h2>
      <div className="flex flex-col gap-10 md:flex-row md:gap-12">
        <Column title="Climbed" movers={climbers} />
        <Column title="Fell" movers={fallers} />
      </div>
    </section>
  );
}
