# Stormglass v1 Design

Public Fortnite Creative / UEFN island analytics explorer. Live data from Epic’s Fortnite Data API. Original brand, not an official Epic product.

**Repo root:** `C:\Users\rudi.patel\Desktop\stormglass`  
**Run:** `npm run dev` → `http://localhost:3000`  
**Publish:** local-first. Vercel only when explicitly requested. Not GitHub Pages (needs a Node server).

## 1. Purpose

Stormglass lets anyone look up a public island by code and see how it is playing and where it sits in Discover genre rankings. It is a portfolio-quality website, not a Creator Portal clone and not a player-stats tracker.

**Primary user:** a creator or analyst browsing the public island ecosystem.  
**Success:** lookup an island code, see real KPIs and 7-day charts, browse a genre board, share a URL. All without login.

## 2. Non-goals (v1)

- Player career stats, ranked, match history, item shop
- Login, accounts, “my islands”
- Discover impressions, clicks, CTR, row placement (Creator Portal / owner-only)
- Island vs playlist comparison
- History beyond the API’s 7-day window
- Thumbnails (API has none; do not scrape fortnite.gg)
- Database, crawler, or Redis
- Calling the Fortnite API from the browser
- Official Fortnite / Epic visual identity

## 3. Product surfaces

| Route | Behavior |
|---|---|
| `/` | Island-code lookup. Fortnite-wide in-match peak CCU. Three genre boards (top 8 each): prefer slugs `simulation-tycoon`, `shooter`, `battle-royale` when `/genres` includes them; otherwise the first three genres returned. Newest public islands (`/islands?size=12`). |
| `/search` | If the query matches `xxxx-xxxx-xxxx`, redirect to `/islands/{code}`. Otherwise filter **already loaded** islands (home rankings + newest) by title, creator, or tag. No API name search exists. |
| `/islands/[code]` | Hero page (see layout below). |
| `/rankings` | Genre list from `GET /genres`. |
| `/rankings/[genre]` | Official hourly ranking for that slug. |
| `/creators/[creatorCode]` | Islands **already seen** in rankings + newest lists with that `creatorCode`. If none, empty state + code lookup. |

Island code format: four groups of four digits, hyphenated. Normalize user input (strip spaces, accept with or without hyphens) before calling the API.

### Island page layout (top → bottom)

1. Title, copyable code, creator link, `createdIn` badge (`UEFN` / `FNC`), tags, optional `category`
2. KPI strip for the **last complete UTC day**: unique players, plays, peak CCU, avg minutes/player, D1 retention, D7 retention, favorites, recommendations
3. 7-day chart with metric toggle: plays / unique players / minutes played
4. Hourly peak CCU chart (last 24 hours)
5. Genre rank (current snapshot) + rank-over-time from `GET /islands/{code}/rankings`
6. Favorites vs recommendations (7-day, smaller chart)

Home and ranking **cards** show title, creator, tags, `createdIn` only. Do not fetch per-island metrics on list pages.

## 4. Fortnite Data API

**Base:** `https://api.fortnite.com/ecosystem/v1`  
**Auth:** none. Do not send OAuth.  
**Docs:** `https://api.fortnite.com/ecosystem/v1/docs`  
**Limits:** 7 days of history; public discoverable islands only; metric `null` when unique players in that bucket &lt; 5; HTTP `429` when rate-limited.

### Endpoints v1 uses

| Method | Path | Use |
|---|---|---|
| GET | `/islands?size=` | Newest-first catalog. Default page size 100, max 1000. Cursor `after` / `before`. |
| GET | `/islands/{code}` | Metadata: `code`, `creatorCode`, `title`, `createdIn`, `tags`, optional `category`. |
| GET | `/islands/{code}/metrics?from=&to=` | Day-bucket bundle: `plays`, `uniquePlayers`, `minutesPlayed`, `averageMinutesPerPlayer`, `peakCCU`, `favorites`, `recommendations`, `retention.{d1,d7}`. |
| GET | `/islands/{code}/metrics/hour?from=&to=` | Hourly series for peak CCU (and other metrics if needed). Interval enum: `day` \| `hour` \| `minute` (`minute` = 10-minute buckets). Retention only on `day`. Avg minutes not on `minute`. |
| GET | `/islands/{code}/rankings?from=&to=` | Rank over time per genre. |
| GET | `/genres` | `{ slug, displayName }[]`. |
| GET | `/genres/{slug}/rankings` | `{ islandCode, rank }[]` plus snapshot metadata. |
| GET | `/metrics/hour` (or `/metrics/{interval}/in-match-peak-ccu`) | Fortnite-wide in-match peak CCU for the home KPI. |

