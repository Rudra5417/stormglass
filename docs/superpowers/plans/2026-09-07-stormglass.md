# Stormglass v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local Next.js site that looks up public Fortnite islands by code and shows live Data API KPIs, 7-day charts, and genre rankings.

**Architecture:** Next.js App Router server-fetches `https://api.fortnite.com/ecosystem/v1`. A typed `lib/fortnite` client is the only module that talks to Epic. Pages are React Server Components; Recharts is the only client island. No database, no browser calls to Epic, no auth.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Recharts, Vitest, Geist.

**Spec:** `docs/superpowers/specs/2026-09-07-stormglass-design.md`

## Global Constraints

- Repo root is `C:\Users\rudi.patel\Desktop\stormglass`; `npm run dev` serves `http://localhost:3000`
- Fortnite Data API base `https://api.fortnite.com/ecosystem/v1`; no OAuth; query params `from` and `to` (ISO-8601), never `startDate`/`endDate`
- Never `fetch` Epic from a `'use client'` file; never scrape fortnite.gg; no thumbnails
- Do not use the eight single-metric island paths; use bundle endpoints
- Home cards: title, creator, tags, `createdIn` only — no per-card metrics
- Island KPIs use the last complete UTC day; null buckets render “Not enough data”, never plot `null` as 0
- Retention `d1`/`d7` are ratios (e.g. `0.85` → `85%`)
- Cache: genres/rankings/newest/ecosystem 60s; island metadata and day metrics 300s; hourly CCU and island rankings 60s
- Visual: canvas `#070B14`, panels `#0E1A2E` / `#152A4A`, gold `#E8C547`, cyan `#5CE1E6`
- Footer copy exactly: `Stormglass is not affiliated with Epic Games or Fortnite.`
- Tests use fixtures only; never hit the live API in `npm test`
- Do not re-init git (repo already exists)

## File structure

```
app/
  globals.css
  layout.tsx
  page.tsx
  not-found.tsx
  error.tsx
  search/page.tsx
  islands/[code]/page.tsx
  islands/[code]/not-found.tsx
  rankings/page.tsx
  rankings/[genre]/page.tsx
  creators/[creatorCode]/page.tsx
lib/fortnite/
  types.ts
  errors.ts
  normalize.ts
  normalize.test.ts
  metrics.ts
  metrics.test.ts
  genres.ts
  genres.test.ts
  search.ts
  search.test.ts
  client.ts
  client.test.ts
components/
  SiteHeader.tsx
  SiteFooter.tsx
  Lookup.tsx
  StaleBanner.tsx
  ErrorPanel.tsx
  IslandCard.tsx
  GenreBoard.tsx
  KpiStrip.tsx
  SeriesChart.tsx
  RankChart.tsx
fixtures/
  island-metadata.json
  island-metrics-populated.json
  island-metrics-null.json
  island-metrics-hour.json
  island-rankings.json
  genres.json
  genre-rankings.json
  newest-islands.json
  ecosystem-hour.json
```

---

