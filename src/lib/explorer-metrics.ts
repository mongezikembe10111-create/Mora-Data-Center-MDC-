import type { ElectionRecord } from "@/lib/data";
import { effectiveTurnoutElectorate, electionMetrics } from "@/lib/analytics";

export const explorerMetrics = {
  registered: {
    label: "Registered voters",
    unit: "people",
    definition:
      "People recorded on the IEC voters' roll at the source reference date. Historical election values use the certified roll; separately reported election-day MEC 7 additions are excluded.",
  },
  turnoutDenominator: {
    label: "Effective turnout electorate",
    unit: "people",
    definition:
      "The official electorate used to calculate election turnout, including separately documented election-day MEC 7 additions where applicable.",
  },
  voters: {
    label: "Participating voters",
    unit: "people",
    definition:
      "People who voted, including voters whose ballot was invalid; distinct from valid ballots.",
  },
  validBallots: {
    label: "Valid ballots",
    unit: "ballots",
    definition:
      "Valid ballots in the documented election contest, excluding invalid or spoiled ballots.",
  },
  turnout: {
    label: "Published turnout",
    unit: "%",
    definition:
      "Published IEC election participation rate. Most reports use participating voters / effective electorate; the 2006 report uses ballot papers / potential ballot papers. These denominator bases are not interchangeable. This is not a percentage of all eligible citizens.",
  },
  eligible: {
    label: "Eligible citizens",
    unit: "people",
    definition:
      "South African citizens eligible to vote; unavailable where a compatible citizenship-and-age denominator has not been verified.",
  },
  registrationRate: {
    label: "Registration rate",
    unit: "%",
    definition:
      "Registered voters divided by eligible citizens, multiplied by 100; calculated only when both compatible counts are available.",
  },
  abstention: {
    label: "Registered voter abstention",
    unit: "%",
    definition:
      "Non-participating people / compatible effective electorate × 100. Calculated only from verified participating-person counts and a reconciled person-level denominator; not from the complement of a ballot-pool rate.",
  },
  nonVoters: {
    label: "Registered non-voters",
    unit: "people",
    definition:
      "The official effective turnout electorate minus participating voters, calculated only when both compatible counts are available.",
  },
} as const;

export type ExplorerMetric = keyof typeof explorerMetrics;
export type ExplorerChartType = "line" | "bar" | "area" | "scatter";

export function isMetric(value: string | null): value is ExplorerMetric {
  return (
    value !== null &&
    Object.prototype.hasOwnProperty.call(explorerMetrics, value)
  );
}

export function effectiveElectorate(record: ElectionRecord): number | null {
  return effectiveTurnoutElectorate(record);
}

export function turnoutBasis(record: ElectionRecord): string {
  return record.turnoutBasis || "effective-electorate";
}

export function metricValue(
  record: ElectionRecord,
  metric: ExplorerMetric,
): number | null {
  if (metric === "registrationRate")
    return electionMetrics(record).registrationRate;
  if (metric === "turnoutDenominator") return effectiveElectorate(record);
  if (metric === "turnout") return electionMetrics(record).turnoutRate;
  if (metric === "abstention")
    return electionMetrics(record).registeredAbstentionRate;
  if (metric === "nonVoters") return electionMetrics(record).nonVoters;
  return record[metric];
}

export function formatMetric(
  value: number | null,
  metric: ExplorerMetric,
): string {
  if (value === null || !Number.isFinite(value)) return "Unavailable";
  return explorerMetrics[metric].unit === "%"
    ? `${value.toFixed(2)}%`
    : new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(
        value,
      );
}

export function csvCell(value: string | number | null | undefined) {
  const text =
    value === null || value === undefined
      ? "Official comparable data unavailable"
      : String(value);
  // A source field should never become an executable formula in spreadsheet software.
  const safe =
    /^[=+@\-\t\r]/.test(text) && typeof value !== "number" ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export const metroOptions = [
  { name: "City of Johannesburg", province: "Gauteng" },
  { name: "City of Tshwane", province: "Gauteng" },
  { name: "City of Ekurhuleni", province: "Gauteng" },
  { name: "City of Cape Town", province: "Western Cape" },
  { name: "eThekwini", province: "KwaZulu-Natal" },
  { name: "Nelson Mandela Bay", province: "Eastern Cape" },
  { name: "Buffalo City", province: "Eastern Cape" },
  { name: "Mangaung", province: "Free State" },
] as const;
