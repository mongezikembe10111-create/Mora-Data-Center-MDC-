import assert from "node:assert/strict";
import test from "node:test";
import {
  areTurnoutComparable,
  csvCell,
  effectiveTurnoutElectorate,
  electionMetrics,
  nonVoters,
  participationGap,
  percentageChange,
  percentagePointChange,
  registrationRate,
  turnoutRate,
} from "./analytics";
import {
  currentAgeRegistration,
  currentProvinceRegistration,
  currentRegistrationObservation,
  elections,
  getElection,
  historicAgeRegistration,
  provinceElections,
  referenceObservations,
  sources,
  type ElectionRecord,
} from "./data";
import {
  ageRegistrationRecordSchema,
  electionRecordSchema,
  validateDataset,
  validateProvinceElections,
  validateRegistrationSnapshot,
} from "./schemas";

const syntheticRecord: ElectionRecord = {
  year: 2021,
  label: "Synthetic test fixture",
  type: "municipal",
  eligible: 1_000,
  registered: 800,
  voters: 400,
  validBallots: null,
  turnout: 50,
  sourceId: "fixture",
};

test("registration and turnout use distinct compatible denominators", () => {
  assert.equal(registrationRate(800, 1_000), 80);
  assert.equal(turnoutRate(400, 800), 50);
  assert.equal(electionMetrics(syntheticRecord).participationGapRate, 60);
});

test("unregistered gap and registered nonparticipation are distinct counts", () => {
  assert.equal(nonVoters(800, 400), 400);
  assert.equal(participationGap(1_000, 400), 600);
  const metrics = electionMetrics(syntheticRecord);
  assert.equal(metrics.registrationGap, 200);
  assert.equal(metrics.registeredAbstentionRate, 50);
});

test("missing, zero, nonfinite and incoherent denominators do not create rates", () => {
  for (const denominator of [null, undefined, 0, -1, Infinity, NaN])
    assert.equal(turnoutRate(0, denominator), null);
  assert.equal(turnoutRate(101, 100), null);
  assert.equal(registrationRate(10.5, 100), null);
  assert.equal(
    registrationRate(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1),
    null,
  );
  assert.equal(nonVoters(100, 101), null);
  assert.equal(participationGap(null, 10), null);
  assert.equal(nonVoters(0, 0), 0);
  assert.equal(turnoutRate(0, 100), 0);
});

test("relative percentage change is distinct from percentage-point change", () => {
  assert.equal(percentagePointChange(60, 50), 10);
  assert.equal(percentageChange(60, 50), 20);
  assert.equal(percentagePointChange(45, 60), -15);
  assert.equal(percentageChange(45, 60), -25);
  assert.equal(percentageChange(10, 0), null);
  assert.equal(percentageChange(NaN, 10), null);
  assert.equal(percentagePointChange(101, 50), null);
});

test("all historical records validate and cite verified official sources", () => {
  const validated = validateDataset(elections, sources);
  assert.equal(validated.elections.length, 5);
  assert.deepEqual(
    elections.map((record) => record.year),
    [2000, 2006, 2011, 2016, 2021],
  );
  assert.deepEqual(
    elections.map((record) => record.turnout),
    [48.06, 48.4, 57.6, 57.94, 45.87],
  );
  for (const record of elections)
    assert.ok(
      sources.find((source) => source.id === record.sourceId)?.verified,
    );
});

test("effective turnout denominator preserves MEC7 additions and certified roll separately", () => {
  const election = getElection(2016)!;
  assert.equal(election.registered, 26_333_353);
  assert.equal(election.turnoutDenominator, 26_389_063);
  assert.equal(electionMetrics(election).nonVoters, 11_098_243);
  const derivedTurnout = turnoutRate(
    election.voters,
    election.turnoutDenominator,
  )!;
  assert.ok(Math.abs(derivedTurnout - election.turnout!) < 0.005);
  assert.ok(
    Math.abs(
      turnoutRate(election.voters, election.registered)! - election.turnout!,
    ) > 0.1,
  );
});

