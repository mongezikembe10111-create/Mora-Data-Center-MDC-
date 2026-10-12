import type { CivicNotice } from "./civic-data";

export type CivicCalendarKind = "deadline" | "event";

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** RFC 5545 lines are folded at 75 UTF-8 octets, without splitting a character. */
function foldLine(value: string) {
  const encoder = new TextEncoder();
  let line = "";
  let bytes = 0;
  const lines: string[] = [];
  for (const character of value) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      lines.push(line);
      line = " ";
      bytes = 1;
    }
    line += character;
    bytes += size;
  }
  lines.push(line);
  return lines.join("\r\n");
}

/** Published deadline times retain their instant; unknown hours become all-day reminders. */
export function civicCalendar(
  notice: CivicNotice,
  kind: CivicCalendarKind,
): string | null {
  const date = kind === "deadline" ? notice.closesOn : notice.eventDate;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const next = new Date(`${date}T12:00:00Z`);
  if (
    !Number.isFinite(next.getTime()) ||
    next.toISOString().slice(0, 10) !== date
  )
    return null;
  next.setUTCDate(next.getUTCDate() + 1);
  const preciseDeadline =
    kind === "deadline" && notice.closesAt ? new Date(notice.closesAt) : null;
  if (
    preciseDeadline &&
    (!Number.isFinite(preciseDeadline.getTime()) ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(notice.closesAt!))
  )
    return null;
  const description = [
    notice.description,
    kind === "deadline"
      ? preciseDeadline
        ? "Submission deadline at the time stated in the source. Confirm the current notice before acting."
        : "Submission deadline day. Confirm the exact cutoff time in the official notice."
      : "Event day reminder. Confirm the time and access arrangements in the official notice.",
    (kind === "deadline" ? notice.deadlineTime : notice.time)
      ? `Source time: ${kind === "deadline" ? notice.deadlineTime : notice.time}`
      : "Exact time has not been supplied in this record.",
    notice.dateNote || "",
    `Source: ${notice.sourceUrl}`,
    `Record verified: ${notice.verifiedAt}. Dates may change; check the issuing authority before acting.`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MORA Data Centre//Public participation reminders//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${notice.id}-${kind}@mora-data-centre.local`,
    `DTSTAMP:${notice.verifiedAt.replaceAll("-", "")}T000000Z`,
    ...(preciseDeadline
      ? [
          `DTSTART:${preciseDeadline.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
        ]
      : [
          `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`,
          `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll("-", "")}`,
        ]),
    `SUMMARY:${escapeCalendarText(`${kind === "deadline" ? "Submission deadline" : "Public participation"}: ${notice.title}`)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    ...(notice.location
      ? [`LOCATION:${escapeCalendarText(notice.location)}`]
      : []),
    `URL:${notice.sourceUrl}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
