"use client";
import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import {
  currentAgeRegistration,
  historicAgeRegistration,
  currentProvinceRegistration,
  provinceElections,
  elections,
  getSource,
} from "@/lib/data";
import {
  csvCell,
  electionMetrics,
  effectiveTurnoutElectorate,
} from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";
import ElectionChart, { downloadBlob } from "./election-chart";

type CompositionChart = "bar" | "stacked" | "donut" | "treemap";
const palette = [
  "#b9f56a",
  "#62a7f8",
  "#86c3af",
  "#f4b76a",
  "#9eb9d3",
  "#7dad7e",
  "#c0ab87",
  "#7d9bb5",
  "#e1ddb0",
];
export default function CompositionStudio() {
  const [year, setYear] = useState(2026);
  const [breakdown, setBreakdown] = useState<"age" | "province">("age");
  const [chartType, setChartType] = useState<CompositionChart>("bar");
  const [flowYear, setFlowYear] = useState(2021);
  const rows = useMemo(
    () =>
      breakdown === "age"
        ? (year === 2026
            ? currentAgeRegistration
            : historicAgeRegistration
          ).map((r) => ({
            name: r.ageGroup,
            registered: r.registered,
            male: r.male,
            female: r.female,
            sourceId: r.sourceId,
            date: r.observedAt,
          }))
        : (year === 2026 ? currentProvinceRegistration : provinceElections).map(
            (r) => ({
              name: r.province,
              registered: r.registered!,
              male: null,
              female: null,
              sourceId: r.sourceId,
              date: "observedAt" in r ? r.observedAt : String(r.year),
            }),
          ),
    [year, breakdown],
  );
  const source = getSource(rows[0].sourceId);
  const total = rows.reduce((sum, r) => sum + r.registered, 0);
  const option = useMemo<EChartsOption>(() => {
    const common: EChartsOption = {
      textStyle: { fontFamily: "Inter", color: "#94a3b8" },
      tooltip: {
        trigger: "item",
        backgroundColor: "#172235",
        borderColor: "#29374c",
        textStyle: { color: "#f5f7fb" },
      },
      color: palette,
    };
    if (chartType === "donut")
      return {
        ...common,
        series: [
          {
            type: "pie",
            radius: ["42%", "70%"],
            center: ["50%", "47%"],
            avoidLabelOverlap: true,
            label: { color: "#94a3b8", fontSize: 10, formatter: "{b}: {d}%" },
            labelLine: { lineStyle: { color: "#53627a" } },
            itemStyle: { borderColor: "#101827", borderWidth: 3 },
            data: rows.map((r) => ({ name: r.name, value: r.registered })),
          },
        ],
      };
    if (chartType === "treemap")
      return {
        ...common,
        series: [
          {
            type: "treemap",
            roam: false,
            nodeClick: false,
            breadcrumb: { show: false },
            width: "100%",
            height: "90%",
            top: 5,
            label: {
              color: "#101827",
              fontSize: 11,
              formatter: (p) =>
                `${p.name}\n${formatNumber(Number(p.value), true)}`,
            },
            itemStyle: { borderColor: "#101827", borderWidth: 3, gapWidth: 3 },
            data: rows.map((r) => ({ name: r.name, value: r.registered })),
          },
        ],
      };
    return {
      ...common,
      tooltip: {
        trigger: "axis",
        backgroundColor: "#172235",
        borderColor: "#29374c",
        textStyle: { color: "#f5f7fb" },
      },
      grid: { left: 110, right: 40, top: 28, bottom: 30 },
      legend:
        chartType === "stacked"
          ? { textStyle: { color: "#94a3b8" }, top: 0 }
          : undefined,
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
          fontSize: 10,
          formatter: (v) => formatNumber(v, true),
        },
        splitLine: { lineStyle: { color: "#29374c" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((r) => r.name),
        axisLabel: { color: "#94a3b8", fontSize: 10 },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series:
        chartType === "stacked"
          ? [
              {
                name: "Male · official category",
                type: "bar",
                stack: "registered",
                data: rows.map((r) => r.male),
                itemStyle: { color: "#62a7f8" },
              },
              {
                name: "Female · official category",
                type: "bar",
                stack: "registered",
                data: rows.map((r) => r.female),
                itemStyle: { color: "#b9f56a" },
              },
            ]
          : [
              {
                name: "Registered people",
                type: "bar",
                data: rows.map((r) => r.registered),
                itemStyle: { color: "#b9f56a", borderRadius: [0, 3, 3, 0] },
              },
            ],
    };
  }, [rows, chartType]);
  const flow = elections.find((e) => e.year === flowYear)!;
  const electorate = effectiveTurnoutElectorate(flow);
  const nonparticipants = electionMetrics(flow).nonVoters;
  const flowOption = useMemo<EChartsOption>(
    () => ({
      textStyle: { fontFamily: "Inter", color: "#94a3b8" },
      tooltip: {
        backgroundColor: "#172235",
        borderColor: "#29374c",
        textStyle: { color: "#f5f7fb" },
      },
      series: [
        {
          type: "sankey",
          layoutIterations: 0,
          left: 25,
          right: 150,
          top: 25,
          bottom: 25,
          nodeWidth: 12,
          nodeGap: 45,
          draggable: false,
          emphasis: { focus: "adjacency" },
          label: {
            color: "#c5d0e0",
            fontSize: 11,
            formatter: (p) =>
              `${p.name}\n${formatNumber(Number(p.value), true)}`,
          },
          data: [
            { name: "Effective electorate", itemStyle: { color: "#62a7f8" } },
            { name: "Participating voters", itemStyle: { color: "#b9f56a" } },
            { name: "Did not participate", itemStyle: { color: "#52657e" } },
          ],
          links: [
            {
              source: "Effective electorate",
              target: "Participating voters",
              value: flow.voters ?? 0,
            },
            {
              source: "Effective electorate",
              target: "Did not participate",
              value: nonparticipants ?? 0,
            },
          ],
          lineStyle: { color: "gradient", opacity: 0.28, curveness: 0.5 },
        },
      ],
    }),
    [flow, nonparticipants],
  );
  function exportCsv() {
    const header = [
      "Category",
      "Registered people",
      "Share of selected roll (%)",
      ...(breakdown === "age"
        ? [
            "Male registered people (published category)",
            "Female registered people (published category)",
          ]
        : []),
      "Source organisation",
      "Source title",
      "Source URL",
      "Observation date",
      "Definition",
    ];
    const body = rows.map((r) =>
      [
        r.name,
        r.registered,
        (r.registered / total) * 100,
        ...(breakdown === "age" ? [r.male, r.female] : []),
        source?.organisation,
        source?.title,
        source?.url,
        r.date,
        "Registered people in the original published category; share of the matching national roll, not an eligible registration or turnout rate.",
      ]
        .map(csvCell)
        .join(","),
    );
    downloadBlob(
      new Blob(
        ["\uFEFF", header.map(csvCell).join(","), "\r\n", body.join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      `mora-registration-composition-${year}-${breakdown}.csv`,
    );
  }
  return (
    <>
      <section className="section panel" id="composition-studio">
        <div className="panel-header">
          <div>
            <p className="eyebrow">COMPOSITION STUDIO</p>
            <h2>See the shape of the voters’ roll</h2>
            <p>
              One coherent observation. Published categories. Parts of a known
              total.
            </p>
          </div>
          <span className="badge badge-lime">
            {formatNumber(total, true)} REGISTERED
          </span>
        </div>
        <div className="toolbar">
          <label className="field">
            Observation
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              <option value={2026}>29 September 2026</option>
              <option value={2016}>2016 certified roll</option>
            </select>
          </label>
          <label className="field">
            Break down by
            <select
              value={breakdown}
              onChange={(e) => {
                setBreakdown(e.target.value as typeof breakdown);
                if (chartType === "stacked") setChartType("bar");
              }}
            >
              <option value="age">Published age band</option>
              <option value="province">Province</option>
            </select>
          </label>
          <label className="field">
            Composition chart
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as CompositionChart)}
            >
              <option value="bar">Horizontal bar</option>
              {breakdown === "age" && (
                <option value="stacked">
                  Stacked bar · official male/female counts
                </option>
              )}
              <option value="donut">Donut · share of roll</option>
              <option value="treemap">Treemap · registration counts</option>
            </select>
          </label>
          <button className="button button-outline" onClick={exportCsv}>
            Composition CSV ↓
          </button>
        </div>
        <ElectionChart
          option={option}
          title={`Registered people by ${breakdown} · ${year}`}
          sourceNote={`${source?.organisation} — ${source?.title}. Observation: ${rows[0].date}. ${breakdown === "province" && year === 2016 ? "Province categories use 2016 election boundaries." : ""}`}
          definition="Absolute registered people; percentage shares refer to the same dated national voters’ roll, not to eligible citizens."
          height={390}
        />
        <details>
          <summary
            className="muted"
            style={{ fontSize: 12, cursor: "pointer" }}
          >
            Accessible composition table
          </summary>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">
                Published registration categories and shares of the same dated
                roll
              </caption>
              <thead>
                <tr>
                  <th>Original category</th>
                  <th>Registered people</th>
                  <th>Share of roll</th>
                  {breakdown === "age" && (
                    <>
                      <th>Male (published)</th>
                      <th>Female (published)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{formatNumber(r.registered)}</td>
                    <td>{((r.registered / total) * 100).toFixed(2)}%</td>
                    {breakdown === "age" && (
                      <>
                        <td>{formatNumber(r.male)}</td>
                        <td>{formatNumber(r.female)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <div className="data-notice">
          Age bands have different widths. Their counts are not age-specific
          registration rates. These are cross-sectional observations, not a
          cohort study.
        </div>
      </section>
      <section className="section panel" id="participation-sankey">
        <div className="panel-header">
          <div>
            <p className="eyebrow">PARTICIPATION FLOWS</p>
            <h2>One electorate, two recorded outcomes</h2>
            <p>
              A Sankey partition of compatible election counts. No eligible
              population is assumed.
            </p>
          </div>
          <label className="field">
            Flow election
            <select
              value={flowYear}
              onChange={(e) => setFlowYear(Number(e.target.value))}
            >
              {elections
                .filter(
                  (e) =>
                    effectiveTurnoutElectorate(e) != null && e.voters != null,
                )
                .map((e) => (
                  <option key={e.year} value={e.year}>
                    {e.year} municipal
                  </option>
                ))}
            </select>
          </label>
        </div>
        <ElectionChart
          option={flowOption}
          title={`${flowYear} effective electorate and participation`}
          sourceNote={`IEC ${flowYear} Municipal Elections Report. ${flow.note}`}
          definition="Participating voters and non-participants sum to the documented effective turnout electorate, including MEC7 additions. Ballot types are not summed."
          unavailable={
            electorate == null || flow.voters == null || nonparticipants == null
          }
          height={300}
        />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Effective electorate</th>
                <th>Participating voters</th>
                <th>Did not participate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatNumber(electorate)}</td>
                <td>{formatNumber(flow.voters)}</td>
                <td>{formatNumber(nonparticipants)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
