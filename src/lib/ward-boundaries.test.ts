import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { MultiPolygon, Polygon } from "geojson";
import { provinces } from "./data";
import { municipalities } from "./municipalities";
import {
  MUNICIPAL_BOUNDARY_PATH,
  provinceBoundaryPath,
  WARD_BOUNDARY_INFO,
  type MunicipalityCollection,
  type WardCollection,
} from "./ward-boundaries";

function asset(path: string) {
  return readFileSync(new URL(`../../public${path}`, import.meta.url), "utf8");
}
const councils = JSON.parse(
  asset(MUNICIPAL_BOUNDARY_PATH),
) as MunicipalityCollection;
const provinceWards = provinces.map((province) => ({
  province,
  data: JSON.parse(asset(provinceBoundaryPath(province)!)) as WardCollection,
}));
const wards = provinceWards.flatMap(({ data }) => data.features);

test("the boundary snapshot covers nine provinces and every local/metro council without duplicate wards", () => {
  assert.equal(wards.length, 4485);
  assert.equal(wards.length, WARD_BOUNDARY_INFO.wardCount);
  assert.equal(councils.features.length, 213);
  assert.equal(councils.features.length, WARD_BOUNDARY_INFO.municipalityCount);
  assert.equal(new Set(wards.map((ward) => ward.id)).size, wards.length);
  assert.equal(
    new Set(councils.features.map((council) => council.id)).size,
    213,
  );
  assert.deepEqual(
    [...new Set(wards.map((ward) => ward.properties.municipalityCode))].sort(),
    municipalities
      .filter((council) => council.type !== "district")
      .map((council) => council.code)
      .sort(),
  );
  assert.equal(provinceBoundaryPath("All provinces"), null);
  assert.equal(provinceBoundaryPath("__proto__"), null);
  for (const { province, data } of provinceWards) {
    assert.equal(data.type, "FeatureCollection");
    assert.equal(
      data.features.length,
      WARD_BOUNDARY_INFO.provinceCounts[province],
    );
    assert.ok(
      data.features.every((ward) => ward.properties.province === province),
    );
  }
});

test("ward identifiers and numbers select the correct municipality, with no inherited election statistics", () => {
  const councilByCode = new Map(
    councils.features.map((council) => [council.properties.code, council]),
  );
  const numbers = new Map<string, number[]>();
  for (const ward of wards) {
    const p = ward.properties;
    assert.match(p.wardId, /^\d{8}$/);
    assert.equal(ward.id, p.wardId);
    assert.ok(Number.isInteger(p.wardNumber) && p.wardNumber > 0);
    const council = councilByCode.get(p.municipalityCode);
    assert.ok(council, `${p.wardId} has a matching council`);
    assert.equal(p.province, council.properties.province);
    // Source ward and council tables use different punctuation/name variants.
    // The published code and province establish the relationship.
    assert.ok(p.municipalityName.trim().length > 0);
    assert.deepEqual(
      Object.keys(p).sort(),
      [
        "wardId",
        "wardNumber",
        "municipalityCode",
        "municipalityName",
        "province",
      ].sort(),
    );
    numbers.set(p.municipalityCode, [
      ...(numbers.get(p.municipalityCode) || []),
      p.wardNumber,
    ]);
  }
  for (const [code, list] of numbers) {
    list.sort((a, b) => a - b);
    const missing =
      WARD_BOUNDARY_INFO.missingWardNumbers.find(
        (entry) => entry.municipalityCode === code,
      )?.wardNumbers || [];
    const expected = Array.from(
      { length: list.length + missing.length },
      (_, i) => i + 1,
    ).filter((number) => !missing.includes(number));
    assert.deepEqual(
      list,
      expected,
      `${code} has unique source ward numbers and explicitly documented gaps`,
    );
  }
  assert.deepEqual(WARD_BOUNDARY_INFO.missingWardNumbers, [
    {
      municipalityCode: "GT484",
      municipalityName: "Merafong City",
      wardNumbers: [8, 19, 27],
    },
  ]);
});

test("display boundaries have closed, finite, usable geographic rings", () => {
  function check(
    geometry: Polygon | MultiPolygon,
    id: string | number | undefined,
  ) {
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    assert.ok(polygons.length > 0, `${id} has geometry`);
    for (const polygon of polygons) {
      assert.ok(polygon.length > 0);
      for (const ring of polygon) {
        assert.ok(ring.length >= 4, `${id} has a usable ring`);
        assert.deepEqual(ring[0], ring.at(-1), `${id} has a closed ring`);
        for (const point of ring) {
          assert.equal(point.length, 2);
          assert.ok(point.every(Number.isFinite));
          assert.ok(
            point[0] >= 15 &&
              point[0] <= 34 &&
              point[1] >= -36 &&
              point[1] <= -22,
            `${id} stays in mainland South African bounds`,
          );
        }
      }
    }
  }
  for (const feature of [...wards, ...councils.features])
    check(feature.geometry, feature.id);
});

test("the map source records immutable file hashes and the unresolved official-count difference", () => {
  assert.match(WARD_BOUNDARY_INFO.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(
    WARD_BOUNDARY_INFO.sourceUrl,
    new RegExp(WARD_BOUNDARY_INFO.sourceCommit),
  );
  assert.equal(WARD_BOUNDARY_INFO.sourcefiles.length, 8);
  for (const file of WARD_BOUNDARY_INFO.sourcefiles) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.bytes > 100);
    assert.ok(file.url.includes(WARD_BOUNDARY_INFO.sourceCommit));
  }
  assert.match(WARD_BOUNDARY_INFO.verificationNote, /4[ ,]?488/);
  assert.match(
    WARD_BOUNDARY_INFO.verificationNote,
    /not|unreconciled|unresolved/i,
  );
  for (const file of WARD_BOUNDARY_INFO.displayFiles) {
    const text = asset(file.path);
    assert.equal(createHash("sha256").update(text).digest("hex"), file.sha256);
  }
});
