import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  Fingerprint,
  Landmark,
  MapPin,
  Vote,
} from "lucide-react";
import { articles } from "@/lib/articles";
import { civicNotices, civicCoverage } from "@/lib/civic-data";
import { municipalities } from "@/lib/municipalities";
import { elections, currentRegistrationObservation } from "@/lib/data";
import { participationBreakdown } from "@/lib/analytics";
import { publicPath } from "@/lib/public-path";
import {
  DemocracyPreview,
  CivicOpportunities,
  MunicipalityFinder,
} from "./home-interactions";
import SiteExperience from "./site-experience";
import "./public-square-home.css";

const destinations = [
  {
    number: "01",
    name: "Electoral intelligence",
    href: "/overview",
    icon: BarChart3,
  },
  {
    number: "02",
    name: "Public participation",
    href: "/participation",
    icon: Landmark,
  },
  {
    number: "03",
    name: "Your municipality",
    href: "/municipalities",
    icon: MapPin,
  },
  { number: "04", name: "Research & ideas", href: "/research", icon: BookOpen },
];
const features = [
  {
    title: "Follow the numbers.",
    category: "ELECTIONS & PARTICIPATION",
    description:
      "Explore five municipal elections, the voters’ roll, age profiles and participation gaps. Change the question. See the evidence.",
    href: "/overview",
    link: "Enter the data centre",
    icon: BarChart3,
    theme: "data",
    small: "2000 — 2021 · HISTORICAL ELECTIONS",
  },
  {
    title: "Have a say in the law.",
    category: "BILLS & PUBLIC HEARINGS",
    description:
      "Understand a proposal, check the deadline and prepare a reasoned submission. National, provincial and local decisions, with source documents.",
    href: "/bills",
    link: "Explore proposed laws",
    icon: FileText,
    theme: "law",
    small: "READ · QUESTION · CONTRIBUTE",
  },
  {
    title: "Start where you live.",
    category: "LOCAL GOVERNMENT",
    description:
      "Find public notices, budgets, development plans and participation channels for your council. All 257 municipalities in one directory.",
    href: "/municipalities",
    link: "Find your municipality",
    icon: MapPin,
    theme: "local",
    small: "9 PROVINCES · 257 COUNCILS",
  },
  {
    title: "Ask a better question.",
    category: "RESEARCH & METHODOLOGY",
    description:
      "Read the story behind a statistic. Understand definitions, follow the source and recognise where the evidence ends.",
    href: "/research",
    link: "Read our research",
    icon: BookOpen,
    theme: "research",
    small: "EVIDENCE BEFORE OPINION",
  },
];

