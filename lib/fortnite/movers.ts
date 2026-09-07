export type RankSnapshotItem = { islandCode: string; rank: number };

export type Mover = {
  islandCode: string;
  currentRank: number;
  previousRank: number | null;
  delta: number | null;
  kind: "climbed" | "fell" | "entered";
};

export function previousHourIso(snapshot: string): string {
  return new Date(new Date(snapshot).getTime() - 60 * 60 * 1000).toISOString();
}

export function rankMovers(
  current: RankSnapshotItem[],
  previous: RankSnapshotItem[],
): { climbed: Mover[]; fell: Mover[] } {
  const prevByCode = new Map(previous.map((item) => [item.islandCode, item.rank]));
  const climbed: Mover[] = [];
  const fell: Mover[] = [];

  for (const item of current) {
    const previousRank = prevByCode.get(item.islandCode);
    if (previousRank === undefined) {
      climbed.push({
        islandCode: item.islandCode,
        currentRank: item.rank,
        previousRank: null,
        delta: null,
        kind: "entered",
      });
      continue;
    }
    const delta = previousRank - item.rank;
    if (delta > 0) {
      climbed.push({
        islandCode: item.islandCode,
        currentRank: item.rank,
        previousRank,
        delta,
        kind: "climbed",
      });
    } else if (delta < 0) {
      fell.push({
        islandCode: item.islandCode,
        currentRank: item.rank,
        previousRank,
        delta,
        kind: "fell",
      });
    }
  }

  climbed.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "climbed" ? -1 : 1;
    return (b.delta ?? 0) - (a.delta ?? 0);
  });
  fell.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
  return { climbed, fell };
}
