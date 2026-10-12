# Verification record

Validated in the Codex cloud environment on **12 October 2026**, using Node.js 24.19.0, the frozen npm lockfile, Next.js 16.4.0 and system Chromium 154. This record covers The Public Square website, including all retained electoral and civic-participation tools. Public hosting remains separate from the verified website builds.

## Application checks

- Frozen-lockfile installation: the saved install script installed 566 packages and validated the curated electoral data successfully.
- TypeScript and production compilation: passed. The build generated 53 artifacts, including 50 public content routes and 28 sourced participation-detail pages.
- Unit suite: **65 tests passed**, covering electoral denominators, participation-gap decomposition, bounded youth counts, age comparisons, source/schema integrity, registration reconciliations, geography, municipal coverage, civic deadlines, calendar exports, CSV safety and scenario baselines.
- Browser suite: **30 tests passed** across desktop (1280 × 720) and mobile (390 × 844) Chromium. Coverage includes navigation/search, source-aware downloads, data/empty-state transitions, comparisons and URL restoration, scenarios, composition charts, civic filters, real timed reminders, unsent drafts, and accessibility. Eight homepage runs verify source-period previews, government-sphere filters, municipality search, keyboard navigation, reduced motion and accessibility. After the decorative hero optimization, the affected accessibility/navigation checks passed again; they explicitly wait for the homepage title after client navigation before scanning it.
- Production route sweep: **all 50 public content routes returned HTTP 200 and contained a main heading**. An unknown participation notice returned HTTP 404.
- Production municipal-directory checks: code/name search, province/type/topic filters, filtered CSV, pagination and empty-state reset passed. No horizontal overflow at 390 px, serious/critical axe violations, or application runtime errors were observed.
- Production map checks: the upgraded MapLibre 6.4.1 canvas rendered with WebGL enabled; the interactive SVG fallback rendered with WebGL disabled. Province selection, 2016 turnout/nonparticipation, unavailable 2021 provincial observations and restoration of the 2026 registration snapshot passed in both modes, with no application runtime errors.
- Production website checks: the municipal bills view shows draft Ward Committee rules while the spatial-development plan retains a proposal-document label. The Public Square homepage, preview tabs, keyboard municipality lookup and complete analytics rendered without runtime errors or failed local requests. Layout checks at 320, 360, 390, 768, 1024 and 1440 px found no horizontal overflow.
- Dependency audit: the complete `npm audit --json` reported **zero known vulnerabilities** after upgrading MapLibre. This describes the audit result at verification time, not a guarantee about future advisories.

## Mobile homepage Lighthouse

Lighthouse 13.5.0, Chromium 154, default simulated mobile throttling, production server. Recorded **2026-10-12T19:44:02.427Z** in a production-only audit after the browser suites finished. These scores cover the homepage and are not claims about every route or complete WCAG conformance.

| Category       | Score |
| -------------- | ----: |
| Performance    |    93 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

First contentful paint: 1.1 s. Largest contentful paint: 3.1 s. Total blocking time: 130 ms. Cumulative layout shift: 0.

Charts use a modular SVG ECharts engine and load near the viewport. The map and its styles also load near the viewport. The editorial homepage renders on the server with lightweight interactive previews, notice filters and municipal search. The decorative brand watermark is a CSS background; the main heading remains immediately visible. Subtle pointer, hover and scroll effects respect reduced motion. Self-hosted variable fonts use adjusted fallbacks. Navigation avoids automatically fetching large analytics routes. Motion respects reduced-motion preferences.

To reproduce, run `npm run build`, start the production server, and audit it with Lighthouse. Stop any development process using the same output directory before building. Browser tests use a separate `.next-e2e` directory and port 3001.

## Verified data and coverage limits

Five municipal election records and eight electoral source records pass validation. The eight original registration age bands and nine province totals independently reconcile to **29,230,808** registered people on 29 September 2026. Seven user-supplied observations remain unverified and excluded from published statistics.

The 2021 observed effective-electorate gap is **14,239,459** people. The source-based adult-population estimate gives a wider gap of **26,510,188**, with explicit decomposition and non-citizen/period limitations. Verified 2016 original age-band turnout rates retain their published whole-percent precision. Exact eligible-citizen denominators, exact 18–35 counts/rates, current youth turnout, municipal/metro/ward electoral series and party performance remain unavailable where compatible official evidence has not been verified. No 2021 population estimate is applied to another year or province.

The civic snapshot contains **28 notices/reports, 21 institutional channels, seven resources and 56 hashed source captures**, checked on 12 October 2026 SAST. National calls, provincial documents, municipal consultations and oversight reports are included. All nine provincial legislatures have source channels. This is a curated snapshot: it does not claim exhaustive or automatically updated government coverage. HTTP 503 results, missing exact times and conflicting deadlines are disclosed. Users confirm changes with the linked issuer.

The municipal directory covers **257 councils**: eight metropolitan, 44 district and 205 local. It contains **440 verified topic destinations across 168 councils**, with published website fallbacks for the other 89. A working destination does not establish that a consultation is currently open. See [civic source methodology](civic-source-methodology.md).

## Publication and setup

Submission and enquiry helpers create unsent local drafts. PMG subscription and voter registration take place on the respective external sites. The IEC link does not promise that registrations after the 7 August proclamation qualify for the 4 November 2026 municipal election.

A separate static-export build generated all 53 outputs and was served using the exact `/Mora-Data-Center-MDC-/` project prefix. Eight route/asset requests, the logo, client navigation, EC104 → Makana lookup, Enter submission, the WebGL map and province selection passed with no runtime errors or failed local requests. The GitHub Pages workflow is prepared. Its administration API was blocked by current cloud network access, so Pages enablement and a verified public deployment remain outstanding. See [publish-website.md](publish-website.md). Configure an operator contact and review policy copy before public launch. Publishing the source to the user's GitHub repository is authorized. Cloud installation/start instructions are saved in the environment draft; publication and fresh-task restoration remain separate from this instance's verified setup. [START-HERE-WINDOWS.txt](../START-HERE-WINDOWS.txt) explains how to install and run the downloaded update on a PC.

[Desktop and phone design previews](website-preview.md) were captured from the verified production website. The new name, palette, faceted Africa/speech mark and typography follow the supplied Public Square identity.
