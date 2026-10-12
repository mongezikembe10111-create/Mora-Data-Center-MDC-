/** Raw published counts are distinct from derived metrics and UI view models. */
export type TurnoutBasis =
  "effective-electorate" | "ballot-pool" | "unreconciled";

export type ElectionRecord = {
  year: number;
  label: string;
  type: "municipal" | "national";
  registered: number | null;
  voters: number | null;
  validBallots: number | null;
  eligible: number | null;
  /** A dated population estimate, distinct from legally eligible citizens. */
  votingAgePopulation?: number | null;
  votingAgePopulationSourceId?: string;
  votingAgePopulationNote?: string;
  turnout: number | null;
  /** Effective IEC population including MEC7 additions, where established. */
  turnoutDenominator?: number | null;
  /** Undefined preserves the legacy effective-electorate convention. */
  turnoutBasis?: TurnoutBasis;
  /** A disclosed count comparison where the turnout denominator is unreconciled. */
  participationComparisonDenominator?: number | null;
  sourceId: string;
  note?: string;
};

export type SourceRecord = {
  id: string;
  organisation: string;
  title: string;
  url: string;
  publishedAt: string | null;
  observedAt: string;
  retrievedAt: string | null;
  coverage: string;
  ageCoverage: string;
  units: string;
  methodology: string;
  limitations: string[];
  verified: boolean;
  secondaryUrls?: string[];
  evidencePath?: string;
};

export type ReferenceObservation = {
  id: string;
  label: string;
  observedAt: string;
  value: number;
  unit: "people" | "percent";
  qualifier: "approximate" | "more-than";
  status: "unverified";
  note: string;
};

export const DATA_UNAVAILABLE = "Official comparable data unavailable.";
export const verificationStatus = {
  checkedAt: "2026-10-12",
  lastVerifiedAt: "2026-10-12" as string | null,
  status: "official-sources-verified" as const,
  explanation:
    "Historical municipal figures and the 29 September 2026 registration snapshot were checked against official IEC publications. The retained official reports were re-examined on 12 October 2026 to add the 2021 estimated voting-age population, qualified source-count comparisons and published 2016 age-turnout rates. Eligible-citizen denominators, exact youth 18–35 splits and missing regional series remain unavailable.",
};

export const municipalYears = [2000, 2006, 2011, 2016, 2021] as const;

const officialReportUrl = (year: number) =>
  `https://www.elections.org.za/content/Documents/Election-reports/Municipal-Elections/${year}-Municipal-Elections-Report${year === 2021 ? "---Compressed-17MB" : ""}/`;

