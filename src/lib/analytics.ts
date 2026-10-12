import type { AgeRegistrationRecord, ElectionRecord } from "./data";

export type NullableNumber = number | null | undefined;

function isCount(value: NullableNumber): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRate(value: NullableNumber): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

/** Counts must describe the same reference period, population and geography. */
export function ratioPercent(
  numerator: NullableNumber,
  denominator: NullableNumber,
): number | null {
  if (
    !isCount(numerator) ||
    !isCount(denominator) ||
    denominator === 0 ||
    numerator > denominator
  )
    return null;
  return (numerator / denominator) * 100;
}

export function registrationRate(
  registered: NullableNumber,
  eligible: NullableNumber,
): number | null {
  return ratioPercent(registered, eligible);
}

export function turnoutRate(
  voters: NullableNumber,
  registered: NullableNumber,
): number | null {
  return ratioPercent(voters, registered);
}

export function nonVoters(
  registered: NullableNumber,
  voters: NullableNumber,
): number | null {
  if (!isCount(registered) || !isCount(voters) || voters > registered)
    return null;
  return registered - voters;
}

/** Eligible citizens who did not participate, including unregistered citizens. */
export function participationGap(
  eligible: NullableNumber,
  voters: NullableNumber,
): number | null {
  if (!isCount(eligible) || !isCount(voters) || voters > eligible) return null;
  return eligible - voters;
}

/** Logical bounds only: the unpublished 30–35 subset is never estimated. */
export function youthRegistrationBounds(
  records: Pick<
    AgeRegistrationRecord,
    "ageGroup" | "registered" | "observedAt" | "sourceId"
  >[],
) {
  const groups = ["18–19", "20–29", "30–39"];
  const required = groups.map((group) =>
    records.filter((record) => record.ageGroup === group),
  );
  if (required.some((matches) => matches.length !== 1)) return null;
  const bands = required.map(([record]) => record);
  if (
    bands.some((record) => !isCount(record.registered)) ||
    new Set(bands.map((record) => record.observedAt)).size !== 1 ||
    new Set(bands.map((record) => record.sourceId)).size !== 1
  )
    return null;
  const lower = bands[0].registered + bands[1].registered;
  const upper = lower + bands[2].registered;
  if (!isCount(lower) || !isCount(upper)) return null;
  return {
    lower,
    upper,
    exact: bands[2].registered === 0,
    sourceId: bands[0].sourceId,
    observedAt: bands[0].observedAt,
    note: "Logical bounds for registered people aged 18–35: all registered 18–29 year olds form the lower bound; adding the entire published 30–39 band forms the upper bound. The unpublished 30–35 subset could lie anywhere within that band's total. These bounds are not a point estimate or statistical confidence interval, do not establish eligible-citizen registration or electoral participation rates, and cannot establish a trend across overlapping intervals.",
  };
}

/** Relative change, expressed as a percentage of the previous value. */
export function percentageChange(
  current: NullableNumber,
  previous: NullableNumber,
): number | null {
  if (
    typeof current !== "number" ||
    typeof previous !== "number" ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    current < 0 ||
    previous <= 0
  )
    return null;
  return ((current - previous) / previous) * 100;
}

/** Difference between two rates expressed on a 0–100 percentage scale. */
export function percentagePointChange(
  current: NullableNumber,
  previous: NullableNumber,
): number | null {
  if (!isRate(current) || !isRate(previous)) return null;
  return current - previous;
}

/** Published ballot-pool and unreconciled rates cannot support a person-rate change. */
export function areTurnoutComparable(
  a: ElectionRecord,
  b: ElectionRecord,
): boolean {
  return (
    a.type === b.type &&
    (a.turnoutBasis ?? "effective-electorate") === "effective-electorate" &&
    (b.turnoutBasis ?? "effective-electorate") === "effective-electorate" &&
    isRate(a.turnout) &&
    isRate(b.turnout)
  );
}

export function effectiveTurnoutElectorate(
  record: ElectionRecord,
): number | null {
  if (
    (record.turnoutBasis ?? "effective-electorate") !== "effective-electorate"
  )
    return null;
  const denominator =
    record.turnoutDenominator === undefined
      ? record.registered
      : record.turnoutDenominator;
  return isCount(denominator) ? denominator : null;
}

export type ParticipationBasis = "electorate" | "voting-age" | "eligible";

/**
 * A count partition with an explicit population basis. A voting-age estimate is
 * never promoted to a count of eligible citizens. MEC7 additions belong to the
 * effective electorate rather than the outside-electorate segment.
 */
