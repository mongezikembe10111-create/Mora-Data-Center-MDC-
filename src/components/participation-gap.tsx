"use client";

import { useState } from "react";
import Link from "next/link";
import { participationBreakdown, ratioPercent, csvCell } from "@/lib/analytics";
import { getSource, type ElectionRecord } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";
import "./citizen-actions.css";

export default function ParticipationGap({
  record,
  geography = "South Africa",
}: {
  record: ElectionRecord;
  geography?: string;
}) {
  const [basis, setBasis] = useState<"electorate" | "voting-age" | "eligible">(
    record.votingAgePopulation ? "voting-age" : "electorate",
  );
  const selectedBasis =
    basis === "voting-age" && !record.votingAgePopulation
      ? "electorate"
      : basis;
  const data = participationBreakdown(record, selectedBasis);
  const source = getSource(data.sourceId);
  const parts = [
    { label: "Participating voters", count: data.voters, color: "#b9f56a" },
    {
      label: "Electorate members who did not participate",
      count: data.nonVoters,
      color: "#62a7f8",
    },
    ...(selectedBasis === "electorate"
      ? []
      : [
          {
            label: data.estimated
              ? "Estimated adults outside the electorate"
              : "Eligible citizens outside the electorate",
            count: data.outsideElectorate,
            color: "#f4b76a",
          },
        ]),
  ];
  function download() {
    const rows = parts.map((part) => [
      part.label,
      part.count,
      ratioPercent(part.count, data.denominator),
      record.year,
      geography,
      selectedBasis,
      source?.url,
      data.caveats.join(" "),
    ]);
    const text = [
      [
        "Segment",
        "People",
        "Share of chosen population (%)",
        "Election year",
        "Geography",
        "Population basis",
        "Source URL",
        "Method and limitations",
      ],
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    const geographySlug = geography.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    anchor.download = `mora-participation-gap-${record.year}-${geographySlug}-${selectedBasis}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="section panel participation-gap-panel"
      id="participation-gap"
    >
      <div className="panel-header">
        <div>
          <p className="eyebrow">FROM COUNTS TO CIVIC ACTION</p>
          <h2>Where participation falls away</h2>
          <p>
            {record.year} municipal election · {geography} · each population
            basis answers a different question.
          </p>
        </div>
        <label className="field">
          Gap population basis
          <select
            value={selectedBasis}
            onChange={(event) => setBasis(event.target.value as typeof basis)}
          >
            <option value="electorate">Documented election electorate</option>
            <option value="voting-age" disabled={!record.votingAgePopulation}>
              Voting-age residents · estimate
              {!record.votingAgePopulation ? " (not available)" : ""}
            </option>
            <option value="eligible" disabled={!record.eligible}>
              Legally eligible citizens
              {!record.eligible ? " (not verified)" : ""}
            </option>
          </select>
        </label>
      </div>
      <div className="gap-headline">
        <div>
          <span className="metric-number lime">
            {formatNumber(data.totalGap, true)}
          </span>
          <p>
            {data.estimated
              ? "Estimated adult-population gap"
              : "Documented electorate gap"}
            {data.qualified ? " · qualified comparison" : ""}
          </p>
        </div>
        <div className="gap-equation">
          <strong>
            {formatNumber(data.denominator)} − {formatNumber(data.voters)} ={" "}
            {formatNumber(data.totalGap)}
          </strong>
          <span>
            Chosen population − participating voters = participation gap
          </span>
          <span>{formatPercent(data.gapRate)} of the chosen population</span>
        </div>
      </div>
      {data.totalGap == null ? (
        <p className="data-notice">
          This selection does not have a compatible participating-person count
          and population. Combined ballot papers and rounded turnout percentages
          cannot establish a missing person count.
        </p>
      ) : (
        <>
          <div className="gap-partition" aria-hidden="true">
            {parts.map((part) => (
              <div
                key={part.label}
                style={{
                  width: `${ratioPercent(part.count, data.denominator) ?? 0}%`,
                  background: part.color,
                }}
              />
            ))}
          </div>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Scrollable participation-gap data"
          >
            <table className="data-table">
              <caption className="sr-only">
                Participation-gap decomposition for {record.year}, {geography};{" "}
                {selectedBasis} population basis
              </caption>
              <thead>
                <tr>
                  <th>Population segment</th>
                  <th>People</th>
                  <th>Share of chosen population</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.label}>
                    <td>
                      <i
                        className="legend-dot"
                        style={{ background: part.color }}
                      />{" "}
                      {part.label}
                    </td>
                    <td>{formatNumber(part.count)}</td>
                    <td>
                      {formatPercent(
                        ratioPercent(part.count, data.denominator),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="button button-secondary" onClick={download}>
            Download gap calculation CSV ↓
          </button>
        </>
      )}
      <p className="data-notice">
        {data.estimated
          ? "This is an estimate of adult residents, including non-citizens. It is not an exact count of eligible citizens or eligible unregistered people. "
          : "The electorate gap excludes adults outside the recorded electorate. "}
        {data.caveats.join(" ")}
      </p>
      <div className="panel-footer">
        <span>
          {source?.organisation} · {source?.title}
        </span>
        <Link
          prefetch={false}
          href={`/explorer?metric=electorateParticipationGap&year=${record.year}${geography === "South Africa" ? "" : `&province=${encodeURIComponent(geography)}`}`}
          className="text-link"
        >
          Explore all gap measures ↗
        </Link>
        {source && (
          <a
            className="text-link"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the source ↗
          </a>
        )}
      </div>
    </section>
  );
}
