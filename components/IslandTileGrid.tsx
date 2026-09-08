import IslandTile from "@/components/IslandTile";
import type { IslandMetadata } from "@/lib/fortnite/types";

export default function IslandTileGrid({
  items,
}: {
  items: { island: IslandMetadata; rank?: number; genre?: string }[];
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.island.code}>
          <IslandTile
            island={item.island}
            rank={item.rank}
            genre={item.genre}
          />
        </li>
      ))}
    </ul>
  );
}