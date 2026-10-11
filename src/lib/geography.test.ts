import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type {
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import {
  currentProvinceRegistration,
  currentRegistrationObservation,
  getSource,
  provinceElections,
  provinces,
} from "./data";
import {
  electoralMapColor,
  getElectoralMapObservation,
  getRegistrationMapObservation,
  registrationMapIntervals,
  turnoutMapIntervals,
  UNAVAILABLE_MAP_COLOR,
} from "./geography";

type ProvinceProperties = {
  name: string;
  iso_3166_2: string;
  source: string;
  label_longitude: number;
  label_latitude: number;
};
const geography = JSON.parse(
  readFileSync(
    new URL("../../public/data/provinces.geojson", import.meta.url),
    "utf8",
  ),
) as FeatureCollection<Polygon | MultiPolygon, ProvinceProperties>;
const metadata = JSON.parse(
  readFileSync(
    new URL("../../public/data/boundaries.metadata.json", import.meta.url),
    "utf8",
  ),
);

test("province geometry covers every app filter once, with stable MapLibre feature IDs", () => {
  assert.equal(geography.type, "FeatureCollection");
  assert.equal(geography.features.length, 9);
  const names = geography.features.map((feature) => feature.properties.name);
  assert.equal(
    new Set(names).size,
    9,
    "Repeated province names would hide a province from filters",
  );
  assert.deepEqual(
    [...names].sort(),
    [...provinces].sort(),
    "Every app province must map to a real geometry, with identical spelling",
  );
  const ids = geography.features.map((feature) => feature.id);
  assert.equal(
    new Set(ids).size,
    9,
    "Hover and selection states require unique IDs",
  );
  assert.ok(
    ids.every(
      (id) => typeof id === "number" && Number.isInteger(id) && id >= 0,
    ),
  );
  assert.equal(
    new Set(geography.features.map((feature) => feature.properties.iso_3166_2))
      .size,
    9,
  );
});

test("all province polygons have closed, finite geographic rings and usable local label points", () => {
  let positionCount = 0;
  for (const feature of geography.features) {
    const name = feature.properties.name;
    assert.ok(
      ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
      `${name} has polygon geometry`,
    );
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    assert.ok(polygons.length > 0, `${name} has at least one polygon`);
    for (const polygon of polygons) {
      assert.ok(polygon.length > 0, `${name} has an exterior ring`);
      for (const ring of polygon) {
        assert.ok(ring.length >= 4, `${name} ring has enough positions`);
        assert.deepEqual(ring[0], ring.at(-1), `${name} ring is closed`);
        for (const position of ring as Position[]) {
          assert.equal(position.length, 2);
          assert.ok(
            position.every(Number.isFinite),
            `${name} coordinates are finite`,
          );
          assert.ok(position[0] >= -180 && position[0] <= 180);
          assert.ok(position[1] >= -90 && position[1] <= 90);
          positionCount++;
        }
      }
    }
    assert.ok(Number.isFinite(feature.properties.label_longitude));
    assert.ok(Number.isFinite(feature.properties.label_latitude));
    assert.ok(
      feature.properties.label_longitude >= 16 &&
        feature.properties.label_longitude <= 33,
    );
    assert.ok(
      feature.properties.label_latitude >= -35 &&
        feature.properties.label_latitude <= -22,
    );
  }
  assert.ok(
    positionCount > 1_000,
    "Geography must retain actual source geometry rather than schematic boxes",
  );
});

test("provenance distinguishes source release date from an unknown election boundary vintage", () => {
  assert.equal(metadata.source, "Natural Earth");
  assert.equal(metadata.license, "Public domain");
  assert.equal(metadata.version, "5.1.2");
  assert.equal(metadata.release_date, "2022-05-13");
  assert.equal(metadata.release_year, 2022);
  assert.equal(
    metadata.boundary_year,
    null,
    "Source publication must not be relabeled as a boundary year",
  );
  assert.match(
    metadata.boundary_year_note,
    /not an election-boundary vintage/i,
  );
  assert.match(
    metadata.source_url,
    /\/v5\.1\.2\/geojson\/ne_10m_admin_1_states_provinces\.geojson$/,
  );
  assert.match(metadata.source_sha256, /^[a-f0-9]{64}$/);
  assert.equal(metadata.feature_count, geography.features.length);
  assert.ok(
    metadata.limitations.some((note: string) =>
      /not official IEC electoral boundaries/i.test(note),
    ),
  );
  assert.ok(
    metadata.limitations.some((note: string) =>
      /No historical boundary matching/i.test(note),
    ),
  );
  assert.ok(
    metadata.limitations.some((note: string) =>
      /Prince Edward islands/i.test(note),
    ),
  );
});

test("administrative shapes carry no electoral values that could be mistaken for verified provincial results", () => {
  for (const feature of geography.features) {
    assert.equal(feature.properties.source, "Natural Earth v5.1.2");
    for (const field of [
      "registered",
      "voters",
      "votes",
      "turnout",
      "party",
      "youth",
      "population",
    ]) {
      assert.ok(
        !(field in feature.properties),
        `${feature.properties.name} must not have an inferred ${field}`,
      );
    }
  }
  assert.ok(
    metadata.limitations.some((note: string) =>
      /No provincial electoral measures/i.test(note),
    ),
  );
});

test("registration snapshot maps each verified observation without assigning it to a historical election", () => {
  for (const record of currentProvinceRegistration) {
    const mapped = getElectoralMapObservation(
      record.province,
      2026,
      "registration",
    );
    assert.ok(mapped);
    assert.equal(mapped.value, record.registered);
    assert.equal(mapped.observedAt, "2026-09-29");
    assert.equal(mapped.kind, "snapshot");
    assert.equal(mapped.sourceId, record.sourceId);
    assert.equal(getSource(mapped.sourceId)?.verified, true);
    assert.equal(
      mapped.shareOfNationalRoll,
      (record.registered / currentRegistrationObservation.registered) * 100,
    );
    assert.match(mapped.note, /not an eligible-population registration rate/);
    assert.equal(
      getRegistrationMapObservation(record.province, 2021, "registration"),
      null,
    );
    assert.equal(
      getElectoralMapObservation(record.province, 2021, "registration"),
      null,
    );
    assert.equal(
      getElectoralMapObservation(record.province, 2026, "turnout"),
      null,
    );
    assert.equal(
      getElectoralMapObservation(record.province, 2026, "youth"),
      null,
    );
  }
  assert.equal(
    getElectoralMapObservation("City of Cape Town", 2026, "registration"),
    null,
    "Province counts must never be assigned to municipalities",
  );
});

test("2016 map retains published provincial turnout and refuses unresolved non-participation denominators", () => {
  for (const record of provinceElections) {
    const turnout = getElectoralMapObservation(
      record.province,
      2016,
      "turnout",
    );
    assert.ok(turnout);
    assert.equal(
      turnout.value,
      record.turnout,
      "A recalculated rate must not replace the published rate",
    );
    assert.equal(turnout.unit, "percent");
    assert.equal(turnout.kind, "election");
    assert.equal(turnout.observedAt, "2016");
    assert.equal(
      getElectoralMapObservation(record.province, 2016, "registration")?.value,
      record.registered,
    );
    const nonparticipation = getElectoralMapObservation(
      record.province,
      2016,
      "nonparticipation",
    );
    if (record.province === "Eastern Cape" || record.province === "Limpopo") {
      assert.equal(record.turnoutDenominator, null);
      assert.equal(
        nonparticipation,
        null,
        "Conflicting roll counts cannot produce a corrected denominator",
      );
    } else {
      assert.ok(nonparticipation);
      assert.equal(
        nonparticipation.value,
        record.turnoutDenominator! - record.voters!,
      );
      assert.match(nonparticipation.label, /effective roll/);
    }
    assert.equal(
      getElectoralMapObservation(record.province, 2006, "turnout"),
      null,
    );
    assert.equal(
      getElectoralMapObservation(record.province, 2016, "change"),
      null,
    );
    assert.equal(
      getElectoralMapObservation(record.province, 2016, "party"),
      null,
    );
  }
});

test("choropleth intervals classify exact boundaries and preserve unavailable values", () => {
  for (const interval of registrationMapIntervals) {
    assert.equal(
      electoralMapColor(interval.min, "registration"),
      interval.color,
    );
    if (interval.max !== null)
      assert.equal(
        electoralMapColor(interval.max - 1, "registration"),
        interval.color,
      );
  }
  for (const interval of turnoutMapIntervals) {
    assert.equal(electoralMapColor(interval.min, "turnout"), interval.color);
    if (interval.max !== null)
      assert.equal(
        electoralMapColor(interval.max - 0.01, "turnout"),
        interval.color,
      );
  }
  for (const value of [null, Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    assert.equal(
      electoralMapColor(value, "registration"),
      UNAVAILABLE_MAP_COLOR,
    );
  }
  assert.equal(electoralMapColor(100.01, "turnout"), UNAVAILABLE_MAP_COLOR);
  assert.equal(
    electoralMapColor(null, "nonparticipation"),
    UNAVAILABLE_MAP_COLOR,
  );
});
