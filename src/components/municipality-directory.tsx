"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  filterMunicipalities,
  municipalities,
  municipalDirectoryCheckedAt,
  municipalProvinces,
  municipalTopics,
  municipalityCsv,
  municipalitySources,
  municipalityTypeLabels,
  type Municipality,
} from "@/lib/municipalities";
import "./municipality-directory.css";

const PAGE_SIZE = 18;
const checkedLabel = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Johannesburg",
}).format(new Date(`${municipalDirectoryCheckedAt}T12:00:00+02:00`));

function ExternalLink({
  href,
  children,
  className,
  title,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
    >
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function PublishedPeriod({ label }: { label: string }) {
  const period = label.match(
    /\b(?:19|20)\d{2}(?:[/-](?:(?:19|20)\d{2}|\d{2}))?\b/,
  )?.[0];
  return period ? (
    <span className="municipal-link-vintage">{period}</span>
  ) : null;
}

function MunicipalityCard({ municipality: m }: { municipality: Municipality }) {
  const participation = m.links.find((link) => link.topic === "participation");
  const primary =
    participation ?? m.links.find((link) => link.topic === "notices");
  return (
    <article className="panel municipal-card">
      <div className="municipal-card-top">
        <span className="badge">{municipalityTypeLabels[m.type]}</span>
        <span className="mono municipal-code">{m.code}</span>
      </div>
      <h3>{m.name}</h3>
      <p className="municipal-province">
        <MapPin size={13} aria-hidden="true" />
        {m.province}
      </p>
      {m.aliases.length > 0 && (
        <p className="municipal-alias">
          Also listed as {m.aliases.join(" / ")}
        </p>
      )}
      {primary ? (
        <ExternalLink
          href={primary.url}
          className="municipal-primary"
          title={primary.label}
        >
          {primary.topic === "participation"
            ? "Public participation"
            : "Public notices"}
          <PublishedPeriod label={primary.label} />
        </ExternalLink>
      ) : m.website ? (
        <ExternalLink href={m.website} className="municipal-primary">
          Official municipal website
        </ExternalLink>
      ) : (
        <ExternalLink href={m.directoryUrl} className="municipal-primary">
          Find municipal contacts
        </ExternalLink>
      )}
      <div
        className="municipal-topic-links"
        aria-label={`Published destinations for ${m.name}`}
      >
        {m.links
          .filter((link) => link !== primary)
          .map((link) => (
            <ExternalLink key={link.topic} href={link.url} title={link.label}>
              {
                municipalTopics.find((topic) => topic.value === link.topic)
                  ?.label
              }
              <PublishedPeriod label={link.label} />
            </ExternalLink>
          ))}
        {primary && m.website && (
          <ExternalLink href={m.website}>Municipal website</ExternalLink>
        )}
        <ExternalLink href={m.directoryUrl}>Contact directory</ExternalLink>
      </div>
      <p
        className={`municipal-coverage ${m.links.length ? "municipal-coverage-confirmed" : ""}`}
      >
        {m.links.length ? (
          <>
            <CheckCircle2 size={13} aria-hidden="true" />
            {m.links.length} verified topic{" "}
            {m.links.length === 1 ? "destination" : "destinations"}
          </>
        ) : (
          <>
            <Info size={13} aria-hidden="true" />
            Topic page not yet verified. Use the website or contact directory.
          </>
        )}
      </p>
      {m.note && <p className="municipal-card-note">{m.note}</p>}
    </article>
  );
}

export default function MunicipalityDirectory() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("all");
  const [type, setType] = useState("all");
  const [topic, setTopic] = useState("all");
  const [page, setPage] = useState(1);
  const [exported, setExported] = useState(false);
  const rows = useMemo(
    () => filterMunicipalities({ search, province, type, topic }),
    [search, province, type, topic],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount);
  const visibleRows = rows.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );
  const directCount = municipalities.filter((m) => m.links.length > 0).length;
  const websiteCount = municipalities.filter((m) => m.website).length;
  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
    setExported(false);
  };
  const reset = () => {
    setSearch("");
    setProvince("all");
    setType("all");
    setTopic("all");
    setPage(1);
    setExported(false);
  };
  const exportCsv = () => {
    const blob = new Blob(["\uFEFF" + municipalityCsv(rows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mora-municipal-participation-directory.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
  };
  return (
    <div className="page-shell municipality-directory">
      <header className="page-intro municipal-intro">
        <p className="eyebrow">Local government · citizen action</p>
        <h1>
          Your municipality.
          <br />
          <span className="lime">Your voice.</span>
        </h1>
        <p className="muted">
          Find your council’s published participation, planning, budget and
          public notice pages. Search every municipality in the directory,
          across all nine provinces.
        </p>
        <div className="municipal-intro-actions">
          <Link href="/participation" className="button">
            Explore public participation{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <span className="municipal-checked">
            Sources checked {checkedLabel}
          </span>
        </div>
      </header>
      <section className="municipal-stat-grid" aria-label="Directory coverage">
        {[
          {
            value: municipalities.length,
            label: "Municipalities in the roster",
            detail: "8 metropolitan · 44 district · 205 local",
          },
          {
            value: websiteCount,
            label: "Published municipal websites",
            detail: "Official Treasury or sourced directory links",
          },
          {
            value: directCount,
            label: "Councils with verified topic pages",
            detail:
              "Specific participation, IDP, budget, by-law or notice destinations",
          },
          {
            value: municipalities.length - directCount,
            label: "Website or directory fallbacks",
            detail: "A specific topic destination still needs verification",
          },
        ].map((stat) => (
          <article className="panel municipal-stat" key={stat.label}>
            <strong className="mono">{stat.value}</strong>
            <h2>{stat.label}</h2>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>
      <section
        className="panel municipal-explainer"
        aria-label="What you can influence"
      >
        <Building2 size={23} aria-hidden="true" />
        <div>
          <h2>Local decisions affect everyday life.</h2>
          <p>
            Municipal councils make <strong>by-laws</strong>. Their Integrated
            Development Plans (IDPs), budgets, tariffs and land-use proposals
            also create opportunities to comment. Open the original notice to
            confirm the closing date, meeting venue and submission instructions.
          </p>
        </div>
      </section>
      <section
        className="panel municipal-controls"
        aria-labelledby="municipal-search-title"
      >
        <div className="municipal-controls-heading">
          <div>
            <p className="eyebrow">Find your council</p>
            <h2 id="municipal-search-title">
              Municipal participation directory
            </h2>
          </div>
          <button
            className="button"
            onClick={exportCsv}
            disabled={!rows.length}
          >
            <Download size={15} aria-hidden="true" />
            Download filtered CSV
          </button>
        </div>
        <div className="municipal-filter-grid">
          <label className="municipal-search-label">
            Municipality name or code
            <div className="municipal-search-box">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={search}
                placeholder="For example: Johannesburg, EC104, Umdoni"
                onChange={(event) => setFilter(setSearch, event.target.value)}
              />
            </div>
          </label>
          <label>
            Province
            <select
              className="select"
              aria-label="Province"
              value={province}
              onChange={(event) => setFilter(setProvince, event.target.value)}
            >
              <option value="all">All provinces</option>
              {municipalProvinces.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Council type
            <select
              className="select"
              aria-label="Council type"
              value={type}
              onChange={(event) => setFilter(setType, event.target.value)}
            >
              <option value="all">All council types</option>
              {Object.entries(municipalityTypeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Verified topic
            <select
              className="select"
              aria-label="Verified topic"
              value={topic}
              onChange={(event) => setFilter(setTopic, event.target.value)}
            >
              <option value="all">All destinations</option>
              {municipalTopics.map(({ value, label }) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="municipal-results-summary">
          <p role="status" aria-live="polite">
            {rows.length}{" "}
            {rows.length === 1 ? "municipality" : "municipalities"} found
            {exported && " · CSV downloaded"}
          </p>
          <button className="municipal-reset" onClick={reset}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Reset filters
          </button>
        </div>
        <p className="municipal-filter-note">
          The topic filter shows councils with a verified link for that topic.
          An absent link does not mean the council offers no opportunity to
          participate.
        </p>
      </section>
      {rows.length ? (
        <>
          <section
            className="municipal-card-grid"
            aria-label="Municipal directory results"
          >
            {visibleRows.map((m) => (
              <MunicipalityCard key={m.code} municipality={m} />
            ))}
          </section>
          <nav className="municipal-pagination" aria-label="Directory pages">
            <button
              className="button"
              disabled={activePage === 1}
              onClick={() => setPage(activePage - 1)}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <p>
              Page <strong>{activePage}</strong> of {pageCount}
              <span>
                {" "}
                · {(activePage - 1) * PAGE_SIZE + 1}–
                {Math.min(activePage * PAGE_SIZE, rows.length)} of {rows.length}
              </span>
            </p>
            <button
              className="button"
              disabled={activePage === pageCount}
              onClick={() => setPage(activePage + 1)}
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </nav>
        </>
      ) : (
        <section className="panel municipal-empty">
          <Search size={26} aria-hidden="true" />
          <h2>No matching municipalities</h2>
          <p className="muted">
            Try a municipality code, former name, another province or “All
            destinations”.
          </p>
          <button className="button" onClick={reset}>
            Reset filters
          </button>
        </section>
      )}
      <section
        className="panel municipal-source-notes"
        aria-labelledby="municipal-source-title"
      >
        <p className="eyebrow">Source trail & coverage</p>
        <h2 id="municipal-source-title">Know where each link comes from.</h2>
        <p>
          Municipality codes, categories and contact details are cross-checked
          with National Treasury’s Municipal Money register. That register
          includes disestablished councils; the active 257-entry roster is
          cross-checked against the Local Government Handbook directory. The
          directory is an independent publication by Yes Media, not a government
          agency.
        </p>
        <p>
          Specific topic links are retained only when linked from the published
          municipal website and retrieved successfully. Website fallbacks come
          from the published source; live access could not be confirmed for
          every site. All link checks describe this snapshot, not an automatic
          live feed. A topic page is not itself proof of an open consultation.
        </p>
        <div className="municipal-source-links">
          {municipalitySources.map((source) => (
            <ExternalLink href={source.url} key={source.id}>
              {source.label}
            </ExternalLink>
          ))}
        </div>
        <p className="municipal-maintenance-note">
          Snapshot checked {checkedLabel}. Follow the original notice for
          deadlines and revisions. Flag corrections through{" "}
          <Link href="/contact">Contact & corrections</Link>.
        </p>
      </section>
    </div>
  );
}
