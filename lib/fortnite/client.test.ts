import { afterEach, expect, test, vi } from "vitest";
import metadata from "../../fixtures/island-metadata.json";
import populated from "../../fixtures/island-metrics-populated.json";
import hourMetrics from "../../fixtures/island-metrics-hour.json";
import islandRankings from "../../fixtures/island-rankings.json";
import genres from "../../fixtures/genres.json";
import genreRankings from "../../fixtures/genre-rankings.json";
import newest from "../../fixtures/newest-islands.json";
import ecosystemHour from "../../fixtures/ecosystem-hour.json";
import {
  FORTNITE_API_BASE,
  getEcosystemHourMetrics,
  getGenreRankings,
  getGenres,
  getIsland,
  getIslandDayMetrics,
  getIslandHourMetrics,
  getIslandMetadataMany,
  getIslandRankings,
  getNewestIslands,
  isoRangeDays,
  isoRangeHours,
} from "./client";
import {
  FortniteApiError,
  FortniteNotFoundError,
  FortniteRateLimitError,
} from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function callUrl(fetchMock: ReturnType<typeof vi.fn>, index = 0): URL {
  return new URL(String(fetchMock.mock.calls[index][0]));
}

function callInit(fetchMock: ReturnType<typeof vi.fn>, index = 0) {
  return fetchMock.mock.calls[index][1] as RequestInit & {
    next?: { revalidate?: number };
  };
}

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
  await expect(getIsland("5555-5555-5555")).rejects.toBeInstanceOf(
    FortniteRateLimitError,
  );
});

test("429 with prior success returns stale true", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse(metadata))
    .mockResolvedValueOnce(new Response("slow down", { status: 429 }));
  vi.stubGlobal("fetch", fetchMock);
  const first = await getIsland("2222-3333-4444");
  expect(first.stale).toBe(false);
  expect(first.data.title).toBe("Fight The Brainrot");
  const second = await getIsland("2222-3333-4444");
  expect(second.stale).toBe(true);
  expect(second.data.title).toBe("Fight The Brainrot");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("isoRangeDays and isoRangeHours use from/to ISO bounds", () => {
  const now = new Date("2026-09-07T15:00:00.000Z");
  expect(isoRangeDays(7, now)).toEqual({
    from: "2026-08-31T15:00:00.000Z",
    to: "2026-09-07T15:00:00.000Z",
  });
  expect(isoRangeHours(24, now)).toEqual({
    from: "2026-09-06T15:00:00.000Z",
    to: "2026-09-07T15:00:00.000Z",
  });
});

test("hour metrics uses from/to on the hour bundle path", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(hourMetrics));
  vi.stubGlobal("fetch", fetchMock);
  const { from, to } = isoRangeHours(24, new Date("2026-09-07T15:00:00.000Z"));
  const result = await getIslandHourMetrics("6980-2761-9936", from, to);
  expect(result.data.peakCCU[0]?.value).toBe(154444);
  const url = callUrl(fetchMock);
  expect(url.pathname).toBe(
    "/ecosystem/v1/islands/6980-2761-9936/metrics/hour",
  );
  expect(url.pathname).not.toContain("/metrics/day/plays");
  expect(url.searchParams.has("startDate")).toBe(false);
  expect(url.searchParams.get("from")).toBe(from);
  expect(url.searchParams.get("to")).toBe(to);
});

test("island metadata and day metrics revalidate 300s; everything else 60s", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(metadata));
  vi.stubGlobal("fetch", fetchMock);
  await getIsland("6980-2761-9936");
  expect(callInit(fetchMock).next?.revalidate).toBe(300);

  fetchMock.mockResolvedValue(jsonResponse(populated));
  const day = isoRangeDays(7, new Date("2026-09-07T15:00:00.000Z"));
  await getIslandDayMetrics("6980-2761-9936", day.from, day.to);
  expect(callInit(fetchMock, 1).next?.revalidate).toBe(300);

  fetchMock.mockResolvedValue(jsonResponse(hourMetrics));
  const hour = isoRangeHours(24, new Date("2026-09-07T15:00:00.000Z"));
  await getIslandHourMetrics("6980-2761-9936", hour.from, hour.to);
  expect(callInit(fetchMock, 2).next?.revalidate).toBe(60);
});

