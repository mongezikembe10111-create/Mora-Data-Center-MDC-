import assert from "node:assert/strict";
import test from "node:test";
import { noticeStatus, southAfricaDate } from "./civic";
import {
  civicChannels,
  civicNotices,
  civicResources,
  civicSources,
  type CivicNotice,
} from "./civic-data";
import { z } from "zod";

const notice: CivicNotice = {
  id: "test",
  title: "Test consultation",
  description: "Fixture",
  level: "national",
  kind: "comment",
  sourceUrl: "https://www.parliament.gov.za/",
  verifiedAt: "2026-10-12",
  sourceId: "fixture",
  instructions: [],
};

test("civic deadlines close after their South African civil day, never at UTC midnight", () => {
  const deadline = { ...notice, opensOn: "2026-10-01", closesOn: "2026-10-12" };
  assert.equal(noticeStatus(deadline, "2026-09-30"), "upcoming");
  assert.equal(noticeStatus(deadline, "2026-10-12"), "open");
  assert.equal(noticeStatus(deadline, "2026-10-13"), "closed");
  assert.equal(southAfricaDate(new Date("2026-10-11T22:01:00Z")), "2026-10-12");
});

test("a published time deadline closes at its exact SAST instant", () => {
  const deadline = {
    ...notice,
    closesOn: "2026-10-12",
    closesAt: "2026-10-12T12:00:00+02:00",
  };
  assert.equal(
    noticeStatus(deadline, "2026-10-12", new Date("2026-10-12T09:59:59Z")),
    "open",
  );
  assert.equal(
    noticeStatus(deadline, "2026-10-12", new Date("2026-10-12T10:00:01Z")),
    "closed",
  );
});

test("a published bill is never mistaken for an open invitation", () => {
  assert.equal(noticeStatus({ ...notice, kind: "bill" }), "published");
  assert.equal(noticeStatus(notice), "undated");
  assert.equal(
    noticeStatus(
      { ...notice, kind: "hearing", eventDate: "2026-10-11" },
      "2026-10-12",
    ),
    "past-event",
  );
});

test("every imported notice has verified provenance, valid dates and a public source", () => {
  const date = z.iso.date();
  const schema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    level: z.enum(["national", "provincial", "municipal"]),
    kind: z.enum(["bill", "hearing", "comment", "meeting", "report"]),
    sourceId: z.string().min(1),
    sourceUrl: z.url(),
    verifiedAt: date,
    publicationDate: date.optional(),
    opensOn: date.optional(),
    closesOn: date.optional(),
    eventDate: date.optional(),
    closesAt: z.iso.datetime({ offset: true }).optional(),
    instructions: z.array(z.string()).min(1),
  });
  assert.equal(
    new Set(civicNotices.map((record) => record.id)).size,
    civicNotices.length,
  );
  for (const record of civicNotices) {
    schema.parse(record);
    const source = civicSources.find((entry) => entry.id === record.sourceId);
    assert.ok(source, `Missing source: ${record.id}`);
    assert.equal(source.httpStatus, 200);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.equal(source.url, record.sourceUrl);
    if (record.opensOn && record.closesOn)
      assert.ok(record.opensOn <= record.closesOn);
    if (record.closesAt) {
      assert.match(record.closesAt, /\+02:00$/);
      assert.equal(record.closesAt.slice(0, 10), record.closesOn);
      assert.ok(record.deadlineTime);
    }
    if (record.kind === "bill" && !record.closesOn && !record.eventDate)
      assert.ok(
        record.dateNote,
        "Bill text alone needs a public-call limitation",
      );
  }
});

test("all nine provincial legislature channels and free PMG/IEC resources are present", () => {
  const provincial = civicChannels.filter((record) =>
    record.id.endsWith("-legislature"),
  );
  assert.equal(new Set(provincial.map((record) => record.province)).size, 9);
  assert.equal(
    civicResources.find((record) => record.id === "pmg-free-alerts")?.url,
    "https://pmg.org.za/email-alerts/",
  );
  assert.equal(
    civicResources.find((record) => record.id === "iec-register")?.url,
    "https://registertovote.elections.org.za/",
  );
});

test("known parliamentary cutoffs and incompatible source dates remain explicit", () => {
  const finance = civicNotices.find(
    (record) => record.id === "general-finance-laws-2026",
  )!;
  assert.equal(
    noticeStatus(finance, "2026-10-12", new Date("2026-10-12T11:00:00Z")),
    "closed",
  );
  assert.equal(finance.eventDate, "2026-10-13");
  const conflict = civicNotices.find(
    (record) => record.id === "second-special-appropriation-2026",
  )!;
  assert.equal(conflict.closesOn, "2026-10-06");
  assert.match(conflict.dateNote!, /conflict/i);
  assert.equal(noticeStatus(conflict, "2026-10-12"), "closed");
});

test("parliamentary submission drafts include every named committee recipient", () => {
  const finance = civicNotices.find(
    (record) => record.id === "general-finance-laws-2026",
  )!;
  assert.equal(
    finance.actionUrl,
    "mailto:awicomb@parliament.gov.za,lntinzi@parliament.gov.za",
  );
  const fiscal = civicNotices.find(
    (record) => record.id === "fiscal-framework-2026",
  )!;
  assert.equal(
    fiscal.actionUrl,
    "mailto:awicomb@parliament.gov.za,lntinzi@parliament.gov.za,nmangweni@parliament.gov.za",
  );
});
