"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AnimatedBar from "./animated-bar";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Database,
  Download,
  FileCheck2,
  Info,
  Landmark,
  SlidersHorizontal,
  Sparkles,
  Users,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  elections,
  sources,
  provinces,
  ageGroups,
  nextMunicipalElection,
  verificationStatus,
  currentRegistrationObservation,
  currentProvinceRegistration,
  provinceElections,
} from "@/lib/data";
import {
  electionMetrics,
  ratioPercent,
  percentagePointChange,
  areTurnoutComparable,
  participationBreakdown,
} from "@/lib/analytics";
import { effectiveElectorate } from "@/lib/explorer-metrics";
import { formatNumber, formatPercent } from "@/lib/utils";
import { articles } from "@/lib/articles";
import AnalyticsChart from "./analytics-chart";
import ScenarioLab from "./scenario-lab";
import YouthLab from "./youth-lab";
import ViewportContent from "./viewport-content";
import ParticipationGap from "./participation-gap";
const ElectoralMap = dynamic(() => import("./electoral-map"), {
  ssr: false,
  loading: () => (
    <div className="loading-skeleton">
      Loading South African province boundaries…
    </div>
  ),
});
const CompositionStudio = dynamic(() => import("./composition-studio"), {
  ssr: false,
  loading: () => (
    <div className="loading-skeleton section">
      Loading source-backed chart tools…
    </div>
  ),
});
type View = "overview" | "registration" | "youth" | "history" | "map";
const titles: Record<
  View,
  { eyebrow: string; title: string; description: string }