export const sources: SourceRecord[] = municipalYears.map((year) => ({
  id: `iec-municipal-${year}`,
  organisation: "Electoral Commission of South Africa (IEC)",
  title: `${year} Municipal Elections Report`,
  url: officialReportUrl(year),
  publishedAt: null,
  observedAt: String(year),
  retrievedAt: "2026-10-11",
  coverage:
    year === 2016
      ? "South Africa; municipal elections; national aggregate, nine provinces, registration age bands and rounded age-turnout rates"
      : year === 2021
        ? "South Africa; municipal elections; national aggregate and a same-year official voting-age population estimate"
        : "South Africa; municipal elections; national aggregate",
  ageCoverage:
    "All registered voting ages; 2016 report also publishes eight age bands from 18–19 to 80+",
  units:
    "People (registered voters and participating voters); ballots; percent",
  methodology:
    year === 2006
      ? "The 2006 report (PDF page 59; printed pages 53–54) calculates its published 48.40% turnout from 26,938,560 cast municipal ballot papers divided by 55,653,781 potential ballot papers. Each voter could receive two or three ballot papers. This ballot-pool statistic is not a participating-person rate; its person-level denominator and participating-voter count remain null."
      : year === 2000
        ? "The 2000 report publishes 8,882,734 participating voters and 48.06% turnout, but its turnout table gives a different registered total from later IEC certified-roll comparisons. Counts and published rate are preserved independently; no reconciled person-turnout denominator or directly comparable rate change is inferred."
        : "Certified voters’ roll counts and IEC-reported participating-voter counts are transcribed independently from the report. Published municipal turnout is preserved. For 2011, 2016 and 2021 the operational numerator is the highest of Ward or PR votes and the denominator includes certified-roll entries plus reported MEC7 additions. All-ballot totals are never substituted for participating voters.",
  limitations: [
    "No compatible legally eligible-citizen denominator is available; eligible-citizen registration and participation-gap rates remain unavailable. Registered-electorate gaps and explicitly labelled voting-age-population estimates are separate measures.",
    "Valid ballots are not a comparable person-level funnel stage when voters receive two or three municipal ballot papers.",
    ...(year === 2000
      ? [
          "The 2000 turnout table lists 18,511,975 registered voters, while later IEC certified-roll comparisons give 18,476,516. The certified count is used and the published 48.06% turnout is retained; a reconciled turnout denominator is unavailable.",
        ]
      : []),
    ...(year === 2006
      ? [
          "Published 48.40% turnout has a ballot-pool basis with unequal ballot papers per person; it cannot establish person-level turnout or registered-person abstention, and is not directly comparable with the 2011–2021 effective-electorate rates.",
        ]
      : []),
    ...(year === 2016
      ? [
          "Figure 14 (printed page 75; PDF page 45, right-hand page of a two-page spread) publishes rounded whole-percent turnout for eight original age bands. Exact age-specific participating-voter counts and detailed denominator reconciliation are not supplied and must not be reconstructed from these rates.",
        ]
      : []),
    ...(year === 2021
      ? [
          "The report narrative gives 12,063,886 participating voters; its results appendix gives 12,063,709. The results-appendix figure is retained and the discrepancy is disclosed.",
          "The report also cites a Stats SA estimated voting-age population of 38,573,897 (printed page 54). It is a population estimate, not a verified legal-eligibility/citizenship count; derived adult-population coverage and gaps remain estimates. The report provides no uncertainty interval or exact estimate reference day.",
        ]
      : []),
  ],
  verified: true,
  ...(year === 2000 ? { secondaryUrls: [officialReportUrl(2016)] } : {}),
  evidencePath: `data/raw/iec-municipal-${year}.json`,
}));

const historicCounts = [
  {
    year: 2000,
    registered: 18_476_516,
    voters: 8_882_734,
    turnout: 48.06,
    turnoutBasis: "unreconciled" as const,
    turnoutDenominator: null,
    participationComparisonDenominator: 18_476_516,
    note: "Certified roll from the 2016 IEC report’s historical comparison; 2000 report turnout retained. The certified roll minus the published participating-voter count is a qualified count comparison, not the operational turnout denominator. The 2000 report itself prints 18,476,519 at certification and 18,511,975 in its turnout table; no reconciled turnout denominator or directly comparable turnout-rate change is inferred.",
  },
  {
    year: 2006,
    registered: 21_054_957,
    voters: null,
    turnout: 48.4,
    turnoutBasis: "ballot-pool" as const,
    turnoutDenominator: null,
    note: "Published turnout is 26,938,560 cast ballot papers divided by 55,653,781 potential ballot papers, with two or three papers per voter. This is not a person-level rate; participating voters, effective person electorate and registered-person abstention remain unavailable.",
  },
  {
    year: 2011,
    registered: 23_655_046,
    voters: 13_664_914,
    turnout: 57.6,
    turnoutBasis: "effective-electorate" as const,
    turnoutDenominator: 23_655_046 + 54_655,
    note: "Published turnout rounded to one decimal. Effective turnout denominator includes 54,655 MEC7 additions to the certified roll.",
  },
  {
    year: 2016,
    registered: 26_333_353,
    voters: 15_290_820,
    turnout: 57.94,
    turnoutBasis: "effective-electorate" as const,
    turnoutDenominator: 26_333_353 + 55_710,
    note: "Effective turnout denominator includes 55,710 MEC7 additions. Certified-roll count and turnout denominator are distinct.",
  },
  {
    year: 2021,
    registered: 26_204_579,
    voters: 12_063_709,
    turnout: 45.87,
    turnoutBasis: "effective-electorate" as const,
    turnoutDenominator: 26_204_579 + 98_589,
    note: "Results appendix participating-person count retained; narrative instead lists 12,063,886. Effective turnout denominator includes 98,589 MEC7 additions. The published turnout is preserved and differs slightly from the ratio of appendix counts.",
  },
];

