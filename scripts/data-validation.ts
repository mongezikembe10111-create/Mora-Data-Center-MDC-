import {
  currentAgeRegistration,
  currentProvinceRegistration,
  currentRegistrationObservation,
  elections,
  historicAgeRegistration,
  historicAgeTurnout,
  provinceElections,
  referenceObservations,
  sources,
} from "../src/lib/data";
import {
  ageRegistrationRecordSchema,
  ageTurnoutRecordSchema,
  referenceObservationSchema,
  validateDataset,
  validateProvinceElections,
  validateRegistrationSnapshot,
} from "../src/lib/schemas";
import { readFileSync } from "node:fs";

const dataset = validateDataset(elections, sources);
referenceObservations.forEach((observation) =>
  referenceObservationSchema.parse(observation),
);
validateProvinceElections(provinceElections, sources);
historicAgeRegistration.forEach((record) =>
  ageRegistrationRecordSchema.parse(record),
);
historicAgeTurnout.forEach((record) => ageTurnoutRecordSchema.parse(record));
validateRegistrationSnapshot(
  currentAgeRegistration,
  currentProvinceRegistration,
  currentRegistrationObservation.registered,
  currentRegistrationObservation.sourceId,
);
for (const source of dataset.sources.filter((record) => record.verified)) {
  if (!source.evidencePath)
    throw new Error(
      `Verified source ${source.id} is missing local provenance.`,
    );
  const evidence = JSON.parse(readFileSync(source.evidencePath, "utf8"));
  if (
    evidence.originalUrl !== source.url ||
    evidence.retrievedAt !== source.retrievedAt ||
    !/^[a-f0-9]{64}$/.test(evidence.sha256)
  )
    throw new Error(`Invalid local source provenance: ${source.id}`);
}
const verifiedCount = dataset.sources.filter(
  (source) => source.verified,
).length;
console.log(
  `Validated ${dataset.elections.length} municipal election records and ${dataset.sources.length} source records (${verifiedCount} verified).`,
);
console.log(
  `${referenceObservations.length} user-supplied observations remain explicitly unverified and excluded from published statistics.`,
);
console.log(
  `Validated ${currentAgeRegistration.length} official age bands and all ${currentProvinceRegistration.length} provinces; both independently sum to ${currentRegistrationObservation.registered.toLocaleString("en-ZA")} registered voters on ${currentRegistrationObservation.observedAt}.`,
);
if (verifiedCount === 0)
  console.log(
    "Official comparable data unavailable. Source retrieval is required before publishing election statistics.",
  );