### Task 1: Scaffold Next.js + Vitest

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`, `vitest.setup.ts` (via create-next-app, then add vitest)
- Modify: existing repo files only as create-next-app requires; keep `docs/` and `.git`

**Interfaces:**
- Consumes: empty app folder with docs + git
- Produces: `npm run dev`, `npm test` (Vitest), path alias `@/*`

- [ ] **Step 1: Scaffold the Next.js app in the existing folder**

From `C:\Users\rudi.patel\Desktop\stormglass` (do not `git init`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
```

If the CLI refuses a non-empty directory, create files equivalently: Next.js App Router, TypeScript, Tailwind, `app/layout.tsx`, `app/page.tsx`. Do not delete `docs/` or `.git`.

- [ ] **Step 2: Add Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Create `vitest.setup.ts`:

```ts
import { afterEach } from "vitest";

afterEach(() => {
  // tests must not call the live API; fail if they try
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Smoke-test the runner**

Create `lib/fortnite/smoke.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest runs", () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npm test`  
Expected: PASS (`vitest runs`)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app vitest.config.ts vitest.setup.ts lib/fortnite/smoke.test.ts tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Island code normalizer

**Files:**
- Create: `lib/fortnite/normalize.ts`
- Test: `lib/fortnite/normalize.test.ts`
- Modify: delete `lib/fortnite/smoke.test.ts` after this task’s tests exist

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export type IslandCode = string` (canonical `dddd-dddd-dddd`)
  - `export function parseIslandCode(input: string): IslandCode | null`
  - `export function formatIslandCode(code: IslandCode): string` (returns canonical form)

- [ ] **Step 1: Write the failing tests**

`lib/fortnite/normalize.test.ts`:

```ts
import { expect, test } from "vitest";
import { formatIslandCode, parseIslandCode } from "./normalize";

test("parses hyphenated codes", () => {
  expect(parseIslandCode("6980-2761-9936")).toBe("6980-2761-9936");
});

test("parses digits with spaces or no hyphens", () => {
  expect(parseIslandCode("698027619936")).toBe("6980-2761-9936");
  expect(parseIslandCode("6980 2761 9936")).toBe("6980-2761-9936");
});

test("rejects invalid shapes", () => {
  expect(parseIslandCode("")).toBeNull();
  expect(parseIslandCode("abc")).toBeNull();
  expect(parseIslandCode("6980-2761")).toBeNull();
  expect(parseIslandCode("6980-2761-993")).toBeNull();
});

test("format is identity for canonical codes", () => {
  expect(formatIslandCode("6980-2761-9936")).toBe("6980-2761-9936");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`  
Expected: FAIL — `Cannot find module './normalize'` or `parseIslandCode is not a function`

- [ ] **Step 3: Implement**

`lib/fortnite/normalize.ts`:

```ts
export type IslandCode = string;

const CANONICAL = /^(\d{4})-(\d{4})-(\d{4})$/;

export function parseIslandCode(input: string): IslandCode | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 12) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

export function formatIslandCode(code: IslandCode): string {
  const parsed = parseIslandCode(code);
  if (!parsed) {
    throw new Error(`Invalid island code: ${code}`);
  }
  return parsed;
}

export function looksLikeIslandCode(input: string): boolean {
  return parseIslandCode(input) !== null || CANONICAL.test(input.trim());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS (4 tests in `normalize.test.ts`)

- [ ] **Step 5: Commit**

```bash
git add lib/fortnite/normalize.ts lib/fortnite/normalize.test.ts
git rm -f lib/fortnite/smoke.test.ts
git commit -m "feat: parse and format Fortnite island codes"
```

---

### Task 3: Types, errors, metrics parser

**Files:**
- Create: `lib/fortnite/types.ts`, `lib/fortnite/errors.ts`, `lib/fortnite/metrics.ts`
- Create: `fixtures/island-metrics-populated.json`, `fixtures/island-metrics-null.json`
- Test: `lib/fortnite/metrics.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces types and functions listed below (later tasks must use these names)

`lib/fortnite/types.ts` must export:

```ts
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
  d1: number | null;
  d7: number | null;
  favorites: number | null;
  recommendations: number | null;
};
```

`lib/fortnite/errors.ts`:

```ts
export class FortniteNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Not found: ${path}`);
    this.name = "FortniteNotFoundError";
  }
}

export class FortniteRateLimitError extends Error {
  constructor(public readonly stale: boolean) {
    super("Fortnite Data API rate limited");
    this.name = "FortniteRateLimitError";
  }
}

export class FortniteApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FortniteApiError";
  }
}
```

`lib/fortnite/metrics.ts` must export:

```ts
export function utcDayStart(iso: string | Date): string
export function lastCompleteUtcDay(now?: Date): string
export function pickDayKpis(bundle: IslandMetricsBundle, now?: Date): DayKpis | null
export function toChartPoints(series: MetricPoint[]): ChartPoint[]
export function formatRetention(ratio: number | null): string
export function formatCount(value: number | null): string
```

- [ ] **Step 1: Write fixtures**

`fixtures/island-metrics-populated.json` (shape from live API, truncated to two days):

```json
{
  "averageMinutesPerPlayer": [
    { "value": 116.21, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 49.81, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "peakCCU": [
    { "value": 154444, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 7901, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "favorites": [
    { "value": 2501, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 210, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "minutesPlayed": [
    { "value": 31786868, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 2027843, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "recommendations": [
    { "value": 7212, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 444, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "plays": [
    { "value": 1812309, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 168433, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "uniquePlayers": [
    { "value": 273541, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "value": 40713, "timestamp": "2026-09-07T00:00:00.000Z" }
  ],
  "retention": [
    { "d1": 0.85, "d7": 0.68, "timestamp": "2026-09-06T00:00:00.000Z" },
    { "d1": 0.73, "d7": 0.67, "timestamp": "2026-09-07T00:00:00.000Z" }
  ]
}
```

`fixtures/island-metrics-null.json`: same keys, every `value`/`d1`/`d7` is `null`, timestamps `2026-09-06T00:00:00.000Z` and `2026-09-07T00:00:00.000Z`.

- [ ] **Step 2: Write failing tests**

`lib/fortnite/metrics.test.ts`:

```ts
import { expect, test } from "vitest";
import populated from "../../fixtures/island-metrics-populated.json";
import allNull from "../../fixtures/island-metrics-null.json";
import {
  formatCount,
  formatRetention,
  lastCompleteUtcDay,
  pickDayKpis,
  toChartPoints,
} from "./metrics";
import type { IslandMetricsBundle } from "./types";

test("lastCompleteUtcDay is yesterday UTC", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  expect(lastCompleteUtcDay(now)).toBe("2026-09-06T00:00:00.000Z");
});

test("pickDayKpis uses last complete UTC day not today", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  const kpis = pickDayKpis(populated as IslandMetricsBundle, now);
  expect(kpis?.uniquePlayers).toBe(273541);
  expect(kpis?.plays).toBe(1812309);
  expect(kpis?.d1).toBe(0.85);
});

test("pickDayKpis keeps nulls as null", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  const kpis = pickDayKpis(allNull as IslandMetricsBundle, now);
  expect(kpis?.uniquePlayers).toBeNull();
  expect(kpis?.d1).toBeNull();
});

test("toChartPoints drops null buckets", () => {
  const points = toChartPoints([
    { value: 10, timestamp: "2026-09-05T00:00:00.000Z" },
    { value: null, timestamp: "2026-09-06T00:00:00.000Z" },
    { value: 12, timestamp: "2026-09-07T00:00:00.000Z" },
  ]);
  expect(points).toEqual([
    { timestamp: "2026-09-05T00:00:00.000Z", value: 10 },
    { timestamp: "2026-09-07T00:00:00.000Z", value: 12 },
  ]);
});

test("formatRetention renders ratios as percents", () => {
  expect(formatRetention(0.85)).toBe("85%");
  expect(formatRetention(null)).toBe("Not enough data");
});

test("formatCount renders null as not enough data", () => {
  expect(formatCount(273541)).toBe("273,541");
  expect(formatCount(null)).toBe("Not enough data");
});
```

Enable JSON imports in `tsconfig.json` (`resolveJsonModule`: true — Next.js default).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- lib/fortnite/metrics.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 4: Implement types, errors, metrics**

`lib/fortnite/metrics.ts`:

```ts
import type {
  ChartPoint,
  DayKpis,
  IslandMetricsBundle,
  MetricPoint,
} from "./types";

export function utcDayStart(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  ).toISOString();
}

export function lastCompleteUtcDay(now: Date = new Date()): string {
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return utcDayStart(y);
}

function valueAt(series: MetricPoint[], timestamp: string): number | null {
  const hit = series.find((p) => p.timestamp === timestamp);
  return hit ? hit.value : null;
}

export function pickDayKpis(
  bundle: IslandMetricsBundle,
  now: Date = new Date(),
): DayKpis | null {
  const timestamp = lastCompleteUtcDay(now);
  const ret = bundle.retention.find((p) => p.timestamp === timestamp);
  if (
    !bundle.uniquePlayers.some((p) => p.timestamp === timestamp) &&
    !ret
  ) {
    return null;
  }
  return {
    timestamp,
    uniquePlayers: valueAt(bundle.uniquePlayers, timestamp),
    plays: valueAt(bundle.plays, timestamp),
    peakCCU: valueAt(bundle.peakCCU, timestamp),
    averageMinutesPerPlayer: valueAt(
      bundle.averageMinutesPerPlayer,
      timestamp,
    ),
    d1: ret?.d1 ?? null,
    d7: ret?.d7 ?? null,
    favorites: valueAt(bundle.favorites, timestamp),
    recommendations: valueAt(bundle.recommendations, timestamp),
  };
}

export function toChartPoints(series: MetricPoint[]): ChartPoint[] {
  return series
    .filter((p): p is MetricPoint & { value: number } => p.value !== null)
    .map((p) => ({ timestamp: p.timestamp, value: p.value }));
}

export function formatRetention(ratio: number | null): string {
  if (ratio === null) return "Not enough data";
  return `${Math.round(ratio * 100)}%`;
}

export function formatCount(value: number | null): string {
  if (value === null) return "Not enough data";
  return value.toLocaleString("en-US");
}
```

Also write `lib/fortnite/types.ts` and `lib/fortnite/errors.ts` exactly as in Interfaces.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/fortnite/metrics.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/fortnite/types.ts lib/fortnite/errors.ts lib/fortnite/metrics.ts lib/fortnite/metrics.test.ts fixtures
git commit -m "feat: parse island day KPIs and chart series"
```

---

### Task 4: Genre selection and in-memory search

**Files:**
- Create: `lib/fortnite/genres.ts`, `lib/fortnite/search.ts`
- Test: `lib/fortnite/genres.test.ts`, `lib/fortnite/search.test.ts`

**Interfaces:**
- Consumes: `Genre`, `IslandMetadata` from `lib/fortnite/types.ts`; `parseIslandCode` from `lib/fortnite/normalize.ts`
- Produces:
  - `export const PREFERRED_HOME_GENRES = ["simulation-tycoon", "shooter", "battle-royale"] as const`
  - `export function selectHomeGenres(genres: Genre[]): Genre[]`
  - `export function filterIslands(islands: IslandMetadata[], query: string): IslandMetadata[]`
  - `export function islandsForCreator(islands: IslandMetadata[], creatorCode: string): IslandMetadata[]`

- [ ] **Step 1: Write failing tests**

`lib/fortnite/genres.test.ts`:

```ts
import { expect, test } from "vitest";
import { selectHomeGenres } from "./genres";
import type { Genre } from "./types";

const catalog: Genre[] = [
  { slug: "horror", displayName: "Horror" },
  { slug: "shooter", displayName: "Shooter" },
  { slug: "simulation-tycoon", displayName: "Simulation & Tycoon" },
  { slug: "battle-royale", displayName: "Battle Royale" },
];

test("prefers the three spec slugs when present", () => {
  const home = selectHomeGenres(catalog);
  expect(home.map((g) => g.slug)).toEqual([
    "simulation-tycoon",
    "shooter",
    "battle-royale",
  ]);
});

test("falls back to first three when preferred missing", () => {
  const home = selectHomeGenres(catalog.slice(0, 3).filter((g) => g.slug === "horror" || g.slug === "shooter" || g.slug === "simulation-tycoon") /* keep three without battle-royale */);
  expect(selectHomeGenres([{ slug: "a", displayName: "A" }, { slug: "b", displayName: "B" }, { slug: "c", displayName: "C" }]).map((g) => g.slug)).toEqual(["a", "b", "c"]);
});
```

`lib/fortnite/search.test.ts`:

```ts
import { expect, test } from "vitest";
import { filterIslands, islandsForCreator } from "./search";
import type { IslandMetadata } from "./types";

