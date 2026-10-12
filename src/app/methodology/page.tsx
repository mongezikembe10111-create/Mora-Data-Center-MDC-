import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { sources, verificationStatus } from "@/lib/data";

export const metadata = {
  title: "Methodology & Sources | MORA",
  description:
    "Source provenance, electoral definitions, calculation rules and data limitations for reproducible MORA analysis.",
};

const definitions = [
  [
    "Eligible citizens",
    "Citizens who meet the legal age and other voting requirements for the election in question. An adult-resident population total is not automatically an eligible-citizen denominator.",
  ],
  [
    "Registered voters",
    "People on the relevant voters’ roll at the source’s observation date. A certified-roll count can differ from an election’s effective turnout denominator when the IEC reports additional voters, including MEC7 additions. Registration is not evidence that a person cast a ballot.",
  ],
  [
    "Participating voters",
    "People who participated under the source’s election-specific definition. If a ballot measure is used as a proxy, the qualification must remain visible.",
  ],
  [
    "Ballots cast",
    "Ballot papers cast in a specified contest. A voter may cast more than one ballot in a local election; totals across contests are not unique-person counts.",
  ],
  [
    "Valid votes",
    "Votes accepted as valid for a specified ballot or contest. They exclude rejected ballots under the source’s rules.",
  ],
  [
    "Youth",
    "The exact age range published by a source. Ages 18–34, 18–35 and a 30–39 source band cannot be treated as interchangeable.",
  ],
];

const calculations = [
  {
    title: "Registration rate",
    formula: "registered voters ÷ eligible citizens × 100",
    note: "Requires compatible citizenship, age, geography and dates. Without an eligible-citizen denominator the rate is unavailable.",
  },
  {
    title: "Registered-voter turnout",
    formula:
      "participating voters ÷ effective election turnout denominator × 100",
    note: "Use the source-defined election denominator, including reported MEC7 additions where applicable. Preserve the published turnout rate when the denominator cannot be reconciled. A certified-roll count or ballot-paper total cannot be silently substituted.",
  },
  {
    title: "Registered non-participation",
    formula: "compatible election voter population − participating voters",
    note: "Use the effective election denominator where established and keep it distinct from a certified-roll snapshot. If the populations cannot be reconciled, this count remains unavailable. Non-participation does not establish individual motives or political preferences.",
  },
  {
    title: "Registration gap",
    formula: "eligible citizens − registered voters",
    note: "Keep this separate from the participation gap. Incompatible dated observations cannot support a precise current gap.",
  },
  {
    title: "Eligible-citizen participation gap",
    formula: "eligible citizens − participating voters",
    note: "The percentage form divides this gap by the compatible eligible-citizen population. Missing data is not zero.",
  },
  {
    title: "Documented electorate participation gap",
    formula: "effective election electorate − participating voters",
    note: "Shows nonparticipation within the documented electorate, excluding people outside it. Qualified certified-roll comparisons can be shown for 2000 and conflicting 2016 provincial tables, with the difference disclosed rather than described as a reconciled operational rate.",
  },
  {
    title: "Estimated adult-population participation gap",
    formula: "same-year estimated voting-age residents − participating voters",
    note: "The 2021 IEC report gives a Stats SA voting-age population estimate of 38,573,897. Adult residents include non-citizens; this is not a legally eligible citizen denominator. The derived gap inherits the estimate’s uncertainty. Never apply it to the 2026 roll or another geography.",
  },
  {
    title: "Estimated adult-population gap decomposition",
    formula:
      "adults outside effective electorate + electorate nonparticipants = adult-population gap",
    note: "For 2021: 12,270,729 estimated adults outside the effective electorate + 14,239,459 recorded electorate nonparticipants = 26,510,188. The outside-electorate segment is not an exact count of eligible unregistered citizens.",
  },
  {
    title: "Percentage-point change",
    formula: "later percentage − earlier percentage",
    note: "For example, 50% to 45% is −5 percentage points. These values are hypothetical, not election observations.",
  },
  {
    title: "Relative percentage change",
    formula: "(later value − earlier value) ÷ earlier value × 100",
    note: "Undefined when the earlier value is zero. A move from 50% to 45% is a hypothetical −10% relative change in the rate.",
  },
];

function referenceDate(value: string | null) {
  return value || "Not established";
}

