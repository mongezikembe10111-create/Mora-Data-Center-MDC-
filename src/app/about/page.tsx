import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Fingerprint,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "About The Public Square",
  description:
    "A space to question power. Explore The Public Square’s evidence, public participation tools and editorial principles.",
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">About The Public Square</p>
        <h1>
          A space to
          <br />
          question power.
        </h1>
        <p className="muted">
          People. Data. Ideas. Accountability. The Public Square connects South
          African electoral evidence with practical ways to take part in public
          decisions.
        </p>
      </header>
      <section className="panel prose" style={{ maxWidth: 900 }}>
        <p className="eyebrow">Purpose</p>
        <h2>Informed citizens. Better questions.</h2>
        <p>
          Election information often lives across reports, result portals,
          statistical releases and boundary files. The Public Square brings the
          questions together: who can vote, who registers, who participates, and
          which comparisons the evidence can support.
        </p>
        <p>
          We present source-backed observations, reproducible calculations and
          clearly labelled interpretation so readers can examine the evidence
          for themselves. This platform does not speak for the Electoral
          Commission, Statistics South Africa, Parliament, PMG or any political
          party.
        </p>
        <p>
          The data centre covers election history, registration, age profiles,
          geographic comparisons and participation gaps. The citizen action
          tools bring together sourced bills, consultations, hearing dates,
          oversight reports and a directory of all 257 municipalities.
        </p>
        <p>
          Participation notices form a dated, curated snapshot. They need
          ongoing review, and a missing notice does not mean there is no
          opportunity to take part. When a compatible dataset is absent, the
          interface makes the gap visible instead of inventing a number. The
          available scope is described in the methodology and source register.
        </p>
      </section>
      <section
        className="article-grid"
        style={{ marginTop: 26 }}
        aria-label="Editorial principles"
      >
        {[
          {
            icon: Scale,
            title: "Evidence before narrative",
            text: "Every published metric needs a source, a reference date and a definition. Interpretation follows the evidence.",
          },
          {
            icon: Fingerprint,
            title: "Definitions that travel",
            text: "Citizens and residents, registration and voting, people and ballots: the distinctions remain attached to the numbers.",
          },
          {
            icon: ChartNoAxesCombined,
            title: "Open to examination",
            text: "Data tables, exportable observations and documented calculation rules help readers reproduce the analysis.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article className="panel" key={title}>
            <Icon
              size={24}
              aria-hidden="true"
              style={{ color: "var(--lime)", marginBottom: 18 }}
            />
            <h2 style={{ fontSize: 20 }}>{title}</h2>
            <p className="muted">{text}</p>
          </article>
        ))}
      </section>
      <section className="panel" style={{ marginTop: 32 }}>
        <p className="eyebrow">For researchers, journalists and the public</p>
        <h2 className="section-title">Questions are part of the work.</h2>
        <p className="muted">
          Explore the explainers, examine the methods, follow a consultation or
          flag an issue with the evidence. Original sources, article
          attributions and calculation notes remain available for examination.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link className="button" href="/research">
            Read the research <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link className="button button-primary" href="/participation">
            Find ways to take part <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link className="button" href="/contact">
            Contact & corrections <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
