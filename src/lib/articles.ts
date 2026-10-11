export type ResearchSource = {
  organisation: string;
  title: string;
  url: string;
  note: string;
};

export type ResearchArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingMinutes: number;
  publishedAt: string;
  highlight: string;
  sections: { id: string; title: string }[];
  sources: ResearchSource[];
};

export const articles: ResearchArticle[] = [
  {
    slug: "the-turnout-denominator",
    title: "The turnout denominator matters",
    summary:
      "Registered voters, eligible citizens and valid ballots answer different questions. A guide to reading participation statistics without losing the population behind the percentage.",
    category: "Methods & measurement",
    readingMinutes: 6,
    publishedAt: "2026-10-11",
    highlight:
      "A turnout percentage is meaningful only when its denominator, election and reference date travel with it.",
    sections: [
      {
        id: "different-questions",
        title: "Different questions, different populations",
      },
      { id: "follow-the-denominator", title: "Follow the denominator" },
      { id: "ballots-and-voters", title: "Ballots are not people" },
      { id: "comparison-checklist", title: "A comparison checklist" },
    ],
    sources: [
      {
        organisation: "Electoral Commission of South Africa",
        title: "2021 Municipal Elections Report",
        url: "https://www.elections.org.za/content/Documents/Election-reports/Municipal-Elections/2021-Municipal-Elections-Report---Compressed-17MB/",
        note: "Verified primary report illustrating certified-roll counts, participating-voter totals and the source-defined municipal turnout denominator. The source register retains the narrative/appendix discrepancy.",
      },
      {
        organisation: "Statistics South Africa",
        title: "Population statistics and statistical releases",
        url: "https://www.statssa.gov.za/",
        note: "Population publications must be checked for citizenship, age, date and coverage before serving as an eligibility denominator.",
      },
      {
        organisation: "Government of South Africa",
        title: "Register to vote",
        url: "https://www.gov.za/services/services-residents/voting/register-vote",
        note: "Official public guidance on registration eligibility; legislation remains the authoritative legal source.",
      },
    ],
  },
  {
    slug: "understanding-youth-registration",
    title: "Youth registration: the question before the percentage",
    summary:
      "A youth registration gap cannot be inferred from an age profile alone. Why citizenship, age bands and matched observation dates matter.",
    category: "Youth participation",
    readingMinutes: 5,
    publishedAt: "2026-10-11",
    highlight:
      "The youth share of the voters’ roll and the youth registration rate describe two different populations.",
    sections: [
      { id: "share-is-not-rate", title: "A share is not a rate" },
      { id: "age-boundaries", title: "Keep the age boundaries intact" },
      { id: "time-and-place", title: "Match time and place" },
      {
        id: "responsible-youth-analysis",
        title: "What responsible analysis can say",
      },
    ],
    sources: [
      {
        organisation: "Electoral Commission of South Africa",
        title: "2016 Municipal Elections Report — voters’ roll age bands",
        url: "https://www.elections.org.za/content/Documents/Election-reports/Municipal-Elections/2016-Municipal-Elections-Report/",
        note: "Verified report retaining the published age bands. Those bands do not permit an unsupported exact 18–35 split.",
      },
      {
        organisation: "Statistics South Africa",
        title: "Census and demographic statistics",
        url: "https://www.statssa.gov.za/",
        note: "Use citizenship and single-year age detail only where the published dataset supports them.",
      },
      {
        organisation: "Government of South Africa",
        title: "Register to vote",
        url: "https://www.gov.za/services/services-residents/voting/register-vote",
        note: "Eligibility to register and eligibility to cast a ballot are legal questions; do not infer them from adult population totals.",
      },
    ],
  },
  {
    slug: "what-non-voting-can-tell-us",
    title: "Non-voting is an outcome, not an explanation",
    summary:
      "Election returns reveal who participated in aggregate. They do not reveal why an individual stayed away, or turn abstention into a political preference.",
    category: "Democracy & interpretation",
    readingMinutes: 5,
    publishedAt: "2026-10-11",
    highlight:
      "An electoral result records an outcome. Explaining non-voting requires evidence beyond the result itself.",
    sections: [
      { id: "observable-outcome", title: "Start with the observable outcome" },
      {
        id: "avoid-ecological-inference",
        title: "Avoid reading individuals into regions",
      },
      {
        id: "boundaries-and-ballots",
        title: "Respect boundaries and ballot systems",
      },
      {
        id: "legitimacy-and-participation",
        title: "Participation and democratic legitimacy",
      },
    ],
    sources: [
      {
        organisation: "Electoral Commission of South Africa",
        title: "2016 Municipal Elections Report",
        url: "https://www.elections.org.za/content/Documents/Election-reports/Municipal-Elections/2016-Municipal-Elections-Report/",
        note: "Verified official report. Electoral results establish outcomes; they do not establish individual motives for abstention.",
      },
      {
        organisation: "Municipal Demarcation Board",
        title: "Municipal and ward demarcation resources",
        url: "https://www.demarcation.org.za/",
        note: "Boundary vintages and changes must be considered when comparing places over time.",
      },
      {
        organisation: "Statistics South Africa",
        title: "Statistical publications",
        url: "https://www.statssa.gov.za/",
        note: "Surveys can answer questions that returns cannot, subject to their sampling design and uncertainty.",
      },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
