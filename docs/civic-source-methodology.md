# Civic participation sources

The participation snapshot was checked on **12 October 2026, South African time**. It is a curated collection of identifiable public notices, bills, scheduled committee business and reports, plus routes to the relevant public institutions. It does not claim to capture every government update or to update automatically.

## Source evidence

`data/raw/civic-participation-snapshot.json` holds the displayed records, source channels and resources. Each notice has an explicit source identifier and source URL. `data/raw/civic-sources-2026-10-12.json` records successful HTTPS retrievals, SHA-256 hashes, excerpts, observed/retrieval dates and publication dates where independently stated. Publication dates are not inferred from a consultation's opening date. A source's unknown publication date remains null.

Official Parliament notices and statements support parliamentary deadlines and hearing arrangements. PMG supplies independently monitored calls, bill links, committee reports and its own free email-alert instructions. Provincial legislature links cover all nine provinces. Two official legislature sites returned HTTP 503; their records explain the issue and offer checked PMG provincial pages as a fallback. Government websites that could not be retrieved are labelled accordingly. An empty notice collection for a province does not mean that the province has no public participation opportunities.

The Gauteng 2026 appropriation submission advert is an image-only PDF. Its 17 March, 16:00 deadline was transcribed using OCR and checked visually against the rendered page. The introduced Western Cape gambling bill provides bill text, not evidence of an open comment window or its present legislative stage.

## Dates, deadlines and places

Dates are South African civil dates. Exact published cutoff times are stored as ISO timestamps with `+02:00`; status changes after that instant. Where a notice gives only a date, the interface shows that date and explains that an exact cutoff time must be confirmed with the issuer. A published bill with no invitation is labelled as a published record rather than an open consultation.

The app keeps a submission deadline separate from a hearing date. A closed submission window can therefore still have a future hearing. No Zoom joining URL, hearing time, street address or physical venue is invented. Some parliamentary schedules state only a virtual platform or province; the record explicitly tells the reader to confirm arrangements before attending or travelling.

There is a source conflict for the **Second Special Appropriation (2025/26 FY) Bill**. Parliament's calls index lists 16 October at 16:00, while its linked detailed notice and PMG state 6 October at 16:00, with an 8 October hearing. The record follows the detailed notice, remains closed, and displays the conflict. It does not infer an extension.

## Registration and alerts

The IEC registration portal's ownership and address were checked against the IEC's official registration guide. Direct portal availability could not be confirmed in this run. Registration for a particular election closes at proclamation; the existing, separately evidenced 2026 municipal timetable records proclamation on 7 August. A registration link does not promise eligibility to join that election's certified roll after its cutoff.

PMG's alert page explicitly offers free email alerts and requires a PMG account. Users choose the account and alert settings on PMG's site. MORA does not collect an email address, create an account or subscribe anyone automatically.

## Checking for changes

Run a read-only source check with Python 3:

```bash
python scripts/civic-refresh.py --output /tmp/mora-civic-refresh.json
```

To check one source:

```bash
python scripts/civic-refresh.py --source pmg-alerts --output /tmp/mora-civic-refresh.json
```

This produces a review report with retrieval status, current hashes, readable HTML text and links. It **does not modify the published snapshot**. Rotating page content can change hashes without changing a consultation. Review the issuer's actual notice, resolve deadline conflicts, update the curated record and source evidence together, then run:

```bash
npm exec -- tsx --test src/lib/civic.test.ts src/lib/civic-calendar.test.ts
```

The checks cover South African date boundaries, exact timed cutoffs, archived events, source integrity and calendar reminders. Network checks are separate from these repeatable offline tests.

## Municipal consultations and directory

The snapshot now includes 28 civic records and 56 hashed source captures. Five municipal records were checked against primary municipal pages over verified HTTPS: Cape Town’s Ward Committee draft rules, 2027–2032 IDP process plan, Kensington/Factreton/Wingfield spatial framework, and MyCiTi stops in Atlantis/Big Bay, plus Mangaung’s August 2026 financial report. Their closing dates, physical submission addresses and online form links follow the source. No hearing or exact cutoff time is invented. The Ward Committee proposal is labelled draft municipal rules, not a parliamentary bill.

The separate directory covers 257 listed municipalities, with 440 directly verified topic destinations across 168 councils. Website-only fallbacks and retrieval failures remain explicit. A working topic page does not establish that a particular consultation is currently open. Municipal source evidence records the homepage that published each destination.
