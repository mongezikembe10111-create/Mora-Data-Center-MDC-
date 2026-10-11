import { z } from "zod";
import type {
  ElectionRecord,
  ProvinceElectionRecord,
  SourceRecord,
} from "./data";

const count = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
  .nullable();
const referenceDate = z
  .string()
  .regex(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/, "Use a year, ISO month, or ISO date");

export const electionRecordSchema = z
  .object({
    year: z.number().int().min(1994).max(2200),
    label: z.string().min(1),
    type: z.enum(["municipal", "national"]),
    registered: count,
    voters: count,
    validBallots: count,
    eligible: count,
    turnout: z.number().min(0).max(100).nullable(),
    turnoutDenominator: count.optional(),
    turnoutBasis: z
      .enum(["effective-electorate", "ballot-pool", "unreconciled"])
      .optional(),
    sourceId: z.string().min(1),
    note: z.string().optional(),
  })
  .superRefine((record, context) => {
    if (
      record.registered !== null &&
      record.eligible !== null &&
      record.registered > record.eligible
    ) {
      context.addIssue({
        code: "custom",
        path: ["registered"],
        message:
          "Registered voters cannot exceed compatible eligible citizens.",
      });
    }
    const denominator =
      record.turnoutDenominator === undefined
        ? record.registered
        : record.turnoutDenominator;
    if (
      record.voters !== null &&
      denominator !== null &&
      record.voters > denominator
    ) {
      context.addIssue({
        code: "custom",
        path: ["voters"],
        message:
          "Participating voters cannot exceed the documented effective electorate.",
      });
    }
    if (
      record.type === "national" &&
      record.validBallots !== null &&
      record.voters !== null &&
      record.validBallots > record.voters
    ) {
      context.addIssue({
        code: "custom",
        path: ["validBallots"],
        message:
          "Single national-ballot valid votes cannot exceed participating voters.",
      });
    }
    if (record.registered === 0 && record.turnout !== null) {
      context.addIssue({
        code: "custom",
        path: ["turnout"],
        message:
          "Turnout has no defined denominator when registered voters are zero.",
      });
    }
    if (
      (record.turnoutBasis === "ballot-pool" ||
        record.turnoutBasis === "unreconciled") &&
      record.turnoutDenominator !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["turnoutDenominator"],
        message:
          "Ballot-pool and unreconciled rates require an explicitly unavailable person-level denominator.",
      });
    }
    if (
      record.registered !== null &&
      denominator !== null &&
      denominator !== undefined &&
      denominator < record.registered
    ) {
      context.addIssue({
        code: "custom",
        path: ["turnoutDenominator"],
        message:
          "Effective turnout denominator cannot be below the certified roll.",
      });
    }
    if (
      record.voters !== null &&
      denominator !== null &&
      denominator !== undefined &&
      denominator > 0 &&
      record.turnout !== null
    ) {
      const calculated = (record.voters / denominator) * 100;
      if (Math.abs(calculated - record.turnout) > 0.051) {
        context.addIssue({
          code: "custom",
          path: ["turnout"],
          message:
            "Published turnout must agree with voter counts, allowing one-decimal rounding.",
        });
      }
    }
  });

export const sourceRecordSchema = z
  .object({
    id: z.string().min(1),
    organisation: z.string().min(1),
    title: z.string().min(1),
    url: z
      .string()
      .url()
      .refine(
        (value) => value.startsWith("https://"),
        "Use an HTTPS original source URL",
      ),
    publishedAt: referenceDate.nullable(),
    observedAt: referenceDate,
    retrievedAt: z
      .string()
      .datetime({ offset: true })
      .or(referenceDate)
      .nullable(),
    coverage: z.string().min(1),
    ageCoverage: z.string().min(1),
    units: z.string().min(1),
    methodology: z.string().min(1),
    limitations: z.array(z.string().min(1)),
    verified: z.boolean(),
    secondaryUrls: z.array(z.string().url()).optional(),
    evidencePath: z.string().optional(),
  })
  .superRefine((source, context) => {
    if (source.verified && source.retrievedAt === null) {
      context.addIssue({
        code: "custom",
        path: ["retrievedAt"],
        message: "Verified sources require a retrieval date.",
      });
    }
  });

