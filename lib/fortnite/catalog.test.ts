import { afterEach, expect, test, vi } from "vitest";
import metadata from "../../fixtures/island-metadata.json";
import genres from "../../fixtures/genres.json";
import genreRankings from "../../fixtures/genre-rankings.json";
import newest from "../../fixtures/newest-islands.json";
import { loadSeenCatalog } from "./catalog";
import { FORTNITE_API_BASE } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const extraCode = "9999-8888-7777";

function stubCatalogFetch() {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/ecosystem/v1/genres") {
      return Promise.resolve(jsonResponse(genres));
    }
    if (url.pathname === "/ecosystem/v1/islands") {
      return Promise.resolve(jsonResponse(newest));
    }
    if (url.pathname === "/ecosystem/v1/genres/horror/rankings") {
      return Promise.resolve(
        jsonResponse({
          meta: { total: 1, snapshotAvailable: true, snapshot: null },
          data: [{ islandCode: extraCode, rank: 1 }],
        }),
      );
    }
    if (url.pathname.endsWith("/rankings")) {
      return Promise.resolve(jsonResponse(genreRankings));
    }
    return Promise.resolve(jsonResponse(metadata));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function calledUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((call) => String(call[0]));
}

test("loadSeenCatalog unions home boards and newest without extra genre", async () => {
  const fetchMock = stubCatalogFetch();
  const result = await loadSeenCatalog();
  expect(result.data.length).toBeGreaterThan(0);
  const urls = calledUrls(fetchMock);
  expect(urls.some((url) => url.includes("/genres/horror/rankings"))).toBe(
    false,
  );
  expect(urls.some((url) => url.includes(`/islands/${extraCode}`))).toBe(false);
  expect(urls.some((url) => url.startsWith(`${FORTNITE_API_BASE}/genres`))).toBe(
    true,
  );
});

test("loadSeenCatalog unions the referrer genre ranking when genre is set", async () => {
  const fetchMock = stubCatalogFetch();
  await loadSeenCatalog("horror");
  const urls = calledUrls(fetchMock);
  const horror = urls.find((url) =>
    url.includes("/genres/horror/rankings"),
  );
  expect(horror).toBeDefined();
  expect(new URL(horror!).searchParams.get("size")).toBe("24");
  expect(urls.some((url) => url.includes(`/islands/${extraCode}`))).toBe(true);
});
