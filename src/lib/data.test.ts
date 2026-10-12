import assert from "node:assert/strict";
import test from "node:test";
import {
  areTurnoutComparable,
  csvCell,
  effectiveTurnoutElectorate,
  electionMetrics,
  nonVoters,
  participationGap,
  participationBreakdown,
  percentageChange,
  percentagePointChange,
  registrationRate,
  turnoutRate,
  youthRegistrationBounds,
} from "./analytics";
import {
  currentAgeRegistration,
  currentProvinceRegistration,
  currentRegistrationObservation,
  elections,
  getElection,
  historicAgeRegistration,
  historicAgeTurnout,
  provinceElections,
  referenceObservations,
  sources,
  type ElectionRecord,
} from "./data";
import {
  ageRegistrationRecordSchema,
  ageTurnoutRecordSchema,
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
    participationComparisonDenominator: null,
    votingAgePopulation: null,
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

test("2016 age turnout preserves original whole-percent published rates without inventing counts", () => {
  assert.deepEqual(
    historicAgeTurnout.map((row) => row.turnout),
    [71, 50, 50, 59, 69, 73, 67, 46],
  );
  assert.deepEqual(
    historicAgeTurnout.map((row) => row.ageGroup),
    historicAgeRegistration.map((row) => row.ageGroup),
  );
  for (const row of historicAgeTurnout) {
    ageTurnoutRecordSchema.parse(row);
    assert.equal(row.observedAt, "2016-08-03");
    assert.equal(row.precision, "whole-percent");
    assert.ok(sources.find((source) => source.id === row.sourceId)?.verified);
    assert.match(row.note, /printed page 75 \(PDF page 45/);
    assert.equal("voters" in row, false);
  }
});

test("18–35 youth registration bounds preserve the unknown portion of the 30–39 band", () => {
  const current = youthRegistrationBounds(currentAgeRegistration)!;
  assert.equal(current.lower, 5_532_873);
  assert.equal(current.upper, 12_308_457);
  assert.equal(current.exact, false);
  assert.equal(current.observedAt, "2026-09-29");
  assert.equal(current.sourceId, currentRegistrationObservation.sourceId);
  const historical = youthRegistrationBounds(historicAgeRegistration)!;
  assert.equal(historical.lower, 6_283_160);
  assert.equal(historical.upper, 12_718_495);
  assert.match(
    current.note,
    /not a point estimate or statistical confidence interval/,
  );
  assert.match(current.note, /overlapping intervals/);
});

test("youth bounds require all three distinct compatible bands and safe published counts", () => {
  assert.equal(
    youthRegistrationBounds(
      currentAgeRegistration.filter((row) => row.ageGroup !== "30–39"),
    ),
    null,
  );
  assert.equal(
    youthRegistrationBounds([
      ...currentAgeRegistration,
      currentAgeRegistration[0],
    ]),
    null,
  );
  const wrongDate = currentAgeRegistration.map((row, index) => ({
    ...row,
    observedAt: index === 0 ? "2016" : row.observedAt,
  }));
  assert.equal(youthRegistrationBounds(wrongDate), null);
  const wrongSource = currentAgeRegistration.map((row, index) => ({
    ...row,
    sourceId: index === 0 ? "other" : row.sourceId,
  }));
  assert.equal(youthRegistrationBounds(wrongSource), null);
  const impossible = currentAgeRegistration.map((row, index) => ({
    ...row,
    registered: index === 0 ? Number.MAX_SAFE_INTEGER : row.registered,
  }));
  assert.equal(youthRegistrationBounds(impossible), null);
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

test("electorate participation gap is observed even without an eligible-citizen denominator", () => {
  const record = getElection(2021)!;
  const breakdown = participationBreakdown(record);
  assert.equal(breakdown.denominator, 26_303_168);
  assert.equal(breakdown.totalGap, 14_239_459);
  assert.equal(breakdown.outsideElectorate, 0);
  assert.equal(breakdown.nonVoters, 14_239_459);
  assert.equal(breakdown.estimated, false);
  assert.equal(breakdown.qualified, false);
  assert.equal(electionMetrics(record).participationGap, null);
  assert.equal(electionMetrics(record).electorateParticipationGap, 14_239_459);
});

test("2021 adult-population estimate decomposes without promoting residents to eligible citizens", () => {
  const record = getElection(2021)!;
  const breakdown = participationBreakdown(record, "voting-age");
  assert.equal(record.votingAgePopulation, 38_573_897);
  assert.equal(record.eligible, null);
  assert.equal(breakdown.denominator, 38_573_897);
  assert.equal(breakdown.totalGap, 26_510_188);
  assert.equal(breakdown.outsideElectorate, 12_270_729);
  assert.equal(breakdown.nonVoters, 14_239_459);
  assert.equal(breakdown.estimated, true);
  assert.equal(breakdown.sourceId, "iec-municipal-2021");
  assert.equal(
    breakdown.outsideElectorate! + breakdown.nonVoters! + breakdown.voters!,
    breakdown.denominator,
  );
  assert.equal(
    breakdown.totalGap,
    breakdown.outsideElectorate! + breakdown.nonVoters!,
  );
  assert.ok(breakdown.caveats.some((note) => /ineligible/.test(note)));
  assert.ok(Math.abs(breakdown.participationRate! - 31.27429) < 0.0001);
  assert.ok(
    Math.abs(
      electionMetrics(record).votingAgeRegistrationCoverage! - 67.93345,
    ) < 0.0001,
  );
  assert.equal(electionMetrics(record).registrationRate, null);
  assert.equal(participationBreakdown(record, "eligible").totalGap, null);
});

test("2000 certified-roll gap is available as a qualified count comparison with unresolved turnout intact", () => {
  const record = getElection(2000)!;
  const breakdown = participationBreakdown(record);
  assert.equal(breakdown.totalGap, 9_593_782);
  assert.equal(breakdown.denominator, 18_476_516);
  assert.equal(breakdown.qualified, true);
  assert.equal(breakdown.denominatorBasis, "certified-roll-comparison");
  assert.equal(breakdown.estimated, false);
  assert.equal(effectiveTurnoutElectorate(record), null);
  assert.equal(electionMetrics(record).nonVoters, null);
  assert.equal(electionMetrics(record).turnoutRate, 48.06);
  assert.ok(
    breakdown.caveats.some((note) => /Source totals differ/.test(note)),
  );
});

test("estimated population partition rejects absent and incompatible denominators", () => {
  assert.equal(
    participationBreakdown(getElection(2016)!, "voting-age").totalGap,
    null,
  );
  assert.equal(participationBreakdown(getElection(2006)!).totalGap, null);
  assert.equal(
    participationBreakdown(
      { ...syntheticRecord, votingAgePopulation: 700 },
      "voting-age",
    ).totalGap,
    null,
  );
  assert.equal(
    participationBreakdown({ ...syntheticRecord, voters: 900 }).totalGap,
    null,
  );
});

test("unreconciled provincial turnout retains a qualified certified-roll count comparison", () => {
  for (const [province, expected] of [
    ["Eastern Cape", 1_449_032],
    ["Limpopo", 1_268_415],
  ] as const) {
    const record = provinceElections.find((row) => row.province === province)!;
    const breakdown = participationBreakdown(record);
    assert.equal(breakdown.totalGap, expected);
    assert.equal(breakdown.qualified, true);
    assert.equal(breakdown.denominatorBasis, "certified-roll-comparison");
    assert.equal(effectiveTurnoutElectorate(record), null);
    assert.equal(electionMetrics(record).nonVoters, null);
    assert.equal(electionRecordSchema.safeParse(record).success, true);
  }
});

test("population-estimate publishing requires dated verified provenance and an explicit limitation", () => {
  const record = getElection(2021)!;
  assert.equal(
    electionRecordSchema.safeParse({
      ...record,
      votingAgePopulationNote: undefined,
    }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({
      ...record,
      votingAgePopulationSourceId: undefined,
    }).success,
    false,
  );
  assert.equal(
    electionRecordSchema.safeParse({
      ...record,
      votingAgePopulation: 20_000_000,
    }).success,
    false,
  );
  assert.throws(
    () =>
      validateDataset(
        [{ ...record, votingAgePopulationSourceId: "missing" }],
        sources,
      ),
    /Voting-age population estimate requires a verified source/,
  );
  assert.throws(
    () =>
      validateDataset(
        [{ ...record, votingAgePopulationSourceId: "iec-municipal-2016" }],
        sources,
      ),
    /estimate and election years must agree/,
  );
});
