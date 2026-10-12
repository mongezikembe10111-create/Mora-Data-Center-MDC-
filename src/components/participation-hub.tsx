"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  Download,
  FileText,
  Landmark,
  MapPin,
  Search,
  Share2,
  Vote,
} from "lucide-react";
import {
  civicChannels,
  civicCoverage,
  civicNotices,
  civicResources,
  type CivicChannel,
  type CivicNotice,
} from "@/lib/civic-data";
import {
  formatCivicDate,
  noticeStatus,
  southAfricaDate,
  type CivicNoticeStatus,
} from "@/lib/civic";
import "./civic.css";

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
const statusLabels: Record<CivicNoticeStatus, string> = {
  open: "Open for submissions",
  upcoming: "Upcoming",
  closed: "Submissions closed",
  "past-event": "Event passed",
  undated: "Date to confirm",
  published: "Published record",
};
const kindLabels = {
  bill: "Bill / draft law",
  hearing: "Public hearing",
  comment: "Public comment",
  meeting: "Public meeting",
  report: "Report",
};
type Filters = {
  query: string;
  level: string;
  province: string;
  kind: string;
  status: string;
  view: "active" | "archive" | "all";
};
const emptyFilters: Filters = {
  query: "",
  level: "all",
  province: "all",
  kind: "all",
  status: "all",
  view: "active",
};

function getUrlFilters(billsOnly: boolean): Filters {
  const params = new URLSearchParams(window.location.search);
  const level = params.get("sphere") || "all";
  const province = params.get("province") || "all";
  const kind = params.get("kind") || "all";
  const status = params.get("status") || "all";
  const view = params.get("view") || "active";
  return {
    query: (params.get("q") || "").slice(0, 200),
    level: ["national", "provincial", "municipal"].includes(level)
      ? level
      : "all",
    province: provinces.includes(province) ? province : "all",
    kind: !billsOnly && Object.keys(kindLabels).includes(kind) ? kind : "all",
    status: Object.keys(statusLabels).includes(status) ? status : "all",
    view: view === "archive" || view === "all" ? view : "active",
  };
}

export function CivicSectionNav({
  active,
}: {
  active: "participation" | "bills" | "municipalities";
}) {
  return (
    <nav aria-label="Citizen participation" className="civic-section-nav">
      <Link
        href="/participation"
        aria-current={active === "participation" ? "page" : undefined}
      >
        Participation hub
      </Link>
      <Link
        href="/bills"
        aria-current={active === "bills" ? "page" : undefined}
      >
        Bills & local law
      </Link>
      <Link
        href="/municipalities"
        aria-current={active === "municipalities" ? "page" : undefined}
      >
        Municipal directory
      </Link>
      <Link href="/registration">Electoral registration</Link>
    </nav>
  );
}

function NoticeCard({
  notice,
  today,
  now,
}: {
  notice: CivicNotice;
  today: string;
  now: Date;
}) {
  const status = noticeStatus(notice, today, now);
  return (
    <article className="civic-notice-card">
      <div className="civic-notice-tags">
        <span className="badge">
          {notice.level === "national"
            ? "National"
            : notice.level === "provincial"
              ? notice.province || "Provincial"
              : "Municipal"}
        </span>
        <span className="badge">
          {notice.kind === "bill" && notice.level === "municipal"
            ? "Draft local law"
            : kindLabels[notice.kind]}
        </span>
        <span className="badge civic-status" data-status={status}>
          {statusLabels[status]}
        </span>
        {notice.proposalType === "draft-rules" && (
          <span className="badge">Draft municipal rules</span>
        )}
      </div>
      <h3>
        <Link href={`/participation/${notice.id}`}>{notice.title}</Link>
      </h3>
      <p className="muted">{notice.description}</p>
      <div className="civic-notice-facts">
        {notice.closesOn && (
          <p>
            <CalendarDays size={15} aria-hidden="true" />
            <span>
              {notice.closesOn === today
                ? "Deadline today: "
                : "Submission deadline: "}
              <strong>{formatCivicDate(notice.closesOn)}</strong>
              {notice.deadlineTime
                ? ` · ${notice.deadlineTime}`
                : " · exact cutoff in source"}
            </span>
          </p>
        )}
        {notice.eventDate && (
          <p>
            <CalendarDays size={15} aria-hidden="true" />
            <span>
              Event: {formatCivicDate(notice.eventDate)}
              {notice.time ? ` · ${notice.time}` : " · time to confirm"}
            </span>
          </p>
        )}
        {notice.location && (
          <p>
            <MapPin size={15} aria-hidden="true" />
            <span>{notice.location}</span>
          </p>
        )}
        {!notice.closesOn && !notice.eventDate && (
          <p>
            <FileText size={15} aria-hidden="true" />
            <span>
              {notice.publicationDate
                ? `Published ${formatCivicDate(notice.publicationDate)}`
                : "Read the source for the current stage and dates."}
            </span>
          </p>
        )}
      </div>
      <div className="civic-notice-bottom">
        <Link href={`/participation/${notice.id}`} className="civic-text-link">
          Read brief & instructions <ArrowRight size={15} aria-hidden="true" />
        </Link>
        <span className="civic-verified">
          <a href={notice.sourceUrl} target="_blank" rel="noopener noreferrer">
            Source notice ↗
          </a>
          <span>Checked {formatCivicDate(notice.verifiedAt)}</span>
        </span>
      </div>
    </article>
  );
}