const islands: IslandMetadata[] = [
  {
    code: "6980-2761-9936",
    creatorCode: "neverty7",
    title: "Fight The Brainrot",
    createdIn: "UEFN",
    tags: ["tycoon"],
  },
  {
    code: "1111-2222-3333",
    creatorCode: "other",
    title: "Zone Wars",
    createdIn: "FNC",
    tags: ["pvp"],
  },
];

test("filters by title, creator, or tag", () => {
  expect(filterIslands(islands, "brainrot")).toHaveLength(1);
  expect(filterIslands(islands, "neverty7")).toHaveLength(1);
  expect(filterIslands(islands, "pvp")).toHaveLength(1);
});

test("islandsForCreator is case-insensitive exact creatorCode", () => {
  expect(islandsForCreator(islands, "Neverty7")).toEqual([islands[0]]);
  expect(islandsForCreator(islands, "missing")).toEqual([]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/fortnite/genres.test.ts lib/fortnite/search.test.ts`  
Expected: FAIL — modules not found

- [ ] **Step 3: Implement**

`lib/fortnite/genres.ts`:

```ts
import type { Genre } from "./types";

export const PREFERRED_HOME_GENRES = [
  "simulation-tycoon",
  "shooter",
  "battle-royale",
] as const;

export function selectHomeGenres(genres: Genre[]): Genre[] {
  const bySlug = new Map(genres.map((g) => [g.slug, g]));
  const preferred = PREFERRED_HOME_GENRES.map((s) => bySlug.get(s)).filter(
    (g): g is Genre => Boolean(g),
  );
  if (preferred.length === 3) return preferred;
  return genres.slice(0, 3);
}
```

`lib/fortnite/search.ts`:

```ts
import type { IslandMetadata } from "./types";

export function filterIslands(
  islands: IslandMetadata[],
  query: string,
): IslandMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return islands.filter((island) => {
    if (island.title.toLowerCase().includes(q)) return true;
    if (island.creatorCode.toLowerCase().includes(q)) return true;
    if (island.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (island.code.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function islandsForCreator(
  islands: IslandMetadata[],
  creatorCode: string,
): IslandMetadata[] {
  const key = creatorCode.trim().toLowerCase();
  return islands.filter((i) => i.creatorCode.toLowerCase() === key);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/fortnite/genres.test.ts lib/fortnite/search.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/fortnite/genres.ts lib/fortnite/genres.test.ts lib/fortnite/search.ts lib/fortnite/search.test.ts
git commit -m "feat: select home genres and filter island catalogs"
```

---

### Task 5: Fortnite HTTP client (mocked fetch)

**Files:**
- Create: `lib/fortnite/client.ts`
- Create: remaining fixtures listed in File structure
- Test: `lib/fortnite/client.test.ts`

**Interfaces:**
- Consumes: types, errors, `parseIslandCode`
- Produces (all server-safe; this file must start with `import "server-only"` after installing `server-only`):

```ts
export const FORTNITE_API_BASE = "https://api.fortnite.com/ecosystem/v1";

export function isoRangeDays(days: number, now?: Date): { from: string; to: string }
export function isoRangeHours(hours: number, now?: Date): { from: string; to: string }

export async function getIsland(code: string): Promise<IslandMetadata>
export async function getIslandDayMetrics(code: string, from: string, to: string): Promise<IslandMetricsBundle>
export async function getIslandHourMetrics(code: string, from: string, to: string): Promise<IslandMetricsBundle>
export async function getIslandRankings(code: string, from: string, to: string): Promise<IslandGenreRank[]>
export async function getGenres(): Promise<Genre[]>
export async function getGenreRankings(slug: string): Promise<GenreRankingPage>
export async function getNewestIslands(size: number): Promise<IslandMetadata[]>
export async function getEcosystemHourMetrics(from: string, to: string): Promise<{ inMatchPeakCCU: MetricPoint[] }>
export async function getIslandMetadataMany(codes: string[]): Promise<IslandMetadata[]>
```

`getIslandMetadataMany` fetches unique codes sequentially in chunks of 8 (not 36 parallel). Skip codes that 404. Never call metrics.

Revalidate: pass `next: { revalidate }` as specified in the spec. On HTTP 429, if `lastSuccess` has that URL, return it and attach `stale: true` via throwing `FortniteRateLimitError` only when there is no last success — actually pages need both data and stale flag.

Use this result wrapper so pages can show the banner:

```ts
export type FetchResult<T> = { data: T; stale: boolean };
```

Every public get* function returns `Promise<FetchResult<T>>` except `getIslandMetadataMany`, which returns `Promise<FetchResult<IslandMetadata[]>>`.

On 429 with lastSuccess: return `{ data: lastSuccess, stale: true }`.  
On 429 without lastSuccess: throw `FortniteRateLimitError(false)`.  
On 404: throw `FortniteNotFoundError(path)`.  
On other non-OK: throw `FortniteApiError(status, body)`.

- [ ] **Step 1: Write fixtures**

`fixtures/island-metadata.json`:

```json
{
  "code": "6980-2761-9936",
  "creatorCode": "neverty7",
  "title": "Fight The Brainrot",
  "createdIn": "UEFN",
  "tags": ["simulator", "just for fun", "casual", "tycoon"]
}
```

`fixtures/genres.json`:

```json
{
  "data": [
    { "slug": "simulation-tycoon", "displayName": "Simulation & Tycoon" },
    { "slug": "shooter", "displayName": "Shooter" },
    { "slug": "battle-royale", "displayName": "Battle Royale" }
  ]
}
```

`fixtures/genre-rankings.json`:

```json
{
  "meta": {
    "total": 10,
    "snapshotAvailable": true,
    "snapshot": "2026-09-07T15:00:00.000Z"
  },
  "data": [
    { "islandCode": "6980-2761-9936", "rank": 1 },
    { "islandCode": "1111-2222-3333", "rank": 2 }
  ]
}
```

`fixtures/newest-islands.json`:

```json
{
  "data": [
    {
      "code": "3179-1383-9790",
      "creatorCode": "bloodlace",
      "title": "Our Spot",
      "createdIn": "FNC",
      "tags": ["party game"]
    }
  ]
}
```

`fixtures/ecosystem-hour.json`:

```json
{
  "inMatchPeakCCU": [
    { "value": 4500000, "timestamp": "2026-09-07T14:00:00.000Z" }
  ]
}
```

`fixtures/island-rankings.json`:

```json
{
  "data": [
    {
      "timestamp": "2026-09-07T14:00:00.000Z",
      "genres": [
        {
          "genreSlug": "simulation-tycoon",
          "genre": "Simulation & Tycoon",
          "rank": 4
        }
      ]
    }
  ]
}
```

`fixtures/island-metrics-hour.json`: copy populated metrics but use hourly timestamps for `peakCCU` only; other keys may be empty arrays.

- [ ] **Step 2: Write failing client tests**

`lib/fortnite/client.test.ts` — mock `globalThis.fetch`. Assert URLs use `from`/`to`, never `startDate`. Assert 404 throws `FortniteNotFoundError`. Assert 429 with prior success returns `stale: true`. Assert `getIslandDayMetrics` hits `/islands/{code}/metrics` not `/metrics/day/plays`.

```ts
import { afterEach, expect, test, vi } from "vitest";
import metadata from "../../fixtures/island-metadata.json";
import populated from "../../fixtures/island-metrics-populated.json";
import {
  FORTNITE_API_BASE,
  getIsland,
  getIslandDayMetrics,
  isoRangeDays,
} from "./client";
import { FortniteNotFoundError, FortniteRateLimitError } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("getIsland GETs /islands/{code} with no auth header", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(metadata), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const result = await getIsland("6980-2761-9936");
  expect(result.data.title).toBe("Fight The Brainrot");
  const url = String(fetchMock.mock.calls[0][0]);
  expect(url).toBe(`${FORTNITE_API_BASE}/islands/6980-2761-9936`);
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  expect(init.headers).toBeUndefined();
});

test("day metrics uses from/to on the bundle path", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(populated), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const { from, to } = isoRangeDays(7, new Date("2026-09-07T15:00:00.000Z"));
  await getIslandDayMetrics("6980-2761-9936", from, to);
  const url = new URL(String(fetchMock.mock.calls[0][0]));
  expect(url.pathname).toBe("/ecosystem/v1/islands/6980-2761-9936/metrics");
  expect(url.searchParams.has("startDate")).toBe(false);
  expect(url.searchParams.get("from")).toBe(from);
  expect(url.searchParams.get("to")).toBe(to);
});

test("404 throws FortniteNotFoundError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("missing", { status: 404 })),
  );
  await expect(getIsland("0000-0000-0000")).rejects.toBeInstanceOf(
    FortniteNotFoundError,
  );
});

test("429 without cache throws FortniteRateLimitError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("slow down", { status: 429 })),
  );
  await expect(getIsland("6980-2761-9936")).rejects.toBeInstanceOf(
    FortniteRateLimitError,
  );
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- lib/fortnite/client.test.ts`  
Expected: FAIL — `./client` not found

- [ ] **Step 4: Implement the client**

Install: `npm install server-only`

`lib/fortnite/client.ts`:

```ts
import "server-only";
import {
  FortniteApiError,
  FortniteNotFoundError,
  FortniteRateLimitError,
} from "./errors";
import { parseIslandCode } from "./normalize";
import type {
  Genre,
  GenreRankingPage,
  IslandGenreRank,
  IslandMetadata,
  IslandMetricsBundle,
  MetricPoint,
} from "./types";

export const FORTNITE_API_BASE = "https://api.fortnite.com/ecosystem/v1";

export type FetchResult<T> = { data: T; stale: boolean };

const lastSuccess = new Map<string, unknown>();

export function isoRangeDays(
  days: number,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now.toISOString();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

export function isoRangeHours(
  hours: number,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = now.toISOString();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  return { from, to };
}

function revalidateFor(path: string): number {
  if (/^\/islands\/[^/]+$/.test(path)) return 300;
  if (/^\/islands\/[^/]+\/metrics$/.test(path)) return 300;
  return 60;
}

async function apiGet<T>(
  path: string,
  query?: Record<string, string>,
): Promise<FetchResult<T>> {
  const url = new URL(`${FORTNITE_API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  const key = url.toString();
  const response = await fetch(key, {
    next: { revalidate: revalidateFor(path) },
  });
  if (response.status === 404) {
    throw new FortniteNotFoundError(path);
  }
  if (response.status === 429) {
    if (lastSuccess.has(key)) {
      return { data: lastSuccess.get(key) as T, stale: true };
    }
    throw new FortniteRateLimitError(false);
  }
  if (!response.ok) {
    throw new FortniteApiError(
      response.status,
      `Fortnite API ${response.status} for ${path}`,
    );
  }
  const data = (await response.json()) as T;
  lastSuccess.set(key, data);
  return { data, stale: false };
}

function requireCode(code: string): string {
  const parsed = parseIslandCode(code);
  if (!parsed) {
    throw new FortniteNotFoundError(`/islands/${code}`);
  }
  return parsed;
}

export async function getIsland(code: string): Promise<FetchResult<IslandMetadata>> {
  return apiGet<IslandMetadata>(`/islands/${requireCode(code)}`);
}

export async function getIslandDayMetrics(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandMetricsBundle>> {
  return apiGet<IslandMetricsBundle>(`/islands/${requireCode(code)}/metrics`, {
    from,
    to,
  });
}

export async function getIslandHourMetrics(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandMetricsBundle>> {
  return apiGet<IslandMetricsBundle>(
    `/islands/${requireCode(code)}/metrics/hour`,
    { from, to },
  );
}

export async function getIslandRankings(
  code: string,
  from: string,
  to: string,
): Promise<FetchResult<IslandGenreRank[]>> {
  const result = await apiGet<{ data: IslandGenreRank[] }>(
    `/islands/${requireCode(code)}/rankings`,
    { from, to },
  );
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getGenres(): Promise<FetchResult<Genre[]>> {
  const result = await apiGet<{ data: Genre[] }>("/genres");
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getGenreRankings(
  slug: string,
): Promise<FetchResult<GenreRankingPage>> {
  const result = await apiGet<{
    data: { islandCode: string; rank: number }[];
    meta: {
      total?: number;
      snapshotAvailable?: boolean;
      snapshot?: string | null;
    };
  }>(`/genres/${slug}/rankings`);
  return {
    stale: result.stale,
    data: {
      items: result.data.data ?? [],
      total: result.data.meta?.total ?? 0,
      snapshotAvailable: result.data.meta?.snapshotAvailable ?? false,
      snapshot: result.data.meta?.snapshot ?? null,
    },
  };
}

export async function getNewestIslands(
  size: number,
): Promise<FetchResult<IslandMetadata[]>> {
  const result = await apiGet<{ data: IslandMetadata[] }>("/islands", {
    size: String(size),
  });
  return { data: result.data.data ?? [], stale: result.stale };
}

export async function getEcosystemHourMetrics(
  from: string,
  to: string,
): Promise<FetchResult<{ inMatchPeakCCU: MetricPoint[] }>> {
  return apiGet("/metrics/hour", { from, to });
}

export async function getIslandMetadataMany(
  codes: string[],
): Promise<FetchResult<IslandMetadata[]>> {
  const unique = [...new Set(codes)];
  const islands: IslandMetadata[] = [];
  let stale = false;
  for (let i = 0; i < unique.length; i += 8) {
    const chunk = unique.slice(i, i + 8);
    const results = await Promise.all(
      chunk.map(async (code) => {
        try {
          return await getIsland(code);
        } catch (error) {
          if (error instanceof FortniteNotFoundError) return null;
          throw error;
        }
      }),
    );
    for (const result of results) {
      if (!result) continue;
      stale = stale || result.stale;
      islands.push(result.data);
    }
  }
  return { data: islands, stale };
}
```

Do not import this file from any `'use client'` component.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/fortnite/client.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/fortnite/client.ts lib/fortnite/client.test.ts fixtures package.json package-lock.json
git commit -m "feat: add server-only Fortnite Data API client"
```

---

### Task 6: App chrome — layout, lookup, tokens

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `components/Lookup.tsx`, `components/StaleBanner.tsx`, `components/ErrorPanel.tsx`

**Interfaces:**
- Consumes: `parseIslandCode` from `lib/fortnite/normalize.ts` (Lookup is a client component; it only uses normalize, never `lib/fortnite/client`)
- Produces:
  - `Lookup` — form GET `/search?q=`
  - `SiteFooter` renders the exact disclaimer
  - CSS variables `--sg-canvas: #070B14` etc.

- [ ] **Step 1: Write a Lookup test**

`components/Lookup.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Lookup from "./Lookup";

test("shows invalid message for bad codes on submit intent via HTML pattern", () => {
  render(<Lookup />);
  const input = screen.getByLabelText(/island code/i);
  expect(input).toBeTruthy();
});
```

Install: `npm install -D @testing-library/react @testing-library/dom`

If this environment-only test is too thin, also test `parseIslandCode` wiring with a small helper `export function lookupHref(q: string): string` in `components/Lookup.tsx`:

```ts
export function lookupHref(q: string): string {
  const code = parseIslandCode(q);
  if (code) return `/islands/${code}`;
  return `/search?q=${encodeURIComponent(q.trim())}`;
}
```

Test file `components/Lookup.test.tsx`:

```ts
import { expect, test } from "vitest";
import { lookupHref } from "./Lookup";

test("canonical codes go to island page", () => {
  expect(lookupHref("698027619936")).toBe("/islands/6980-2761-9936");
});

test("other queries go to search", () => {
  expect(lookupHref("tycoon")).toBe("/search?q=tycoon");
});
```

Because `lookupHref` can live in the same file as a client component, extract it to `lib/fortnite/normalize.ts` instead if `'use client'` + vitest fights — **put `lookupHref` in `lib/fortnite/normalize.ts`** so tests stay node-side.

Add to `normalize.ts`:

```ts
export function lookupHref(q: string): string {
  const code = parseIslandCode(q);
  if (code) return `/islands/${code}`;
  const trimmed = q.trim();
  if (!trimmed) return "/";
  return `/search?q=${encodeURIComponent(trimmed)}`;
}
```

Add tests to `normalize.test.ts` for `lookupHref`.

- [ ] **Step 2: Run tests — fail then pass**

Run: `npm test -- lib/fortnite/normalize.test.ts`  
Expected: FAIL on missing `lookupHref`, then PASS after adding it.

- [ ] **Step 3: Implement chrome**

`app/globals.css` — set body background `#070B14`, text cool gray, gold/cyan utilities:

```css
:root {
  --sg-canvas: #070b14;
  --sg-panel: #0e1a2e;
  --sg-panel-2: #152a4a;
  --sg-gold: #e8c547;
  --sg-cyan: #5ce1e6;
}
body {
  background: var(--sg-canvas);
  color: #d5dbe8;
}
```

`components/Lookup.tsx` (`'use client'`): controlled input, on submit `router.push(lookupHref(value))`. If `parseIslandCode` is null and user typed only digits/hyphens that failed parse, show inline `Enter a code like 6980-2761-9936` and **do not navigate**. If they typed words, navigate to search.

`components/SiteHeader.tsx`: link “Stormglass” → `/`, link “Rankings” → `/rankings`, embed `Lookup`.

`components/SiteFooter.tsx`: exact disclaimer sentence.

`app/layout.tsx`: Geist, header, `{children}`, footer.

`app/page.tsx`: for this task only, render header lookup + placeholder `<p>Stormglass</p>`. Full home data is Task 8.

`components/StaleBanner.tsx`: paragraph “Data may be stale. The Fortnite Data API rate-limited this request.”

`components/ErrorPanel.tsx`: `{ message: string }` plus a Retry `<a href="">` that reloads.

- [ ] **Step 4: Manual check**

Run: `npm run dev`  
Open `http://localhost:3000` — dark canvas, footer disclaimer visible.

- [ ] **Step 5: Commit**

```bash
git add app components lib/fortnite/normalize.ts lib/fortnite/normalize.test.ts
git commit -m "feat: add Stormglass chrome and island lookup"
```

---

### Task 7: Island page

**Files:**
- Create: `app/islands/[code]/page.tsx`, `app/islands/[code]/not-found.tsx`
- Create: `components/KpiStrip.tsx`, `components/SeriesChart.tsx`, `components/RankChart.tsx`
- Modify: `app/not-found.tsx`

**Interfaces:**
- Consumes: `getIsland`, `getIslandDayMetrics`, `getIslandHourMetrics`, `getIslandRankings`, `isoRangeDays`, `isoRangeHours`, `pickDayKpis`, `toChartPoints`, `formatCount`, `formatRetention`
- Produces: island hero page matching spec section 3 layout

- [ ] **Step 1: KpiStrip unit test (pure props)**

Put formatting-only assertions in `lib/fortnite/metrics.test.ts` (already has formatters). Add `components/kpiModel.ts`:

```ts
import type { DayKpis } from "@/lib/fortnite/types";
import { formatCount, formatRetention } from "@/lib/fortnite/metrics";

export function kpiItems(kpis: DayKpis | null): { label: string; value: string }[] {
  if (!kpis) {
    const empty = "Not enough data";
    return [
      { label: "Unique players", value: empty },
      { label: "Plays", value: empty },
      { label: "Peak CCU", value: empty },
      { label: "Avg minutes / player", value: empty },
      { label: "D1 retention", value: empty },
      { label: "D7 retention", value: empty },
      { label: "Favorites", value: empty },
      { label: "Recommendations", value: empty },
    ];
  }
  return [
    { label: "Unique players", value: formatCount(kpis.uniquePlayers) },
    { label: "Plays", value: formatCount(kpis.plays) },
    { label: "Peak CCU", value: formatCount(kpis.peakCCU) },
    { label: "Avg minutes / player", value: formatCount(kpis.averageMinutesPerPlayer) },
    { label: "D1 retention", value: formatRetention(kpis.d1) },
    { label: "D7 retention", value: formatRetention(kpis.d7) },
    { label: "Favorites", value: formatCount(kpis.favorites) },
    { label: "Recommendations", value: formatCount(kpis.recommendations) },
  ];
}
```

Test `lib/fortnite/kpiModel.test.ts` (file lives next to metrics if you prefer `lib/fortnite/kpiModel.ts` — **put `kpiModel.ts` in `lib/fortnite/`** not components, so it stays server-safe and testable).

```ts
import { expect, test } from "vitest";
import { kpiItems } from "./kpiModel";

test("null kpis are eight not-enough-data rows", () => {
  expect(kpiItems(null).every((i) => i.value === "Not enough data")).toBe(true);
  expect(kpiItems(null)).toHaveLength(8);
});
```

- [ ] **Step 2: Fail then implement kpiModel**

Run: `npm test -- lib/fortnite/kpiModel.test.ts`

- [ ] **Step 3: Island page RSC**

`app/islands/[code]/page.tsx`:

1. `parseIslandCode(params.code)`; if null, `notFound()`
2. `Promise.all` of the four client calls inside try/catch
3. `FortniteNotFoundError` → `notFound()`
4. `FortniteRateLimitError` / `FortniteApiError` → render `ErrorPanel`
5. `stale` OR of the four results → `StaleBanner`
6. Layout:
   - h1 title
   - copyable code (client tiny `CopyCode` button is OK; copying is browser-only)
   - `Link` to `/creators/{creatorCode}`
   - badge `createdIn`, tags, category
   - `KpiStrip` from `kpiItems(pickDayKpis(day.data))`
   - `SeriesChart` 7-day with toggle plays | uniquePlayers | minutesPlayed (client; pass all three `ChartPoint[]`)
   - `SeriesChart` hourly peak CCU
   - current genre ranks + `RankChart` from rankings series
   - small favorites vs recommendations chart (two series)

Install: `npm install recharts`

`components/SeriesChart.tsx` is `'use client'`. It receives `{ series: { name: string; points: ChartPoint[] }[]; toggleNames?: string[] }`. Stroke color `#5CE1E6`. Do not fetch.

`components/KpiStrip.tsx` can be a server component: grid 4 columns desktop, 2 mobile (`grid-cols-2 md:grid-cols-4`), gold numbers.

`app/islands/[code]/not-found.tsx`: “Island not found” + `Lookup`.

- [ ] **Step 4: Manual check**

Run: `npm run dev`  
Visit `http://localhost:3000/islands/6980-2761-9936`  
Expected: live title “Fight The Brainrot”, KPIs, charts.  
Visit `http://localhost:3000/islands/0000-0000-0000`  
Expected: not-found + lookup.

- [ ] **Step 5: Commit**

```bash
git add app/islands components/KpiStrip.tsx components/SeriesChart.tsx components/RankChart.tsx lib/fortnite/kpiModel.ts lib/fortnite/kpiModel.test.ts package.json package-lock.json
git commit -m "feat: render live island analytics page"
```

---

### Task 8: Home — CCU, genre boards, newest

**Files:**
- Modify: `app/page.tsx`
- Create: `components/IslandCard.tsx`, `components/GenreBoard.tsx`
- Create: `lib/fortnite/home.ts`

**Interfaces:**
- Consumes: `getEcosystemHourMetrics`, `getGenres`, `getGenreRankings`, `getNewestIslands`, `getIslandMetadataMany`, `selectHomeGenres`
- Produces: `loadHome(): Promise<HomePageData>`

```ts
export type HomePageData = {
  stale: boolean;
  inMatchPeakCCU: number | null;
  boards: {
    genre: Genre;
    items: { rank: number; island: IslandMetadata }[];
  }[];
  newest: IslandMetadata[];
};
```

Home request budget: 1 ecosystem + 3 rankings + 1 newest + metadata many for unique codes (≤ 36). No metrics.

- [ ] **Step 1: Test selectHomeGenres already exists. Add `lib/fortnite/home.test.ts` for unique-code collection.**

```ts
import { expect, test } from "vitest";
import { collectHomeCodes } from "./home";

test("collectHomeCodes unions ranking tops and newest, max 36", () => {
  const codes = collectHomeCodes(
    [
      ["a", "b", "c", "d", "e", "f", "g", "h", "extra"],
      ["a", "i"],
      ["j"],
    ],
    ["k", "l"],
  );
  expect(codes).toContain("a");
  expect(codes.length).toBeLessThanOrEqual(36);
  expect(codes.filter((c) => c === "a")).toHaveLength(1);
  expect(codes).not.toContain("extra"); // only top 8 per board
});
```

```ts
export function collectHomeCodes(
  rankingLists: string[][],
  newest: string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of rankingLists) {
    for (const code of list.slice(0, 8)) {
      if (seen.has(code)) continue;
      seen.add(code);
      out.push(code);
    }
  }
  for (const code of newest) {
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.slice(0, 36);
}
```

- [ ] **Step 2: Fail then pass `home.test.ts`**

- [ ] **Step 3: Implement `loadHome` in `lib/fortnite/home.ts` using the client.** Latest ecosystem CCU = last non-null `inMatchPeakCCU` point.

- [ ] **Step 4: `IslandCard`** — title, creator `Link` to `/creators/{creatorCode}`, tags, `createdIn` badge. No metrics. Hover: `border-color: #E8C547`. Radius `rounded-sm`.

- [ ] **Step 5: `app/page.tsx`** — Lookup, CCU KPI, three `GenreBoard` (title = displayName, 8 cards + “Full ranking” link to `/rankings/{slug}`), newest row of 12 cards. `StaleBanner` if `stale`.

- [ ] **Step 6: Manual check `http://localhost:3000`**

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/IslandCard.tsx components/GenreBoard.tsx lib/fortnite/home.ts lib/fortnite/home.test.ts
git commit -m "feat: build home with live CCU, genre boards, and newest islands"
```

---

### Task 9: Rankings, search, creator pages

**Files:**
- Create: `app/rankings/page.tsx`, `app/rankings/[genre]/page.tsx`, `app/search/page.tsx`, `app/creators/[creatorCode]/page.tsx`
- Create: `lib/fortnite/catalog.ts`

**Interfaces:**
- Consumes: `getGenres`, `getGenreRankings`, `getNewestIslands`, `getIslandMetadataMany`, `filterIslands`, `islandsForCreator`, `parseIslandCode`
- Produces: `loadSeenCatalog(): Promise<FetchResult<IslandMetadata[]>>` — union of home three genre top-8 codes + newest 12, then metadata. This is the in-request catalog for search and creator pages. Rankings genre page additionally loads that genre’s ranking list.

Search page:
- Read `searchParams.q`
- If `parseIslandCode(q)` → `redirect(/islands/{code})`
- Else `filterIslands(catalog, q)`; empty → “No matches. Search is code-first: try an island code like 6980-2761-9936.”

Creator page: `islandsForCreator(catalog, creatorCode)`; empty → empty state + Lookup.

Rankings index: list genres as links.  
Rankings genre: ranked list (stacked on mobile) of `IslandCard` + rank number in gold.

- [ ] **Step 1: Test `loadSeenCatalog` uniqueness via `collectHomeCodes` (already tested). Add `filterIslands` empty-query returns [] (already in search.test). No extra unit test required if those pass.**

Run: `npm test`  
Expected: all existing tests PASS

- [ ] **Step 2: Implement `lib/fortnite/catalog.ts`**

```ts
import { getGenreRankings, getGenres, getIslandMetadataMany, getNewestIslands, type FetchResult } from "./client";
import { selectHomeGenres } from "./genres";
import { collectHomeCodes } from "./home";
import type { IslandMetadata } from "./types";

export async function loadSeenCatalog(): Promise<FetchResult<IslandMetadata[]>> {
  const genres = await getGenres();
  const homeGenres = selectHomeGenres(genres.data);
  const rankingPages = await Promise.all(
    homeGenres.map((g) => getGenreRankings(g.slug)),
  );
  const newest = await getNewestIslands(12);
  const codes = collectHomeCodes(
    rankingPages.map((p) => p.data.items.map((i) => i.islandCode)),
    newest.data.map((i) => i.code),
  );
  const meta = await getIslandMetadataMany(codes);
  return {
    data: meta.data,
    stale:
      genres.stale ||
      newest.stale ||
      meta.stale ||
      rankingPages.some((p) => p.stale),
  };
}
```

- [ ] **Step 3: Implement the four routes as specified**

- [ ] **Step 4: Manual check**

- `/rankings` lists genres  
- `/rankings/simulation-tycoon` shows ranks  
- `/search?q=698027619936` redirects to island  
- `/search?q=zzzz-not-a-map` empty hint  
- `/creators/neverty7` shows Brainrot if it was in catalog  

- [ ] **Step 5: Commit**

```bash
git add app/rankings app/search app/creators lib/fortnite/catalog.ts
git commit -m "feat: add rankings, search, and creator catalog pages"
```

---

### Task 10: Errors, empty states, visual polish

**Files:**
- Modify: `app/globals.css`, `app/error.tsx`, `app/not-found.tsx`, island/home/creator/search pages
- Modify: components for spacing, hairline hover, tabular nums

**Interfaces:**
- Consumes: existing error types and components
- Produces: spec section 7 table fully visible in the UI

- [ ] **Step 1: `app/error.tsx`** (client) renders `ErrorPanel` with `error.message` and retry via `reset()`.

- [ ] **Step 2: `app/not-found.tsx`** — “Page not found” + Lookup.

- [ ] **Step 3: Apply visual tokens** — `font-variant-numeric: tabular-nums` on KPIs; card `rounded-sm border border-transparent hover:border-[#E8C547]`; gold for ranks and primary buttons; cyan for links and chart strokes; no box-shadow glow.

- [ ] **Step 4: Manual pass (spec §8)**

Checklist (all on `localhost:3000`):
- [ ] Home loads CCU + 3 boards + newest  
- [ ] Lookup valid code → island page  
- [ ] Lookup invalid digit string → inline error, no request  
- [ ] Island `6980-2761-9936` has charts  
- [ ] Island unknown → not-found + lookup  
- [ ] Genre ranking page  
- [ ] Footer disclaimer exact  
- [ ] Narrow viewport: KPI 2×4, charts full width, rankings stacked  

- [ ] **Step 5: Run full unit suite**

Run: `npm test`  
Expected: PASS, and no test calls `api.fortnite.com` (fetch mocked or unused)

- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: polish Stormglass empty states and visual system"
```

---

## Self-review vs spec

| Spec requirement | Task |
|---|---|
| Public explorer, no login | 6–9 |
| Live Data API, no mock catalog as source of truth | 5 |
| Genre rankings instead of impressions | 8, 9 |
| Routes `/` `/search` `/islands/[code]` `/rankings` `/rankings/[genre]` `/creators/[creatorCode]` | 7–9 |
| KPI last complete UTC day; null → “Not enough data” | 3, 7 |
| 7-day toggle chart + hourly CCU + rank-over-time + fav vs rec | 7 |
| Home: CCU, 3 preferred genres, newest 12, cards without metrics | 4, 8 |
| Search code-first; name filter on seen catalog only | 4, 9 |
| Creator = seen islands only | 9 |
| Server-only fetch, from/to, bundle metrics, revalidate times, 429 stale | 5 |
| Visual tokens, Geist, footer disclaimer, mobile wrap | 6, 10 |
| Fixtures + unit tests, no live API in CI | 2–5 |
| Local-first, no Vercel in v1 | 1 (no deploy task) |

Out of spec on purpose (no task): Vercel, thumbnails, impressions, player stats, DB.