Do **not** use the eight single-metric island paths on the island page; use the bundle endpoints.

Query names are `from` and `to` (ISO-8601), not `startDate` / `endDate`.

### Explicitly unused in v1

Impressions, clicks, Discover row IDs, playlist comparison — not in this API. Genre rankings are the public Discover stand-in.

## 5. Architecture

Next.js App Router (current stable), TypeScript, Tailwind CSS, Recharts (client components only).

```
app/                  routes (RSC)
lib/fortnite/         server-only typed client
components/           cards, KPI strip, charts, lookup
```

**Data flow:** Browser → Next.js Server Component / server function → `lib/fortnite` `fetch` → Data API. Never `fetch` Epic from a Client Component.

**Next.js cache (`revalidate`):**

| Data | Seconds |
|---|---|
| Genre list, genre rankings, newest islands, ecosystem CCU | 60 |
| Island metadata | 300 |
| Day metrics (7d) | 300 |
| Hourly CCU, island rankings series | 60 |

**Request budget**

- Home: 1 ecosystem CCU + 3 genre ranking pages + 1 newest page. Then hydrate metadata only for visible card codes (3×8 ranking cards + 12 newest ≤ 36). No metrics fan-out.
- Island: 4 calls — metadata, day metrics, hourly metrics, rankings.
- Rankings page: genres + one ranking page + metadata for that page’s codes.

**429:** if a cached representation exists, render it with a “data may be stale” banner. If not, page-level error with retry. No parallel retry storm.

**404:** unknown island code → not-found page with lookup.  
**Null metrics:** KPI shows “Not enough data”; charts drop null buckets rather than plotting zero.

**Creator index:** in-request only. Union island codes from the three home genre boards + newest list (and the current rankings page if the user came from one). No persistent store.

## 6. Visual

- Canvas `#070B14`; panels `#0E1A2E` → `#152A4A`
- Gold `#E8C547` for primary actions, ranks, KPI emphasis
- Cyan `#5CE1E6` for links and chart series
- Geist (Next.js default) with tabular figures for numbers
- Sharp / tiny radius; gold hairline on card hover; no glow-heavy game-marketing chrome
- Footer: “Stormglass is not affiliated with Epic Games or Fortnite.”
- Mobile: KPI strip wraps 2×4; charts full width; rankings as a stacked list

## 7. Error handling and empty states

| Case | UI |
|---|---|
| Invalid code shape | Inline validation on lookup; do not call API |
| 404 island | Not-found + lookup |
| All-null day metrics | Page renders; KPIs “Not enough data” |
| 429 with cache | Stale banner |
| 429 without cache / 5xx / network | Error panel, retry |
| Creator with no known islands | Empty + lookup |
| Search with no matches | Empty; hint that search is code-first |

## 8. Testing

- Fixture JSON copied from real responses (including all-null and a high-CCU island such as `6980-2761-9936`)
- Unit tests: code normalizer, metrics parser (`null` vs number), retention display (API `d1`/`d7` are ratios, render as percents)
- Do not hit the live API in CI
- Manual check: home, lookup, island, genre ranking, 404, mobile width

## 9. Modules (one job each)

| Module | Does | Depends on |
|---|---|---|
| `lib/fortnite/client` | Typed GET wrappers, 429/404 mapping | `fetch` |
| `lib/fortnite/normalize` | Island-code parse/format | none |
| `lib/fortnite/metrics` | Align timestamped series; pick last complete day | none |
| `app/islands/[code]` | Island page composition | client + metrics |
| `components/KpiStrip` | Eight KPIs + null state | metrics types |
| `components/SeriesChart` | Recharts wrapper | series arrays |
| `components/IslandCard` | List card, no metrics | metadata type |
| `components/Lookup` | Home/search input | normalize |

## 10. Implementation order (for the later plan)

1. Scaffold Next.js app in this folder  
2. Fortnite client + fixtures + tests  
3. Lookup + island page  
4. Home (CCU + newest + 3 genre boards)  
5. Rankings + creator pages  
6. Visual polish + empty/error states  

No app code until this spec is approved and an implementation plan is written.
