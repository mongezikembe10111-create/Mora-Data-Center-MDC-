import test from "node:test";
import assert from "node:assert/strict";
import type { ElectionRecord } from "./data";
import { getElection } from "./data";
import { csvCell, metricValue } from "./explorer-metrics";

const fixture: ElectionRecord & { turnoutDenominator: number | null } = {
  year: 2000,
  label: "Calculation fixture",
  type: "municipal",
  registered: 100,
  turnoutDenominator: 120,
  voters: 60,
  validBallots: null,
  eligible: 200,
  turnout: 50,
  sourceId: "test-only",
};

test("turnout and non-voters use the effective electorate while registration uses the certified roll", () => {
  assert.equal(metricValue(fixture, "turnout"), 50);
  assert.equal(metricValue(fixture, "turnoutDenominator"), 120);
  assert.equal(metricValue(fixture, "nonVoters"), 60);
  assert.equal(metricValue(fixture, "registrationRate"), 50);
  assert.equal(metricValue(fixture, "abstention"), 50);
});

test("published turnout can be available while voter counts and population rates remain unavailable", () => {
  const partial = { ...fixture, turnout: 48.4, voters: null, eligible: null };
  assert.equal(metricValue(partial, "turnout"), 48.4);
  assert.equal(metricValue(partial, "nonVoters"), null);
  assert.equal(metricValue(partial, "registrationRate"), null);
  assert.equal(metricValue(partial, "validBallots"), null);
});

test("an explicitly unreconciled turnout denominator remains unavailable", () => {
  const unreconciled = { ...fixture, turnoutDenominator: null };
  assert.equal(metricValue(unreconciled, "turnoutDenominator"), null);
  assert.equal(metricValue(unreconciled, "nonVoters"), null);
  assert.equal(metricValue(unreconciled, "abstention"), null);
  assert.equal(metricValue(unreconciled, "turnout"), 50);
});

test("impossible population relationships do not produce negative non-voters or rates over 100", () => {
  assert.equal(metricValue({ ...fixture, voters: 140 }, "nonVoters"), null);
  assert.equal(
    metricValue({ ...fixture, eligible: 80 }, "registrationRate"),
    null,
  );
});

test("exported CSV identifies missing observations and neutralises source-text spreadsheet formulas", () => {
  assert.equal(csvCell(null), '"Official comparable data unavailable"');
  assert.equal(
    csvCell('=HYPERLINK("malicious")'),
    '"\'=HYPERLINK(""malicious"")"',
  );
  assert.equal(csvCell(-12), '"-12"');
  assert.equal(csvCell('IEC, "report"'), '"IEC, ""report"""');
});

test("explorer exposes distinct electorate and estimated adult-population participation gaps", () => {
  const record = getElection(2021)!;
  assert.equal(metricValue(record, "electorateParticipationGap"), 14_239_459);
  assert.equal(metricValue(record, "votingAgePopulation"), 38_573_897);
  assert.equal(metricValue(record, "votingAgeParticipationGap"), 26_510_188);
  assert.equal(metricValue(record, "votingAgeOutsideElectorate"), 12_270_729);
  assert.equal(metricValue(record, "participationGap"), null);
  assert.equal(metricValue(record, "registrationGap"), null);
  assert.equal(
    metricValue(getElection(2000)!, "electorateParticipationGap"),
    9_593_782,
  );
  assert.equal(metricValue(getElection(2000)!, "nonVoters"), null);
  assert.equal(
    metricValue(getElection(2016)!, "votingAgeParticipationGap"),
    null,
  );
});
