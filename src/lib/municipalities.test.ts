import assert from "node:assert/strict";
import test from "node:test";
import raw from "../../data/raw/municipal-directory-source.json";
import {
  filterMunicipalities,
  municipalities,
  municipalDirectoryCheckedAt,
  municipalProvinces,
  municipalityCsv,
} from "./municipalities";

test("municipal roster includes every province and reconciles the current directory categories", () => {
  assert.equal(municipalities.length, 257);
  assert.equal(new Set(municipalities.map((m) => m.code)).size, 257);
  assert.equal(municipalProvinces.length, 9);
  assert.equal(
    municipalities.filter((m) => m.type === "metropolitan").length,
    8,
  );
  assert.equal(municipalities.filter((m) => m.type === "district").length, 44);
  assert.equal(municipalities.filter((m) => m.type === "local").length, 205);
  const sourceCodes = new Set(
    raw.treasury.data.map((m) => m["municipality.demarcation_code"]),
  );
  for (const municipality of municipalities)
    assert.ok(
      sourceCodes.has(municipality.code),
      `${municipality.code} needs Treasury provenance`,
    );
});

test("published municipal destinations retain a source and a dated verification trail", () => {
  for (const m of municipalities) {
    assert.equal(m.checkedAt, municipalDirectoryCheckedAt);
    assert.ok(["http:", "https:"].includes(new URL(m.directoryUrl).protocol));
    if (m.website) {
      assert.ok(m.websiteSource, `${m.code} website needs a source`);
      assert.ok(["http:", "https:"].includes(new URL(m.website).protocol));
    }
    assert.equal(
      new Set(m.links.map((link) => link.topic)).size,
      m.links.length,
    );
    for (const link of m.links) {
      assert.equal(link.checkedAt, municipalDirectoryCheckedAt);
      assert.equal(
        new URL(link.url).hostname,
        new URL(link.discoveredOn).hostname,
        `${m.code} topic link must be published on the checked municipality site`,
      );
    }
  }
});

test("former names, municipality codes and council scope identify the expected council", () => {
  const filters = {
    search: "EC104",
    province: "all",
    type: "all",
    topic: "all",
  };
  assert.equal(
    filterMunicipalities(filters)[0]?.name,
    "Makana Local Municipality",
  );
  assert.equal(
    filterMunicipalities({ ...filters, search: "Ubuhlebezwe" })[0]?.code,
    "KZN434",
  );
  assert.equal(
    filterMunicipalities({ ...filters, search: "", province: "Gauteng" })
      .length,
    11,
  );
  assert.equal(
    filterMunicipalities({ ...filters, search: "EC104", type: "metropolitan" })
      .length,
    0,
  );
});

test("filtered directory exports retain destination categories and provenance dates", () => {
  const metros = filterMunicipalities({
    search: "",
    province: "all",
    type: "metropolitan",
    topic: "all",
  });
  const csv = municipalityCsv(metros);
  assert.equal(csv.split("\r\n").length, 9);
  assert.match(csv, /"participation_and_comments"/);
  assert.match(csv, /"municipal_contact_directory"/);
  assert.match(csv, /"CPT"/);
  assert.ok(csv.includes(municipalDirectoryCheckedAt));
  assert.ok(!csv.includes('"EC104"'));
});