export const elections: ElectionRecord[] = historicCounts.map((record) => ({
  ...record,
  label: `${record.year} Local Government Election`,
  type: "municipal",
  validBallots: null,
  eligible: null,
  votingAgePopulation: record.year === 2021 ? 38_573_897 : null,
  ...(record.year === 2021
    ? {
        votingAgePopulationSourceId: "iec-municipal-2021",
        votingAgePopulationNote:
          "The IEC 2021 report (printed page 54) cites Statistics South Africa's estimated voting-age population of 38,573,897. This is a same-election-year adult-population benchmark, not a verified count of voting-eligible South African citizens. The report supplies no uncertainty interval or exact population estimate reference day.",
      }
    : {}),
  sourceId: `iec-municipal-${record.year}`,
}));

export const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

/** Filter categories only; no unpublished counts or inferred 18–35 splits. */
export const ageGroups = [
  "18–19",
  "20–29",
  "30–39",
  "40–49",
  "50–59",
  "60–69",
  "70–79",
  "80+",
] as const;

sources.push({
  id: "iec-registration-2026-09-29",
  organisation: "Electoral Commission of South Africa (IEC)",
  title: "Voter registration statistics as at 29 September 2026",
  url: "https://www.elections.org.za/pw/StatsData/Voter-Registration-Statistics",
  publishedAt: null,
  observedAt: "2026-09-29",
  retrievedAt: "2026-10-11",
  coverage: "South Africa; national aggregate and all nine provinces",
  ageCoverage: "18–19, 20–29, 30–39, 40–49, 50–59, 60–69, 70–79, 80+",
  units: "Registered people; male/female registration counts",
  methodology:
    "Counts transcribed from the official IEC snapshot. Age totals sum the published male and female counts; province and age totals independently sum to the national roll. This snapshot is separate from historical election rolls.",
  limitations: [
    "Eligible-citizen counts and rates are unavailable.",
    "The published 30–39 band cannot support a precise 18–35 youth split.",
    "Registration does not establish voting participation.",
  ],
  verified: true,
  evidencePath: "data/raw/iec-registration-2026-09-29.json",
});

sources.push({
  id: "iec-municipal-turnout-methodology",
  organisation: "Electoral Commission of South Africa (IEC)",
  title: "Election results portal — municipal report definitions",
  url: "https://results.elections.org.za/home/",
  publishedAt: null,
  observedAt: "2026-10-11",
  retrievedAt: "2026-10-11",
  coverage: "South Africa; municipal-election report methodology",
  ageCoverage: "All registered voting ages",
  units: "Report definitions; votes; registered population; percent",
  methodology:
    "The official portal describes Percentage Voter Turnout as comparing the highest of either Ward or PR votes cast to the sum of registered population and MEC7 votes cast.",
  limitations: [
    "Operational voter counts use the IEC ballot-based measure; they are not summed across all ballot types.",
    "The portal does not give a separate publication date for its definitions.",
  ],
  verified: true,
  evidencePath: "data/raw/iec-municipal-turnout-methodology.json",
});

sources.push({
  id: "iec-election-timetable-2026",
  organisation: "Electoral Commission of South Africa (IEC)",
  title: "Timetable for the 2026 Local Government Elections",
  url: "https://www.elections.org.za/pw/Documents/Electoral%20Commission%20LGE%202026%20Election%20Timetable.pdf",
  publishedAt: null,
  observedAt: "2026-11-04",
  retrievedAt: "2026-10-11",
  coverage: "South Africa; 2026 local government elections",
  ageCoverage: "All legally eligible registered voters",
  units: "Calendar dates and South African Standard Time (UTC+02:00)",
  methodology:
    "Official timetable labels Wednesday 4 November 2026 as Election Day, with voting from 07:00 to 21:00. The proclamation date printed on the timetable is 7 August 2026.",
  limitations: [
    "Election results must only be added after the election occurs and official results are published.",
  ],
  verified: true,
  evidencePath: "data/raw/iec-election-timetable-2026.json",
});

export const currentRegistrationObservation = {
  registered: 29_230_808,
  observedAt: "2026-09-29",
  retrievedAt: "2026-10-11",
  sourceId: "iec-registration-2026-09-29",
  eligible: null,
  registrationRate: null,
};