test("no participating-person count is inferred from municipal ballot totals or rounded turnout", () => {
  const election = getElection(2006)!;
  assert.equal(election.voters, null);
  assert.equal(election.turnoutDenominator, null);
  assert.equal(election.turnoutBasis, "ballot-pool");
  assert.equal(electionMetrics(election).nonVoters, null);
  assert.equal(electionMetrics(election).registeredAbstentionRate, null);
  assert.equal(getElection(2000)!.turnoutDenominator, null);
  assert.equal(electionMetrics(getElection(2000)!).nonVoters, null);
  for (const record of elections) {
    assert.equal(record.validBallots, null);
    assert.equal(record.eligible, null);
    assert.equal(electionMetrics(record).registrationRate, null);
    assert.equal(electionMetrics(record).participationGap, null);
  }
});

test("2006 published ballot-pool turnout is preserved without creating a person-level rate", () => {
  const election = getElection(2006)!;
  const publishedBallotPoolRatio = (26_938_560 / 55_653_781) * 100;
  assert.ok(Math.abs(publishedBallotPoolRatio - election.turnout!) < 0.005);
  assert.equal(electionMetrics(election).turnoutRate, 48.4);
  assert.equal(effectiveTurnoutElectorate(election), null);
  assert.equal(
    electionRecordSchema.safeParse({
      ...election,
      turnoutDenominator: 21_054_957 + 146_535,
    }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({
      ...election,
      turnoutDenominator: undefined,
    }).success,
    false,
  );
});

test("rate comparisons require compatible person-based turnout definitions", () => {
  assert.equal(
    areTurnoutComparable(getElection(2016)!, getElection(2021)!),
    true,
  );
  assert.equal(
    areTurnoutComparable(getElection(2011)!, getElection(2016)!),
    true,
  );
  assert.equal(
    areTurnoutComparable(getElection(2006)!, getElection(2011)!),
    false,
  );
  assert.equal(
    areTurnoutComparable(getElection(2000)!, getElection(2016)!),
    false,
  );
  assert.equal(
    areTurnoutComparable(syntheticRecord, {
      ...syntheticRecord,
      type: "national",
    }),
    false,
  );
  assert.equal(
    areTurnoutComparable(syntheticRecord, {
      ...syntheticRecord,
      turnout: null,
    }),
    false,
  );
});

test("2021 appendix baseline and narrative discrepancy are preserved", () => {
  const election = getElection(2021)!;
  assert.equal(election.voters, 12_063_709);
  assert.equal(election.turnoutDenominator, 26_303_168);
  assert.match(election.note!, /12,063,886/);
  assert.equal(electionMetrics(election).turnoutRate, 45.87);
});

test("unverified observations cannot be published through a source registry entry", () => {
  assert.ok(
    referenceObservations.every((record) => record.status === "unverified"),
  );
  const unverifiedSources = sources.map((source) => ({
    ...source,
    verified: false,
  }));
  assert.throws(
    () => validateDataset(elections, unverifiedSources),
    /Unverified source/,
  );
  const noData = elections.map((record) => ({
    ...record,
    registered: null,
    voters: null,
    turnout: null,
    turnoutDenominator: null,
  }));
  assert.doesNotThrow(() => validateDataset(noData, unverifiedSources));
});

test("registry integrity rejects missing sources and duplicate records", () => {
  assert.throws(() => validateDataset(elections, []), /Missing source/);
  assert.throws(
    () => validateDataset([...elections, elections[0]], sources),
    /unique/,
  );
  assert.throws(
    () => validateDataset(elections, [...sources, sources[0]]),
    /unique/,
  );
});

test("source retrieval is required before a source is marked verified", () => {
  assert.throws(() =>
    validateDataset(
      elections,
      sources.map((source) => ({ ...source, retrievedAt: null })),
    ),
  );
});

test("schema rejects impossible counts and incompatible reported turnout", () => {
  assert.equal(
    electionRecordSchema.safeParse({ ...syntheticRecord, voters: 900 }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({ ...syntheticRecord, registered: 1_001 })
      .success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({ ...syntheticRecord, turnout: 75 }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({ ...syntheticRecord, turnout: 50.04 })
      .success,
    true,
  );
  assert.equal(
    electionRecordSchema.safeParse({ ...syntheticRecord, voters: -1 }).success,
    false,
  );
});

test("documented roll additions permit voters above the certified roll, within the effective electorate", () => {
  const coherent: ElectionRecord = {
    ...syntheticRecord,
    registered: 100,
    turnoutDenominator: 120,
    voters: 110,
    turnout: (110 / 120) * 100,
  };
  assert.equal(electionRecordSchema.safeParse(coherent).success, true);
  assert.equal(electionMetrics(coherent).nonVoters, 10);
  assert.equal(effectiveTurnoutElectorate(coherent), 120);
  assert.equal(
    electionRecordSchema.safeParse({ ...coherent, voters: 121 }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({
      ...coherent,
      turnoutDenominator: undefined,
    }).success,
    false,
  );
  const unresolved = {
    ...coherent,
    turnoutDenominator: null,
    turnoutBasis: "unreconciled" as const,
  };
  assert.equal(electionRecordSchema.safeParse(unresolved).success, true);
  assert.equal(electionMetrics(unresolved).nonVoters, null);
  assert.equal(electionMetrics(unresolved).registeredAbstentionRate, null);
});

test("national single-ballot counts cannot exceed participating people", () => {
  assert.equal(
    electionRecordSchema.safeParse({
      ...syntheticRecord,
      type: "national",
      validBallots: 401,
    }).success,
    false,
  );
});

test("official registration age and province sums reconcile with the dated national roll", () => {
  const snapshot = validateRegistrationSnapshot(
    currentAgeRegistration,
    currentProvinceRegistration,
    currentRegistrationObservation.registered,
    currentRegistrationObservation.sourceId,
  );
  assert.equal(snapshot.age.length, 8);
  assert.equal(snapshot.province.length, 9);
  assert.equal(currentRegistrationObservation.observedAt, "2026-09-29");
  assert.notEqual(
    currentRegistrationObservation.observedAt,
    currentRegistrationObservation.retrievedAt,
  );
  for (const record of snapshot.age)
    assert.equal(record.registrationRate, null);
});

test("snapshot reconciliation catches edits and mismatched dates", () => {
  const altered = currentProvinceRegistration.map((record, index) => ({
    ...record,
    registered: record.registered + (index === 0 ? 1 : 0),
  }));
  assert.throws(
    () =>
      validateRegistrationSnapshot(
        currentAgeRegistration,
        altered,
        currentRegistrationObservation.registered,
        currentRegistrationObservation.sourceId,
      ),
    /national roll/,
  );
  const wrongDate = currentProvinceRegistration.map((record) => ({
    ...record,
    observedAt: "2025",
  }));
  assert.throws(
    () =>
      validateRegistrationSnapshot(
        currentAgeRegistration,
        wrongDate,
        currentRegistrationObservation.registered,
        currentRegistrationObservation.sourceId,
      ),
    /dates/,
  );
});

test("historical age groups retain original categories and reconcile with the certified roll", () => {
  historicAgeRegistration.forEach((record) =>
    ageRegistrationRecordSchema.parse(record),
  );
  assert.equal(
    historicAgeRegistration.reduce((sum, record) => sum + record.registered, 0),
    getElection(2016)!.registered,
  );
  assert.ok(
    currentAgeRegistration.some((record) => record.ageGroup === "30–39"),
  );
  assert.ok(
    !currentAgeRegistration.some((record) => record.ageGroup === "30–35"),
  );
});

test("2016 province rows validate and reconcile as people, not ballot papers", () => {
  validateProvinceElections(provinceElections, sources);
  assert.equal(provinceElections.length, 9);
  assert.equal(
    provinceElections.reduce((sum, record) => sum + record.registered!, 0),
    getElection(2016)!.registered,
  );
  assert.equal(
    provinceElections.reduce((sum, record) => sum + record.voters!, 0),
    getElection(2016)!.voters,
  );
  assert.ok(provinceElections.every((record) => record.boundaryYear === 2016));
  for (const province of ["Eastern Cape", "Limpopo"]) {
    const record = provinceElections.find(
      (item) => item.province === province,
    )!;
    assert.equal(record.turnoutDenominator, null);
    assert.equal(electionMetrics(record).nonVoters, null);
    assert.ok(electionMetrics(record).turnoutRate !== null);
  }
});

test("regional publishing requires verified provenance and unique geographic records", () => {
  assert.throws(
    () => validateProvinceElections(provinceElections, []),
    /verified source/,
  );
  assert.throws(
    () =>
      validateProvinceElections(
        [...provinceElections, provinceElections[0]],
        sources,
      ),
    /unique/,
  );
});

test("CSV fields escape punctuation, multiline source notes and spreadsheet formulas", () => {
  assert.equal(csvCell("IEC, report"), '"IEC, report"');
  assert.equal(csvCell('A "quoted" source'), '"A ""quoted"" source"');
  assert.equal(csvCell("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(csvCell("line\nbreak"), '"line\nbreak"');
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(0), "0");
});
