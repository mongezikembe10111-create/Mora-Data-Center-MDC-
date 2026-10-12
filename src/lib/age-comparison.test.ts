import assert from "node:assert/strict";
import test from "node:test";
import { getAgeComparisonObservation } from "./age-comparison";

test("age comparison uses each observation's matching roll and original age band", () => {
  const current = getAgeComparisonObservation("18–19", "2026")!;
  const historic = getAgeComparisonObservation("18–19", "2016")!;
  assert.equal(current.registered, 693_913);
  assert.equal(current.nationalRegistered, 29_230_808);
  assert.equal(historic.registered, 506_561);
  assert.equal(historic.nationalRegistered, 26_333_353);
  assert.equal(current.shareOfNationalRoll, (693_913 / 29_230_808) * 100);
  assert.equal(historic.shareOfNationalRoll, (506_561 / 26_333_353) * 100);
  assert.equal(current.female + current.male, current.registered);
});

test("age registration comparisons do not infer eligible citizens or participant counts", () => {
  const current = getAgeComparisonObservation("20–29", "2026")!;
  assert.equal(current.record.registered, 4_838_960);
  assert.equal(current.record.eligible, null);
  assert.equal(current.record.voters, null);
  assert.equal(current.record.turnoutDenominator, null);
  assert.equal(current.record.turnout, null);
  assert.equal(getAgeComparisonObservation("18–35", "2026"), null);
  assert.equal(getAgeComparisonObservation("36+", "2016"), null);
});

test("only the verified 2016 source supplies rounded age turnout, without inferred voter counts", () => {
  const historic = getAgeComparisonObservation("18–19", "2016")!;
  assert.equal(historic.publishedTurnout, 71);
  assert.equal(historic.record.turnout, 71);
  assert.equal(historic.record.voters, null);
  assert.equal(historic.record.turnoutDenominator, null);
  assert.match(historic.turnoutNote!, /round|whole|precision/i);
  assert.equal(
    getAgeComparisonObservation("18–19", "2026")!.publishedTurnout,
    null,
  );
});