export type AgeRegistrationRecord = {
  ageGroup: string;
  registered: number;
  female: number;
  male: number;
  eligible: number | null;
  registrationRate: number | null;
  observedAt: string;
  sourceId: string;
};

const ageCounts = [
  [308_310, 385_603],
  [2_155_211, 2_683_749],
  [3_118_675, 3_656_909],
  [2_997_361, 3_320_270],
  [2_212_237, 2_604_700],
  [1_407_685, 1_928_572],
  [645_142, 1_033_434],
  [230_457, 542_493],
];

export const currentAgeRegistration: AgeRegistrationRecord[] = ageGroups.map(
  (ageGroup, index) => ({
    ageGroup,
    male: ageCounts[index][0],
    female: ageCounts[index][1],
    registered: ageCounts[index][0] + ageCounts[index][1],
    eligible: null,
    registrationRate: null,
    observedAt: "2026-09-29",
    sourceId: "iec-registration-2026-09-29",
  }),
);

const ageCounts2016 = [
  [228_289, 278_272],
  [2_653_797, 3_122_802],
  [3_062_254, 3_373_081],
  [2_468_351, 2_799_636],
  [1_782_626, 2_246_966],
  [1_055_687, 1_430_877],
  [450_258, 769_866],
  [166_195, 444_396],
];

export const historicAgeRegistration: AgeRegistrationRecord[] = ageGroups.map(
  (ageGroup, index) => ({
    ageGroup,
    male: ageCounts2016[index][0],
    female: ageCounts2016[index][1],
    registered: ageCounts2016[index][0] + ageCounts2016[index][1],
    eligible: null,
    registrationRate: null,
    observedAt: "2016",
    sourceId: "iec-municipal-2016",
  }),
);

export type AgeTurnoutRecord = {
  ageGroup: (typeof ageGroups)[number];
  turnout: number;
  observedAt: string;
  sourceId: string;
  precision: "whole-percent";
  note: string;
};

/** Published rates, never reconstructed participating-voter counts. */
export const historicAgeTurnout: AgeTurnoutRecord[] = ageGroups.map(
  (ageGroup, index) => ({
    ageGroup,
    turnout: [71, 50, 50, 59, 69, 73, 67, 46][index],
    observedAt: "2016-08-03",
    sourceId: "iec-municipal-2016",
    precision: "whole-percent",
    note: "IEC 2016 Local Government Elections Report, Figure 14 on printed page 75 (PDF page 45, right-hand page of a two-page spread). Published registered-electorate turnout by age, rounded to whole percentages; it is not a voting-age-population or eligible-citizen rate. The figure does not supply exact age-specific participating-voter counts or its detailed age-denominator reconciliation, so those counts are not reconstructed. This historical observation does not describe the 2026 roll or the same individuals ten years later.",
  }),
);

export type ProvinceRegistrationRecord = {
  province: string;
  registered: number;
  eligible: number | null;
  registrationRate: number | null;
  observedAt: string;
  sourceId: string;
};

const provinceCounts: Record<(typeof provinces)[number], number> = {
  "Eastern Cape": 3_628_934,
  "Free State": 1_533_570,
  Gauteng: 6_751_064,
  "KwaZulu-Natal": 6_030_969,
  Limpopo: 3_037_387,
  Mpumalanga: 2_170_139,
  "North West": 1_907_623,
  "Northern Cape": 713_869,
  "Western Cape": 3_457_253,
};

export const currentProvinceRegistration: ProvinceRegistrationRecord[] =
  provinces.map((province) => ({
    province,
    registered: provinceCounts[province],
    eligible: null,
    registrationRate: null,
    observedAt: "2026-09-29",
    sourceId: "iec-registration-2026-09-29",
  }));

export type ProvinceElectionRecord = ElectionRecord & {
  province: string;
  boundaryYear: number;
};

const provinceCounts2016: [string, number, number, number, number][] = [
  ["Eastern Cape", 3_337_532, 1_888_500, 9_349, 56.43],
  ["Free State", 1_470_999, 829_349, 3_735, 56.24],
  ["Gauteng", 6_234_822, 3_618_214, 13_284, 57.91],
  ["KwaZulu-Natal", 5_411_237, 3_333_298, 10_750, 61.48],
  ["Limpopo", 2_556_128, 1_287_713, 2_664, 50.33],
  ["Mpumalanga", 1_919_216, 1_082_665, 7_671, 56.19],
  ["North West", 1_715_460, 921_519, 2_951, 53.63],
  ["Northern Cape", 621_310, 380_718, 1_005, 61.18],
  ["Western Cape", 3_066_649, 1_948_844, 4_301, 63.46],
];

