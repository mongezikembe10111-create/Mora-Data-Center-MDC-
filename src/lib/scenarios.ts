import { z } from "zod";
const scenarioSchema = z.object({
  eligibleYouth: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  registrationRate: z.number().min(0).max(100),
  youthTurnoutRate: z.number().min(0).max(100),
  overallTurnoutRate: z.number().min(0).max(100),
});
export type ScenarioInputs = z.infer<typeof scenarioSchema>;
/** Fixed illustrative baseline: 10m eligible × 60% registration × 55% turnout. */
export const SCENARIO_BASELINE = 3_300_000;
export function calculateScenario(inputs: ScenarioInputs) {
  const parsed = scenarioSchema.parse(inputs);
  const registered = Math.round(
    (parsed.eligibleYouth * parsed.registrationRate) / 100,
  );
  const participants = Math.round((registered * parsed.youthTurnoutRate) / 100);
  return {
    registered,
    participants,
    changeFromBaseline: participants - SCENARIO_BASELINE,
    eligibleParticipationRate:
      (parsed.registrationRate * parsed.youthTurnoutRate) / 100,
    comparisonParticipants: Math.round(
      (registered * parsed.overallTurnoutRate) / 100,
    ),
  };
}
