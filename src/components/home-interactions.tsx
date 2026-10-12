"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  Search,
} from "lucide-react";
import {
  currentProvinceRegistration,
  currentRegistrationObservation,
  elections,
  historicAgeTurnout,
} from "@/lib/data";
import { participationBreakdown } from "@/lib/analytics";
import type { CivicNotice } from "@/lib/civic-data";
import { formatCivicDate, noticeStatus, southAfricaDate } from "@/lib/civic";
import { publicPath } from "@/lib/public-path";
import "./home-interactions.css";

const numberFormat = new Intl.NumberFormat("en-ZA");
const millionFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const compactMillions = (value: number) =>
  `${millionFormat.format(value / 1_000_000)}M`;
const participation2021 = participationBreakdown(
  elections.find((election) => election.year === 2021)!,
);
const previewTabs = ["Participation", "Registration", "Youth"] as const;
type PreviewTab = (typeof previewTabs)[number];

function PreviewBars({
  rows,
  maximum,
  percent = false,
}: {
  rows: { label: string; value: number; highlight?: boolean }[];
  maximum: number;
  percent?: boolean;
}) {
  return (
    <ul className="home-preview-bars">
      {rows.map((row, index) => (
        <li key={row.label}>
          <span className="home-preview-bar-label">{row.label}</span>
          <span className="home-preview-bar-track" aria-hidden="true">
            <span
              className={row.highlight ? "is-highlighted" : undefined}
              style={
                {
                  "--bar-width": `${(row.value / maximum) * 100}%`,
                  "--bar-delay": `${index * 45}ms`,
                } as CSSProperties
              }
            />
          </span>
          <span className="home-preview-bar-value">
            {percent ? `${row.value}%` : compactMillions(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A small data preview: no chart engine or map is needed on the homepage. */
export function DemocracyPreview() {
  const [tab, setTab] = useState<PreviewTab>("Participation");
  const id = useId();
  const gap = participation2021.totalGap!;
  const electorate = participation2021.denominator!;
  const voters = participation2021.voters!;
  const gapRate = participation2021.gapRate!;
  const circumference = 2 * Math.PI * 74;
  const registrationRows = [...currentProvinceRegistration]
    .sort((a, b) => b.registered - a.registered)
    .slice(0, 4)
    .map((record, index) => ({
      label: record.province,
      value: record.registered,
      highlight: index === 0,
    }));
  const preview = {
    Participation: {
      label: "THE PARTICIPATION GAP",
      value: compactMillions(gap),
      description: "People in the effective electorate who did not vote.",
      period: "2021 municipal election",
      source: "IEC municipal election report · 2021",
      href: "/overview?year=2021#participation-gap",
      link: "Explore the participation gap",
    },
    Registration: {
      label: "THE NATIONAL VOTERS’ ROLL",
      value: compactMillions(currentRegistrationObservation.registered),
      description: "Registered people across South Africa’s nine provinces.",
      period: "29 September 2026 snapshot",
      source: "IEC registration statistics · 29 September 2026",
      href: "/registration",
      link: "Explore voter registration",
    },
    Youth: {
      label: "YOUNG VOTERS, HISTORICAL CONTEXT",
      value: "50%",
      description:
        "Published turnout among registered 20–29 year olds in 2016.",
      period: "2016 municipal election · rounded rates",
      source: "IEC 2016 report · Figure 14, printed page 75",
      href: "/youth",
      link: "Open the youth intelligence lab",
    },
  }[tab];

  return (
    <section
      className="home-democracy-preview"
      aria-label="Explore South Africa’s electoral data"
    >
      <div className="home-preview-topline">
        <span className="home-preview-wordmark">DEMOCRACY, BY THE NUMBERS</span>
        <span className="home-preview-verified">
          <CheckCircle2 size={12} aria-hidden="true" /> IEC sources
        </span>
      </div>
      <div
        className="home-preview-tabs"
        role="group"
        aria-label="Choose a data preview"
      >
        {previewTabs.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={tab === name}
            aria-controls={`${id}-panel`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} className="home-preview-content" key={tab}>
        <p className="home-preview-eyebrow">{preview.label}</p>
        <p className="home-preview-value">{preview.value}</p>
        <p className="home-preview-description">{preview.description}</p>
        {tab === "Participation" ? (
          <div className="home-preview-partition">
            <div className="home-preview-ring">
              <svg
                viewBox="0 0 180 180"
                role="img"
                aria-labelledby={`${id}-chart-title`}
              >
                <title id={`${id}-chart-title`}>
                  {`${numberFormat.format(gap)} did not vote and ${numberFormat.format(voters)} participated, out of an effective electorate of ${numberFormat.format(electorate)}.`}
                </title>
                <circle
                  className="home-preview-ring-track"
                  cx="90"
                  cy="90"
                  r="74"
                />
                <circle
                  className="home-preview-ring-value"
                  cx="90"
                  cy="90"
                  r="74"
                  strokeDasharray={`${(gapRate / 100) * circumference} ${circumference}`}
                  transform="rotate(-90 90 90)"
                />
              </svg>
              <span className="home-preview-ring-label" aria-hidden="true">
                <strong>{gapRate.toFixed(2)}%</strong>
                <span>did not vote</span>
              </span>
            </div>
            <dl className="home-preview-legend">
              <div>
                <dt>
                  <span className="home-preview-dot is-lime" />
                  Did not vote
                </dt>
                <dd>{numberFormat.format(gap)}</dd>
              </div>
              <div>
                <dt>
                  <span className="home-preview-dot is-blue" />
                  Participated
                </dt>
                <dd>{numberFormat.format(voters)}</dd>
              </div>
              <div className="home-preview-total">
                <dt>Effective electorate</dt>
                <dd>{numberFormat.format(electorate)}</dd>
              </div>
            </dl>
          </div>
        ) : tab === "Registration" ? (
          <div className="home-preview-bar-section">
            <p className="home-preview-chart-caption">
              Four largest provincial rolls · registered people
            </p>
            <PreviewBars
              rows={registrationRows}
              maximum={registrationRows[0].value}
            />
          </div>
        ) : (
          <div className="home-preview-bar-section is-age-chart">
            <p className="home-preview-chart-caption">
              2016 turnout · original IEC age bands
            </p>
            <PreviewBars
              rows={historicAgeTurnout.map((record) => ({
                label: record.ageGroup,
                value: record.turnout,
                highlight: record.ageGroup === "20–29",
              }))}
              maximum={100}
              percent
            />
          </div>
        )}
        <p className="home-preview-period">{preview.period}</p>
        <p className="home-preview-caveat">
          {tab === "Participation"
            ? "This gap measures participation in the effective electorate; it does not explain why people did not vote."
            : tab === "Registration"
              ? "Registration is a count, not turnout or a legal-eligibility rate."
              : "Historical whole-percent rates; they do not describe youth participation in 2026."}
        </p>
      </div>
      <div className="home-preview-footer">
        <span>{preview.source}</span>
        <Link href={preview.href} prefetch={false}>
          {preview.link} <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

const sphereFilters = [
  { value: "all", label: "All government" },
  { value: "national", label: "National" },
  { value: "provincial", label: "Provincial" },
  { value: "municipal", label: "Municipal" },
] as const;
type SphereFilter = (typeof sphereFilters)[number]["value"];

function relevantDate(notice: CivicNotice, today: string, now: Date) {
  const status = noticeStatus(notice, today, now);
  const dates = [
    status === "open" || status === "upcoming" ? notice.closesOn : undefined,
    notice.eventDate && notice.eventDate >= today
      ? notice.eventDate
      : undefined,
  ].filter((date): date is string => Boolean(date));
  return dates.sort()[0];
}

function OpportunityCard({ notice, now }: { notice: CivicNotice; now: Date }) {
  const today = southAfricaDate(now);
  const status = noticeStatus(notice, today, now);
  const upcomingEvent = Boolean(notice.eventDate && notice.eventDate >= today);
  const statusLabel =
    status === "open"
      ? "Comments open"
      : upcomingEvent
        ? notice.kind === "meeting"
          ? "Meeting upcoming"
          : "Hearing upcoming"
        : status === "upcoming"
          ? "Opening soon"
          : status === "published"
            ? "Published record"
            : status === "undated"
              ? "Dates to confirm"
              : "Archived notice";
  const isActive = status === "open" || status === "upcoming" || upcomingEvent;
  return (
    <article className="home-opportunity-card">
      <div className="home-opportunity-meta">
        <span className="home-opportunity-sphere">{notice.level}</span>
        <span className="home-opportunity-status" data-active={isActive}>
          {statusLabel}
        </span>
      </div>
      <h3>
        <Link href={`/participation/${notice.id}`} prefetch={false}>
          {notice.title}
        </Link>
      </h3>
      <p className="home-opportunity-description">{notice.description}</p>
      <div className="home-opportunity-facts">
        {notice.closesOn && (
          <p>
            <CalendarDays size={14} aria-hidden="true" />
            <span>
              <strong>
                {status === "closed" ? "Comments closed" : "Comment deadline"}
              </strong>
              {formatCivicDate(notice.closesOn)}
              <small>
                {notice.deadlineTime || "Cutoff time not published"}
              </small>
            </span>
          </p>
        )}
        {notice.eventDate && (
          <p>
            <CalendarDays size={14} aria-hidden="true" />
            <span>
              <strong>
                {notice.kind === "meeting" ? "Meeting" : "Hearing / event"}
              </strong>
              {formatCivicDate(notice.eventDate)}
              <small>{notice.time || "Time to confirm with the issuer"}</small>
            </span>
          </p>
        )}
        {!notice.closesOn && !notice.eventDate && (
          <p>
            <FileText size={14} aria-hidden="true" />
            <span>
              <strong>
                {notice.publicationDate ? "Published" : "Source document"}
              </strong>
              {notice.publicationDate
                ? formatCivicDate(notice.publicationDate)
                : "Current dates are not established."}
              <small>No open comment window is assumed.</small>
            </span>
          </p>
        )}
        <p className="home-opportunity-location">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {notice.location ||
              (notice.closesOn
                ? "Written submissions · see the brief for official instructions."
                : "Venue or joining details must be confirmed with the issuer.")}
          </span>
        </p>
      </div>
      <Link
        href={`/participation/${notice.id}`}
        prefetch={false}
        className="home-opportunity-link"
      >
        Read the brief <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function CivicOpportunities({
  notices,
  initialNow,
}: {
  notices: CivicNotice[];
  initialNow: string;
}) {
  const [sphere, setSphere] = useState<SphereFilter>("all");
  const [nowValue, setNowValue] = useState(() => Date.parse(initialNow));
  useEffect(() => {
    setNowValue(Date.now());
    const timer = window.setInterval(() => setNowValue(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const now = useMemo(() => new Date(nowValue), [nowValue]);
  const today = southAfricaDate(now);
  const selection = useMemo(() => {
    const records = notices.filter(
      (notice) => sphere === "all" || notice.level === sphere,
    );
    const active = records.filter((notice) => relevantDate(notice, today, now));
    const isArchive = active.length === 0;
    const selected = [...(isArchive ? records : active)].sort((a, b) => {
      if (!isArchive)
        return relevantDate(a, today, now)!.localeCompare(
          relevantDate(b, today, now)!,
        );
      const aPublished = noticeStatus(a, today, now) === "published";
      const bPublished = noticeStatus(b, today, now) === "published";
      if (aPublished !== bPublished) return aPublished ? -1 : 1;
      return (
        b.publicationDate ||
        b.closesOn ||
        b.eventDate ||
        ""
      ).localeCompare(a.publicationDate || a.closesOn || a.eventDate || "");
    });
    return { records: selected.slice(0, 4), isArchive };
  }, [notices, sphere, today, now]);

  return (
    <div className="home-opportunities">
      <div className="home-opportunities-toolbar">
        <div
          className="home-sphere-filters"
          role="group"
          aria-label="Filter participation opportunities by government sphere"
        >
          {sphereFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={sphere === filter.value}
              onClick={() => setSphere(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span className="home-snapshot-label">
          SOURCE SNAPSHOT · 12 OCT 2026
        </span>
      </div>
      <p className="home-opportunities-context" aria-live="polite">
        {selection.isArchive
          ? "No upcoming dated opportunity is verified in this selection. Explore published documents and earlier notices, then check the issuing institution for updates."
          : "Upcoming deadlines and events from verified source notices. Dates and cutoff times follow South African time."}
      </p>
      <div className="home-opportunities-grid">
        {selection.records.map((notice) => (
          <OpportunityCard key={notice.id} notice={notice} now={now} />
        ))}
        {selection.records.length === 0 && (
          <p className="home-opportunities-empty">
            No source notice has been imported for this selection. The
            participation hub includes official channels to check.
          </p>
        )}
      </div>
      <div className="home-opportunities-footer">
        <p>
          Curated coverage. Confirm changes, access and submission instructions
          with the issuer.
        </p>
        <Link
          href={`/participation${sphere !== "all" ? `?sphere=${sphere}${selection.isArchive ? "&view=all" : ""}` : ""}`}
          prefetch={false}
        >
          Browse participation hub <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

type FinderMunicipality = { code: string; name: string; province: string };
const featuredCodes = ["JHB", "CPT", "ETH", "TSH", "MAN"];
function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function MunicipalityFinder({
  municipalities,
}: {
  municipalities: FinderMunicipality[];
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const { matches, total } = useMemo(() => {
    const tokens = normalizeSearch(query).split(" ").filter(Boolean);
    if (!tokens.length) {
      const featured = featuredCodes
        .map((code) =>
          municipalities.find((municipality) => municipality.code === code),
        )
        .filter((municipality): municipality is FinderMunicipality =>
          Boolean(municipality),
        );
      return {
        matches: featured.length ? featured : municipalities.slice(0, 5),
        total: municipalities.length,
      };
    }
    const found = municipalities.filter((municipality) => {
      const haystack = normalizeSearch(
        `${municipality.name} ${municipality.code} ${municipality.province}`,
      );
      return tokens.every((token) => haystack.includes(token));
    });
    return { matches: found.slice(0, 5), total: found.length };
  }, [municipalities, query]);

  return (
    <div className="home-municipality-finder">
      <form
        className="home-finder-search"
        action={publicPath("/municipalities")}
        method="get"
        role="search"
        aria-label="Find your municipality"
      >
        <Search size={19} aria-hidden="true" />
        <label htmlFor={`${id}-query`} className="sr-only">
          Search a municipality, province or municipal code
        </label>
        <input
          id={`${id}-query`}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Your municipality, province or code"
          maxLength={120}
          autoComplete="off"
          aria-controls={`${id}-results`}
        />
        <button type="submit" aria-label="Search the municipal directory">
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </form>
      <div className="home-finder-results-topline">
        <span aria-live="polite">
          {query.trim()
            ? `${total} ${total === 1 ? "municipality" : "municipalities"} found${total > 5 ? " · first 5 shown" : ""}`
            : "Start with a city, or search your own"}
        </span>
        <span>{municipalities.length} MUNICIPALITIES</span>
      </div>
      <ul id={`${id}-results`} className="home-finder-results">
        {matches.map((municipality) => (
          <li key={municipality.code}>
            <Link
              href={`/municipalities?q=${encodeURIComponent(municipality.code)}`}
              prefetch={false}
            >
              <span className="home-finder-result-icon">
                <MapPin size={17} aria-hidden="true" />
              </span>
              <span className="home-finder-result-name">
                <strong>
                  {municipality.name.replace(
                    / (Metropolitan|District|Local) Municipality$/,
                    "",
                  )}
                </strong>
                <span>
                  {municipality.province} <span aria-hidden="true">·</span>{" "}
                  {municipality.code}
                </span>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {matches.length === 0 && (
        <div className="home-finder-empty">
          <MapPin size={23} aria-hidden="true" />
          <p>
            No matching municipality. Try its official name, province or
            municipal code.
          </p>
          <button type="button" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      )}
      <p className="home-finder-note">
        Official websites, participation, budgets, IDPs and local laws. Topic
        pages are labelled by what has been verified.
      </p>
      <Link
        className="home-finder-all"
        href={`/municipalities${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`}
        prefetch={false}
      >
        {query.trim()
          ? "See these results in the directory"
          : "Explore the complete municipal directory"}{" "}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