export default function PublicSquareHome() {
  const election = elections.find((record) => record.year === 2021)!;
  const gap = participationBreakdown(election, "electorate");
  const count = new Intl.NumberFormat("en-ZA");
  return (
    <div className="square-home">
      <SiteExperience />
      <section className="square-hero" aria-labelledby="square-hero-title">
        <div className="square-hero-atmosphere" aria-hidden="true">
          <div
            className="square-hero-watermark"
            style={{
              backgroundImage: `url(${publicPath("/brand/public-square-mark.svg")})`,
            }}
          />
          <div className="square-orbit square-orbit-one" />
          <div className="square-orbit square-orbit-two" />
        </div>
        <div className="square-hero-topline">
          <span>
            <i /> PEOPLE. DATA. ACCOUNTABILITY.
          </span>
          <span>
            SOUTH AFRICA <span className="square-topline-separator">/</span>{" "}
            PUBLIC INTEREST
          </span>
        </div>
        <div className="square-hero-grid">
          <div className="square-hero-copy">
            <p className="square-kicker">THE PUBLIC SQUARE</p>
            <h1 id="square-hero-title">
              A space to
              <br />
              <span>question</span>
              <br />
              power<span className="square-period">.</span>
            </h1>
            <p className="square-hero-description">
              Understand the decisions that shape your life.
              <br className="square-desktop-break" /> Explore the evidence. Find
              your voice. Take part.
            </p>
            <div className="square-hero-actions">
              <Link
                prefetch={false}
                href="/overview"
                className="square-button square-button-primary"
              >
                Explore the data <ArrowUpRight size={18} />
              </Link>
              <a
                href="#participation-now"
                className="square-button square-button-secondary"
              >
                Find ways to participate <ArrowDown size={17} />
              </a>
            </div>
            <p className="square-hero-topics">
              Politics <span>/</span> Law <span>/</span> Society <span>/</span>{" "}
              Accountability
            </p>
          </div>
          <div className="square-hero-evidence">
            <div className="square-evidence-label">
              <span className="square-mini-cross">+</span> A CLOSER LOOK AT OUR
              DEMOCRACY <span>OPEN DATA</span>
            </div>
            <DemocracyPreview />
            <div className="square-evidence-note">
              <CheckCircle2 size={14} /> Published evidence. Clear definitions.
              Open questions.
            </div>
          </div>
        </div>
        <div className="square-source-strip">
          <span>FOLLOW THE SOURCE</span>
          <a
            href="https://www.elections.org.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Electoral Commission <ArrowUpRight size={12} />
          </a>
          <a
            href="https://www.statssa.gov.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Statistics South Africa <ArrowUpRight size={12} />
          </a>
          <a
            href="https://www.parliament.gov.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Parliament <ArrowUpRight size={12} />
          </a>
          <a
            href="https://pmg.org.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            PMG <ArrowUpRight size={12} />
          </a>
        </div>
      </section>

      <nav
        className="square-destination-strip"
        aria-label="Explore The Public Square"
      >
        {destinations.map(({ number, name, href, icon: Icon }) => (
          <Link prefetch={false} key={href} href={href}>
            <span className="square-destination-number">{number}</span>
            <Icon size={20} />
            <strong>{name}</strong>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </nav>

      <section
        className="square-section square-purpose"
        aria-labelledby="square-purpose-title"
      >
        <div className="square-section-heading">
          <p className="square-kicker">KNOW MORE. TAKE PART.</p>
          <h2 id="square-purpose-title">
            Democracy happens
            <br />
            <span>between elections, too.</span>
          </h2>
          <p>
            The ballot is one part of the story. Public hearings, proposed laws,
            council budgets and development plans are places to shape what
            happens next.
          </p>
        </div>
        <div className="square-feature-grid">
          {features.map(
            ({
              title,
              category,
              description,
              href,
              link,
              icon: Icon,
              theme,
              small,
            }) => (
              <Link
                prefetch={false}
                href={href}
                key={href}
                className={`square-feature square-feature-${theme}`}
              >
                <div className="square-feature-visual" aria-hidden="true">
                  <Icon size={46} strokeWidth={1.2} />
                  <span>{small}</span>
                  {theme === "data" && (
                    <div className="square-mini-bars">
                      {[26, 52, 44, 76, 68, 90, 63, 81].map((height, i) => (
                        <i key={i} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  )}
                  {theme === "law" && (
                    <div className="square-document-lines">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                  {theme === "local" && (
                    <div className="square-map-points">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                  {theme === "research" && (
                    <div className="square-question-mark">?</div>
                  )}
                </div>
                <div className="square-feature-copy">
                  <p className="square-kicker">{category}</p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="square-feature-link">
                    {link}
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </Link>
            ),
          )}
        </div>
      </section>

      <section
        className="square-section square-gap-story"
        aria-labelledby="square-gap-title"
      >
        <div className="square-gap-art">
          <span className="square-kicker">
            2021 MUNICIPAL ELECTION · DOCUMENTED ELECTORATE
          </span>
          <strong>{count.format(gap.totalGap ?? 0)}</strong>
          <span>electorate members did not participate</span>
          <div
            className="square-gap-composition"
            role="img"
            aria-label="2021 effective electorate: 12,063,709 participating voters and 14,239,459 nonparticipants."
          >
            <i />
            <i />
          </div>
          <div className="square-gap-legend">
            <span>
              <i /> Participating voters
            </span>
            <span>
              <i /> Nonparticipants
            </span>
          </div>
          <Link prefetch={false} href="/methodology">
            IEC 2021 report · effective electorate includes MEC7 additions{" "}
            <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="square-gap-copy">
          <p className="square-kicker">THE QUESTION BEHIND THE NUMBER</p>
          <h2 id="square-gap-title">
            Who is missing
            <br />
            from the conversation?
          </h2>
          <p>
            A participation gap deserves an explanation. Our tools separate the
            documented electorate from estimated adult residents, show the
            calculation and explain what each population can tell us.
          </p>
          <Link
            prefetch={false}
            href="/overview#participation-gap"
            className="square-button square-button-secondary"
          >
            Explore participation gaps <ArrowRight size={17} />
          </Link>
          <p className="square-small-note">
            A non-vote is an observed outcome. These counts alone do not
            establish why someone did not vote.
          </p>
        </div>
      </section>

      <section
        className="square-section"
        id="participation-now"
        aria-labelledby="square-participation-title"
      >
        <div className="square-section-heading square-heading-row">
          <div>
            <p className="square-kicker">YOUR NEXT OPPORTUNITY</p>
            <h2 id="square-participation-title">
              Turn understanding
              <br />
              <span>into participation.</span>
            </h2>
          </div>
          <Link
            prefetch={false}
            href="/participation"
            className="square-text-link"
          >
            All notices & source channels <ArrowUpRight size={17} />
          </Link>
        </div>
        <CivicOpportunities
          notices={civicNotices}
          initialNow={new Date().toISOString()}
        />
        <p className="square-source-note">
          Notices checked {civicCoverage.checkedAt}. Coverage is curated; check
          the issuer’s latest notice before submitting or travelling.
        </p>
      </section>

      <section
        className="square-section square-local"
        aria-labelledby="square-local-title"
      >
        <div className="square-local-copy">
          <p className="square-kicker">YOUR STREET. YOUR COUNCIL. YOUR SAY.</p>
          <h2 id="square-local-title">
            Change starts
            <br />
            <span>closer to home.</span>
          </h2>
          <p>
            Find the council responsible for your area and follow its public
            participation, IDP, budget and notice channels.
          </p>
          <div className="square-local-stats">
            <span>
              <strong>{municipalities.length}</strong> municipalities
            </span>
            <span>
              <strong>9</strong> provinces
            </span>
            <span>
              <strong>440</strong> verified topic links
            </span>
          </div>
          <p className="square-small-note">
            Some councils have website fallbacks while specific participation
            destinations await verification.
          </p>
        </div>
        <MunicipalityFinder
          municipalities={municipalities.map(({ code, name, province }) => ({
            code,
            name,
            province,
          }))}
        />
      </section>

      <section
        className="square-section square-research"
        aria-labelledby="square-research-title"
      >
        <div className="square-section-heading square-heading-row">
          <div>
            <p className="square-kicker">IDEAS WITH EVIDENCE BEHIND THEM</p>
            <h2 id="square-research-title">
              A better-informed
              <br />
              <span>public square.</span>
            </h2>
          </div>
          <Link prefetch={false} href="/research" className="square-text-link">
            All research <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="square-research-grid">
          {articles.map((article, index) => (
            <Link
              prefetch={false}
              href={`/research/${article.slug}`}
              key={article.slug}
              className="square-research-card"
            >
              <div
                className={`square-research-art square-research-art-${index}`}
                aria-hidden="true"
              >
                <span>{index === 0 ? "%" : index === 1 ? "18—35" : "?"}</span>
                <div className="square-research-art-rule" />
                <i />
              </div>
              <div className="square-research-body">
                <p className="square-kicker">{article.category}</p>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <div>
                  <span>{article.readingMinutes} MIN READ</span>
                  <ArrowUpRight size={17} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="square-section square-principles"
        aria-labelledby="square-principles-title"
      >
        <div>
          <Fingerprint size={23} />
          <p className="square-kicker">OUR STANDARD</p>
          <h2 id="square-principles-title">
            Evidence before opinion.
            <br />
            People at the centre.
          </h2>
        </div>
        <p>
          Source documents stay visible. Estimates are labelled. Missing
          information remains an open question. You can inspect our methods,
          download the data and challenge a finding.
        </p>
        <Link prefetch={false} href="/methodology" className="square-text-link">
          See how we work <ArrowUpRight size={17} />
        </Link>
      </section>

      <section
        className="square-section square-final-cta"
        aria-labelledby="square-final-title"
      >
        <div>
          <p className="square-kicker">
            A STRONGER PUBLIC SQUARE STARTS WITH YOU
          </p>
          <h2 id="square-final-title">
            Stay informed.
            <br />
            <span>Make your voice count.</span>
          </h2>
          <p>
            Register with the IEC. Follow Parliament with free PMG alerts. Come
            back with better questions.
          </p>
        </div>
        <div className="square-final-actions">
          <a
            href="https://registertovote.elections.org.za/"
            target="_blank"
            rel="noopener noreferrer"
            className="square-button square-button-primary"
          >
            <Vote size={18} /> Register to vote <ArrowUpRight size={16} />
          </a>
          <a
            href="https://pmg.org.za/email-alerts/"
            target="_blank"
            rel="noopener noreferrer"
            className="square-button square-button-secondary"
          >
            Subscribe to free PMG updates <ArrowUpRight size={16} />
          </a>
          <p>
            PMG requires a free account. Registration for the 4 November 2026
            municipal election closed at proclamation on 7 August; check your
            details and future options with the IEC.
          </p>
        </div>
      </section>
      <span className="sr-only">
        The latest verified national registration snapshot is{" "}
        {count.format(currentRegistrationObservation.registered)} people on 29
        September 2026.
      </span>
    </div>
  );
}
