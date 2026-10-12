import type { CivicNotice } from "./civic-data";

export type CivicNoticeStatus =
  "open" | "upcoming" | "closed" | "undated" | "past-event" | "published";

/** Civil date in South Africa: browser timezone cannot alter deadline status. */
export function southAfricaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

export function noticeStatus(
  notice: CivicNotice,
  today = southAfricaDate(),
  now = new Date(),
): CivicNoticeStatus {
  if (notice.closesOn) {
    if (today > notice.closesOn) return "closed";
    if (notice.opensOn && today < notice.opensOn) return "upcoming";
    if (
      notice.closesAt &&
      today === southAfricaDate(now) &&
      now.getTime() > Date.parse(notice.closesAt)
    )
      return "closed";
    return "open";
  }
  if (notice.eventDate)
    return today > notice.eventDate ? "past-event" : "upcoming";
  if (notice.kind === "bill" || notice.kind === "report") return "published";
  return "undated";
}

export function formatCivicDate(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(`${date}T12:00:00+02:00`));
}
