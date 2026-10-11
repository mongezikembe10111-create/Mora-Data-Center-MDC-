import test from "node:test";
import assert from "node:assert/strict";
import { calculateScenario, SCENARIO_BASELINE } from "./scenarios";
const baseline = {
  eligibleYouth: 10_000_000,
  registrationRate: 60,
  youthTurnoutRate: 55,
  overallTurnoutRate: 60,
};
test("illustrative baseline uses sequential denominators, not turnout of all eligible citizens", () => {
  const result = calculateScenario(baseline);
  assert.equal(result.registered, 6_000_000);
  assert.equal(result.participants, 3_300_000);
  assert.equal(result.eligibleParticipationRate, 33);
  assert.equal(result.changeFromBaseline, 0);
});
test("changing the population preserves the fixed baseline described by the interface", () => {
  const result = calculateScenario({ ...baseline, eligibleYouth: 20_000_000 });
  assert.equal(result.participants, SCENARIO_BASELINE * 2);
  assert.equal(result.changeFromBaseline, SCENARIO_BASELINE);
});
test("zero registration and turnout remain valid assumptions without impossible counts", () => {
  assert.equal(
    calculateScenario({ ...baseline, registrationRate: 0 }).participants,
    0,
  );
  assert.equal(
    calculateScenario({ ...baseline, youthTurnoutRate: 0 }).participants,
    0,
  );
  assert.equal(
    calculateScenario({ ...baseline, youthTurnoutRate: 100 }).participants,
    6_000_000,
  );
  assert.throws(() =>
    calculateScenario({ ...baseline, registrationRate: 101 }),
  );
});