> = {
  overview: {
    eyebrow: "THE PUBLIC SQUARE DATA CENTRE",
    title: "South Africa’s democracy, measured.",
    description:
      "Explore the people, participation and patterns behind South African elections. Evidence to inform your next question.",
  },
  registration: {
    eyebrow: "VOTER REGISTRATION OBSERVATORY",
    title: "The first step towards a voice.",
    description:
      "Separate the voters’ roll from the eligible population. Understand what the registration data can tell us.",
  },
  youth: {
    eyebrow: "YOUTH ELECTORAL INTELLIGENCE LAB",
    title: "A generation. A democratic future.",
    description:
      "Explore youth registration, preserve published age boundaries, and test hypothetical participation scenarios.",
  },
  history: {
    eyebrow: "MUNICIPAL ELECTION ARCHIVE",
    title: "Five elections. A changing democracy.",
    description:
      "Explore South Africa’s municipal elections from 2000 to 2021, with consistent measures and transparent sources.",
  },
  map: {
    eyebrow: "ELECTORAL GEOGRAPHY",
    title: "Every place has a participation story.",
    description:
      "Explore all nine provinces, with real geographical boundaries and clear limits on available electoral data.",
  },
};
function EmptyChart({
  message = "A comparable official dataset is needed before this chart can be published.",
}: {
  message?: string;
}) {
  return (
    <div className="chart-empty">
      <Database size={23} strokeWidth={1} />
      <h3>Official comparable data unavailable.</h3>
      <p>{message}</p>
      <Link prefetch={false} href="/methodology" className="text-link">
        Explore the source registry <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}
function SourceInfo({
  sourceId,
  definition,
}: {
  sourceId: string;
  definition: string;
}) {
  const source = sources.find((s) => s.id === sourceId);
  return (
    <details className="metric-source">
      <summary aria-label="Metric source and definition">
        <Info size={12} />
      </summary>
      <div>
        <p>{definition}</p>
        <p className="muted">
          {source?.organisation ?? "Comparable official source required"} ·{" "}
          {source?.observedAt ?? "Reference date unavailable"}
        </p>
        {source && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Original source <ArrowUpRight size={11} />
          </a>
        )}
      </div>
    </details>
  );
}
export default function Dashboard({
  view = "overview",
  citizenActions,
}: {
  view?: View;
  citizenActions?: React.ReactNode;
}) {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [year, setYear] = useState(2021);
  const [province, setProvince] = useState("All provinces");
  const [denominator, setDenominator] = useState<
    "absolute" | "eligible" | "registered" | "voting-age"
  >("absolute");
  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const y = Number(q.get("year"));
    if (elections.some((e) => e.year === y)) setYear(y);
    const p = q.get("province");
    if (p && provinces.includes(p as (typeof provinces)[number]))
      setProvince(p);
  }, []);
  const selectYear = (value: number) => {
    setYear(value);
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(value));
    window.history.replaceState(null, "", url);
  };
  const selectProvince = (value: string) => {
    setProvince(value);
    const url = new URL(window.location.href);
    if (value === "All provinces") url.searchParams.delete("province");
    else url.searchParams.set("province", value);
    window.history.replaceState(null, "", url);
  };
  const election =
    elections.find((e) => e.year === year) ?? elections[elections.length - 1];
  const national = province === "All provinces";
  const record = national
    ? election
    : (provinceElections.find(
        (r) => r.year === year && r.province === province,
      ) ?? {
        ...election,
        registered: null,
        voters: null,
        validBallots: null,
        eligible: null,
        turnout: null,
        turnoutDenominator: null,
        votingAgePopulation: null,
        votingAgePopulationSourceId: undefined,
        votingAgePopulationNote: undefined,
      });
  const metrics = electionMetrics(record);
  const gap = participationBreakdown(
    record,
    record.votingAgePopulation ? "voting-age" : "electorate",
  );
  const previous = elections.filter((e) => e.year < year).at(-1);
  const momentum =
    national && previous && areTurnoutComparable(record, previous)
      ? percentagePointChange(record.turnout, previous.turnout)
      : null;
  const historyRows = elections.map((e) =>
    national
      ? e
      : (provinceElections.find(
          (p) => p.year === e.year && p.province === province,
        ) ?? {
          ...e,
          registered: null,
          voters: null,
          turnout: null,
          turnoutDenominator: null,
        }),
  );
  const title = titles[view];
  const liveRegistration = national
    ? currentRegistrationObservation.registered
    : (currentProvinceRegistration.find((r) => r.province === province)
        ?.registered ?? null);
  const electorate = effectiveElectorate(record);
  const sourceNote = sources
    .find((s) => s.id === record.sourceId)
    ?.limitations.join(" ");
  const daysToElection = nextMunicipalElection.officialDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(
            nextMunicipalElection.officialDate + "T07:00:00+02:00",
          ).getTime() -
            (currentTime ??
              new Date(
                verificationStatus.checkedAt + "T12:00:00+02:00",
              ).getTime())) /
            86400000,
        ),
      )
    : null;
  const stats = [
    {
      label: record.votingAgePopulation
        ? "Voting-age residents · estimate"
        : "Selected election’s voters’ roll",
      value: formatNumber(
        record.votingAgePopulation ?? record.registered,
        true,
      ),
      detail: record.votingAgePopulation
        ? "Adult population; includes non-citizen residents"
        : "Certified registered people for this election",
      foot: `${year} · ${record.votingAgePopulation ? "IEC-reported Stats SA estimate" : "IEC certified roll"}`,
      definition:
        record.votingAgePopulationNote ??
        "Certified voters’ roll at the selected election. This is distinct from the current registration snapshot and the operational turnout electorate.",
      sourceId: record.votingAgePopulationSourceId ?? record.sourceId,
    },
    {
      label: "Current registered voters",
      value: formatNumber(liveRegistration, true),
      detail: `Selected election’s certified roll: ${formatNumber(record.registered, true)}`,
      foot: "29 Sep 2026 · IEC registration snapshot",
      definition:
        "Registered people in the IEC snapshot dated 29 September 2026. This observation is distinct from the selected historical election; no contemporary eligible denominator is available.",
      sourceId: currentRegistrationObservation.sourceId,
    },
    {
      label: "Participating voters",
      value: formatNumber(record.voters, true),
      detail: "People participating in the selected election",
      foot: `${year} · IEC recorded participation`,
      definition:
        "IEC participating-voter count for this election, distinct from multiple ballot papers. The 2021 appendix/narrative discrepancy is retained in the source note.",
    },
    {
      label:
        record.turnoutBasis === "ballot-pool"
          ? "Published ballot participation"
          : "Municipal voter turnout",
      value: formatPercent(metrics.turnoutRate),
      detail:
        record.voters == null
          ? "Participating-voter count unavailable"
          : `${formatNumber(record.voters, true)} participating voters`,
      foot: `${year} · published IEC turnout`,
      definition:
        record.note ??
        "Published IEC turnout, using the documented effective electorate. Multiple ballot papers are not multiple people.",
      featured: true,
    },
    {
      label: gap.estimated
        ? "Adult-population participation gap"
        : "Electorate participation gap",
      value: formatNumber(gap.totalGap, true),
      detail:
        gap.gapRate == null
          ? "Compatible participating-person count required"
          : `${formatPercent(gap.gapRate)} of ${gap.estimated ? "estimated adults" : "the documented electorate"}`,
      foot: `${year} · ${gap.estimated ? "population estimate" : gap.qualified ? "qualified certified-roll comparison" : "effective electorate"}`,
      definition: gap.estimated
        ? "Estimated adult residents minus participating voters. Includes unregistered adults and non-citizen residents; it is not a legally eligible citizen count. See the gap decomposition and source note."
        : "Documented election electorate minus participating voters. This shows nonparticipation within the recorded electorate, separately from people outside it. Historical qualifications remain explicit.",
      sourceId: gap.sourceId,
    },
    {
      label: "Next municipal election",
      value: nextMunicipalElection.officialDate
        ? new Intl.DateTimeFormat("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Africa/Johannesburg",
          }).format(new Date(nextMunicipalElection.officialDate + "T12:00:00Z"))
        : "Date unconfirmed",
      detail: nextMunicipalElection.officialDate
        ? daysToElection && daysToElection > 0
          ? `${daysToElection} days · confirmed IEC timetable`
          : "Date reached · check latest IEC notices"
        : (nextMunicipalElection.window ??
          "Awaiting official date verification"),
      foot: nextMunicipalElection.officialDate
        ? "Confirmed date · IEC"
        : "Countdown withheld until confirmed",
      definition: nextMunicipalElection.status,
      text: true,
      sourceId: nextMunicipalElection.sourceId,
    },
  ];
  const chartOption = useMemo(
    () => ({
      grid: { left: 46, right: 22, top: 25, bottom: 35 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#0f1b2d",
        borderColor: "#25364e",
        textStyle: { color: "#f5f7fb" },
        valueFormatter: (v: unknown) => `${v}%`,
      },
      xAxis: {
        type: "category" as const,
        data: historyRows.map((e) => String(e.year)),
        axisLine: { lineStyle: { color: "#25364e" } },
        axisTick: { show: false },
        axisLabel: { color: "#94a3b8", fontFamily: "Geist Mono", fontSize: 11 },
      },
      yAxis: {
        type: "value" as const,
        min: 0,
        max: 100,
        axisLabel: { formatter: "{value}%", color: "#94a3b8", fontSize: 10 },
        splitLine: {
          lineStyle: { color: "#25364e88", type: "dashed" as const },
        },
      },
      series: [
        {
          name: "Person-based turnout",
          type: "line" as const,
          data: historyRows.map((e) =>
            e.turnoutBasis === "effective-electorate" ? e.turnout : null,
          ),
          connectNulls: false,
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: "#a3ff3d", width: 3 },
          itemStyle: {
            color: "#a3ff3d",
            borderColor: "#030b14",
            borderWidth: 3,
          },
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#a3ff3d25" },
                { offset: 1, color: "#a3ff3d00" },
              ],
            },
          },
        },
        {
          name: "Reported rate · method limitations",
          type: "scatter" as const,
          symbol: "diamond",
          symbolSize: 11,
          itemStyle: { color: "#f4b76a" },
          data: historyRows
            .filter(
              (e) =>
                e.turnoutBasis !== "effective-electorate" && e.turnout != null,
            )
            .map((e) => [String(e.year), e.turnout]),
        },
      ],
    }),
    [province],
  );
  const funnelStages = [
    {
      label: record.votingAgePopulation
        ? "Adult residents · estimate"
        : "Eligible citizens",
      count: record.votingAgePopulation ?? record.eligible,
      color: "#a3ff3d",
    },
    { label: "Registered electorate*", count: electorate, color: "#73b12a" },
    { label: "Actual voters", count: record.voters, color: "#3b82f6" },
    { label: "Valid ballots", count: record.validBallots, color: "#2563eb" },
  ];
  const basis =
    denominator === "voting-age"
      ? record.votingAgePopulation
      : denominator === "eligible"
        ? record.eligible
        : denominator === "registered"
          ? electorate
          : Math.max(...funnelStages.map((s) => s.count ?? 0));
  const history = (
    <section className="section panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">THE LONG VIEW</p>
          <h2>Municipal turnout, over time</h2>
          <p>
            Published IEC turnout · effective electorate includes documented
            election-day additions.
          </p>
        </div>
        <div className="badge">
          2000 — 2021{" "}
          <span className="legend-dot" style={{ background: "#a3ff3d" }} />
        </div>
      </div>
      {historyRows.some((e) => e.turnout != null) ? (
        <AnalyticsChart
          option={chartOption}
          label="Historical municipal turnout percentages. Exact values are in the accessible table below."
        />
      ) : (
        <EmptyChart
          message={
            national
              ? "Certified turnout observations are displayed only after primary-source verification."
              : "Official provincial turnout observations are not loaded. National figures are not substituted."
          }
        />
      )}
      {national && (
        <p className="chart-caption">
          <span className="legend-dot" style={{ background: "#a3ff3d" }} />{" "}
          Comparable person-based turnout ·{" "}
          <span className="legend-dot" style={{ background: "#f4b76a" }} />{" "}
          2000: unreconciled denominator; 2006: ballot-pool basis. These
          reported rates are shown separately and excluded from homogeneous
          rate-change calculations.
        </p>
      )}
      <div className="history-strip">
        {historyRows.map((e) => (
          <button
            key={e.year}
            onClick={() => selectYear(e.year)}
            className={year === e.year ? "active" : ""}
            aria-pressed={year === e.year}
          >
            <span>{e.year} ELECTION</span>
            <strong>{formatPercent(e.turnout)}</strong>
            <span>
              {e.turnout == null
                ? "Data unavailable"
                : e.turnoutBasis === "ballot-pool"
                  ? "Ballot-pool basis"
                  : e.turnoutBasis === "unreconciled"
                    ? "Denominator unreconciled"
                    : "Published IEC turnout"}
            </span>
          </button>
        ))}
      </div>
      <div className="panel-footer">
        <span>
          {momentum == null
            ? "Comparable change unavailable"
            : `${momentum > 0 ? "+" : ""}${momentum.toFixed(2)} percentage points from ${previous?.year} to ${year}`}
        </span>
        <Link
          prefetch={false}
          href={`/explorer?dataset=elections&year=${year}${national ? "" : `&province=${encodeURIComponent(province)}`}`}
          className="text-link"
        >
          View underlying data <ArrowUpRight size={11} />
        </Link>
      </div>
      <details style={{ marginTop: 15 }}>
        <summary className="muted" style={{ fontSize: 10, cursor: "pointer" }}>
          Accessible chart data table
        </summary>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">
              Municipal election turnout, selected geography
            </caption>
            <thead>
              <tr>
                <th>Election</th>
                <th>Registered voters</th>
                <th>Participating voters</th>
                <th>Published rate</th>
                <th>Method</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((e) => (
                <tr key={e.year}>
                  <td>{e.year}</td>
                  <td>{formatNumber(e.registered)}</td>
                  <td>{formatNumber(e.voters)}</td>
                  <td>{formatPercent(e.turnout)}</td>
                  <td>{e.turnoutBasis ?? "Unavailable"}</td>
                  <td>IEC · {e.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
  const funnel = (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">FROM ELIGIBILITY TO PARTICIPATION</p>
          <h2>The participation funnel</h2>
          <p>
            {year} municipal election ·{" "}
            {province === "All provinces" ? "South Africa" : province}
          </p>
        </div>
        <div className="segmented" aria-label="Funnel denominator">
          {[
            { key: "absolute", label: "Numbers" },
            { key: "eligible", label: "% eligible" },
            ...(record.votingAgePopulation
              ? [{ key: "voting-age", label: "% adults · est." }]
              : []),
            { key: "registered", label: "% electorate" },
          ].map((d) => (
            <button
              key={d.key}
              aria-pressed={denominator === d.key}
              disabled={d.key === "eligible" && record.eligible == null}
              title={
                d.key === "eligible" && record.eligible == null
                  ? "An exact legally eligible-citizen denominator has not been verified for this election."
                  : undefined
              }
              onClick={() => setDenominator(d.key as typeof denominator)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="funnel-stages">
        {funnelStages.map((stage, i) => {
          const rate =
            denominator === "absolute"
              ? null
              : ratioPercent(stage.count, basis);
          const width =
            stage.count != null && basis ? (stage.count / basis) * 100 : null;
          const prev = funnelStages[i - 1]?.count;
          const loss =
            prev != null && stage.count != null && prev >= stage.count
              ? prev - stage.count
              : null;
          return (
            <div key={stage.label}>
              <div className="funnel-stage">
                <span className="funnel-stage-label">{stage.label}</span>
                <div className="funnel-track">
                  {width == null ||
                  (rate == null && denominator !== "absolute") ? (
                    <div className="funnel-unavailable">Data unavailable</div>
                  ) : (
                    <AnimatedBar
                      className="funnel-bar"
                      width={`${Math.min(width, 100)}%`}
                      color={stage.color}
                    >
                      {denominator === "absolute"
                        ? formatNumber(stage.count, true)
                        : formatPercent(rate)}
                    </AnimatedBar>
                  )}
                </div>
                <span className="funnel-value">
                  {denominator === "absolute"
                    ? formatNumber(stage.count, true)
                    : formatPercent(rate)}
                </span>
              </div>
              {i > 0 && (
                <div className="funnel-loss">
                  <ArrowDown size={10} />
                  {loss == null
                    ? "Comparable stage loss unavailable"
                    : `${formatNumber(loss, true)} lost · ${formatPercent(ratioPercent(loss, prev))} of previous stage`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="data-notice">
        <CircleHelp size={13} />
        <span>
          *Effective electorate includes published MEC7 additions; the certified
          roll is a separate count. Municipal voters receive multiple ballots.
          The valid-ballot stage requires an identified ballot type; combined
          ballot totals are never treated as people.{" "}
          {denominator === "voting-age"
            ? "All rates use the source’s estimated adult-resident population, including non-citizens. This is not a legally eligible citizen denominator."
            : denominator === "eligible"
              ? "All rates use eligible citizens as their denominator."
              : denominator === "registered"
                ? "All rates use the effective registered electorate as their denominator."
                : "Counts are people, except explicitly identified ballot records."}
        </span>
      </div>
    </section>
  );
  const registration = (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">THE REGISTRATION QUESTION</p>
          <h2>
            {record.votingAgePopulation
              ? "Registration among adult residents"
              : "A roll is not a rate"}
          </h2>
          <p>
            {year} ·{" "}
            {record.votingAgePopulation
              ? "Source-reported voting-age population estimate"
              : "Certified roll; eligible-citizen rate not established"}
          </p>
        </div>
        <Users size={18} className="muted" />
      </div>
      <div
        className="registration-ring"
        role="img"
        aria-label={
          (metrics.registrationRate ?? metrics.votingAgeRegistrationCoverage) ==
          null
            ? "Registration rate unavailable"
            : `Registration coverage ${formatPercent(metrics.registrationRate ?? metrics.votingAgeRegistrationCoverage)}`
        }
      >
        <strong>
          {(metrics.registrationRate ??
            metrics.votingAgeRegistrationCoverage) == null
            ? formatNumber(record.registered, true)
            : `${(metrics.registrationRate ?? metrics.votingAgeRegistrationCoverage)!.toFixed(1)}%`}
        </strong>
        <span>
          {record.votingAgePopulation
            ? "of estimated adult residents"
            : metrics.registrationRate
              ? "of eligible citizens"
              : "registered people"}
        </span>
      </div>
      <div className="breakdown-list">
        <div className="breakdown-row">
          <span>
            <i className="legend-dot" style={{ background: "#a3ff3d" }} />
            Registered voters
          </span>
          <span className="mono">{formatNumber(record.registered, true)}</span>
        </div>
        <div className="breakdown-row">
          <span>
            <i className="legend-dot" style={{ background: "#25364e" }} />
            {record.votingAgePopulation
              ? "Estimated adult residents outside certified roll"
              : "Eligible, not registered"}
          </span>
          <span className="mono">
            {formatNumber(
              record.votingAgePopulation != null && record.registered != null
                ? record.votingAgePopulation - record.registered
                : metrics.registrationGap,
              true,
            )}
          </span>
        </div>
        <div className="breakdown-row">
          <span>
            {record.votingAgePopulation
              ? "Estimated adult residents"
              : "Eligible population"}
          </span>
          <span className="mono">
            {formatNumber(record.votingAgePopulation ?? record.eligible, true)}
          </span>
        </div>
      </div>
      <div className="panel-footer">
        <span>Residents ≠ eligible citizens</span>
        <Link prefetch={false} href="/methodology" className="text-link">
          Definition <ArrowUpRight size={10} />
        </Link>
      </div>
    </section>
  );
  const youth = <YouthLab expanded={view === "youth"} />;
  return (
    <div className="page-shell">
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">{title.eyebrow}</p>
          <h1>{title.title}</h1>
          <p className="intro-sub">{title.description}</p>
          <div className="intro-meta">
            <span>
              <CalendarDays
                size={11}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: 5,
                }}
              />
              {new Intl.DateTimeFormat("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Africa/Johannesburg",
              }).format(
                new Date(
                  currentTime ??
                    verificationStatus.checkedAt + "T12:00:00+02:00",
                ),
              )}
            </span>
            <span className="live-label">
              <i className="status-dot" />{" "}
              {verificationStatus.lastVerifiedAt
                ? `Sources verified ${verificationStatus.lastVerifiedAt}`
                : "Source verification in progress"}
            </span>
          </div>
        </div>
        <div className="intro-controls">
          <label className="sr-only" htmlFor="hero-year">
            Election year
          </label>
          <select
            id="hero-year"
            value={year}
            onChange={(e) => selectYear(Number(e.target.value))}
          >
            {elections.map((e) => (
              <option key={e.year} value={e.year}>
                {e.year} Municipal election
              </option>
            ))}
          </select>
          <Link
            prefetch={false}
            href={`/explorer?dataset=elections&year=${year}${national ? "" : `&province=${encodeURIComponent(province)}`}`}
            className="button button-outline button-sm"
          >
            <Download size={13} /> Export data
          </Link>
        </div>
      </div>
      {view === "overview" && citizenActions}
      <nav className="electoral-section-links" aria-label="Electoral sections">
        <Link prefetch={false} href="/registration">
          Registration
        </Link>
        <Link prefetch={false} href="/youth">
          Age profiles & participation
        </Link>
        <Link prefetch={false} href="/history">
          Election history
        </Link>
        <Link prefetch={false} href="/map">
          Electoral geography
        </Link>
        <Link prefetch={false} href="/comparison">
          Compare elections & age bands
        </Link>
      </nav>
      <div className="filter-bar">
        <div className="filter-bar-left">
          <SlidersHorizontal size={13} className="muted" />
          <label htmlFor="global-province">Geography</label>
          <select
            id="global-province"
            value={province}
            onChange={(e) => selectProvince(e.target.value)}
          >
            <option>All provinces</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <span className="badge">MUNICIPAL ELECTIONS</span>
        </div>
        <div className="filter-current">
          {year} · {province}
          <button
            className="icon-button"
            aria-label="Reset global filters"
            onClick={() => {
              selectYear(2021);
              selectProvince("All provinces");
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      {!national &&
        !provinceElections.some(
          (row) => row.province === province && row.year === year,
        ) && (
          <div className="data-notice">
            <span>
              Verified provincial election counts for {province} are available
              for 2016. The dated 2026 registration snapshot is shown
              separately.
            </span>
            <button
              className="button button-secondary button-sm"
              onClick={() => selectYear(2016)}
            >
              Use verified 2016 province data
            </button>
          </div>
        )}
      {(view === "overview" || view === "registration") && (
        <>
          <div className="overview-label">
            <p>DEMOCRACY AT A GLANCE</p>
            <Link prefetch={false} href="/methodology" className="text-link">
              <ShieldCheck size={11} /> Sources & definitions{" "}
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="metric-grid">
            {stats.map((s) => (
              <article
                className={`metric-card ${s.featured ? "featured" : ""}`}
                key={s.label}
              >
                <div className="metric-top">
                  <span>{s.label}</span>
                  <SourceInfo
                    sourceId={
                      "sourceId" in s && s.sourceId
                        ? s.sourceId
                        : record.sourceId
                    }
                    definition={s.definition}
                  />
                </div>
                <div className={`metric-number ${s.text ? "text-value" : ""}`}>
                  {s.value}
                </div>
                <p className="metric-detail">{s.detail}</p>
                <div className="metric-foot">
                  {s.featured ? (
                    <i className="status-dot" />
                  ) : (
                    <CalendarDays size={9} />
                  )}{" "}
                  {s.foot}
                </div>
              </article>
            ))}
          </div>
          <p className="chart-caption">
            These measures use distinct reference dates. The September 2026
            voters’ roll is not the denominator for historical municipal
            turnout.
          </p>
        </>
      )}
      {(view === "overview" || view === "registration") && (
        <div className="two-column section">
          {funnel}
          {registration}
        </div>
      )}
      {(view === "overview" ||
        view === "registration" ||
        view === "history") && (
        <ParticipationGap
          record={record}
          geography={national ? "South Africa" : province}
        />
      )}
      {(view === "overview" || view === "history") && history}
      {(view === "overview" || view === "map") && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE GEOGRAPHY OF DEMOCRACY</p>
              <h2>A national picture. Local perspectives.</h2>
              <p>
                Real provincial boundaries. Linked selection. Transparent data
                coverage.
              </p>
            </div>
            {view !== "map" && (
              <Link prefetch={false} href="/map" className="text-link">
                Explore the map <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
          <ViewportContent label="South African provincial geography">
            <ElectoralMap
              year={year}
              province={province}
              onProvinceChange={selectProvince}
            />
          </ViewportContent>
        </section>
      )}
      {(view === "overview" || view === "youth") && youth}
      {view === "youth" && <ScenarioLab />}
      {view === "history" && (
        <>
          <section className="section equal-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Registered versus participating voters</h2>
              </div>
              {historyRows.some(
                (e) => e.registered != null && e.voters != null,
              ) ? (
                <AnalyticsChart
                  label="Registered and participating voters by municipal year"
                  option={{
                    tooltip: { trigger: "axis" },
                    legend: { textStyle: { color: "#94a3b8" } },
                    grid: { left: 60, right: 15, bottom: 40, top: 35 },
                    xAxis: {
                      type: "category",
                      data: historyRows.map((e) => e.year),
                      axisLabel: { color: "#94a3b8" },
                    },
                    yAxis: {
                      type: "value",
                      axisLabel: {
                        color: "#94a3b8",
                        formatter: (v: number) => formatNumber(v, true),
                      },
                      splitLine: { lineStyle: { color: "#25364e" } },
                    },
                    series: [
                      {
                        name: "Registered",
                        type: "bar",
                        data: historyRows.map((e) => e.registered),
                        itemStyle: {
                          color: "#3b82f6",
                          borderRadius: [3, 3, 0, 0],
                        },
                      },
                      {
                        name: "Participating",
                        type: "bar",
                        data: historyRows.map((e) => e.voters),
                        itemStyle: {
                          color: "#a3ff3d",
                          borderRadius: [3, 3, 0, 0],
                        },
                      },
                    ],
                  }}
                />
              ) : (
                <EmptyChart />
              )}
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>Registered non-participation</h2>
              </div>
              <div className="metric-number">
                {formatNumber(metrics.nonVoters, true)}
              </div>
              <p className="muted">
                {year} · registered electorate who did not participate
              </p>
              <div className="metric-list">
                <div className="breakdown-row">
                  <span>Effective-electorate abstention rate</span>
                  <span className="mono">
                    {formatPercent(metrics.registeredAbstentionRate)}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span>Eligible-population participation gap</span>
                  <span className="mono">
                    {formatNumber(metrics.participationGap, true)}
                  </span>
                </div>
              </div>
              <div className="data-notice">
                Non-voting records an outcome. It does not establish an
                individual’s political preference or reason for staying away.
              </div>
            </div>
          </section>
          <div className="panel section">
            <div className="panel-header">
              <h2>Province & metropolitan comparisons</h2>
              <Link prefetch={false} href="/comparison" className="text-link">
                Open comparison studio <ArrowUpRight size={13} />
              </Link>
            </div>
            <p className="empty-state">
              Verified 2016 provincial turnout is available in the comparison
              studio. Metropolitan series remain unavailable; national figures
              are never substituted for local observations.
            </p>
          </div>
        </>
      )}
      {view === "registration" && <CompositionStudio />}
      {view === "registration" && (
        <section className="section panel">
          <p className="eyebrow">
            VERIFIED OBSERVATIONS, SHARED ACROSS THE APP
          </p>
          <h2>Follow the same dated evidence.</h2>
          <p className="muted">
            Explore original IEC age bands in the age laboratory, inspect age
            and province compositions here, and compare dated records in the
            explorer. Estimated adult-resident gaps are kept distinct from legal
            eligibility.
          </p>
          <div className="electoral-section-links">
            <Link href="/youth">
              Age registration and historical participation
            </Link>
            <Link href="/explorer?dataset=registration">
              Registration datasets and downloads
            </Link>
            <Link href="/comparison?mode=ages&metric=registered">
              Compare published age bands
            </Link>
            <Link href="/methodology">
              Methods, qualifications and source registry
            </Link>
          </div>
        </section>
      )}
      {view === "overview" && (
        <>
          <section className="section panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">ELECTORAL COMPARISON STUDIO</p>
                <h2>Put the numbers in perspective.</h2>
                <p>
                  Compare election years, inspect coherent denominators, and
                  share your selected view.
                </p>
              </div>
              <Link
                prefetch={false}
                href="/comparison"
                className="button button-outline button-sm"
              >
                Compare elections <ArrowRight size={13} />
              </Link>
            </div>
            <div className="breakdown-list">
              {elections.slice(-3).map((e) => (
                <div className="breakdown-row" key={e.year}>
                  <span>
                    <Landmark size={13} />
                    {e.year} Municipal election
                  </span>
                  <span className="mono">
                    {formatPercent(e.turnout)} turnout
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RESEARCH & INSIGHTS</p>
                <h2>Beyond the vote. Into the data.</h2>
              </div>
              <Link prefetch={false} href="/research" className="text-link">
                All research <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="article-grid">
              {articles.map((article, i) => (
                <Link
                  prefetch={false}
                  key={article.slug}
                  href={`/research/${article.slug}`}
                  className="article-card"
                >
                  <div className="article-art" aria-hidden="true">
                    <div className="art-bars">
                      {[30, 50, 65, 44, 75, 55, 35, 60].map((v, j) => (
                        <i
                          key={j}
                          style={{
                            height: `${v - i * 3}px`,
                            opacity: 0.3 + j * 0.08,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="eyebrow section-eyebrow">
                    {article.category}
                  </span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <div className="article-card-meta">
                    <span>
                      THE PUBLIC SQUARE · {article.readingMinutes} MIN READ
                    </span>
                    <ArrowUpRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      <div className="source-strip">
        <FileCheck2 size={14} />
        <strong>BUILT ON TRANSPARENT EVIDENCE</strong>
        <span>Electoral Commission of South Africa</span>
        <i className="divider" />
        <span>Statistics South Africa</span>
        <i className="divider" />
        <Link prefetch={false} href="/methodology" className="text-link">
          Source registry <ArrowUpRight size={11} />
        </Link>
      </div>
    </div>
  );
}