export default function MethodologyPage() {
  const verified = sources.filter((source) => source.verified).length;
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Methodology & source register</p>
        <h1>
          Trust is a method.
          <br />
          Not an aesthetic.
        </h1>
        <p className="muted">
          Definitions, provenance and reproducible calculations. The rules that
          turn election information into responsible analysis.
        </p>
      </header>
      <section
        className="panel"
        aria-labelledby="verification-heading"
        style={{ marginBottom: 30 }}
      >
        <div className="panel-header">
          <p className="eyebrow">Verification status</p>
          <ShieldCheck size={20} aria-hidden="true" />
        </div>
        <h2 id="verification-heading" className="section-title">
          {verified} of {sources.length} source records verified
        </h2>
        <p className="muted">
          Verified records preserve the original official publication, its
          observation date and known limitations. A verified source can still
          contain missing measures or conflicting totals; those qualifications
          remain attached to the data.
        </p>
        <p className="muted">{verificationStatus.explanation}</p>
        <p className="muted" style={{ fontSize: 13 }}>
          Verification review date:{" "}
          <time dateTime={verificationStatus.checkedAt}>
            {verificationStatus.checkedAt}
          </time>
          . Last source verification:{" "}
          {verificationStatus.lastVerifiedAt || "None established"}.
        </p>
      </section>
      <div className="article-grid" aria-label="Evidence workflow">
        {[
          {
            icon: FileSearch,
            title: "01 / Observe",
            description:
              "Locate the original official publication. Retain raw counts, dates, geography, age ranges and the publisher’s definitions.",
          },
          {
            icon: CheckCircle2,
            title: "02 / Validate",
            description:
              "Check schema, coverage, units and arithmetic. Verify the source before its numerical records enter a published dataset.",
          },
          {
            icon: Database,
            title: "03 / Derive",
            description:
              "Calculate only from compatible observations. Keep raw data, derived measures and interface labels separate.",
          },
        ].map(({ icon: Icon, title, description }) => (
          <section className="panel" key={title}>
            <Icon
              size={22}
              aria-hidden="true"
              style={{ color: "#B9F56A", marginBottom: 15 }}
            />
            <h2 style={{ fontSize: 18 }}>{title}</h2>
            <p className="muted">{description}</p>
          </section>
        ))}
      </div>
      <section style={{ marginTop: 42 }} aria-labelledby="definitions-heading">
        <p className="eyebrow">The language of participation</p>
        <h2 className="section-title" id="definitions-heading">
          Distinctions that stay with the data.
        </h2>
        <div className="panel">
          {definitions.map(([title, description]) => (
            <details
              key={title}
              style={{ borderBottom: "1px solid #29374C", padding: "19px 0" }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                {title}
              </summary>
              <p
                className="muted"
                style={{ maxWidth: 900, margin: "12px 0 2px" }}
              >
                {description}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section style={{ marginTop: 42 }} aria-labelledby="calculation-heading">
        <p className="eyebrow">Reproducible calculations</p>
        <h2 className="section-title" id="calculation-heading">
          Every rate needs a denominator.
        </h2>
        <div className="panel">
          {calculations.map(({ title, formula, note }) => (
            <details
              key={title}
              style={{ borderBottom: "1px solid #29374C", padding: "18px 0" }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                {title}
              </summary>
              <p
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#B9F56A",
                  fontSize: 14,
                  margin: "16px 0 10px",
                  overflowWrap: "anywhere",
                }}
              >
                {formula}
              </p>
              <p className="muted" style={{ maxWidth: 900 }}>
                {note}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section
        id="source-register"
        style={{ marginTop: 42 }}
        aria-labelledby="sources-heading"
      >
        <div className="panel-header">
          <div>
            <p className="eyebrow">Primary-source register</p>
            <h2 className="section-title" id="sources-heading">
              Evidence, with its provenance.
            </h2>
          </div>
          <span className="badge">{sources.length} records</span>
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          {sources.map((source) => (
            <details className="panel" key={source.id}>
              <summary
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span>
                  <span
                    className="eyebrow"
                    style={{ display: "block", marginBottom: 7 }}
                  >
                    {source.organisation}
                  </span>
                  <strong>{source.title}</strong>
                </span>
                <span className="badge">
                  {source.verified ? "Verified" : "Verification pending"}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(115px, 180px) minmax(0, 1fr)",
                  gap: "14px 20px",
                  marginTop: 25,
                  fontSize: 14,
                }}
              >
                <dt className="muted">Source identifier</dt>
                <dd style={{ margin: 0 }}>{source.id}</dd>
                <dt className="muted">Publication date</dt>
                <dd style={{ margin: 0 }}>
                  {referenceDate(source.publishedAt)}
                </dd>
                <dt className="muted">Observation date</dt>
                <dd style={{ margin: 0 }}>{source.observedAt}</dd>
                <dt className="muted">Date retrieved</dt>
                <dd style={{ margin: 0 }}>
                  {referenceDate(source.retrievedAt)}
                </dd>
                <dt className="muted">Geographic coverage</dt>
                <dd style={{ margin: 0 }}>{source.coverage}</dd>
                <dt className="muted">Age coverage</dt>
                <dd style={{ margin: 0 }}>{source.ageCoverage}</dd>
                <dt className="muted">Units</dt>
                <dd style={{ margin: 0 }}>{source.units}</dd>
                <dt className="muted">Methodology</dt>
                <dd style={{ margin: 0 }}>{source.methodology}</dd>
                <dt className="muted">Known limitations</dt>
                <dd style={{ margin: 0 }}>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {source.limitations.map((limitation) => (
                      <li key={limitation} style={{ marginBottom: 8 }}>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </dd>
              </dl>
              <a
                className="button"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 18 }}
              >
                Open original source{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              {source.secondaryUrls && source.secondaryUrls.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <p className="eyebrow">Additional official references</p>
                  {source.secondaryUrls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="muted"
                      style={{ display: "block", fontSize: 13 }}
                    >
                      Supporting official report {index + 1}{" "}
                      <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                        style={{ display: "inline" }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      </section>
      <section className="panel prose" style={{ marginTop: 38 }}>
        <h2>Historical turnout and reconciliation</h2>
        <p>
          The certified voters’ roll and the effective election turnout
          denominator are separate fields. Where an IEC report establishes a
          compatible person-based method and gives MEC7 additions, the effective
          turnout electorate includes those additions. Published turnout is
          retained independently of reconstructed rates, and differences caused
          by source definitions or rounding are disclosed.
        </p>
        <p>
          The 2000 reports contain different roll totals, so a reconciled
          effective turnout denominator remains unavailable. The 2006 report
          calculates published participation from ballot papers divided by
          potential ballot papers, rather than participating people divided by
          an electorate. Its 48.40% is preserved with a ballot-pool label; a
          person-level turnout denominator, abstention rate, and changes against
          person-based turnout are unavailable. The 2021 report’s narrative and
          appendix give different participating-voter totals; MORA retains the
          results-appendix figure and flags the discrepancy in the source
          record.
        </p>
        <h2>Geography and time</h2>
        <p>
          Boundaries must match the election period or carry an explicit
          comparability warning. Provincial values are never substituted for
          municipality or ward observations. A changed boundary requires
          documented harmonisation before a geographic trend is treated as
          continuous.
        </p>
        <h2>Observations, interpretation and scenarios</h2>
        <p>
          Observed statistics retain a verified source. Estimates preserve the
          publisher’s method and uncertainty. Analytical commentary is labelled
          as interpretation. Scenario controls and article examples are
          hypothetical demonstrations, not forecasts or electoral evidence.
        </p>
        <h2>Unavailable data and updates</h2>
        <p>
          Unavailable measures are stored as missing values and displayed as
          “Official comparable data unavailable.” To add a dataset, record its
          provenance, validate its definitions and schema, run the calculation
          checks, and confirm that exported tables preserve the source and
          reference date.
        </p>
        <p>
          Primary sources include the{" "}
          <a
            href="https://www.elections.org.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Electoral Commission
          </a>
          ,{" "}
          <a
            href="https://www.statssa.gov.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Statistics South Africa
          </a>
          , the{" "}
          <a
            href="https://www.demarcation.org.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Municipal Demarcation Board
          </a>
          , and official government or gazette publications. Their institutional
          status does not make every proposed comparison compatible.
        </p>
        <Link href="/contact" className="button">
          Suggest a source correction{" "}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
