/**
 * Read-only municipal link check. Run:
 *   npx tsx scripts/check-municipal-links.ts
 * Optional JSON report:
 *   npx tsx scripts/check-municipal-links.ts /tmp/mora-municipal-link-check.json
 *
 * Uses only source-published URLs from the reviewed snapshot. It never submits
 * forms or publishes data. Reachability does not establish an open consultation.
 */
import { writeFile } from "node:fs/promises";
import { municipalities } from "../src/lib/municipalities";

const destinations = municipalities.flatMap((municipality) => [
  ...(municipality.website
    ? [{ code: municipality.code, kind: "website", url: municipality.website }]
    : []),
  ...municipality.links.map((link) => ({
    code: municipality.code,
    kind: link.topic,
    url: link.url,
  })),
]);
const checkedAt = new Date().toISOString();
const results: {
  code: string;
  kind: string;
  url: string;
  status: number | null;
  finalUrl?: string;
  error?: string;
}[] = [];
for (let offset = 0; offset < destinations.length; offset += 6) {
  const batch = destinations.slice(offset, offset + 6);
  const values = await Promise.all(
    batch.map(async (destination) => {
      try {
        const response = await fetch(destination.url, {
          redirect: "follow",
          signal: AbortSignal.timeout(15_000),
          headers: {
            "User-Agent": "MORA municipal directory link verification",
          },
        });
        await response.body?.cancel();
        return {
          ...destination,
          status: response.status,
          finalUrl: response.url,
        };
      } catch (error) {
        return {
          ...destination,
          status: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
  results.push(...values);
  process.stdout.write(`Checked ${results.length}/${destinations.length}\r`);
}
const successful = results.filter((result) => result.status === 200).length;
console.log(
  `\n${successful}/${results.length} returned HTTP 200. Review errors; a failed request can reflect temporary network conditions.`,
);
if (process.argv[2]) {
  await writeFile(
    process.argv[2],
    JSON.stringify(
      {
        checkedAt,
        note: "A successful response does not establish an open consultation or correct deadline.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Report written to ${process.argv[2]}`);
}
