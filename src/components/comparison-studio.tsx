"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import {
  elections,
  provinceElections,
  provinces,
  sources,
  type ElectionRecord,
} from "@/lib/data";
import { areTurnoutComparable } from "@/lib/analytics";
import {
  csvCell,
  effectiveElectorate,
  explorerMetrics,
  formatMetric,
  isMetric,
  metricValue,
  metroOptions,
  turnoutBasis,
  type ExplorerMetric,
} from "@/lib/explorer-metrics";
import ElectionChart, { downloadBlob } from "@/components/election-chart";

type ComparisonMode = "years" | "provinces" | "metros" | "ages";
type ComparisonFilters = {
  mode: ComparisonMode;
  a: string;
  b: string;
  provinceA: string;
  provinceB: string;
  metroA: string;
  metroB: string;
  ageA: string;
  ageB: string;
  metric: ExplorerMetric;
  chart: "paired" | "mirrored";
};
const recordKey = (record?: ElectionRecord) =>
  record ? `${record.year}-${record.type}` : "unavailable";
const comparisonMetrics: ExplorerMetric[] = [
  "registered",
  "turnoutDenominator",
  "voters",
  "turnout",
  "registrationRate",
  "abstention",
  "nonVoters",
  "validBallots",
  "eligible",
];
const defaults: ComparisonFilters = {
  mode: "years",
  a: recordKey(
    elections.find(
      (record) => record.year === 2016 && record.type === "municipal",
    ) || elections[0],
  ),
  b: recordKey(
    elections.find(
      (record) => record.year === 2021 && record.type === "municipal",
    ) || elections[elections.length - 1],
  ),
  provinceA: "Gauteng",
  provinceB: "Western Cape",
  metroA: "City of Johannesburg",
  metroB: "City of Cape Town",
  ageA: "18–35",
  ageB: "36+",
  metric: "turnout",
  chart: "paired",
};

