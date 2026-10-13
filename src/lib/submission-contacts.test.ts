import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { civicNotices, type CivicNotice } from "./civic-data";
import { submissionContacts } from "./submission-contacts";

const evidence = JSON.parse(
  readFileSync(
    new URL("../../data/raw/civic-sources-2026-10-12.json", import.meta.url),
    "utf8",
  ),
) as { sources: { id: string; excerpts: string[] }[] };

function normalise(text: string) {
  return text
    .toLowerCase()
    .replace(/par-liament/g, "parliament")
    .replace(/[.\s]+/g, " ")
    .trim();
}

test("every named submission contact and address has retained source evidence", () => {
  for (const notice of civicNotices) {
    for (const contact of submissionContacts(notice)) {
      const source = evidence.sources.find(
        (entry) => entry.id === contact.sourceId,
      );
      assert.ok(source, `${notice.id}: contact source is missing`);
      const text = normalise(source.excerpts.join("\n"));
      assert.ok(
        text.includes(normalise(contact.email)),
        `${notice.id}: ${contact.email} is absent from its source`,
      );
      if (contact.name)
        assert.ok(
          text.includes(normalise(contact.name)),
          `${notice.id}: ${contact.name} is absent from its source`,
        );
    }
  }
});

test("fiscal submission recipients remain individually paired with the published name", () => {
  const notice = civicNotices.find(
    (entry) => entry.id === "fiscal-framework-2026",
  )!;
  assert.deepEqual(
    submissionContacts(notice).map(({ name, email, purpose }) => ({
      name,
      email,
      purpose,
    })),
    [
      {
        name: "Mr Allen Wicomb",
        email: "awicomb@parliament.gov.za",
        purpose: "submissions",
      },
      {
        name: "Ms Lwazikazi Ntinzi",
        email: "lntinzi@parliament.gov.za",
        purpose: "submissions",
      },
      {
        name: "Mr Nkululeko Mangweni",
        email: "nmangweni@parliament.gov.za",
        purpose: "submissions",
      },
    ],
  );
});

test("media and municipal assistance contacts are not mistaken for submission recipients", () => {
  const cda = civicNotices.find(
    (entry) => entry.id === "central-drug-authority-2026",
  )!;
  assert.deepEqual(
    submissionContacts(cda).map((contact) => contact.email),
    ["lntsabo@parliament.gov.za"],
  );
  const wardRules = civicNotices.find(
    (entry) => entry.id === "cape-town-ward-committee-rules-2026",
  )!;
  assert.ok(
    submissionContacts(wardRules).every(
      (contact) => contact.purpose !== "submissions",
    ),
  );
  const myciti = civicNotices.find(
    (entry) => entry.id === "cape-town-myciti-stops-2026",
  )!;
  assert.deepEqual(
    submissionContacts(myciti)
      .filter((contact) => contact.purpose === "submissions")
      .map((contact) => contact.email),
    ["MyCiTi.News@capetown.gov.za"],
  );
});

test("a new source address remains visible without inventing an individual's name", () => {
  const notice: CivicNotice = {
    ...civicNotices[0],
    id: "future-fixture",
    contact:
      "Office: citizen.comments@example.gov.za; CITIZEN.COMMENTS@example.gov.za",
    actionUrl:
      "mailto:citizen.comments@example.gov.za,second.office@example.gov.za?subject=Fixture",
  };
  const contacts = submissionContacts(notice);
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].name, undefined);
  assert.equal(contacts[1].email, "second.office@example.gov.za");
  assert.ok(contacts.every((contact) => contact.sourceId === notice.sourceId));
});