export function participationBreakdown(
  record: ElectionRecord,
  basis: ParticipationBasis = "electorate",
) {
  const effective = effectiveTurnoutElectorate(record);
  const comparison = record.participationComparisonDenominator;
  const usesCertifiedComparison =
    effective === null &&
    isCount(comparison) &&
    comparison === record.registered;
  const electorate = usesCertifiedComparison ? comparison : effective;
  const population =
    basis === "voting-age"
      ? record.votingAgePopulation
      : basis === "eligible"
        ? record.eligible
        : electorate;
  const denominator = isCount(population) ? population : null;
  const coherentPartition =
    denominator !== null &&
    isCount(electorate) &&
    electorate <= denominator &&
    isCount(record.voters) &&
    record.voters <= electorate;
  const totalGap = coherentPartition
    ? nonVoters(denominator, record.voters)
    : null;
  const outsideElectorate = coherentPartition
    ? nonVoters(denominator, electorate)
    : null;
  const electorateGap = coherentPartition
    ? nonVoters(electorate, record.voters)
    : null;
  const caveats = [
    "Nonparticipation counts do not establish why a person did not vote or whether abstention was intentional.",
    ...(usesCertifiedComparison
      ? [
          "This is the certified-roll count minus the published participating-voter count. Source totals differ, so it is a qualified comparison rather than a reconciled operational turnout measure.",
        ]
      : []),
    ...(basis === "voting-age"
      ? [
          record.votingAgePopulationNote ??
            "Estimated voting-age residents are not necessarily legally eligible South African citizens. The population estimate's uncertainty also applies to the derived gap.",
          "Population outside the electorate includes adults who may be ineligible to vote; it must not be described as an exact count of unregistered eligible citizens.",
        ]
      : []),
  ];
  return {
    basis,
    denominator,
    electorate: isCount(electorate) ? electorate : null,
    voters: coherentPartition ? record.voters : null,
    outsideElectorate,
    nonVoters: electorateGap,
    totalGap,
    gapRate: ratioPercent(totalGap, denominator),
    participationRate: coherentPartition
      ? ratioPercent(record.voters, denominator)
      : null,
    denominatorBasis: usesCertifiedComparison
      ? ("certified-roll-comparison" as const)
      : ("effective-electorate" as const),
    estimated: basis === "voting-age",
    qualified: usesCertifiedComparison,
    sourceId:
      basis === "voting-age"
        ? (record.votingAgePopulationSourceId ?? record.sourceId)
        : record.sourceId,
    caveats,
  };
}

export function electionMetrics(record: ElectionRecord) {
  const gap = participationGap(record.eligible, record.voters);
  const compatibleTurnoutDenominator = effectiveTurnoutElectorate(record);
  const electorateBreakdown = participationBreakdown(record, "electorate");
  const votingAgeBreakdown = participationBreakdown(record, "voting-age");
  return {
    registrationRate: registrationRate(record.registered, record.eligible),
    turnoutRate:
      record.turnout ??
      turnoutRate(record.voters, compatibleTurnoutDenominator),
    nonVoters: nonVoters(compatibleTurnoutDenominator, record.voters),
    participationGap: gap,
    participationGapRate: ratioPercent(gap, record.eligible),
    electorateParticipationGap: electorateBreakdown.totalGap,
    electorateParticipationGapRate: electorateBreakdown.gapRate,
    votingAgeRegistrationCoverage: ratioPercent(
      record.registered,
      record.votingAgePopulation,
    ),
    votingAgeParticipationRate: votingAgeBreakdown.participationRate,
    votingAgeParticipationGap: votingAgeBreakdown.totalGap,
    votingAgeParticipationGapRate: votingAgeBreakdown.gapRate,
    votingAgeOutsideElectorate: votingAgeBreakdown.outsideElectorate,
    registrationGap: nonVoters(record.eligible, record.registered),
    registeredAbstentionRate: ratioPercent(
      nonVoters(compatibleTurnoutDenominator, record.voters),
      compatibleTurnoutDenominator,
    ),
  };
}

export function formatCount(value: NullableNumber, compact = false): string {
  if (!isCount(value)) return "Unavailable";
  return new Intl.NumberFormat(
    "en-ZA",
    compact ? { notation: "compact", maximumFractionDigits: 2 } : {},
  ).format(value);
}

export function formatRate(value: NullableNumber, digits = 2): string {
  if (!isRate(value)) return "Unavailable";
  return `${value.toFixed(digits)}%`;
}

/** CSV cells are escaped, including spreadsheet formulas in imported source text. */
export function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const stringValue = String(value);
  const safeValue =
    typeof value === "string" && /^[=+\-@\t\r]/.test(stringValue)
      ? `'${stringValue}`
      : stringValue;
  return /[",\r\n]/.test(safeValue)
    ? `"${safeValue.replace(/"/g, '""')}"`
    : safeValue;
}