function signed(value: number, decimals = 0) {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("en-ZA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}`;
}
function sourceFor(record?: ElectionRecord) {
  return record
    ? sources.find((source) => source.id === record.sourceId)
    : undefined;
}

export default function ComparisonStudio() {
  const [filters, setFilters] = useState<ComparisonFilters>(defaults);
  const [restored, setRestored] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const a = params.get("a");
    const b = params.get("b");
    const metric = params.get("metric");
    setFilters((current) => ({
      ...current,
      mode:
        mode && ["years", "provinces", "metros", "ages"].includes(mode)
          ? (mode as ComparisonMode)
          : current.mode,
      a:
        a && elections.some((record) => recordKey(record) === a)
          ? a
          : current.a,
      b:
        b && elections.some((record) => recordKey(record) === b)
          ? b
          : current.b,
      provinceA: provinces.some(
        (province) => province === params.get("provinceA"),
      )
        ? params.get("provinceA")!
        : current.provinceA,
      provinceB: provinces.some(
        (province) => province === params.get("provinceB"),
      )
        ? params.get("provinceB")!
        : current.provinceB,
      metroA: metroOptions.some((metro) => metro.name === params.get("metroA"))
        ? params.get("metroA")!
        : current.metroA,
      metroB: metroOptions.some((metro) => metro.name === params.get("metroB"))
        ? params.get("metroB")!
        : current.metroB,
      ageA: ["18–35", "36+"].includes(params.get("ageA") || "")
        ? params.get("ageA")!
        : current.ageA,
      ageB: ["18–35", "36+"].includes(params.get("ageB") || "")
        ? params.get("ageB")!
        : current.ageB,
      metric: isMetric(metric) ? metric : current.metric,
      chart: params.get("chart") === "mirrored" ? "mirrored" : "paired",
    }));
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(filters))
      url.searchParams.set(key, value);
    window.history.replaceState(null, "", url);
    setShareUrl(url.toString());
  }, [filters, restored]);

  const recordA =
    filters.mode === "provinces"
      ? provinceElections.find(
          (record) =>
            record.province === filters.provinceA && record.year === 2016,
        )
      : elections.find((record) => recordKey(record) === filters.a);
  const recordB =
    filters.mode === "provinces"
      ? provinceElections.find(
          (record) =>
            record.province === filters.provinceB && record.year === 2016,
        )
      : elections.find((record) => recordKey(record) === filters.b);
  const supported = filters.mode === "years" || filters.mode === "provinces";
  const mixedElectionTypes = recordA?.type !== recordB?.type;
  const incompatibleTurnout =
    supported && recordA && recordB
      ? !areTurnoutComparable(recordA, recordB)
      : false;
  const labelA =
    filters.mode === "provinces"
      ? filters.provinceA
      : filters.mode === "metros"
        ? filters.metroA
        : filters.mode === "ages"
          ? `${filters.ageA} years`
          : recordA
            ? `${recordA.year} · ${recordA.type}`
            : "Selection A";
  const labelB =
    filters.mode === "provinces"
      ? filters.provinceB
      : filters.mode === "metros"
        ? filters.metroB
        : filters.mode === "ages"
          ? `${filters.ageB} years`
          : recordB
            ? `${recordB.year} · ${recordB.type}`
            : "Selection B";
  const metric = explorerMetrics[filters.metric];

  const comparisons = comparisonMetrics.map((key) => {
    const valueA = supported && recordA ? metricValue(recordA, key) : null;
    const valueB = supported && recordB ? metricValue(recordB, key) : null;
    const comparable =
      !(mixedElectionTypes && key === "validBallots") &&
      !(key === "turnout" && incompatibleTurnout);
    const change =
      valueA !== null && valueB !== null && comparable ? valueB - valueA : null;
    const relativeChange =
      valueA !== null && valueA !== 0 && change !== null
        ? (change / valueA) * 100
        : null;
    return { key, valueA, valueB, change, relativeChange, comparable };
  });
  const selected = comparisons.find((row) => row.key === filters.metric)!;
  const hasChartData =
    selected.valueA !== null && selected.valueB !== null && selected.comparable;
  const sourceNote = supported
    ? `Sources: ${[...new Set([sourceFor(recordA), sourceFor(recordB)].filter(Boolean).map((source) => `${source!.organisation} — ${source!.title} (observed ${source!.observedAt})`))].join("; ") || "MORA source registry"}. Reference years: ${recordA?.year || "unavailable"}, ${recordB?.year || "unavailable"}. Geography: ${filters.mode === "provinces" ? `${filters.provinceA} / ${filters.provinceB}; 2016 electoral boundaries` : "South Africa"}.`
    : "Source: MORA source registry. Comparable metropolitan and exact youth 18–35 observations have not been verified.";
  const emptyMessage =
    filters.metric === "turnout" && incompatibleTurnout
      ? "The published rates use incompatible or unreconciled denominator bases. Select compatible person-level elections; individual published rates remain in the table with source notes."
      : !supported
        ? "Comparable metropolitan and exact youth 18–35 datasets have not been verified. National figures are not substituted for the selected groups."
        : "This metric requires compatible observations for both selections. Choose another metric or consult the source coverage table.";

  const option = useMemo<EChartsOption>(() => {
    const valueA =
      supported && recordA ? metricValue(recordA, filters.metric) : null;
    const valueB =
      supported && recordB ? metricValue(recordB, filters.metric) : null;
    const mirrored = filters.chart === "mirrored";
    const percentage = explorerMetrics[filters.metric].unit === "%";
    const formatter = (value: number) =>
      percentage
        ? `${Math.abs(value).toFixed(0)}%`
        : new Intl.NumberFormat("en-ZA", { notation: "compact" }).format(
            Math.abs(value),
          );
    return {
      textStyle: { fontFamily: "Inter, Arial, sans-serif", color: "#94A3B8" },
      grid: { top: 32, left: 72, right: 36, bottom: 45 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#172235",
        borderColor: "#29374C",
        textStyle: { color: "#F5F7FB" },
        valueFormatter: (value) =>
          typeof value === "number"
            ? formatMetric(Math.abs(value), filters.metric)
            : "Unavailable",
      },
      legend: {
        bottom: 0,
        textStyle: { color: "#94A3B8", fontSize: 11 },
        icon: "circle",
      },
      xAxis: mirrored
        ? {
            type: "value",
            min: percentage ? -100 : undefined,
            max: percentage ? 100 : undefined,
            axisLabel: { color: "#94A3B8", formatter },
            splitLine: { lineStyle: { color: "#29374C", type: "dashed" } },
          }
        : {
            type: "category",
            data: ["Election comparison"],
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#29374C" } },
            axisLabel: { color: "#94A3B8" },
          },
      yAxis: mirrored
        ? {
            type: "category",
            data: [explorerMetrics[filters.metric].label],
            axisLabel: { show: false },
            axisTick: { show: false },
            axisLine: { show: false },
          }
        : {
            type: "value",
            min: 0,
            max: percentage ? 100 : undefined,
            axisLabel: { color: "#94A3B8", formatter },
            splitLine: { lineStyle: { color: "#29374C", type: "dashed" } },
          },
      series: [
        {
          name: labelA,
          type: "bar",
          stack: mirrored ? "comparison" : undefined,
          data: [valueA === null ? null : mirrored ? -valueA : valueA],
          itemStyle: {
            color: "#62A7F8",
            borderRadius: mirrored ? [3, 0, 0, 3] : [3, 3, 0, 0],
          },
          barMaxWidth: mirrored ? 75 : 100,
          label: {
            show: true,
            position: mirrored ? "left" : "top",
            color: "#F5F7FB",
            formatter: () => formatMetric(valueA, filters.metric),
          },
        },
        {
          name: labelB,
          type: "bar",
          stack: mirrored ? "comparison" : undefined,
          data: [valueB],
          itemStyle: {
            color: "#B9F56A",
            borderRadius: mirrored ? [0, 3, 3, 0] : [3, 3, 0, 0],
          },
          barMaxWidth: mirrored ? 75 : 100,
          label: {
            show: true,
            position: mirrored ? "right" : "top",
            color: "#F5F7FB",
            formatter: () => formatMetric(valueB, filters.metric),
          },
        },
      ],
    };
  }, [
    filters.chart,
    filters.metric,
    labelA,
    labelB,
    recordA,
    recordB,
    supported,
  ]);

  function update<K extends keyof ComparisonFilters>(
    key: K,
    value: ComparisonFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
    setFeedback("");
  }

  async function shareComparison() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setFeedback(
        "Comparison URL copied. It restores both selections and the metric.",
      );
    } catch {
      setFeedback("Select and copy the comparison link below.");
    }
  }

  function downloadCsv() {
    const header = [
      "Variable",
      "Definition",
      "Unit",
      "Selection A",
      "Reference year A",
      "Value A",
      "Effective turnout denominator A",
      "Published turnout basis A",
      "Selection B",
      "Reference year B",
      "Value B",
      "Effective turnout denominator B",
      "Published turnout basis B",
      "Change B minus A",
      "Change unit",
      "Relative change percent",
      "Source A title",
      "Source A organisation",
      "Source A URL",
      "Source A observed",
      "Source B title",
      "Source B organisation",
      "Source B URL",
      "Source B observed",
      "Source notes A",
      "Source notes B",
      "Comparability note",
    ];
    const sourceA = supported ? sourceFor(recordA) : undefined;
    const sourceB = supported ? sourceFor(recordB) : undefined;
    const data = comparisons.map((row) =>
      [
        explorerMetrics[row.key].label,
        explorerMetrics[row.key].definition,
        explorerMetrics[row.key].unit,
        labelA,
        recordA?.year,
        row.valueA,
        supported && recordA ? effectiveElectorate(recordA) : null,
        supported && recordA ? turnoutBasis(recordA) : null,
        labelB,
        recordB?.year,
        row.valueB,
        supported && recordB ? effectiveElectorate(recordB) : null,
        supported && recordB ? turnoutBasis(recordB) : null,
        row.change,
        explorerMetrics[row.key].unit === "%"
          ? "percentage points"
          : explorerMetrics[row.key].unit,
        row.relativeChange,
        sourceA?.title,
        sourceA?.organisation,
        sourceA?.url,
        sourceA?.observedAt,
        sourceB?.title,
        sourceB?.organisation,
        sourceB?.url,
        sourceB?.observedAt,
        supported ? recordA?.note : "Official comparable data unavailable",
        supported ? recordB?.note : "Official comparable data unavailable",
        !row.comparable
          ? row.key === "turnout"
            ? "Incompatible or unreconciled turnout denominator bases; rate changes are unavailable"
            : "Different ballot structures; valid-ballot change is not comparable"
          : "Nulls are unavailable, not zero",
      ]
        .map(csvCell)
        .join(","),
    );
    downloadBlob(
      new Blob(
        ["\uFEFF", header.map(csvCell).join(","), "\r\n", data.join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      `mora-comparison-${filters.a}-${filters.b}.csv`,
    );
    setFeedback(
      "Comparison CSV downloaded with source references and variable definitions.",
    );
  }

  function renderSelection(side: "A" | "B") {
    const lower = side.toLowerCase() as "a" | "b";
    const label = side === "A" ? labelA : labelB;
    const record = side === "A" ? recordA : recordB;
    return (
      <div
        className="panel"
        style={{
          borderTop: `2px solid ${side === "A" ? "#62A7F8" : "#B9F56A"}`,
        }}
      >
        <div className="panel-header">
          <span className="eyebrow">Selection {side}</span>
          <span className="muted" style={{ fontSize: 11 }}>
            {filters.mode === "provinces"
              ? "2016 municipal election"
              : supported
                ? "National aggregate"
                : "Data unavailable"}
          </span>
        </div>
        <label className="field">
          {filters.mode === "years"
            ? "Election cycle"
            : filters.mode === "provinces"
              ? "Province"
              : filters.mode === "metros"
                ? "Metropolitan municipality"
                : "Age group"}
          {filters.mode === "years" && (
            <select
              className="select"
              value={filters[lower]}
              onChange={(event) => update(lower, event.target.value)}
            >
              {[...elections]
                .sort((a, b) => b.year - a.year)
                .map((record) => (
                  <option key={recordKey(record)} value={recordKey(record)}>
                    {record.year} ·{" "}
                    {record.type === "municipal" ? "Municipal" : "National"}
                  </option>
                ))}
            </select>
          )}
          {filters.mode === "provinces" && (
            <select
              className="select"
              value={filters[`province${side}`]}
              onChange={(event) =>
                update(`province${side}`, event.target.value)
              }
            >
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          )}
          {filters.mode === "metros" && (
            <select
              className="select"
              value={filters[`metro${side}`]}
              onChange={(event) => update(`metro${side}`, event.target.value)}
            >
              {metroOptions.map((metro) => (
                <option key={metro.name} value={metro.name}>
                  {metro.name}
                </option>
              ))}
            </select>
          )}
          {filters.mode === "ages" && (
            <select
              className="select"
              value={filters[`age${side}`]}
              onChange={(event) => update(`age${side}`, event.target.value)}
            >
              <option value="18–35">Youth · 18–35</option>
              <option value="36+">Older citizens · 36+</option>
            </select>
          )}
        </label>
        <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
          {metric.label} · {label}
        </p>
        <p
          style={{
            fontSize: 36,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
            margin: "6px 0 12px",
            color: side === "A" ? "#62A7F8" : "#B9F56A",
          }}
        >
          {formatMetric(
            side === "A" ? selected.valueA : selected.valueB,
            filters.metric,
          )}
        </p>
        {supported && record && filters.metric === "turnout" && (
          <p className="muted" style={{ fontSize: 11 }}>
            Published rate basis: {turnoutBasis(record).replaceAll("-", " ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="comparison-workspace">
      <section className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-header">
          <div>
            <span className="eyebrow">Two perspectives. One standard.</span>
            <h2>Configure a comparison</h2>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setFilters(defaults);
              setFeedback("Comparison reset.");
            }}
          >
            Reset ↺
          </button>
        </div>
        <div
          className="toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "end",
          }}
        >
          <label className="field" style={{ minWidth: 190, flex: 1 }}>
            Compare by
            <select
              className="select"
              value={filters.mode}
              onChange={(event) =>
                update("mode", event.target.value as ComparisonMode)
              }
            >
              <option value="years">Election year</option>
              <option value="provinces">Province</option>
              <option value="metros">Metropolitan municipality</option>
              <option value="ages">Age group</option>
            </select>
          </label>
          <label className="field" style={{ minWidth: 220, flex: 1 }}>
            Metric
            <select
              className="select"
              value={filters.metric}
              onChange={(event) =>
                update("metric", event.target.value as ExplorerMetric)
              }
            >
              {comparisonMetrics.map((key) => (
                <option key={key} value={key}>
                  {explorerMetrics[key].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ minWidth: 170 }}>
            Visualisation
            <select
              className="select"
              value={filters.chart}
              onChange={(event) =>
                update("chart", event.target.value as "paired" | "mirrored")
              }
            >
              <option value="paired">Paired bars</option>
              <option value="mirrored">Mirrored bars</option>
            </select>
          </label>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void shareComparison()}
          >
            Share comparison ↗
          </button>
        </div>
        {filters.mode === "provinces" && (
          <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
            Comparable provincial election counts are currently verified for
            2016. These comparisons use the 2016 electoral boundaries and
            official published turnout.
          </p>
        )}
      </section>

      <div
        className="comparison-grid"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: 22,
          marginBottom: 22,
        }}
      >
        {renderSelection("A")}
        {renderSelection("B")}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Difference · B minus A</span>
            <h2>{metric.label}</h2>
          </div>
          <span
            style={{
              color: "#F5F7FB",
              fontSize: 22,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {selected.change === null
              ? "Unavailable"
              : `${signed(selected.change, metric.unit === "%" ? 2 : 0)}${metric.unit === "%" ? " pp" : ""}`}
          </span>
        </div>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
          {metric.definition}{" "}
          {metric.unit === "%"
            ? "Rate differences are percentage points (pp); relative percentage changes are shown separately in the table."
            : "Count differences and relative percentage changes are shown separately."}{" "}
          {filters.chart === "mirrored" &&
            "Mirrored chart bars show absolute values; direction separates selections, not negative counts."}
        </p>
        {supported && mixedElectionTypes && (
          <p
            className="notice"
            style={{
              padding: 14,
              background: "#F4B76A0D",
              color: "#F4B76A",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            The selected elections use different contests and ballot structures.
            Interpret turnout and electorate changes in that context. A change
            in valid-ballot totals is not calculated across election types.
          </p>
        )}
        {incompatibleTurnout && (
          <p
            className="notice"
            style={{
              padding: 14,
              background: "#F4B76A0D",
              color: "#F4B76A",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            The published turnout rates use different or unreconciled
            denominator bases. Turnout percentage-point and relative changes are
            unavailable. The 2006 published rate measures ballot-pool
            participation, and the 2000 denominator is unreconciled.
          </p>
        )}
        <ElectionChart
          option={option}
          title={`${metric.label}: ${labelA} versus ${labelB}`}
          filename={`mora-comparison-${filters.a}-${filters.b}-${filters.metric}`}
          sourceNote={sourceNote}
          definition={metric.definition}
          unavailable={!hasChartData}
          emptyMessage={emptyMessage}
          height={330}
        />
        <div className="panel-header" style={{ marginTop: 30 }}>
          <div>
            <span className="eyebrow">The numbers behind the view</span>
            <h3>Comparison table</h3>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={downloadCsv}
          >
            Download comparison CSV ↓
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <caption
              style={{
                textAlign: "left",
                color: "#94A3B8",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              Rates use registered or eligible voters as defined. Unavailable
              values are never treated as zero.
            </caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">A · {labelA}</th>
                <th scope="col">B · {labelB}</th>
                <th scope="col">Change (B − A)</th>
                <th scope="col">Relative change</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr
                  key={row.key}
                  style={
                    row.key === filters.metric
                      ? { background: "#B9F56A06" }
                      : undefined
                  }
                >
                  <th scope="row">
                    <span title={explorerMetrics[row.key].definition}>
                      {explorerMetrics[row.key].label}
                    </span>
                  </th>
                  <td>{formatMetric(row.valueA, row.key)}</td>
                  <td>{formatMetric(row.valueB, row.key)}</td>
                  <td
                    title={
                      !row.comparable
                        ? "Different ballot structures are not comparable"
                        : undefined
                    }
                  >
                    {row.change === null
                      ? "Unavailable"
                      : `${signed(row.change, explorerMetrics[row.key].unit === "%" ? 2 : 0)}${explorerMetrics[row.key].unit === "%" ? " pp" : ""}`}
                  </td>
                  <td>
                    {row.relativeChange === null
                      ? "Unavailable"
                      : `${signed(row.relativeChange, 2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>
          Relative change = (B − A) / A × 100. It is unavailable when A is zero
          or either observation is missing. Official turnout and non-voter
          counts use the effective electorate, including documented MEC 7
          additions; the certified voters’ roll remains a separate count.
        </p>
        <p
          role="status"
          aria-live="polite"
          className="muted"
          style={{ fontSize: 12 }}
        >
          {feedback}
        </p>
        {supported && (
          <details style={{ marginBottom: 16 }}>
            <summary
              className="muted"
              style={{ cursor: "pointer", fontSize: 12 }}
            >
              Source notes and comparability
            </summary>
            <p
              className="muted"
              style={{ fontSize: 12, lineHeight: 1.7, marginTop: 12 }}
            >
              A · {recordA?.note || "No additional source notes."}
            </p>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
              B · {recordB?.note || "No additional source notes."}
            </p>
          </details>
        )}
        {shareUrl && (
          <details>
            <summary
              className="muted"
              style={{ fontSize: 12, cursor: "pointer" }}
            >
              Shareable comparison URL
            </summary>
            <input
              className="select"
              readOnly
              value={shareUrl}
              aria-label="Shareable comparison URL"
              onFocus={(event) => event.target.select()}
              style={{ marginTop: 12, width: "100%" }}
            />
          </details>
        )}
      </section>
    </div>
  );
}
