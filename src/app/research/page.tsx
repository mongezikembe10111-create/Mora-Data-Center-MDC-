import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import { articles } from "@/lib/articles";

export const metadata = {
  title: "Research & Insights | MORA",
  description:
    "Independent explainers on South African electoral participation, youth registration and responsible democratic analysis.",
};

export default function ResearchPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Research & insights</p>
        <h1>
          Behind every number,
          <br />a better question.
        </h1>
        <p className="muted">
          Ideas, evidence and methods for understanding South Africa’s
          democratic participation. Published by MORA.
        </p>
      </header>
      <div className="panel" style={{ marginBottom: 28 }}>
        <div className="panel-header">
          <span className="eyebrow">The editorial standard</span>
          <BookOpen size={19} aria-hidden="true" />
        </div>
        <p className="muted">
          These are methodological explainers. Observations, analytical
          interpretation and hypothetical examples are labelled separately. No
          article treats a missing dataset as evidence.
        </p>
      </div>
      <section aria-label="Research articles" className="article-grid">
        {articles.map((article, index) => (
          <Link
            href={`/research/${article.slug}`}
            className="article-card"
            key={article.slug}
          >
            <div className="panel-header">
              <span className="eyebrow">{article.category}</span>
              <span className="muted" aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <div
              className="research-card-graphic"
              aria-hidden="true"
              style={{
                height: 96,
                display: "flex",
                alignItems: "end",
                gap: 9,
                margin: "24px 0",
              }}
            >
              {[28, 45, 68, 56, 85, 100, 75, 45].map((height, i) => (
                <span
                  key={i}
                  style={{
                    height: `${height}%`,
                    flex: 1,
                    background:
                      i === index + 3
                        ? "var(--lime, #B9F56A)"
                        : "var(--surface-elevated, #172235)",
                    borderTop: "1px solid #29374C",
                    borderRadius: "3px 3px 0 0",
                  }}
                />
              ))}
            </div>
            <h2>{article.title}</h2>
            <p className="muted">{article.summary}</p>
            <div
              className="panel-header"
              style={{ marginTop: "auto", paddingTop: 20 }}
            >
              <span
                className="muted"
                style={{ display: "inline-flex", gap: 7, alignItems: "center" }}
              >
                <Clock3 size={14} aria-hidden="true" />
                {article.readingMinutes} min read
              </span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </div>
          </Link>
        ))}
      </section>
      <p className="muted" style={{ marginTop: 22, fontSize: 13 }}>
        Article card graphics are decorative editorial motifs; they do not
        represent an electoral dataset.
      </p>
      <section className="panel" style={{ marginTop: 36 }}>
        <p className="eyebrow">Follow the evidence</p>
        <h2 className="section-title">
          Reproducible analysis starts with definitions.
        </h2>
        <p className="muted">
          Explore the source register, calculation rules and known limitations
          behind this data centre.
        </p>
        <Link href="/methodology" className="button">
          Read the methodology <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
