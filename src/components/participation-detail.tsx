"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarPlus,
  Download,
  FileText,
  Share2,
} from "lucide-react";
import { civicNotices, civicSources, type CivicNotice } from "@/lib/civic-data";
import { formatCivicDate, noticeStatus, southAfricaDate } from "@/lib/civic";
import { civicCalendar, type CivicCalendarKind } from "@/lib/civic-calendar";
import { CivicSectionNav } from "./participation-hub";
import "./civic.css";

type Draft = {
  author: string;
  issue: string;
  proposal: string;
  evidence: string;
};
const initialDraft: Draft = {
  author: "",
  issue: "",
  proposal: "",
  evidence: "",
};

function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ParticipationDetail({
  notice,
  initialNow,
}: {
  notice: CivicNotice;
  initialNow: string;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [draftStatus, setDraftStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const today = southAfricaDate(now);
  const status = noticeStatus(notice, today, now);
  const isClosed = status === "closed" || status === "past-event";
  const related = civicNotices.find(
    (item) => item.id === notice.relatedNoticeId,
  );
  const source = civicSources.find((item) => item.id === notice.sourceId);
  const deadlineCalendar =
    !isClosed && notice.closesOn ? civicCalendar(notice, "deadline") : null;
  const eventCalendar =
    notice.eventDate && notice.eventDate >= today
      ? civicCalendar(notice, "event")
      : null;
  const statusText =
    status === "open"
      ? "Open for submissions"
      : status === "upcoming"
        ? "Upcoming"
        : status === "closed"
          ? "Submission window closed"
          : status === "past-event"
            ? "Past event"
            : status === "published"
              ? "Published record"
              : "Date to confirm";

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  function update(field: keyof Draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setDraftStatus("");
  }
  function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = [
      "PUBLIC PARTICIPATION SUBMISSION — UNSENT DRAFT",
      `Subject: ${notice.title}`,
      `Prepared on: ${today} (South Africa)`,
      `Author / organisation: ${draft.author.trim() || "Add your name or organisation if required by the notice"}`,
      "",
      "ISSUE / CLAUSE / PAGE",
      draft.issue.trim(),
      "",
      "PROPOSED CHANGE / RECOMMENDATION",
      draft.proposal.trim(),
      "",
      "REASONS AND SUPPORTING EVIDENCE",
      draft.evidence.trim(),
      "",
      "SOURCE AND SUBMISSION ARRANGEMENTS",
      notice.sourceUrl,
      ...(notice.billUrl ? [`Proposal document: ${notice.billUrl}`] : []),
      ...(notice.closesOn
        ? [
            `Source deadline: ${notice.closesOn}${notice.deadlineTime ? `, ${notice.deadlineTime}` : "; verify exact cutoff time in the source"}`,
          ]
        : []),
      ...(notice.contact ? [`Source contact: ${notice.contact}`] : []),
      ...notice.instructions.map(
        (instruction, index) => `${index + 1}. ${instruction}`,
      ),
      "",
      "This draft has not been sent. Check the current official notice, required format, deadline and privacy rules. Submit it yourself through the issuing authority's stated channel and keep an acknowledgment. Do not assume a closed window accepts late submissions.",
    ].join("\n");
    downloadFile(
      text,
      `mora-${notice.id}-submission-draft.txt`,
      "text/plain;charset=utf-8",
    );
    setDraftStatus(
      "Draft downloaded to your device. It has not been sent. Use the source instructions to submit it yourself.",
    );
  }
  function calendar(kind: CivicCalendarKind) {
    const content = civicCalendar(notice, kind);
    if (content)
      downloadFile(
        content,
        `mora-${notice.id}-${kind}.ics`,
        "text/calendar;charset=utf-8",
      );
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Notice link copied.");
    } catch {
      setShareStatus(
        "Copy this page’s address from your browser to share the notice.",
      );
    }
  }

  return (
    <div className="page-shell civic-shell">
      <nav className="civic-breadcrumb" aria-label="Breadcrumb">
        <Link href="/participation">
          <ArrowLeft
            size={13}
            style={{ verticalAlign: "middle", marginRight: 6 }}
            aria-hidden="true"
          />
          Participation hub
        </Link>
        <span aria-hidden="true">/</span>
        <span>Source notice</span>
      </nav>
      <header className="civic-hero">
        <p className="eyebrow">
          {notice.level} participation
          {notice.province ? ` · ${notice.province}` : ""}
        </p>
        <h1>{notice.title}</h1>
        <p className="muted">{notice.description}</p>
        <div className="civic-notice-tags">
          <span className="badge civic-status" data-status={status}>
            {statusText}
          </span>
          <span className="badge">
            Source checked {formatCivicDate(notice.verifiedAt)}
          </span>
          <span className="badge">
            Status as of {formatCivicDate(today)} · SAST
          </span>
        </div>
        <div className="civic-actions">
          <a
            href={notice.sourceUrl}
            className="button button-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the source notice <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          {notice.billUrl && (
            <a
              href={notice.billUrl}
              className="button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText size={15} aria-hidden="true" />
              Read the proposal document{" "}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
          <button
            className="button button-outline"
            type="button"
            onClick={share}
          >
            <Share2 size={14} aria-hidden="true" />
            Share notice
          </button>
        </div>
        <p className="civic-share-status" role="status">
          {shareStatus}
        </p>
      </header>
      <CivicSectionNav
        active={notice.kind === "bill" ? "bills" : "participation"}
      />
      <div className="civic-detail-layout">
        <div>
          <section className="panel" aria-labelledby="civic-brief-title">
            <p className="eyebrow">The proposal, in context</p>
            <h2 id="civic-brief-title">What this notice covers.</h2>
            <p className="muted">{notice.description}</p>
            {notice.committee && (
              <p className="muted">
                <strong style={{ color: "var(--text)", fontWeight: 500 }}>
                  Committee / issuing body:
                </strong>{" "}
                {notice.committee}
              </p>
            )}
            <p className="muted">
              This brief summarises the source notice. Read the full proposal
              and its supporting documents before forming a view. A
              participation notice does not mean a bill has passed or a proposal
              is already law.
            </p>
            {notice.level === "municipal" && (
              <p className="muted">
                Municipal draft by-laws, budgets and development plans follow
                council processes. They are distinct from bills before
                Parliament or a provincial legislature.
              </p>
            )}
            {related && (
              <Link
                className="civic-text-link"
                href={`/participation/${related.id}`}
              >
                Related notice: {related.title}{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            )}
          </section>
          <section className="panel" aria-labelledby="civic-instructions-title">
            <p className="eyebrow">Use the stated channel</p>
            <h2 id="civic-instructions-title">How to take part.</h2>
            {isClosed && (
              <div
                className="civic-coverage-note"
                style={{ marginTop: 0, marginBottom: 22 }}
              >
                <strong>
                  {status === "closed"
                    ? "This submission window has closed."
                    : "This event has passed."}
                </strong>{" "}
                The record remains available for reference. Check the source for
                extensions, later stages or a new consultation.
              </div>
            )}
            <ol className="civic-instructions">
              {notice.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
            {notice.actionUrl && (
              <div className="civic-actions">
                <a
                  className="button"
                  href={isClosed ? notice.sourceUrl : notice.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isClosed
                    ? "Read original participation instructions"
                    : notice.actionUrl.startsWith("mailto:")
                      ? "Open email draft in your mail app"
                      : "Open participation instructions"}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
            )}
            <p className="muted" style={{ marginTop: 20, marginBottom: 0 }}>
              Confirm the current deadline, required documents and whether oral
              participation needs a separate request. The Public Square does not send
              submissions or register you for a hearing.
            </p>
          </section>
          <section className="panel" aria-labelledby="civic-draft-title">
            <p className="eyebrow">Turn a view into a useful submission</p>
            <h2 id="civic-draft-title">Prepare a local draft.</h2>
            <p className="muted">
              Write a reasoned response and download a text copy. Your writing
              stays in this page’s memory until you leave; it is not sent to
              The Public Square or the issuing authority. Check whether submissions will
              become public before including personal information.
            </p>
            {isClosed && (
              <p className="muted">
                This is an archived window. A draft can help you prepare for a
                later stage; it does not reopen submissions.
              </p>
            )}
            <form className="civic-draft-form" onSubmit={saveDraft}>
              <label htmlFor="submission-author">
                Name or organisation{" "}
                <span className="muted">
                  Optional. Follow the authority’s identification requirements.
                </span>
                <input
                  id="submission-author"
                  autoComplete="organization"
                  value={draft.author}
                  maxLength={180}
                  onChange={(event) => update("author", event.target.value)}
                />
              </label>
              <label htmlFor="submission-issue">
                Which issue, clause or page are you addressing?
                <textarea
                  id="submission-issue"
                  rows={3}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="Identify the specific provision or decision and how it affects you."
                  value={draft.issue}
                  onChange={(event) => update("issue", event.target.value)}
                />
              </label>
              <label htmlFor="submission-proposal">
                What change do you recommend?
                <textarea
                  id="submission-proposal"
                  rows={3}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="Propose a clear, practical amendment or action."
                  value={draft.proposal}
                  onChange={(event) => update("proposal", event.target.value)}
                />
              </label>
              <label htmlFor="submission-evidence">
                What reasons or evidence support your recommendation?
                <textarea
                  id="submission-evidence"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={10000}
                  placeholder="Explain the effect and include references, relevant experience or evidence."
                  value={draft.evidence}
                  onChange={(event) => update("evidence", event.target.value)}
                />
              </label>
              <button className="button" type="submit">
                <Download size={15} aria-hidden="true" />
                Download unsent submission draft
              </button>
              <p className="muted" role="status">
                {draftStatus}
              </p>
            </form>
          </section>
        </div>
        <aside>
          <section className="panel" aria-labelledby="civic-dates-title">
            <p className="eyebrow">Dates & arrangements</p>
            <h2 id="civic-dates-title">Plan your participation.</h2>
            <dl className="civic-detail-meta">
              {notice.publicationDate && (
                <div>
                  <dt>Published</dt>
                  <dd>
                    <time dateTime={notice.publicationDate}>
                      {formatCivicDate(notice.publicationDate)}
                    </time>
                  </dd>
                </div>
              )}
              {notice.opensOn && (
                <div>
                  <dt>Submission window opens</dt>
                  <dd>
                    <time dateTime={notice.opensOn}>
                      {formatCivicDate(notice.opensOn)}
                    </time>
                  </dd>
                </div>
              )}
              {notice.closesOn && (
                <div>
                  <dt>Submission deadline</dt>
                  <dd>
                    <time dateTime={notice.closesAt || notice.closesOn}>
                      {formatCivicDate(notice.closesOn)}
                    </time>
                    {notice.deadlineTime
                      ? ` · ${notice.deadlineTime}`
                      : " · exact cutoff time to confirm in source"}
                  </dd>
                </div>
              )}
              {notice.eventDate && (
                <div>
                  <dt>Hearing / event</dt>
                  <dd>
                    <time dateTime={notice.eventDate}>
                      {formatCivicDate(notice.eventDate)}
                    </time>
                    {notice.time
                      ? ` · ${notice.time}`
                      : " · time not supplied in this record"}
                  </dd>
                </div>
              )}
              {notice.eventDate && (
                <div>
                  <dt>Venue / access</dt>
                  <dd>
                    {notice.location ||
                      "Venue or access arrangements have not been supplied in this record. Confirm with the issuing authority."}
                  </dd>
                </div>
              )}
              {!notice.closesOn && !notice.eventDate && (
                <div>
                  <dt>Participation dates</dt>
                  <dd>
                    No deadline or event date has been verified in this record.
                    Read the current source for the stage and participation
                    arrangements.
                  </dd>
                </div>
              )}
              {notice.contact && (
                <div>
                  <dt>Contact stated in source</dt>
                  <dd>{notice.contact}</dd>
                </div>
              )}
              <div>
                <dt>Primary notice</dt>
                <dd>
                  <a
                    href={notice.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read the source ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt>Source organisation</dt>
                <dd>
                  {source?.organisation || "Read the issuing source notice"}
                </dd>
              </div>
            </dl>
            {notice.dateNote && (
              <p className="muted" style={{ marginTop: 20 }}>
                {notice.dateNote}
              </p>
            )}
            <div className="civic-actions">
              {deadlineCalendar && (
                <button
                  className="button"
                  type="button"
                  onClick={() => calendar("deadline")}
                >
                  <CalendarPlus size={15} aria-hidden="true" />
                  {notice.closesAt
                    ? "Add deadline to calendar"
                    : "Add deadline day to calendar"}
                </button>
              )}
              {eventCalendar && (
                <button
                  className="button"
                  type="button"
                  onClick={() => calendar("event")}
                >
                  <CalendarPlus size={15} aria-hidden="true" />
                  Add event day to calendar
                </button>
              )}
            </div>
            {deadlineCalendar || eventCalendar ? (
              <p className="muted" style={{ fontSize: 11, marginBottom: 0 }}>
                Downloads an .ics file for your calendar. Event days and
                deadlines without a published time are all-day reminders. Check
                the source for changes and exact arrangements.
              </p>
            ) : null}
          </section>
          <section className="panel">
            <p className="eyebrow">Keep following the process</p>
            <h2>What happens after your submission?</h2>
            <p className="muted" style={{ marginTop: 16 }}>
              Check committee meetings, reports and revised documents.
              Participation includes following the response, asking informed
              questions and checking whether the final decision addresses the
              issue you raised.
            </p>
            <Link
              className="civic-text-link"
              href="/participation#civic-channels-title"
            >
              Find monitoring & source channels{" "}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
