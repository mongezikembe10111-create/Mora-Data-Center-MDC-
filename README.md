# MORA Data Centre

**Democracy, By the Numbers.** An independent South African electoral research application built with Next.js App Router, React, TypeScript, Tailwind, Radix/shadcn primitives, Motion, ECharts, D3, MapLibre, Turf, TanStack Table and Zod.

## Run locally

Use Node.js 24 (see `.nvmrc`) and npm. No database, API key or environment secret is required.

```sh
npm ci
npm run dev
```

The development server uses port 3000. For a production build:

```sh
npm run build
npm run start
```

The build validates the curated datasets before compiling. In a cloud sandbox with a read-only home directory, use `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`.

## What works

- Executive overview, date-specific KPI sources, election/year/province filters, participation funnel and registration definitions.
- Municipal history (2000, 2006, 2011, 2016, 2021), accessible chart tables and mathematically consistent comparisons.
- Verified provincial registration/turnout choropleths, province selection, hover, zoom, reset, exact legends and linked dashboard filters. The map needs no external tiles or API key and has an interactive keyboard SVG fallback when WebGL is unavailable.
- Registration age profile using the original IEC age bands; a two-observation 2016/2026 registration view; age-filtered insights and a clearly hypothetical scenario laboratory.
- Explorer with election and registration datasets, province/year/age filters, sorting, search, line/bar/area/scatter charts, source-aware SVG/PNG exports, selected-metric CSV and complete filtered-dataset CSV. The Registration page includes a composition studio (stacked bar, donut and treemap) and a compatible-electorate Sankey; Explorer links to these tools and the provincial map.
- Election-year and 2016 province comparisons, paired/mirrored charts, comparison tables, CSV and restorable share URLs.
- Three MDX research explainers with references, table of contents, interactive denominator example, reading time, related articles and sharing.
- Search, methodology/source registry, about, contact, privacy, cookies, terms and accessibility routes.
- Contact generates an unsent local enquiry draft or opens the repository issue composer. No invented contact address or submission backend is configured. No marketing trackers or optional cookies are used.

## Verified evidence and limitations

Primary-source excerpts, retrieval dates, PDF page references and SHA-256 hashes are recorded under `data/raw`. The complete registry is in `src/lib/data.ts` and visible at `/methodology`. Original reports remain linked; PDF binaries are not duplicated in the repository.

| Dataset                         | Coverage                                                                   | Important qualification                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| IEC municipal reports           | National, 2000–2021                                                        | Published participation definitions vary. Counts and rates are transcribed independently.                                          |
| IEC 2016 report                 | Nine provinces, certified roll, participating voters and published turnout | Eastern Cape and Limpopo have conflicting roll tables; their effective denominators and non-participant counts remain unavailable. |
| IEC registration snapshot       | 29 September 2026; 29,230,808 registered people                            | Nine province totals and eight age-band totals independently reconcile to the national roll. Registration is not turnout.          |
| IEC 2016 age profile            | Eight original age bands                                                   | Comparing 2016 and 2026 does not track individuals or unchanged cohorts.                                                           |
| IEC official election timetable | Election day: 4 November 2026, 07:00–21:00 SAST                            | No future results or forecasts are included.                                                                                       |
| Natural Earth v5.1.2            | Nine province polygons, public domain                                      | Release date 13 May 2022; original boundary vintage unspecified. These are not IEC election/ward boundaries.                       |

The 2006 report's **48.40%** is ballot papers divided by potential ballot papers (two or three per voter). It is plotted separately and cannot establish person-level abstention or a homogeneous change against later voter-based rates. The 2000 effective denominator is unreconciled and its published rate is also shown separately. For compatible later reports, the effective electorate includes documented MEC7 additions and remains distinct from the certified roll.

The 2021 results appendix records **12,063,709** participating voters; the narrative records **12,063,886**. The application retains the appendix count, publishes the official 45.87% separately and discloses the difference. It never silently rewrites official numbers to force agreement.

