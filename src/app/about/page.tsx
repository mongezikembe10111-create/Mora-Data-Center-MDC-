import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Fingerprint,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "About MORA | MORA Data Centre",
  description:
    "The purpose, editorial principles and scope of MORA Data Centre.",
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">About MORA</p>
        <h1>
          Democracy,
          <br />
          by the numbers.
        </h1>
        <p className="muted">
          MORA Data Centre is an evidence-led interface for exploring South
          African electoral participation. Beyond the vote. Into the data.
        </p>
      </header>
      <section className="panel prose" style={{ maxWidth: 900 }}>
        <p className="eyebrow">Purpose</p>
        <h2>A clearer view of participation.</h2>
        <p>
          Election information often lives across reports, result portals,
          statistical releases and boundary files. MORA brings the questions
          together: who can vote, who registers, who participates, and which
          comparisons the evidence can support.
        </p>
        <p>
          Our editorial approach is politically neutral. We present
          source-backed observations, reproducible calculations and clearly
          labelled interpretation. We do not speak for the Electoral Commission,
          Statistics South Africa or any political party.
        </p>
        <p>
          This initial release prioritises a trustworthy foundation. When a
          compatible dataset is absent, the interface makes the gap visible
          instead of inventing a number. The available scope is described in the
          methodology and source register.
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
              style={{ color: "#B9F56A", marginBottom: 18 }}
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
          Explore the explainers, examine the methods or flag an issue with the
          evidence. Research articles are attributed to MORA. Source checks and
          methodology notes remain open to scrutiny.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link className="button" href="/research">
            Read the research <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link className="button" href="/contact">
            Contact & corrections <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
