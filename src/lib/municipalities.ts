import snapshot from "../../data/municipalities.json";

export type MunicipalityType = "metropolitan" | "district" | "local";
export type MunicipalTopic =
  "participation" | "idp" | "budget" | "bylaws" | "notices";
export interface MunicipalLink {
  topic: MunicipalTopic;
  label: string;
  url: string;
  discoveredOn: string;
  checkedAt: string;
}
export interface Municipality {
  code: string;
  name: string;
  aliases: string[];
  province: string;
  type: MunicipalityType;
  website: string | null;
  websiteSource: "treasury" | "directory" | null;
  websiteStatus: "reachable" | "not-confirmed" | "not-listed";
  directoryUrl: string;
  phone: string | null;
  links: MunicipalLink[];
  checkedAt: string;
  note: string | null;
}

export const municipalities = snapshot.municipalities as Municipality[];
export const municipalitySources = snapshot.sources;
export const municipalDirectoryCheckedAt = snapshot.checkedAt;
export const municipalProvinces = [
  ...new Set(municipalities.map((m) => m.province)),
].sort();
export const municipalTopics: { value: MunicipalTopic; label: string }[] = [
  { value: "participation", label: "Participation & comments" },
  { value: "idp", label: "Integrated Development Plans" },
  { value: "budget", label: "Budgets" },
  { value: "bylaws", label: "By-laws" },
  { value: "notices", label: "Public notices" },
];
export const municipalityTypeLabels: Record<MunicipalityType, string> = {
  metropolitan: "Metropolitan",
  district: "District",
  local: "Local",
};

export function filterMunicipalities(filters: {
  search: string;
  province: string;
  type: string;
  topic: string;
}) {
  const search = filters.search.toLocaleLowerCase("en-ZA").trim();
  return municipalities.filter((m) => {
    const terms = [m.name, m.code, m.province, ...m.aliases]
      .join(" ")
      .toLocaleLowerCase("en-ZA");
    return (
      (!search || terms.includes(search)) &&
      (filters.province === "all" || m.province === filters.province) &&
      (filters.type === "all" || m.type === filters.type) &&
      (filters.topic === "all" ||
        m.links.some((link) => link.topic === filters.topic))
    );
  });
}

export function municipalityCsv(rows: Municipality[]): string {
  const quote = (value: string | null) =>
    `"${(value ?? "").replaceAll('"', '""')}"`;
  const header = [
    "municipality_code",
    "municipality",
    "aliases",
    "province",
    "type",
    "official_website",
    "website_source",
    "website_reachability",
    "municipal_contact_directory",
    "public_phone",
    "participation_and_comments",
    "integrated_development_plan",
    "budget",
    "bylaws",
    "public_notices",
    "checked_at",
    "notes",
  ];
  return [
    header.map(quote).join(","),
    ...rows.map((m) =>
      [
        m.code,
        m.name,
        m.aliases.join("; "),
        m.province,
        m.type,
        m.website,
        m.websiteSource,
        m.websiteStatus,
        m.directoryUrl,
        m.phone,
        ...municipalTopics.map(
          (topic) =>
            m.links.find((link) => link.topic === topic.value)?.url ?? "",
        ),
        m.checkedAt,
        m.note,
      ]
        .map(quote)
        .join(","),
    ),
  ].join("\r\n");
}
