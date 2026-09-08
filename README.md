# Stormglass

Public Fortnite Creative / UEFN island analytics. Look up an island by code and see how it is playing and where it sits in genre rankings.

**Live:** [https://feat-stormglass-v1.vercel.app](https://feat-stormglass-v1.vercel.app)

Stormglass is not affiliated with Epic Games or Fortnite.

## What it does

- Look up any public island by `xxxx-xxxx-xxxx`
- Last-day KPIs, 7-day charts, hourly CCU, genre rank hold
- Home boards: movers, genre rankings, newest islands
- No login. Data comes from Epic’s public [Fortnite Data API](https://api.fortnite.com/ecosystem/v1/docs)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Stack

Next.js App Router, TypeScript, Tailwind, Recharts. Server Components fetch Epic; the browser never calls the Data API directly.
