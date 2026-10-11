import {
  currentProvinceRegistration,
  currentRegistrationObservation,
  getElection,
  getSource,
  provinceElections,
} from "./data";
import { electionMetrics } from "./analytics";

export const REGISTRATION_MAP_YEAR = Number(
  currentRegistrationObservation.observedAt.slice(0, 4),
);
export const REGISTRATION_MAP_DATE = currentRegistrationObservation.observedAt;
export const UNAVAILABLE_MAP_COLOR = "#34384c";

/** Integer intervals are left-inclusive and right-exclusive. */
export const registrationMapIntervals = [
  { min: 0, max: 1_000_000, color: "#36364f", label: "0–999,999" },
  {
    min: 1_000_000,
    max: 2_000_000,
    color: "#514777",
    label: "1,000,000–1,999,999",
  },
  {
    min: 2_000_000,
    max: 3_000_000,
    color: "#7562a8",
    label: "2,000,000–2,999,999",
  },
  {
    min: 3_000_000,
    max: 5_000_000,
    color: "#9c7fd3",
    label: "3,000,000–4,999,999",
  },
  { min: 5_000_000, max: null, color: "#c6a3f1", label: "5,000,000 or more" },
] as const;

export const turnoutMapIntervals = [
  { min: 0, max: 50, color: "#36364f", label: "0%–<50%" },
  { min: 50, max: 55, color: "#514777", label: "50%–<55%" },
  { min: 55, max: 60, color: "#7562a8", label: "55%–<60%" },
  { min: 60, max: 65, color: "#9c7fd3", label: "60%–<65%" },
  { min: 65, max: null, color: "#c6a3f1", label: "65%–100%" },
] as const;

export const nonparticipationMapIntervals = [
  { min: 0, max: 500_000, color: "#36364f", label: "0–499,999" },
  { min: 500_000, max: 1_000_000, color: "#514777", label: "500,000–999,999" },
  {
    min: 1_000_000,
    max: 1_500_000,
    color: "#7562a8",
    label: "1,000,000–1,499,999",
  },
  {
    min: 1_500_000,
    max: 2_000_000,
    color: "#9c7fd3",
    label: "1,500,000–1,999,999",
  },
  { min: 2_000_000, max: null, color: "#c6a3f1", label: "2,000,000 or more" },
] as const;

export function getMapIntervals(metric: string) {
  return metric === "turnout"
    ? turnoutMapIntervals
    : metric === "nonparticipation"
      ? nonparticipationMapIntervals
      : registrationMapIntervals;
}

export function electoralMapColor(
  value: number | null,
  metric: string,
): string {
  if (
    value === null ||
    !Number.isFinite(value) ||
    value < 0 ||
    (metric === "turnout" && value > 100)
  )
    return UNAVAILABLE_MAP_COLOR;
  return (
    getMapIntervals(metric).find(
      (interval) =>
        value >= interval.min &&
        (interval.max === null || value < interval.max),
    )?.color ?? UNAVAILABLE_MAP_COLOR
  );
}

export function registrationMapColor(registered: number | null): string {
  return electoralMapColor(registered, "registration");
}

/** Snapshot values never stand in for historical election rolls or other measures. */
export function getRegistrationMapObservation(
  province: string,
  year: number,
  metric: string,
) {
  if (metric !== "registration" || year !== REGISTRATION_MAP_YEAR) return null;
  const record = currentProvinceRegistration.find(
    (observation) => observation.province === province,
  );
  if (
    !record ||
    record.observedAt !== REGISTRATION_MAP_DATE ||
    !getSource(record.sourceId)?.verified
  )
    return null;
  return {
    ...record,
    shareOfNationalRoll:
      currentRegistrationObservation.registered > 0
        ? (record.registered / currentRegistrationObservation.registered) * 100
        : null,
  };
}

export type ElectoralMapObservation = {
  province: string;
  value: number;
  unit: "people" | "percent";
  label: string;
  observedAt: string;
  sourceId: string;
  kind: "snapshot" | "election";
  registered: number;
  voters: number | null;
  turnoutDenominator: number | null;
  shareOfNationalRoll: number | null;
  note: string;
};

export function getElectoralMapObservation(
  province: string,
  year: number,
  metric: string,
): ElectoralMapObservation | null {
  const snapshot = getRegistrationMapObservation(province, year, metric);
  if (snapshot)
    return {
      province,
      value: snapshot.registered,
      unit: "people",
      label: "Registered voters",
      observedAt: snapshot.observedAt,
      sourceId: snapshot.sourceId,
      kind: "snapshot",
      registered: snapshot.registered,
      voters: null,
      turnoutDenominator: null,
      shareOfNationalRoll: snapshot.shareOfNationalRoll,
      note: "Share of the national roll is not an eligible-population registration rate. Registration does not establish voting participation.",
    };
  if (!["registration", "turnout", "nonparticipation"].includes(metric))
    return null;
  const record = provinceElections.find(
    (observation) =>
      observation.province === province && observation.year === year,
  );
  if (
    !record ||
    !getSource(record.sourceId)?.verified ||
    record.registered === null
  )
    return null;
  const value =
    metric === "registration"
      ? record.registered
      : metric === "turnout"
        ? record.turnout
        : electionMetrics(record).nonVoters;
  if (value === null) return null;
  const nationalRoll = getElection(year)?.registered;
  return {
    province,
    value,
    unit: metric === "turnout" ? "percent" : "people",
    label:
      metric === "turnout"
        ? "Published turnout"
        : metric === "nonparticipation"
          ? "Did not vote (effective roll)"
          : "Certified registered voters",
    observedAt: String(year),
    sourceId: record.sourceId,
    kind: "election",
    registered: record.registered,
    voters: record.voters,
    turnoutDenominator: record.turnoutDenominator ?? null,
    shareOfNationalRoll: nationalRoll
      ? (record.registered / nationalRoll) * 100
      : null,
    note:
      metric === "nonparticipation"
        ? "Derived from the compatible effective turnout roll, including reported MEC7 additions, minus participating voters. Eastern Cape and Limpopo are unavailable because report roll counts conflict."
        : metric === "turnout"
          ? "Published turnout is retained. A coherent effective-roll denominator is unavailable for Eastern Cape and Limpopo; no replacement denominator is inferred."
          : "Certified rolls are distinct from effective turnout rolls including MEC7 additions. Share of the national certified roll is not an eligible-population rate.",
  };
}
