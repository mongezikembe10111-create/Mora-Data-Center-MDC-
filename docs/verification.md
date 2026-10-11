# Verification record

Validated in the Codex cloud environment on 11 October 2026 using Node.js 24.19.0, the repository's npm lockfile, and system Chromium. The repository was initially empty; this record describes the newly built application, not a public deployment.

## Application checks

- Frozen-lockfile installation: the saved install script installed 569 packages and validated the curated data successfully.
- TypeScript and production compilation: passed. Next.js generated all application routes and the three research article pages.
- Unit suite: 37 tests passed, covering election denominators, missing values, source/schema integrity, registration reconciliations, geography, CSV safety and scenario baselines.
- Browser suite: 12 tests passed across desktop (1280 × 720) and mobile (390 × 844) Chromium. Coverage includes navigation/search, data-to-empty-state chart resets, CSV downloads, comparison URL restoration, scenarios, composition charts and core-route axe checks.
- Production smoke checks: actual lazy chart and map rendering, linked province selection, year changes, source-aware SVG and PNG downloads, male/female accessible composition values and CSV columns, and desktop/mobile overflow checks passed with no application or console errors.
- Earlier route sweep: all 19 public routes returned HTTP 200 and rendered at desktop/mobile widths without horizontal overflow or application errors.

## Mobile homepage Lighthouse

Audit version 13.5.0, Chromium 154, default simulated mobile throttling, production server. Recorded 2026-10-11T21:46:32.881Z. This audit covers the homepage; these scores are not claims about every route or a full WCAG certification.

| Category       | Score |
| -------------- | ----: |
| Performance    |    91 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

First contentful paint: 0.8 s. Largest contentful paint: 2.9 s. Total blocking time: 230 ms. Cumulative layout shift: 0.

Charts use a modular SVG ECharts engine and load near the viewport. The map and its styles load near the viewport, with an accessible SVG fallback. Self-hosted variable fonts are preloaded with adjusted fallbacks. Navigation avoids automatically fetching large analytics routes before they are selected. Motion uses native animations for changing bars and respects reduced-motion preferences.

To reproduce, run `npm run build`, start the production server, and audit it with the installed Lighthouse CLI. Stop any development process using the same output directory before building. Browser tests use a separate `.next-e2e` directory and port 3001.

## Data and launch limits

Five municipal election records and eight verified source records pass validation. The eight published registration age bands and nine province totals each independently reconcile to 29,230,808 registered people on 29 September 2026. Seven user-supplied observations remain unverified and excluded from published statistics.

Eligible-citizen denominators, exact youth 18–35 statistics, youth turnout, municipal/metro/ward series and party performance remain unavailable where compatible official data has not been verified. Original age bands and the 2000/2006/2021 source limitations remain visible. See the methodology page and README for details.

Contact produces an unsent local draft or opens a GitHub issue composer. Configure an operator contact and review policy copy before public launch. The application has not been deployed. Source publication to the user's GitHub repository was explicitly authorized after these checks. The cloud install/start instructions are saved in an environment configuration draft; environment publication and fresh-task restoration have not been tested.