function ChannelCard({ channel }: { channel: CivicChannel }) {
  return (
    <article className="civic-channel-card">
      <span className="badge">{channel.province || channel.level}</span>
      <h3>{channel.name}</h3>
      <p className="muted">{channel.description}</p>
      <a
        href={channel.participationUrl || channel.url}
        className="civic-text-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Check latest notices <ArrowUpRight size={15} aria-hidden="true" />
      </a>
      {channel.billsUrl && (
        <p>
          <a
            className="civic-text-link"
            href={channel.billsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Bills & legislation <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </p>
      )}
      {channel.note && <p className="muted">{channel.note}</p>}
      <span className="civic-verified">
        {channel.verifiedAt
          ? `${channel.verification === "directory-verified" ? "Directory entry checked" : "Source checked"} ${formatCivicDate(channel.verifiedAt)}`
          : "Destination has not been verified in this snapshot."}
      </span>
    </article>
  );
}

export function CivicResources() {
  return (
    <section
      className="panel"
      id="pmg-resources"
      aria-labelledby="civic-resources-title"
    >
      <p className="eyebrow">Keep following the evidence</p>
      <h2 id="civic-resources-title">Public information, within reach.</h2>
      <div className="civic-resources">
        {civicResources
          .filter((resource) => resource.kind !== "register")
          .map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <strong>{resource.title}</strong>
                <span className="muted">{resource.description}</span>
                {resource.note && (
                  <span
                    className="muted"
                    style={{ display: "block", marginTop: 5 }}
                  >
                    {resource.note}
                  </span>
                )}
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          ))}
      </div>
    </section>
  );
}

