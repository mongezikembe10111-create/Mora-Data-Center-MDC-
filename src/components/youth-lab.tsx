"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import AnimatedBar from "./animated-bar";
import {
  currentAgeRegistration,
  historicAgeRegistration,
  historicAgeTurnout,
  currentProvinceRegistration,
  currentRegistrationObservation,
  provinces,
} from "@/lib/data";
import { percentageChange, youthRegistrationBounds } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";
import AnalyticsChart from "./analytics-chart";
export default function YouthLab({ expanded = false }: { expanded?: boolean }) {
  const [age, setAge] = useState("20–29");
  const selected = currentAgeRegistration.find((r) => r.ageGroup === age)!;
  const historic = historicAgeRegistration.find((r) => r.ageGroup === age);
  const historicParticipation = historicAgeTurnout.find(
    (r) => r.ageGroup === age,
  );
  const youthBounds = youthRegistrationBounds(currentAgeRegistration);
  const growth = percentageChange(selected.registered, historic?.registered);
  const max = Math.max(...currentAgeRegistration.map((r) => r.registered));
  const option = useMemo(
    () => ({
      grid: { left: 58, right: 28, bottom: 42, top: 25 },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#172235",
        borderColor: "#29374c",
        textStyle: { color: "#f5f7fb" },
        valueFormatter: (v: unknown) =>
          typeof v === "number" ? formatNumber(v) : String(v),
      },
      xAxis: {
        type: "category" as const,
        data: ["2016 certified roll", "29 Sep 2026 snapshot"],
        axisLabel: { color: "#94a3b8", fontSize: 10 },
        axisLine: { lineStyle: { color: "#29374c" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: {
          color: "#94a3b8",
          fontSize: 10,
          formatter: (v: number) => formatNumber(v, true),
        },
        splitLine: { lineStyle: { color: "#29374c", type: "dashed" as const } },
      },
      series: [
        {
          name: `Registered age ${age}`,
          type: "line" as const,
          data: [historic?.registered ?? null, selected.registered],
          lineStyle: { color: "#b9f56a", width: 3, type: "dashed" as const },
          symbolSize: 10,
          itemStyle: { color: "#b9f56a" },
          areaStyle: { color: "#b9f56a08" },
        },
      ],
    }),
    [age, historic, selected],
  );
  return (
    <>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUTH INTELLIGENCE LAB</p>
            <h2>The next generation of participation</h2>
            <p>
              Verified registration counts · 29 September 2026 · original IEC
              age bands
            </p>
          </div>
          {!expanded && (
            <Link href="/youth" className="text-link">
              Open youth lab <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
        <div className="youth-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>The age profile of the voters’ roll</h3>
                <p>
                  Absolute registration counts; these are not registration or
                  turnout rates.
                </p>
              </div>
              <span className="badge badge-lime">IEC · VERIFIED SNAPSHOT</span>
            </div>
            <div className="youth-rows">
              {currentAgeRegistration.map((row) => (
                <button
                  key={row.ageGroup}
                  onClick={() => setAge(row.ageGroup)}
                  aria-pressed={age === row.ageGroup}
                  className="age-select-row"
                >
                  <span>{row.ageGroup}</span>
                  <div className="age-bar-track">
                    <AnimatedBar
                      width={`${(row.registered / max) * 100}%`}
                      className="age-bar"
                      color={age === row.ageGroup ? "#b9f56a" : "#62a7f87a"}
                    />
                  </div>
                  <span className="mono">
                    {formatNumber(row.registered, true)}
                  </span>
                </button>
              ))}
            </div>
            <div className="panel-footer">
              <span>
                30–39 is preserved; it cannot establish an exact 18–35 total.
              </span>
              <Link href="/explorer?dataset=registration" className="text-link">
                Explore snapshot <ArrowUpRight size={10} />
              </Link>
            </div>
            <details style={{ marginTop: 13 }}>
              <summary
                className="muted"
                style={{ fontSize: 10, cursor: "pointer" }}
              >
                Accessible age-profile table
              </summary>
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Scrollable age-profile data"
              >
                <table className="data-table">
                  <caption className="sr-only">
                    Registered voters by published IEC age bands, 29 September
                    2026
                  </caption>
                  <thead>
                    <tr>
                      <th>Age band</th>
                      <th>Registered people</th>
                      <th>Observation date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAgeRegistration.map((row) => (
                      <tr key={row.ageGroup}>
                        <td>{row.ageGroup}</td>
                        <td>{formatNumber(row.registered)}</td>
                        <td>29 September 2026</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
          <div>
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>Selected age group · {age}</h3>
                  <p>
                    Registration snapshot, not actual election participation.
                  </p>
                </div>
              </div>
              <div className="metric-number lime">
                {formatNumber(selected.registered, true)}
              </div>
              <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                {(
                  (selected.registered /
                    currentRegistrationObservation.registered) *
                  100
                ).toFixed(2)}
                % of the national voters’ roll.
              </p>
              <div className="breakdown-list" style={{ marginTop: 25 }}>
                <div className="breakdown-row">
                  <span>2016 published age-band turnout</span>
                  <span className="mono">
                    {historicParticipation?.turnout ?? "—"}% · rounded
                  </span>
                </div>
                <div className="breakdown-row">
                  <span>Eligible citizens in this age band</span>
                  <span className="mono">—</span>
                </div>
                <div className="breakdown-row">
                  <span>Registration rate</span>
                  <span className="mono">—</span>
                </div>
                <div className="breakdown-row">
                  <span>Actual voters in this age band</span>
                  <span className="mono">—</span>
                </div>
              </div>
            </div>
            <div className="insight-card">
              <p className="eyebrow">
                <Sparkles
                  size={12}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: 7,
                  }}
                />{" "}
                INSIGHT ENGINE
              </p>
              <h3>
                {age} registrations{" "}
                {growth != null && growth < 0 ? "decreased" : "increased"}{" "}
                across the two snapshots.
              </h3>
              <p>
                {growth == null
                  ? "Comparable change unavailable."
                  : `${Math.abs(growth).toFixed(1)}% ${growth < 0 ? "fewer" : "more"} registered people than the same published age band in the 2016 certified roll. This compares different cohorts at different dates; it does not track individuals or measure an eligible-youth registration rate.`}
              </p>
            </div>
          </div>
        </div>
      </section>
      {expanded && (
        <>
          <section className="section equal-columns">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Two registration observations</h2>
                  <p>
                    Original age band · {age} · historical roll and current
                    snapshot
                  </p>
                </div>
                <label className="field">
                  Age band
                  <select value={age} onChange={(e) => setAge(e.target.value)}>
                    {currentAgeRegistration.map((r) => (
                      <option key={r.ageGroup}>{r.ageGroup}</option>
                    ))}
                  </select>
                </label>
              </div>
              <AnalyticsChart
                label={`Registered people aged ${age}, 2016 compared with September 2026. Dashed line joins two snapshots, not a continuous series.`}
                option={option}
              />
              <div className="data-notice">
                The dashed line joins two verified snapshots. It is not a
                continuous annual series, and changing cohorts limit
                interpretation.
              </div>
              <table className="data-table" style={{ marginTop: 20 }}>
                <thead>
                  <tr>
                    <th>Observation</th>
                    <th>Registered · {age}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2016 certified roll</td>
                    <td>{formatNumber(historic?.registered)}</td>
                  </tr>
                  <tr>
                    <td>29 Sep 2026 snapshot</td>
                    <td>{formatNumber(selected.registered)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>Provincial registration context</h2>
                <span className="badge badge-lime">
                  ALL-AGE PROVINCE SNAPSHOT
                </span>
              </div>
              <div className="province-grid">
                {provinces.map((p) => (
                  <div className="province-mini" key={p}>
                    {p}
                    <strong>
                      {formatNumber(
                        currentProvinceRegistration.find(
                          (row) => row.province === p,
                        )?.registered,
                        true,
                      )}
                    </strong>
                    <span>Registered · all ages · 29 Sep 2026</span>
                  </div>
                ))}
              </div>
              <div className="data-notice">
                These are verified all-age province totals, not province-level
                youth figures. Exact province-by-age registrations remain
                unavailable.{" "}
                <Link className="text-link" href="/map">
                  Explore the province map ↗
                </Link>
              </div>
              <h3 style={{ margin: "25px 0 13px" }}>
                What can we establish about ages 18–35?
              </h3>
              <p className="muted">
                Registered ages 18–35 lie between{" "}
                <strong className="lime">
                  {formatNumber(youthBounds?.lower)} and{" "}
                  {formatNumber(youthBounds?.upper)}
                </strong>{" "}
                in the September 2026 snapshot.
              </p>
              <p className="data-notice">
                The lower bound includes every registered person aged 18–29. The
                upper bound includes all registered people aged 18–39. The
                unknown 30–35 share lies inside the 30–39 band. These are
                logical limits, not a confidence interval or a best estimate.
                Exact eligible youth and youth registration rates remain
                unverified.
              </p>
              <Link
                className="text-link"
                href="/comparison?mode=ages&metric=registered"
              >
                Compare original published age bands ↗
              </Link>
            </div>
          </section>
          <section className="section panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">VERIFIED HISTORICAL AGE PARTICIPATION</p>
                <h2>2016 turnout by published age band</h2>
                <p>
                  Rounded IEC percentages. These describe the 2016 election, not
                  the September 2026 registration snapshot.
                </p>
              </div>
              <Link
                className="text-link"
                href="/comparison?mode=ages&metric=turnout&ageYearA=2016&ageYearB=2016"
              >
                Compare historical age turnout ↗
              </Link>
            </div>
            <AnalyticsChart
              label="IEC 2016 municipal turnout:18–19 71%,20–29 50%,30–39 50%,40–49 59%,50–59 69%,60–69 73%,70–79 67%,80+46%; published whole percentages"
              option={{
                grid: { left: 45, right: 18, bottom: 35, top: 22 },
                tooltip: {
                  trigger: "axis",
                  valueFormatter: (value) =>
                    `${value}% (published rounded rate)`,
                },
                xAxis: {
                  type: "category",
                  data: historicAgeTurnout.map((row) => row.ageGroup),
                  axisLabel: { color: "#94a3b8" },
                },
                yAxis: {
                  type: "value",
                  max: 100,
                  axisLabel: { color: "#94a3b8", formatter: "{value}%" },
                  splitLine: { lineStyle: { color: "#29374c" } },
                },
                series: [
                  {
                    type: "bar",
                    data: historicAgeTurnout.map((row) => ({
                      value: row.turnout,
                      itemStyle: {
                        color: row.ageGroup === age ? "#b9f56a" : "#62a7f8",
                      },
                    })),
                    barMaxWidth: 36,
                  },
                ],
              }}
            />
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Scrollable age-profile data"
            >
              <table className="data-table">
                <caption className="sr-only">
                  2016 published age turnout, rounded whole percentages
                </caption>
                <thead>
                  <tr>
                    <th>Original age band</th>
                    <th>2016 published turnout</th>
                    <th>Precision</th>
                  </tr>
                </thead>
                <tbody>
                  {historicAgeTurnout.map((row) => (
                    <tr key={row.ageGroup}>
                      <td>{row.ageGroup}</td>
                      <td>{row.turnout}%</td>
                      <td>Whole percent; exact voter count not inferred</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="data-notice">
              Source: IEC 2016 Municipal Elections Report, Figure 14 (printed
              page 75). Rounded percentages cannot reconstruct exact
              participating-person counts. Original bands do not provide an
              exact 18–35 turnout rate.
            </p>
          </section>
        </>
      )}
    </>
  );
}
