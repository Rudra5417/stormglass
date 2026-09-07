export type CreatedIn = string;

export type IslandMetadata = {
  code: string;
  creatorCode: string;
  title: string;
  createdIn: CreatedIn;
  tags: string[];
  category?: string;
};

export type MetricPoint = {
  value: number | null;
  timestamp: string;
};

export type RetentionPoint = {
  d1: number | null;
  d7: number | null;
  timestamp: string;
};

export type IslandMetricsBundle = {
  averageMinutesPerPlayer: MetricPoint[];
  peakCCU: MetricPoint[];
  favorites: MetricPoint[];
  minutesPlayed: MetricPoint[];
  recommendations: MetricPoint[];
  plays: MetricPoint[];
  uniquePlayers: MetricPoint[];
  retention: RetentionPoint[];
};

export type Genre = { slug: string; displayName: string };

export type GenreRankingItem = {
  islandCode: string;
  rank: number;
};

export type GenreRankingPage = {
  snapshot: string | null;
  snapshotAvailable: boolean;
  total: number;
  items: GenreRankingItem[];
};

export type IslandGenreRank = {
  timestamp: string;
  genres: { genreSlug: string; genre: string; rank: number }[];
};

export type ChartPoint = { timestamp: string; value: number };

export type DayKpis = {
  timestamp: string;
  uniquePlayers: number | null;
  plays: number | null;
  peakCCU: number | null;
  averageMinutesPerPlayer: number | null;
  minutesPlayed: number | null;
  d1: number | null;
  d7: number | null;
  favorites: number | null;
  recommendations: number | null;
};
