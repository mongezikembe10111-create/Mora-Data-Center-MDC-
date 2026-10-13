import type { CivicNotice } from "./civic-data";

export type SubmissionContact = {
  /** A person's name appears only when explicitly published alongside the address. */
  name?: string;
  office: string;
  email: string;
  purpose: "submissions" | "enquiries" | "assistance" | "contact";
  phone?: string;
  sourceId: string;
};

/*
 * Transcribed from the retained 12 October 2026 source excerpts in
 * data/raw/civic-sources-2026-10-12.json. Enquiry and accessibility contacts
 * are deliberately separate from the address that receives submissions.
 */
const financeContacts: SubmissionContact[] = [
  {
    name: "Mr Allen Wicomb",
    office: "Standing Committee on Finance · Committee Secretary",
    email: "awicomb@parliament.gov.za",
    purpose: "submissions",
    sourceId: "parliament-fiscal",
  },
  {
    name: "Ms Lwazikazi Ntinzi",
    office: "Standing Committee on Finance · Committee Secretary",
    email: "lntinzi@parliament.gov.za",
    purpose: "submissions",
    sourceId: "parliament-fiscal",
  },
];

const publishedContacts: Record<string, SubmissionContact[]> = {
  "pmg-1785": [
    {
      name: "Mr Zolani Sakasa",
      office: "Portfolio Committee on Employment and Labour",
      email: "employmentservicesbill@parliament.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1785",
    },
  ],
  "pmg-1776": [
    {
      name: "Ms Anna-Marie Lotter",
      office: "Department of Trade, Industry and Competition",
      email: "nbrcomments@thedtic.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1776",
    },
  ],
  "pmg-1790": [
    {
      name: "Mr S Mokubyane",
      office: "Civilian Secretariat for the Police Service",
      email: "STA_Bill@csp.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1790",
    },
  ],
  "pmg-1791": [
    {
      name: "Mr M Ntwana",
      office: "Civilian Secretariat for the Police Service",
      email: "SHGA_Bill@csp.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1791",
    },
    {
      name: "Colonel Gerhard Pretorius",
      office: "South African Police Service",
      email: "PretoriusG@saps.gov.za",
      purpose: "enquiries",
      phone: "012 393 9007",
      sourceId: "pmg-1791",
    },
  ],
  "pmg-1789": [
    {
      office: "Universal Service and Access Agency of South Africa",
      email: "consultation@usaasa.org.za",
      purpose: "submissions",
      sourceId: "pmg-1789",
    },
  ],
  "pmg-1780": [
    {
      office: "Department of Water and Sanitation",
      email: "SFWSSComments@dws.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1780",
    },
    {
      name: "Mr Siboniso Ndlovu",
      office: "Department of Water and Sanitation",
      email: "NdlovuS2@dws.gov.za",
      purpose: "enquiries",
      sourceId: "pmg-1780",
    },
    {
      name: "Ms Zamanguni Mncwabe",
      office: "Department of Water and Sanitation",
      email: "MncwabeZ@dws.gov.za",
      purpose: "enquiries",
      sourceId: "pmg-1780",
    },
  ],
  "pmg-1786": [
    {
      name: "Mr Joseph Maraba",
      office: "Department of Electricity and Energy",
      email: "EPP.Comments@dee.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1786",
    },
  ],
  "pmg-1772": [
    {
      name: "Ms Vusani Ramuntshi",
      office: "Department of Electricity and Energy",
      email: "EMTPP.Queries@dee.gov.za",
      purpose: "submissions",
      sourceId: "pmg-1772",
    },
  ],
  "general-finance-laws-2026": financeContacts.map((contact) => ({
    ...contact,
    sourceId: "parliament-generalfinance",
  })),
  "fiscal-framework-2026": [
    ...financeContacts,
    {
      name: "Mr Nkululeko Mangweni",
      office: "Select Committee on Finance · Committee Secretary",
      email: "nmangweni@parliament.gov.za",
      purpose: "submissions",
      sourceId: "parliament-fiscal",
    },
  ],
  "central-drug-authority-2026": [
    {
      name: "Ms L Ntsabo",
      office: "Committee Secretary",
      email: "lntsabo@parliament.gov.za",
      purpose: "submissions",
      sourceId: "parliament-cda",
    },
  ],
  "second-special-appropriation-2026": [
    {
      name: "Mr L Nodada",
      office: "Select Committee on Appropriations · Committee Secretary",
      email: "Lnodada@parliament.gov.za",
      purpose: "submissions",
      phone: "083 412 1526",
      sourceId: "parliament-specialappropriation",
    },
    {
      name: "Ms E Grunewald",
      office: "Select Committee on Appropriations · Committee Secretary",
      email: "egrunewald@parliament.gov.za",
      purpose: "submissions",
      phone: "071 363 2257",
      sourceId: "parliament-specialappropriation",
    },
  ],
  "gauteng-appropriation-2026": [
    {
      name: "Mr Mphutlane John Ntsane",
      office: "Gauteng Provincial Legislature · Senior Committee Coordinator",
      email: "JNtsane@gpl.gov.za",
      purpose: "submissions",
      sourceId: "gp-budgetpdf",
    },
  ],
  "gauteng-adjustments-2026": [
    {
      name: "Mr Mphutlane John Ntsane",
      office: "Gauteng Provincial Legislature · Senior Committee Coordinator",
      email: "jntsane@gpl.gov.za",
      purpose: "submissions",
      sourceId: "gp-budgetadjust",
    },
  ],
  "gauteng-service-repeal-hearing": [
    {
      name: "Ms Chuma Senoko",
      office: "Gauteng Provincial Legislature · Committee Coordinator",
      email: "Csenoko@gpl.gov.za",
      purpose: "enquiries",
      phone: "076 012 8084",
      sourceId: "gp-repeal",
    },
    {
      name: "Mr Lesiba Lamola",
      office: "Gauteng Provincial Legislature · Committee Administrator",
      email: "LLamola@gpl.gov.za",
      purpose: "enquiries",
      phone: "079 897 2353",
      sourceId: "gp-repeal",
    },
  ],
  "cape-town-ward-committee-rules-2026": [
    {
      name: "Alesia Valda Bosman",
      office: "City of Cape Town",
      email: "AlesiaValda.Bosman@capetown.gov.za",
      purpose: "enquiries",
      sourceId: "municipal-cpt-ward-rules",
    },
    {
      name: "Justin Joseph Hendricks",
      office: "City of Cape Town",
      email: "JustinJoseph.Hendricks@capetown.gov.za",
      purpose: "enquiries",
      sourceId: "municipal-cpt-ward-rules",
    },
    {
      office: "City of Cape Town · Public Participation Unit",
      email: "public.participation@capetown.gov.za",
      purpose: "assistance",
      phone: "0800 212 176",
      sourceId: "municipal-cpt-ward-rules",
    },
  ],
  "cape-town-idp-process-2027-2032": [
    {
      office: "City of Cape Town · IDP process plan",
      email: "NTO5YR@capetown.gov.za",
      purpose: "submissions",
      sourceId: "municipal-cpt-idp-process",
    },
    {
      name: "Anthea Bendie",
      office: "City of Cape Town · Assistance with verbal comments",
      email: "anthea.bendie@capetown.gov.za",
      purpose: "assistance",
      phone: "021 400 1450",
      sourceId: "municipal-cpt-idp-process",
    },
    {
      office: "City of Cape Town · Public Participation Unit",
      email: "public.participation@capetown.gov.za",
      purpose: "assistance",
      phone: "0800 212 176",
      sourceId: "municipal-cpt-idp-process",
    },
  ],
  "cape-town-kensington-factreton-lsdf-2026": [
    {
      office: "City of Cape Town · Table Bay district spatial planning",
      email: "TableBay.DistrictSDF@capetown.gov.za",
      purpose: "submissions",
      sourceId: "municipal-cpt-lsdf",
    },
    {
      name: "Anthea Bendie",
      office: "City of Cape Town · Public participation assistance",
      email: "anthea.bendie@capetown.gov.za",
      purpose: "assistance",
      phone: "021 400 1450",
      sourceId: "municipal-cpt-lsdf",
    },
  ],
  "cape-town-myciti-stops-2026": [
    {
      office: "City of Cape Town · MyCiTi",
      email: "MyCiTi.News@capetown.gov.za",
      purpose: "submissions",
      sourceId: "municipal-cpt-myciti",
    },
    {
      name: "Kapil Singh",
      office: "City of Cape Town · MyCiTi",
      email: "Kapil.Singh@capetown.gov.za",
      purpose: "enquiries",
      sourceId: "municipal-cpt-myciti",
    },
    {
      name: "Andre Louw",
      office: "City of Cape Town · Public participation assistance",
      email: "Andre.Louw@capetown.gov.za",
      purpose: "assistance",
      phone: "021 400 9809",
      sourceId: "municipal-cpt-myciti",
    },
  ],
};

/** Retain source addresses even for a future notice without a named contact map. */
export function submissionContacts(notice: CivicNotice): SubmissionContact[] {
  const contacts = [...(publishedContacts[notice.id] || [])];
  const addressText = [
    notice.contact || "",
    notice.actionUrl?.startsWith("mailto:")
      ? notice.actionUrl.slice(7).split("?")[0]
      : "",
  ].join(" ");
  const addresses =
    addressText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  for (const email of addresses) {
    if (
      contacts.some(
        (contact) => contact.email.toLowerCase() === email.toLowerCase(),
      )
    )
      continue;
    contacts.push({
      office: notice.committee || "Contact stated in the notice",
      email,
      purpose: "contact",
      sourceId: notice.sourceId,
    });
  }
  return contacts;
}
