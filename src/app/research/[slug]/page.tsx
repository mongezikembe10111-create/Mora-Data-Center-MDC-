import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { articles, getArticle } from "@/lib/articles";
import TurnoutArticle from "@/content/research/turnout.mdx";
import YouthArticle from "@/content/research/youth.mdx";
import NonVotingArticle from "@/content/research/nonvoting.mdx";
import ParticipationExplainer from "./participation-explainer";
import ArticleTools from "./article-tools";

const contents = {
  "the-turnout-denominator": TurnoutArticle,
  "understanding-youth-registration": YouthArticle,
  "what-non-voting-can-tell-us": NonVotingArticle,
};

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  return {
    title: article
      ? `${article.title} | MORA Research`
      : "Article unavailable | MORA",
    description: article?.summary,
  };
}

export default async function ResearchArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const Content = contents[slug as keyof typeof contents];
  if (!Content) notFound();

  return (
    <div className="page-shell">
      <Link
        href="/research"
        className="muted"
        style={{
          display: "inline-flex",
          gap: 7,
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Research & insights
      </Link>
      <header className="page-intro">
        <p className="eyebrow">{article.category} · Explainer</p>
        <h1>{article.title}</h1>
        <p className="muted">{article.summary}</p>
        <div
          className="article-meta muted"
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: 13,
            marginTop: 22,
          }}
        >
          <span>
            By <strong style={{ color: "#F5F7FB" }}>MORA</strong>
          </span>
          <time dateTime={article.publishedAt}>11 October 2026</time>
          <span
            style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
          >
            <Clock3 size={14} aria-hidden="true" />
            {article.readingMinutes} min read
          </span>
        </div>
      </header>
      <ArticleTools title={article.title} highlight={article.highlight} />
      <div className="research-layout">
        <aside className="article-toc">
          <nav aria-label="Article contents" className="panel">
            <p className="eyebrow">In this article</p>
            <ol
              style={{
                paddingLeft: 18,
                display: "grid",
                gap: 14,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
              <li>
                <a href="#sources">Source references</a>
              </li>
            </ol>
          </nav>
        </aside>
        <article className="prose">
          <blockquote
            style={{
              margin: "0 0 30px",
              borderLeft: "2px solid #B9F56A",
              paddingLeft: 20,
              color: "#F5F7FB",
              fontSize: 21,
              lineHeight: 1.55,
            }}
          >
            {article.highlight}
          </blockquote>
          <Content components={{ ParticipationExplainer }} />
          <section id="sources" className="panel" style={{ marginTop: 38 }}>
            <p className="eyebrow">Source references & further reading</p>
            <p className="muted" style={{ fontSize: 13 }}>
              The linked IEC reports support the electoral definitions discussed
              here; broader official resources provide further reading. Article
              examples remain explicitly hypothetical. Numerical election
              observations and their known limitations are documented in the
              source register.
            </p>
            <ol style={{ paddingLeft: 20 }}>
              {article.sources.map((source, i) => (
                <li
                  id={`reference-${i + 1}`}
                  key={source.url}
                  style={{ marginBottom: 18 }}
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.organisation}: {source.title}{" "}
                    <ArrowUpRight
                      size={13}
                      aria-hidden="true"
                      style={{ display: "inline" }}
                    />
                  </a>
                  <p
                    className="muted"
                    style={{ fontSize: 13, margin: "6px 0 0" }}
                  >
                    {source.note}
                  </p>
                </li>
              ))}
            </ol>
            <Link href="/methodology">
              Full methodology and source register →
            </Link>
          </section>
        </article>
      </div>
      <section style={{ marginTop: 52 }} aria-labelledby="related-research">
        <p className="eyebrow">Continue reading</p>
        <h2 id="related-research" className="section-title">
          Related research
        </h2>
        <div className="article-grid">
          {articles
            .filter((item) => item.slug !== slug)
            .map((item) => (
              <Link
                className="article-card"
                key={item.slug}
                href={`/research/${item.slug}`}
              >
                <p className="eyebrow">{item.category}</p>
                <h3>{item.title}</h3>
                <p className="muted">{item.summary}</p>
                <span className="muted">
                  {item.readingMinutes} min read{" "}
                  <ArrowUpRight
                    size={15}
                    aria-hidden="true"
                    style={{ display: "inline" }}
                  />
                </span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