export const provinceElections: ProvinceElectionRecord[] =
  provinceCounts2016.map(([province, registered, voters, mec7, turnout]) => ({
    province,
    boundaryYear: 2016,
    year: 2016,
    label: `2016 ${province} municipal election`,
    type: "municipal",
    turnoutBasis: "effective-electorate",
    registered,
    voters,
    turnout,
    turnoutDenominator:
      province === "Eastern Cape" || province === "Limpopo"
        ? null
        : registered + mec7,
    ...(province === "Eastern Cape" || province === "Limpopo"
      ? { participationComparisonDenominator: registered }
      : {}),
    validBallots: null,
    eligible: null,
    sourceId: "iec-municipal-2016",
    note: "Certified roll from Table 16; participating voters, MEC7 additions and published turnout from Table 27. Table 27 transcribes different roll counts for Eastern Cape and Limpopo; the certified table is used for registration but those two effective turnout denominators remain null until reconciled. Provincial boundaries are those used for the 2016 election.",
  }));

export const metros = [
  "City of Cape Town",
  "City of Johannesburg",
  "City of Tshwane",
  "eThekwini",
  "Ekurhuleni",
  "Nelson Mandela Bay",
  "Buffalo City",
  "Mangaung",
] as const;

/** User-supplied leads only. These do not feed the verified election dataset. */
export const referenceObservations: ReferenceObservation[] = [
  {
    id: "reference-2026-registration",
    label: "Registered voters",
    observedAt: "2026-08",
    value: 29_000_000,
    unit: "people",
    qualifier: "more-than",
    status: "unverified",
    note: "User-supplied reference: more than 29 million. Verify against an IEC publication before using.",
  },
  {
    id: "reference-2025-youth",
    label: "Registered voters aged 18–35",
    observedAt: "2025-04",
    value: 7_900_000,
    unit: "people",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference. Age coverage and observation date require official verification; no compatible eligible-youth denominator is available.",
  },
  {
    id: "reference-2024-eligible",
    label: "Eligible citizens",
    observedAt: "2024-03",
    value: 39_750_000,
    unit: "people",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference. Citizenship, legal eligibility and estimation methodology require official verification.",
  },
  {
    id: "reference-2024-registration",
    label: "Registered voters",
    observedAt: "2024-03",
    value: 27_780_000,
    unit: "people",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference. Verify reference date and voters’ roll scope before deriving a rate.",
  },
  {
    id: "reference-2021-registration",
    label: "2021 municipal registered voters",
    observedAt: "2021",
    value: 26_200_000,
    unit: "people",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference. Rounded counts cannot establish an exact turnout denominator.",
  },
  {
    id: "reference-2021-voters",
    label: "2021 municipal votes cast",
    observedAt: "2021",
    value: 12_060_000,
    unit: "people",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference. Verify whether “votes cast” means participating people or ballot papers. Never combine ballot types to estimate voters.",
  },
  {
    id: "reference-2021-turnout",
    label: "2021 municipal turnout",
    observedAt: "2021",
    value: 45.87,
    unit: "percent",
    qualifier: "approximate",
    status: "unverified",
    note: "User-supplied reference requiring primary-source verification. Do not reconstruct voter counts from this rounded rate.",
  },
];

export const nextMunicipalElection = {
  officialDate: "2026-11-04" as string | null,
  window: null as string | null,
  status:
    "Official IEC timetable: Wednesday 4 November 2026, 07:00–21:00 SAST.",
  sourceUrl:
    "https://www.elections.org.za/pw/Documents/Electoral%20Commission%20LGE%202026%20Election%20Timetable.pdf",
  sourceId: "iec-election-timetable-2026",
};

export function getElection(year: number): ElectionRecord | undefined {
  return elections.find((record) => record.year === year);
}

export function getSource(sourceId: string): SourceRecord | undefined {
  return sources.find((source) => source.id === sourceId);
}