Compatible eligible-citizen denominators, exact 18–35 counts/rates, youth turnout, municipal/metro/ward series and party performance are not verified in this release. They display **Official comparable data unavailable.** Published 30–39 counts are never split into 30–35. User-supplied reference observations remain separate and explicitly unverified. Historical rolls are never combined with the 2026 snapshot to derive contemporary participation rates.

## Update a dataset

1. Obtain the original official IEC, Statistics South Africa, Municipal Demarcation Board or government publication over verified HTTPS. Record URL, organisation, publication date if known, observation date, retrieval date, geography, age bands, units, methods and limitations.
2. Add a provenance/evidence file in `data/raw` with the original artifact's SHA-256 and exact relevant excerpt/page. A successful HTTP request alone is not statistical verification.
3. Add the source registry entry and transcribe the observation independently in `src/lib/data.ts`. Preserve `null` for unavailable or unreconciled fields; never infer voters from rounded turnout or combined municipal ballots.
4. Establish `turnoutBasis` and an effective denominator only when compatible. Explicit `turnoutDenominator: null` means unresolved, not a fallback to the certified roll.
5. Keep new geography/date/age combinations distinct. Add source-backed adapter support in `src/lib/geography.ts` and explorer view models rather than substituting a national number.
6. Run the checks below, inspect the source-aware exports and verify the affected browser view. Review any boundary changes before enabling geographical comparisons.

This version uses cached, curated datasets and makes no live source requests when visitors load pages. Source updates are a reviewed research process; there is no unattended job that promotes changed website numbers to verified data.

## Architecture

- `data/raw/`: primary-source evidence and provenance.
- `src/lib/data.ts`: dated source registry and transcribed election/registration records.
- `src/lib/schemas.ts`: Zod integrity, source and reconciliation checks.
- `src/lib/analytics.ts`, `scenarios.ts`: reproducible derived metrics and guarded hypothetical calculations.
- `src/lib/explorer-metrics.ts`, `geography.ts`: source-aware UI/map adapters.
- `src/components/`: reusable visualisation and research tools; locally owned shadcn-style primitives in `ui/`.
- `src/content/research/`: local MDX articles; metadata/sections in `src/lib/articles.ts` can later come from a CMS.
- `src/app/`: route layouts, pages and metadata.

There is no unnecessary persistence layer. Future election types can extend the shared record schema and source registry; province records retain geography and election-boundary years separately. Unsupported chart types are not offered for datasets that cannot support them.

## Test

```sh
npm run typecheck
npm test
npm run validate:data
npm run test:e2e
```

Unit tests check denominators, gaps, percentage points versus relative percentages, missing values, source verification, historical discrepancies, schema validity, independent registration sums, genuine province geometry, map adapters, safe CSV fields and scenario baselines. Browser tests exercise actual navigation, filters, empty-state transitions, downloads, comparison restoration, scenarios and axe accessibility checks at desktop and mobile widths.

Playwright uses `/usr/bin/chromium` when available. Otherwise run `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_PATH` to an installed browser. Browser tests use port 3001 and an independent `.next-e2e` output directory. `MORA_BUILD_DIR` selects an alternative Next output folder; ordinary development/builds use `.next`.

GitHub Actions runs installation, TypeScript, tests, dataset validation and the production build. Browser accessibility audits are useful evidence but do not constitute a complete WCAG conformance certification.

The [verification record](docs/verification.md) documents the executed checks and mobile homepage Lighthouse audit: performance 91, accessibility 100, best practices 100 and SEO 100.

## Deployment

Deploy to any supported Next.js Node host using the lockfile, `npm ci`, `npm run build`, and `npm run start`. Supply the host's `PORT` if necessary. No deployment has been published automatically. Configure an operator contact and review the policy copy before public launch. Do not run `next dev` and a production build against the same output directory simultaneously.

For Codex cloud tasks, use the existing isolated checkout under `/workspace/Mora-Data-Center-MDC-`; do not create a worktree unless explicitly requested. Dependency files persist in an environment snapshot; running server processes do not. Restart the server and make a functional local request in each new task.
