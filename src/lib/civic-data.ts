import snapshot from "../../data/raw/civic-participation-snapshot.json";

/** Curated public civic records. Dates describe source notices, never a live feed. */
export type CivicLevel = "national" | "provincial" | "municipal";
export type CivicNoticeKind =
  "bill" | "hearing" | "comment" | "meeting" | "report";
export type CivicNotice = {
  id: string;
  title: string;
  level: CivicLevel;
  province?: string;
  kind: CivicNoticeKind;
  proposalType?: "bill" | "draft-bylaw" | "draft-rules" | "policy" | "plan";
  description: string;
  publicationDate?: string;
  opensOn?: string;
  closesOn?: string;
  /** Exact source deadline where published; ISO timestamp includes +02:00. */
  closesAt?: string;
  deadlineTime?: string;
  eventDate?: string;
  time?: string;
  location?: string;
  sourceUrl: string;
  actionUrl?: string;
  contact?: string;
  verifiedAt: string;
  sourceId: string;
  instructions: string[];
  dateNote?: string;
  billUrl?: string;
  committee?: string;
  relatedNoticeId?: string;
};
export type CivicChannel = {
  id: string;
  name: string;
  level: CivicLevel;
  province?: string;
  description: string;
  url: string;
  participationUrl?: string;
  billsUrl?: string;
  reportsUrl?: string;
  verifiedAt: string | null;
  verification: "verified" | "directory-verified" | "unavailable";
  note?: string;
  sourceId?: string;
};
export type CivicResource = {
  id: string;
  title: string;
  description: string;
  url: string;
  kind: "register" | "subscribe" | "guide" | "reports" | "bills";
  organisation: string;
  verifiedAt: string | null;
  note?: string;
  sourceId?: string;
};
export type CivicSource = {
  id: string;
  url: string;
  title: string;
  organisation: string;
  verifiedAt: string;
  publicationDate: string | null;
  observedAt: string;
  httpStatus: number;
  sha256: string;
};
export const civicNotices = snapshot.notices as CivicNotice[];
export const civicChannels = snapshot.channels as CivicChannel[];
export const civicResources = snapshot.resources as CivicResource[];
export const civicSources = snapshot.sources as CivicSource[];
export const civicCoverage = {
  checkedAt: "2026-10-12",
  timezone: "Africa/Johannesburg",
  description:
    "Curated notices checked on 12 October 2026, with national parliamentary calls, sourced provincial bills, municipal consultations, oversight reports and all nine provincial legislature channels. Status follows South African time; verify changes with the issuer.",
  limitations: [
    "This snapshot is not an exhaustive live government feed. A missing notice does not establish that no opportunity exists.",
    "Municipal notice records currently include Cape Town consultations and a Mangaung financial report. The directory covers all 257 municipalities; it does not claim every current local notice has been imported.",
    "Provincial notice records currently cover Gauteng and Western Cape documents; the other provinces are represented by source channels and verified PMG provincial fallbacks.",
    "Gov.za and the KwaZulu-Natal and Limpopo legislature sites returned HTTP 503 during checks. Their current notices could not be imported.",
    "Some notices publish only a date. An exact cutoff time or joining link is shown only when stated in the source.",
    "The Second Special Appropriation call has conflicting index and detailed deadlines; its source note explains why it is recorded as closed.",
  ],
  evidencePath: "data/raw/civic-sources-2026-10-12.json",
};
