import type { ElectionRecord } from "./data";

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

export function electionMetrics(record: ElectionRecord) {
  const gap = participationGap(record.eligible, record.voters);
  const compatibleTurnoutDenominator = effectiveTurnoutElectorate(record);
  return {
    registrationRate: registrationRate(record.registered, record.eligible),
    turnoutRate:
      record.turnout ??
      turnoutRate(record.voters, compatibleTurnoutDenominator),
    nonVoters: nonVoters(compatibleTurnoutDenominator, record.voters),
    participationGap: gap,
    participationGapRate: ratioPercent(gap, record.eligible),
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
