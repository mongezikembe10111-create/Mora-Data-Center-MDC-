"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import AnimatedBar from "./animated-bar";
import {
  currentAgeRegistration,
  historicAgeRegistration,
  currentRegistrationObservation,
  provinces,
} from "@/lib/data";
import { percentageChange } from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";
import AnalyticsChart from "./analytics-chart";
export default function YouthLab({ expanded = false }: { expanded?: boolean }) {
  const [age, setAge] = useState("20–29");
  const selected = currentAgeRegistration.find((r) => r.ageGroup === age)!;
  const historic = historicAgeRegistration.find((r) => r.ageGroup === age);
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
              <div className="table-scroll">
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
                <h2>Provincial youth coverage</h2>
                <span className="badge badge-amber">
                  EXACT 18–35 UNAVAILABLE
                </span>
              </div>
              <div className="province-grid">
                {provinces.map((p) => (
                  <div className="province-mini" key={p}>
                    {p}
                    <strong>—</strong>
                    <span>Eligible and registered 18–35 unavailable</span>
                  </div>
                ))}
              </div>
              <div className="data-notice">
                Province totals for all ages are available in the map and
                explorer. They are not substituted for province-level youth
                figures.
              </div>
              <h3 style={{ margin: "25px 0 13px" }}>
                Youth versus older voters
              </h3>
              <p className="empty-state">
                Official comparable data unavailable. The published 30–39 band
                cannot be split into 30–35 and 36–39 without reliable underlying
                data.
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
