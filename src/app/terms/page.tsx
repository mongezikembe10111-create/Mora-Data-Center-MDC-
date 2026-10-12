import Link from "next/link";

export const metadata = {
  title: "Terms of Use | The Public Square",
  description:
    "Responsible use of The Public Square’s research, civic notices, source data and scenario tools.",
};

export default function TermsPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Terms of use · 12 October 2026</p>
        <h1>
          Use the evidence.
          <br />
          Keep its context.
        </h1>
        <p className="muted">
          The Public Square connects public electoral information, transparent
          analysis and source-linked opportunities for citizen action.
        </p>
      </header>
      <article className="prose panel" style={{ maxWidth: 900 }}>
        <h2>Research scope</h2>
        <p>
          Information is provided for research and general understanding. The
          Public Square is not an official election-results service, legal
          adviser, electoral authority or political representative. Confirm
          consequential election, registration and legal information with the
          relevant official authority.
        </p>
        <h2>Dates, definitions and uncertainty</h2>
        <p>
          Historical observations are not current forecasts. A published
          estimate remains an estimate. Missing data is not zero. Scenario
          outputs and article demonstrations are hypothetical and must not be
          presented as observed election results or predictions.
        </p>
        <p>
          When quoting a metric, retain its source, observation date, geography,
          units and relevant limitations. Consult the{" "}
          <Link href="/methodology">methodology</Link> before combining
          observations.
        </p>
        <h2>Source rights and reuse</h2>
        <p>
          Original datasets and external publications remain subject to their
          publishers’ licences and terms. A link or CSV export does not grant
          additional rights. Consult the original source before redistribution.
          Attribute original sources and identify The Public Square’s derived
          calculations when reproducing them.
        </p>
        <h2>Corrections and availability</h2>
        <p>
          Civic notices are a curated snapshot, not a complete live feed of all
          government activity. Confirm deadlines, venues, joining arrangements
          and submission instructions with the issuer before acting. A verified
          municipal topic page does not establish that a consultation is open.
        </p>
        <p>
          Sources, routes and datasets can change. We aim to make limitations
          visible and corrections reproducible, but no completeness or
          uninterrupted-availability guarantee is provided by this research
          build. Report a reproducible source or calculation issue through{" "}
          <Link href="/contact">Contact & corrections</Link>.
        </p>
        <h2>Responsible interaction</h2>
        <p>
          Do not submit personal or sensitive information to public repository
          issues. Respect the terms of linked services and do not misuse the
          application to misrepresent electoral evidence.
        </p>
        <p className="muted">
          Production operators should review these terms and add their legal
          identity, jurisdiction and private contact details before operating a
          public service that collects personal information or enters into user
          agreements.
        </p>
      </article>
    </div>
  );
}