test("getIslandRankings unwraps data and uses from/to", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(islandRankings));
  vi.stubGlobal("fetch", fetchMock);
  const { from, to } = isoRangeDays(7, new Date("2026-09-07T15:00:00.000Z"));
  const result = await getIslandRankings("6980-2761-9936", from, to);
  expect(result.data[0]?.genres[0]?.rank).toBe(4);
  const url = callUrl(fetchMock);
  expect(url.pathname).toBe("/ecosystem/v1/islands/6980-2761-9936/rankings");
  expect(url.searchParams.has("startDate")).toBe(false);
  expect(url.searchParams.get("from")).toBe(from);
  expect(url.searchParams.get("to")).toBe(to);
});

test("getGenres unwraps catalog data", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(genres));
  vi.stubGlobal("fetch", fetchMock);
  const result = await getGenres();
  expect(result.data.map((genre) => genre.slug)).toEqual([
    "simulation-tycoon",
    "shooter",
    "battle-royale",
  ]);
  expect(String(fetchMock.mock.calls[0][0])).toBe(`${FORTNITE_API_BASE}/genres`);
});

test("getGenreRankings maps items and snapshot meta", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(genreRankings));
  vi.stubGlobal("fetch", fetchMock);
  const result = await getGenreRankings("simulation-tycoon");
  expect(result.data).toEqual({
    items: [
      { islandCode: "6980-2761-9936", rank: 1 },
      { islandCode: "1111-2222-3333", rank: 2 },
    ],
    total: 10,
    snapshotAvailable: true,
    snapshot: "2026-09-07T15:00:00.000Z",
  });
  expect(String(fetchMock.mock.calls[0][0])).toBe(
    `${FORTNITE_API_BASE}/genres/simulation-tycoon/rankings`,
  );
});

test("getNewestIslands requests size and unwraps data", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(newest));
  vi.stubGlobal("fetch", fetchMock);
  const result = await getNewestIslands(12);
  expect(result.data[0]?.title).toBe("Our Spot");
  const url = callUrl(fetchMock);
  expect(url.pathname).toBe("/ecosystem/v1/islands");
  expect(url.searchParams.get("size")).toBe("12");
});

test("getEcosystemHourMetrics uses from/to on /metrics/hour", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(ecosystemHour));
  vi.stubGlobal("fetch", fetchMock);
  const { from, to } = isoRangeHours(24, new Date("2026-09-07T15:00:00.000Z"));
  const result = await getEcosystemHourMetrics(from, to);
  expect(result.data.inMatchPeakCCU[0]?.value).toBe(4500000);
  const url = callUrl(fetchMock);
  expect(url.pathname).toBe("/ecosystem/v1/metrics/hour");
  expect(url.searchParams.has("startDate")).toBe(false);
  expect(url.searchParams.get("from")).toBe(from);
  expect(url.searchParams.get("to")).toBe(to);
});

test("other non-OK throws FortniteApiError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
  );
  await expect(getIsland("3333-4444-5555")).rejects.toBeInstanceOf(
    FortniteApiError,
  );
});

test("getIslandMetadataMany skips 404s and never fetches metrics", async () => {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("0000-0000-0000")) {
      return Promise.resolve(new Response("missing", { status: 404 }));
    }
    return Promise.resolve(jsonResponse(metadata));
  });
  vi.stubGlobal("fetch", fetchMock);
  const result = await getIslandMetadataMany([
    "6980-2761-9936",
    "0000-0000-0000",
    "6980-2761-9936",
  ]);
  expect(result.data).toHaveLength(1);
  expect(result.data[0]?.title).toBe("Fight The Brainrot");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const call of fetchMock.mock.calls) {
    expect(String(call[0])).not.toContain("/metrics");
  }
});

test("getIslandMetadataMany fetches unique codes in chunks of 8", async () => {
  let concurrent = 0;
  let maxConcurrent = 0;
  const fetchMock = vi.fn().mockImplementation(async () => {
    concurrent += 1;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await Promise.resolve();
    concurrent -= 1;
    return jsonResponse(metadata);
  });
  vi.stubGlobal("fetch", fetchMock);
  const codes = Array.from(
    { length: 9 },
    (_, index) => `1000-0000-${String(index).padStart(4, "0")}`,
  );
  await getIslandMetadataMany(codes);
  expect(fetchMock).toHaveBeenCalledTimes(9);
  expect(maxConcurrent).toBe(8);
});