export default function ParticipationHub({
  initialNow,
  billsOnly = false,
}: {
  initialNow: string;
  billsOnly?: boolean;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const today = southAfricaDate(now);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [hydrated, setHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const registration = civicResources.find(
    (resource) => resource.kind === "register",
  );
  const subscription = civicResources.find(
    (resource) => resource.kind === "subscribe",
  );

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const restore = () => setFilters(getUrlFilters(billsOnly));
    restore();
    refresh();
    setHydrated(true);
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("popstate", restore);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("popstate", restore);
    };
  }, [billsOnly]);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href);
    for (const key of ["q", "sphere", "province", "kind", "status", "view"])
      url.searchParams.delete(key);
    if (filters.query) url.searchParams.set("q", filters.query);
    if (filters.level !== "all") url.searchParams.set("sphere", filters.level);
    if (filters.province !== "all")
      url.searchParams.set("province", filters.province);
    if (filters.kind !== "all") url.searchParams.set("kind", filters.kind);
    if (filters.status !== "all")
      url.searchParams.set("status", filters.status);
    if (filters.view !== "active") url.searchParams.set("view", filters.view);
    window.history.replaceState(null, "", url);
    setShareStatus("");
  }, [filters, hydrated]);

  const records = useMemo(
    () =>
      civicNotices.filter(
        (notice) =>
          !billsOnly ||
          notice.kind === "bill" ||
          notice.proposalType === "draft-bylaw" ||
          notice.proposalType === "draft-rules",
      ),
    [billsOnly],
  );
  const visible = useMemo(
    () =>
      records
        .filter((notice) => {
          const status = noticeStatus(notice, today, now);
          if (filters.status !== "all" && filters.status !== status)
            return false;
          const archived =
            (status === "closed" || status === "past-event") &&
            !(notice.eventDate && notice.eventDate >= today);
          if (
            (filters.view === "active" && archived) ||
            (filters.view === "archive" && !archived)
          )
            return false;
          if (filters.level !== "all" && notice.level !== filters.level)
            return false;
          if (
            filters.province !== "all" &&
            notice.province !== filters.province
          )
            return false;
          if (
            filters.kind !== "all" &&
            !(filters.kind === "hearing" && notice.eventDate) &&
            notice.kind !== filters.kind
          )
            return false;
          const searchable =
            `${notice.title} ${notice.description} ${notice.province || ""} ${notice.location || ""}`.toLocaleLowerCase(
              "en-ZA",
            );
          return searchable.includes(
            filters.query.trim().toLocaleLowerCase("en-ZA"),
          );
        })
        .sort((left, right) => {
          const leftDate = left.closesOn || left.eventDate || "9999-12-31";
          const rightDate = right.closesOn || right.eventDate || "9999-12-31";
          return filters.view === "archive"
            ? rightDate.localeCompare(leftDate)
            : leftDate.localeCompare(rightDate);
        }),
    [records, filters, today, now],
  );
  const openCount = records.filter(
    (notice) => noticeStatus(notice, today, now) === "open",
  ).length;
  const relevantChannels = civicChannels.filter(
    (channel) =>
      (filters.level === "all" || channel.level === filters.level) &&
      (filters.province === "all" || channel.province === filters.province),
  );

  function update(field: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "status" && value !== "all"
        ? { view: "all" as const }
        : {}),
    }));
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied. It includes your current filters.");
    } catch {
      setShareStatus(
        `Copy the address in your browser to share these filters.`,
      );
    }
  }
  function exportNotices() {
    const safeCell = (value: unknown) => {
      const text = String(value ?? "");
      return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
    };
    const rows = [
      [
        "Title",
        "Sphere",
        "Province",
        "Type",
        "Status as of South African date",
        "Status date",
        "Submission deadline",
        "Deadline time",
        "Event date",
        "Event time as supplied",
        "Location as supplied",
        "Brief",
        "Source",
        "Verified on",
      ],
      ...visible.map((notice) => [
        notice.title,
        notice.level,
        notice.province,
        notice.kind,
        noticeStatus(notice, today, now),
        today,
        notice.closesOn,
        notice.deadlineTime,
        notice.eventDate,
        notice.time,
        notice.location,
        notice.description,
        notice.sourceUrl,
        notice.verifiedAt,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        [
          "\uFEFF" +
            rows.map((row) => row.map(safeCell).join(",")).join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `mora-${billsOnly ? "bills" : "participation"}-${today}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="page-shell civic-shell">
      <header className="civic-hero">
        <p className="eyebrow">Citizen participation · South Africa</p>
        <h1>
          {billsOnly ? (
            <>
              Understand the law.
              <br />
              Help shape what follows.
            </>
          ) : (
            <>
              Democracy needs
              <br />
              your voice.
            </>
          )}
        </h1>
        <p className="muted">
          {billsOnly
            ? "Read plain-language briefs, source texts and comment deadlines for national or provincial bills and municipal draft by-laws or rules. Municipal rules are labelled separately from parliamentary bills."
            : "Find opportunities to influence laws, attend hearings, follow public decisions and make a reasoned submission. Start with the evidence. Act through the official channel."}
        </p>
        <div className="civic-actions">
          {registration && (
            <a
              className="button button-primary"
              href={registration.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Vote size={16} aria-hidden="true" /> Register to vote with the
              IEC <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
          {subscription && (
            <a
              className="button"
              href={subscription.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe to free PMG updates{" "}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>
        {registration && (
          <p className="muted" style={{ fontSize: 12 }}>
            Registration for the 4 November 2026 municipal election closed when
            it was proclaimed. Check your registration, address and current
            options with the IEC.
          </p>
        )}
      </header>
      <CivicSectionNav active={billsOnly ? "bills" : "participation"} />
      {billsOnly ? (
        <section className="panel civic-bill-note">
          <p className="eyebrow">Know the instrument</p>
          <h2 className="section-title">
            A bill is a proposal, before it becomes law.
          </h2>
          <p className="muted">
            Parliament and provincial legislatures consider bills. Municipal
            councils adopt by-laws; their draft by-laws, IDPs and budgets have
            separate public participation processes. This view lists verified
            bill or draft-law notices. Find consultations on policy, planning
            and budgets in the participation hub and municipal directory.
          </p>
          <Link className="civic-text-link" href="/participation">
            All consultation types <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <div className="civic-action-grid">
          <section className="civic-action-card">
            <Vote size={25} aria-hidden="true" />
            <h2>Make your vote count.</h2>
            <p className="muted">
              Register or update your address with the IEC. Registration is a
              first step; participation also means voting and staying informed
              between elections.
            </p>
            <Link className="civic-text-link" href="/registration">
              Understand registration{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
          <section className="civic-action-card">
            <FileText size={25} aria-hidden="true" />
            <h2>Help shape public decisions.</h2>
            <p className="muted">
              Read the proposal, identify the clauses that affect you and
              explain a practical change. Below, each notice has a brief, dates
              and source instructions.
            </p>
            <a className="civic-text-link" href="#participation-notices">
              Find a participation notice{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </section>
          <section className="civic-action-card">
            <Landmark size={25} aria-hidden="true" />
            <h2>Follow your council.</h2>
            <p className="muted">
              Local budgets, development plans and draft by-laws affect daily
              life. Find municipal websites and their public participation
              channels.
            </p>
            <Link className="civic-text-link" href="/municipalities">
              Open municipal directory{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </div>
      )}
      <section
        id="participation-notices"
        aria-labelledby="participation-notices-title"
      >
        <div className="civic-section-heading">
          <div>
            <p className="eyebrow">Verified source notices</p>
            <h2 id="participation-notices-title">
              {billsOnly
                ? "Bills & draft local law"
                : "Find your next opportunity."}
            </h2>
            <p className="muted">
              Deadlines are checked against {formatCivicDate(today)} in South
              Africa. An open date does not guarantee a notice is unchanged;
              always confirm the latest source.
            </p>
          </div>
          <span className="badge badge-lime">
            <CheckCheck size={13} aria-hidden="true" />
            {openCount} dated submission window{openCount === 1 ? "" : "s"} open
          </span>
        </div>
        <div className="civic-filter-panel">
          <div className="civic-filter-grid" data-bills-only={billsOnly}>
            <label htmlFor="civic-query">
              <span>
                <Search
                  size={13}
                  style={{ verticalAlign: "middle", marginRight: 5 }}
                  aria-hidden="true"
                />
                Search notices
              </span>
              <input
                id="civic-query"
                type="search"
                placeholder="Bill, topic, place…"
                value={filters.query}
                maxLength={200}
                onChange={(event) => update("query", event.target.value)}
              />
            </label>
            <label htmlFor="civic-sphere">
              Sphere of government
              <select
                id="civic-sphere"
                value={filters.level}
                onChange={(event) => update("level", event.target.value)}
              >
                <option value="all">All spheres</option>
                <option value="national">National</option>
                <option value="provincial">Provincial</option>
                <option value="municipal">Municipal</option>
              </select>
            </label>
            <label htmlFor="civic-province">
              Province
              <select
                id="civic-province"
                value={filters.province}
                onChange={(event) => update("province", event.target.value)}
              >
                <option value="all">All provinces</option>
                {provinces.map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
            {!billsOnly && (
              <label htmlFor="civic-kind">
                Participation type
                <select
                  id="civic-kind"
                  value={filters.kind}
                  onChange={(event) => update("kind", event.target.value)}
                >
                  <option value="all">All types</option>
                  {Object.entries(kindLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label htmlFor="civic-status">
              Notice status
              <select
                id="civic-status"
                value={filters.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="civic-filter-bottom">
            <div className="civic-tabs" role="group" aria-label="Notice period">
              <button
                type="button"
                aria-pressed={filters.view === "active"}
                onClick={() => update("view", "active")}
              >
                Current & published
              </button>
              <button
                type="button"
                aria-pressed={filters.view === "archive"}
                onClick={() => update("view", "archive")}
              >
                Closed & past
              </button>
              <button
                type="button"
                aria-pressed={filters.view === "all"}
                onClick={() => update("view", "all")}
              >
                All records
              </button>
            </div>
            <button
              className="button button-sm"
              type="button"
              onClick={() => setFilters(emptyFilters)}
            >
              Reset filters
            </button>
          </div>
        </div>
        <div className="civic-result-info">
          <span role="status" aria-live="polite">
            <strong>{visible.length}</strong> notice
            {visible.length === 1 ? "" : "s"} match your filters
          </span>
          <button
            className="button button-sm"
            type="button"
            disabled={visible.length === 0}
            onClick={exportNotices}
          >
            <Download size={13} aria-hidden="true" /> Download notices CSV
          </button>
          <button className="button button-sm" type="button" onClick={share}>
            <Share2 size={13} aria-hidden="true" /> Share this view
          </button>
        </div>
        <p className="civic-share-status" role="status">
          {shareStatus}
        </p>
        {visible.length > 0 ? (
          <div className="civic-notice-grid">
            {visible.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                today={today}
                now={now}
              />
            ))}
          </div>
        ) : (
          <div className="civic-empty">
            <h3>No verified notices match this view.</h3>
            <p className="muted">
              This does not mean there are no participation opportunities. Check
              the official channels below for notices published after this
              snapshot, change your filters, or browse closed records for the
              history of a proposal.
            </p>
            <div className="civic-actions">
              <button
                className="button"
                type="button"
                onClick={() => setFilters(emptyFilters)}
              >
                Reset filters
              </button>
              <button
                className="button button-outline"
                type="button"
                onClick={() => update("view", "all")}
              >
                Include all records
              </button>
              <Link className="button button-outline" href="/municipalities">
                Find a municipal channel
              </Link>
            </div>
          </div>
        )}
        <div className="civic-coverage-note">
          <p>
            <strong>Coverage, openly stated.</strong>{" "}
            {civicCoverage.description} Source review:{" "}
            {formatCivicDate(civicCoverage.checkedAt)}.
          </p>
          {civicCoverage.limitations.map((limitation) => (
            <p key={limitation}>{limitation}</p>
          ))}
        </div>
      </section>
      <section
        className="civic-channel-section"
        aria-labelledby="civic-channels-title"
      >
        <div className="civic-section-heading">
          <div>
            <p className="eyebrow">Check the issuing institutions</p>
            <h2 id="civic-channels-title">
              Stay connected to public participation.
            </h2>
            <p className="muted">
              These channels publish fresh calls, hearing arrangements,
              committee work and legislative documents. Your sphere and province
              filters also narrow this directory.
            </p>
          </div>
        </div>
        <div className="civic-channel-grid">
          {relevantChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
        {relevantChannels.length === 0 && (
          <p className="muted">
            No channel in this directory matches these filters. Municipal
            channels are listed separately in the municipal directory.
          </p>
        )}
        <div className="civic-actions">
          <Link className="button" href="/municipalities">
            Browse all municipal websites{" "}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="civic-guide">
        <section className="panel" aria-labelledby="civic-guide-title">
          <p className="eyebrow">A useful submission</p>
          <h2 id="civic-guide-title">Be clear. Be specific. Be heard.</h2>
          <ol>
            <li>
              <strong>Read the actual proposal.</strong> The source notice
              contains the document, scope and participation rules.
            </li>
            <li>
              <strong>Identify the issue.</strong> Name the clause, page, budget
              item or decision you want the authority to consider.
            </li>
            <li>
              <strong>Explain the effect.</strong> Support your view with
              evidence, experience and a practical alternative.
            </li>
            <li>
              <strong>Follow the channel and deadline.</strong> Use the issuing
              authority’s instructions. Request acknowledgment and keep a dated
              copy.
            </li>
            <li>
              <strong>Follow what happens next.</strong> Read the committee
              report or council response and check whether the proposal changed.
            </li>
          </ol>
        </section>
        <CivicResources />
      </div>
    </div>
  );
}