export const referenceObservationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  observedAt: referenceDate,
  value: z.number().nonnegative(),
  unit: z.enum(["people", "percent"]),
  qualifier: z.enum(["approximate", "more-than"]),
  status: z.literal("unverified"),
  note: z.string().min(1),
});

const snapshotFields = {
  registered: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  eligible: count,
  registrationRate: z.number().min(0).max(100).nullable(),
  observedAt: referenceDate,
  sourceId: z.string().min(1),
};

export const ageRegistrationRecordSchema = z
  .object({
    ...snapshotFields,
    ageGroup: z.string().min(1),
    male: z.number().int().nonnegative(),
    female: z.number().int().nonnegative(),
  })
  .superRefine((record, context) => {
    if (record.male + record.female !== record.registered)
      context.addIssue({
        code: "custom",
        path: ["registered"],
        message: "Age-band totals must equal the published gender counts.",
      });
    if (record.eligible === null && record.registrationRate !== null)
      context.addIssue({
        code: "custom",
        path: ["registrationRate"],
        message:
          "An eligible-citizen denominator is required for a registration rate.",
      });
  });

export const provinceRegistrationRecordSchema = z.object({
  ...snapshotFields,
  province: z.string().min(1),
});

export function validateRegistrationSnapshot(
  ageRecords: unknown[],
  provinceRecords: unknown[],
  total: number,
  sourceId: string,
) {
  const age = z.array(ageRegistrationRecordSchema).parse(ageRecords);
  const province = z
    .array(provinceRegistrationRecordSchema)
    .parse(provinceRecords);
  if (new Set(age.map((record) => record.ageGroup)).size !== age.length)
    throw new Error("Age bands must be unique.");
  if (
    new Set(province.map((record) => record.province)).size !== province.length
  )
    throw new Error("Provinces must be unique.");
  if (
    new Set([...age, ...province].map((record) => record.observedAt)).size !== 1
  )
    throw new Error("Registration snapshot dates must agree.");
  if ([...age, ...province].some((record) => record.sourceId !== sourceId))
    throw new Error("Registration snapshot sources must agree.");
  if (
    age.reduce((sum, record) => sum + record.registered, 0) !== total ||
    province.reduce((sum, record) => sum + record.registered, 0) !== total
  )
    throw new Error(
      "Age and province totals must independently equal the official national roll.",
    );
  return { age, province };
}

/** A source check prevents unverified leads from entering publishable records. */
export function validateDataset(
  records: ElectionRecord[],
  registry: SourceRecord[],
) {
  const validSources = z.array(sourceRecordSchema).parse(registry);
  const validRecords = z.array(electionRecordSchema).parse(records);
  const sourceMap = new Map(validSources.map((source) => [source.id, source]));
  if (sourceMap.size !== validSources.length)
    throw new Error("Source IDs must be unique.");
  if (
    new Set(validRecords.map((record) => `${record.type}:${record.year}`))
      .size !== validRecords.length
  )
    throw new Error("Election type/year records must be unique.");
  for (const record of validRecords) {
    const source = sourceMap.get(record.sourceId);
    if (!source)
      throw new Error(`Missing source registry entry: ${record.sourceId}`);
    const containsStatistic = [
      record.registered,
      record.voters,
      record.validBallots,
      record.eligible,
      record.turnout,
    ].some((value) => value !== null);
    if (containsStatistic && !source.verified)
      throw new Error(
        `Unverified source ${source.id} cannot publish election statistics.`,
      );
  }
  return { elections: validRecords, sources: validSources };
}

export function validateProvinceElections(
  records: ProvinceElectionRecord[],
  registry: SourceRecord[],
) {
  const regionSchema = electionRecordSchema.and(
    z.object({ province: z.string().min(1), boundaryYear: z.number().int() }),
  );
  const validRecords = z.array(regionSchema).parse(records);
  const sourceMap = new Map(
    z
      .array(sourceRecordSchema)
      .parse(registry)
      .map((source) => [source.id, source]),
  );
  if (
    new Set(
      validRecords.map(
        (record) => `${record.type}:${record.year}:${record.province}`,
      ),
    ).size !== validRecords.length
  )
    throw new Error(
      "Regional election type/year/province records must be unique.",
    );
  for (const record of validRecords) {
    if (!sourceMap.get(record.sourceId)?.verified)
      throw new Error(
        `A verified source is required for ${record.province}: ${record.sourceId}`,
      );
  }
  return validRecords;
}
