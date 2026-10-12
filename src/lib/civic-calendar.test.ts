import test from "node:test";
import assert from "node:assert/strict";
import { civicCalendar } from "./civic-calendar";
import type { CivicNotice } from "./civic-data";

const notice: CivicNotice = {
  id: "calendar-fixture",
  title: "Draft by-law; comment, hearing",
  level: "municipal",
  kind: "comment",
  description: "A calendar test fixture, not a published notice.",
  closesOn: "2026-12-31",
  eventDate: "2027-01-02",
  sourceUrl: "https://example.org/notice",
  verifiedAt: "2026-10-12",
  sourceId: "test",
  instructions: [],
};

test("calendar deadline is an all-day reminder with an exclusive next-day end across years", () => {
  const calendar = civicCalendar(notice, "deadline")!;
  assert.ok(calendar.includes("DTSTART;VALUE=DATE:20261231\r\n"));
  assert.ok(calendar.includes("DTEND;VALUE=DATE:20270101\r\n"));
  assert.ok(
    calendar.replace(/\r\n /g, "").includes("Exact time has not been supplied"),
  );
  assert.ok(!calendar.includes("LOCATION:"));
  assert.ok(!calendar.includes("TZID"));
});

test("unknown or invalid dates do not create a guessed event", () => {
  assert.equal(
    civicCalendar({ ...notice, eventDate: undefined }, "event"),
    null,
  );
  assert.equal(
    civicCalendar({ ...notice, closesOn: "2026-02-31" }, "deadline"),
    null,
  );
  assert.equal(
    civicCalendar({ ...notice, closesAt: "2026-12-31T12:00:00" }, "deadline"),
    null,
  );
});

test("an exact South African cutoff is exported as the same UTC instant, without an invented end time", () => {
  const calendar = civicCalendar(
    {
      ...notice,
      closesAt: "2026-12-31T12:00:00+02:00",
      deadlineTime: "12:00 SAST",
    },
    "deadline",
  )!;
  assert.ok(calendar.includes("DTSTART:20261231T100000Z\r\n"));
  assert.ok(!calendar.includes("DTEND"));
  assert.ok(!calendar.includes("VALUE=DATE"));
});

test("calendar text escapes delimiter and newline injection; folded Unicode lines meet the byte limit", () => {
  const calendar = civicCalendar(
    {
      ...notice,
      title: "é".repeat(100),
      location: "Room 2, Hall; North\nEND:VEVENT",
    },
    "event",
  )!;
  assert.ok(calendar.includes("LOCATION:Room 2\\, Hall\\; North\\nEND:VEVENT"));
  assert.equal(calendar.match(/\r\nEND:VEVENT\r\n/g)?.length, 1);
  for (const line of calendar.split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  const unfolded = calendar.replace(/\r\n /g, "");
  assert.ok(unfolded.includes("é".repeat(100)));
  assert.ok(unfolded.includes("https://example.org/notice"));
});
