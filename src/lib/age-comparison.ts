import {
  currentAgeRegistration,
  currentRegistrationObservation,
  getElection,
  getSource,
  historicAgeRegistration,
  historicAgeTurnout,
  type AgeRegistrationRecord,
  type ElectionRecord,
} from "./data";
import { ratioPercent } from "./analytics";

export type AgeComparisonYear = "2016" | "2026";
export type AgeComparisonObservation = AgeRegistrationRecord & {
  year: number;
  nationalRegistered: number;
  shareOfNationalRoll: number;
  publishedTurnout: number | null;
  turnoutNote: string | null;
  record: ElectionRecord;
};

/** Published age bands keep their own dated roll denominator and provenance. */
export function getAgeComparisonObservation(
  ageGroup: string,
  year: AgeComparisonYear,
): AgeComparisonObservation | null {
  const data =
    year === "2026" ? currentAgeRegistration : historicAgeRegistration;
  const observation = data.find((row) => row.ageGroup === ageGroup);
  const nationalRegistered =
    year === "2026"
      ? currentRegistrationObservation.registered
      : getElection(2016)?.registered;
  if (
    !observation ||
    !getSource(observation.sourceId)?.verified ||
    nationalRegistered == null
  )
    return null;
  const shareOfNationalRoll = ratioPercent(
    observation.registered,
    nationalRegistered,
  );
  if (shareOfNationalRoll === null) return null;
  const turnoutObservation =
    year === "2016"
      ? historicAgeTurnout.find((row) => row.ageGroup === ageGroup)
      : undefined;
  return {
    ...observation,
    year: Number(year),
    nationalRegistered,
    shareOfNationalRoll,
    publishedTurnout: turnoutObservation?.turnout ?? null,
    turnoutNote: turnoutObservation?.note ?? null,
    record: {
      year: Number(year),
      label: `${observation.ageGroup} · ${observation.observedAt} registration observation`,
      type: "municipal",
      registered: observation.registered,
      voters: null,
      validBallots: null,
      eligible: null,
      turnout: turnoutObservation?.turnout ?? null,
      turnoutDenominator: null,
      sourceId: observation.sourceId,
      note:
        "National registration count in the original published IEC age band. Share divides by the matching dated national voters’ roll; it is not a registration rate among eligible citizens or an age-specific turnout rate. Comparisons across dates describe different cohorts, not individual changes. The published 30–39 band is not split into an exact 18–35 estimate." +
        (turnoutObservation
          ? ` ${turnoutObservation.note}`
          : " Published age-specific turnout is unavailable for the 2026 registration snapshot."),
    },
  };
}
