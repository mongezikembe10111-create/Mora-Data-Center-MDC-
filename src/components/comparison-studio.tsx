"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import {
  ageGroups,
  elections,
  provinceElections,
  provinces,
  sources,
  type ElectionRecord,
} from "@/lib/data";
import { areTurnoutComparable } from "@/lib/analytics";
import {
  getAgeComparisonObservation,
  type AgeComparisonYear,
} from "@/lib/age-comparison";
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
  ageYearA: AgeComparisonYear;
  ageYearB: AgeComparisonYear;
  metric: ExplorerMetric;
  chart: "paired" | "mirrored";
};
const recordKey = (record?: ElectionRecord) =>
  record ? `${record.year}-${record.type}` : "unavailable";
const originalComparisonMetrics: ExplorerMetric[] = [
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
const comparisonMetrics: ExplorerMetric[] = [
  ...originalComparisonMetrics,
  ...(Object.keys(explorerMetrics) as ExplorerMetric[]).filter(
    (key) => !originalComparisonMetrics.includes(key),
  ),
];
const comparableElectorateRateMetrics: ExplorerMetric[] = [
  "turnout",
  "abstention",
  "electorateParticipationGapRate",
];
const ageTurnoutDefinition =
  "IEC 2016 Municipal Elections Report, Figure 14 (printed page 75): published registered-electorate turnout by original age band, rounded to whole percentages. Exact participating-person counts and reconciled age denominators are not supplied and are not reconstructed. Age-specific turnout is unavailable for the 2026 registration snapshot. Differences and relative changes use these rounded inputs.";
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
  ageA: "18–19",
  ageB: "20–29",
  ageYearA: "2026",
  ageYearB: "2026",
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
      ageA: ageGroups.some((group) => group === params.get("ageA"))
        ? params.get("ageA")!
        : current.ageA,
      ageB: ageGroups.some((group) => group === params.get("ageB"))
        ? params.get("ageB")!
        : current.ageB,
      ageYearA: params.get("ageYearA") === "2016" ? "2016" : "2026",
      ageYearB: params.get("ageYearB") === "2016" ? "2016" : "2026",
      metric:
        mode === "ages"
          ? metric === "turnout"
            ? "turnout"
            : "registered"
          : isMetric(metric)
            ? metric
            : current.metric,
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

  const ageObservationA =
    filters.mode === "ages"
      ? getAgeComparisonObservation(filters.ageA, filters.ageYearA)
      : null;
  const ageObservationB =
    filters.mode === "ages"
      ? getAgeComparisonObservation(filters.ageB, filters.ageYearB)
      : null;
  const recordA =
    filters.mode === "ages"
      ? ageObservationA?.record
      : filters.mode === "provinces"
        ? provinceElections.find(
            (record) =>
              record.province === filters.provinceA && record.year === 2016,
          )
        : elections.find((record) => recordKey(record) === filters.a);
  const recordB =
    filters.mode === "ages"
      ? ageObservationB?.record
      : filters.mode === "provinces"
        ? provinceElections.find(
            (record) =>
              record.province === filters.provinceB && record.year === 2016,
          )
        : elections.find((record) => recordKey(record) === filters.b);
  const supported = filters.mode !== "metros";
  const mixedElectionTypes = recordA?.type !== recordB?.type;
  const incompatibleTurnout =
    filters.mode !== "ages" && supported && recordA && recordB
      ? !areTurnoutComparable(recordA, recordB)
      : false;
  const labelA =
    filters.mode === "provinces"
      ? filters.provinceA
      : filters.mode === "metros"
        ? filters.metroA
        : filters.mode === "ages"
          ? `${filters.ageA} · ${filters.ageYearA === "2026" ? "29 Sep 2026" : "2016 certified roll"}`
          : recordA
            ? `${recordA.year} · ${recordA.type}`
            : "Selection A";
  const labelB =
    filters.mode === "provinces"
      ? filters.provinceB
      : filters.mode === "metros"
        ? filters.metroB
        : filters.mode === "ages"
          ? `${filters.ageB} · ${filters.ageYearB === "2026" ? "29 Sep 2026" : "2016 certified roll"}`
          : recordB
            ? `${recordB.year} · ${recordB.type}`
            : "Selection B";
  const metric =
    filters.mode === "ages" && filters.metric === "turnout"
      ? {
          ...explorerMetrics.turnout,
          label: "Published age turnout (2016, rounded)",
          definition: ageTurnoutDefinition,
        }
      : explorerMetrics[filters.metric];
  function formatComparisonValue(value: number | null, key: ExplorerMetric) {
    return filters.mode === "ages" && key === "turnout" && value !== null
      ? `${value.toFixed(0)}%`
      : formatMetric(value, key);
  }
  function comparisonMetricLabel(key: ExplorerMetric) {
    return filters.mode === "ages" && key === "turnout"
      ? "Published age turnout (2016, rounded)"
      : explorerMetrics[key].label;
  }
  function comparisonMetricDefinition(key: ExplorerMetric) {
    return filters.mode === "ages" && key === "turnout"
      ? ageTurnoutDefinition
      : explorerMetrics[key].definition;
  }
  function metricDecimals(key: ExplorerMetric) {
    return explorerMetrics[key].unit === "%" &&
      !(filters.mode === "ages" && key === "turnout")
      ? 2
      : 0;
  }

  const availableComparisonMetrics =
    filters.mode === "ages"
      ? (["registered", "turnout"] as ExplorerMetric[])
      : comparisonMetrics;
  const comparisons = availableComparisonMetrics.map((key) => {
    const valueA = supported && recordA ? metricValue(recordA, key) : null;
    const valueB = supported && recordB ? metricValue(recordB, key) : null;
    const comparable =
      !(mixedElectionTypes && key === "validBallots") &&
      !(comparableElectorateRateMetrics.includes(key) && incompatibleTurnout) &&
      !(
        key === "electorateParticipationGapRate" &&
        (!recordA ||
          !recordB ||
          effectiveElectorate(recordA) === null ||
          effectiveElectorate(recordB) === null)
      );
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
  const populationNotes = filters.metric.startsWith("votingAge")
    ? [
        ...new Set(
          [
            recordA?.votingAgePopulationNote,
            recordB?.votingAgePopulationNote,
          ].filter(Boolean),
        ),
      ].join(" ")
    : "";
  const sourceNote =
    (supported
      ? `Sources: ${[...new Set([sourceFor(recordA), sourceFor(recordB)].filter(Boolean).map((source) => `${source!.organisation} — ${source!.title} (observed ${source!.observedAt})`))].join("; ") || "MORA source registry"}. Reference years: ${recordA?.year || "unavailable"}, ${recordB?.year || "unavailable"}. Geography: ${filters.mode === "provinces" ? `${filters.provinceA} / ${filters.provinceB}; 2016 electoral boundaries` : "South Africa"}.${filters.mode === "ages" ? ` Age bands: ${filters.ageA} / ${filters.ageB}. Registration shares use each matching dated national roll, not eligible citizens. Published age turnout is available only for 2016, rounded to whole percentages.` : ""}`
      : "Source: MORA source registry. Comparable metropolitan observations have not been verified.") +
    (populationNotes ? ` Population-estimate notes: ${populationNotes}` : "");
  const emptyMessage =
    comparableElectorateRateMetrics.includes(filters.metric) &&
    incompatibleTurnout
      ? "The published rates use incompatible or unreconciled denominator bases. Select compatible person-level elections; individual published rates remain in the table with source notes."
      : !supported
        ? "Comparable metropolitan datasets have not been verified. National figures are not substituted for the selected groups."
        : filters.mode === "ages" && filters.metric === "turnout"
          ? "Published age turnout is verified only for the 2016 municipal election, rounded to whole percentages. Select the 2016 reference for both age bands. No turnout rate or participant count is inferred from the 2026 registration snapshot."
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
            ? formatComparisonValue(Math.abs(value), filters.metric)
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
            formatter: () => formatComparisonValue(valueA, filters.metric),
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
            formatter: () => formatComparisonValue(valueB, filters.metric),
          },
        },
      ],
    };
  }, [
    filters.chart,
    filters.metric,
    filters.mode,
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
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "mode" && value === "ages"
        ? { metric: "registered" as ExplorerMetric }
        : {}),
      ...(key === "metric" && value === "turnout" && current.mode === "ages"
        ? {
            ageYearA: "2016" as AgeComparisonYear,
            ageYearB: "2016" as AgeComparisonYear,
          }
        : {}),
    }));
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
      "Matching national roll A (age registration only)",
      "Share of matching national roll A percent",
      "Male registration A (published category)",
      "Female registration A (published category)",
      "Matching national roll B (age registration only)",
      "Share of matching national roll B percent",
      "Male registration B (published category)",
      "Female registration B (published category)",
      "Estimated voting-age population A",
      "Voting-age population source A URL",
      "Voting-age population notes A",
      "Estimated voting-age population B",
      "Voting-age population source B URL",
      "Voting-age population notes B",
    ];
    const sourceA = supported ? sourceFor(recordA) : undefined;
    const sourceB = supported ? sourceFor(recordB) : undefined;
    const data = comparisons.map((row) =>
      [
        comparisonMetricLabel(row.key),
        comparisonMetricDefinition(row.key),
        explorerMetrics[row.key].unit,
        labelA,
        supported ? recordA?.year : null,
        row.valueA,
        supported && recordA ? effectiveElectorate(recordA) : null,
        supported && filters.mode !== "ages" && recordA
          ? turnoutBasis(recordA)
          : null,
        labelB,
        supported ? recordB?.year : null,
        row.valueB,
        supported && recordB ? effectiveElectorate(recordB) : null,
        supported && filters.mode !== "ages" && recordB
          ? turnoutBasis(recordB)
          : null,
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
          ? comparableElectorateRateMetrics.includes(row.key)
            ? "Incompatible or unreconciled turnout denominator bases; rate changes are unavailable"
            : "Different ballot structures; valid-ballot change is not comparable"
          : "Nulls are unavailable, not zero",
        ageObservationA?.nationalRegistered,
        ageObservationA?.shareOfNationalRoll,
        ageObservationA?.male,
        ageObservationA?.female,
        ageObservationB?.nationalRegistered,
        ageObservationB?.shareOfNationalRoll,
        ageObservationB?.male,
        ageObservationB?.female,
        supported ? recordA?.votingAgePopulation : null,
        supported
          ? sources.find(
              (source) => source.id === recordA?.votingAgePopulationSourceId,
            )?.url
          : null,
        supported ? recordA?.votingAgePopulationNote : null,
        supported ? recordB?.votingAgePopulation : null,
        supported
          ? sources.find(
              (source) => source.id === recordB?.votingAgePopulationSourceId,
            )?.url
          : null,
        supported ? recordB?.votingAgePopulationNote : null,
      ]
        .map(csvCell)
        .join(","),
    );
    downloadBlob(
      new Blob(
        ["\uFEFF", header.map(csvCell).join(","), "\r\n", data.join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      filters.mode === "ages"
        ? `mora-age-comparison-${filters.ageYearA}-${filters.ageA}-${filters.ageYearB}-${filters.ageB}.csv`
        : `mora-comparison-${filters.a}-${filters.b}.csv`,
    );
    setFeedback(
      "Comparison CSV downloaded with source references and variable definitions.",
    );
  }

  function downloadAgeProfileCsv() {
    const header = [
      "Published age band",
      "Reference A",
      "Registered A",
      "Male A (published category)",
      "Female A (published category)",
      "Matching national roll A",
      "Share of matching roll A percent",
      "Reference B",
      "Registered B",
      "Male B (published category)",
      "Female B (published category)",
      "Matching national roll B",
      "Share of matching roll B percent",
      "Change B minus A people",
      "Relative change percent",
      "Source A URL",
      "Source B URL",
      "Definition",
      "Published age turnout A percent (2016, rounded)",
      "Published age turnout B percent (2016, rounded)",
      "Age turnout methodology",
    ];
    const data = ageGroups.map((band) => {
      const a = getAgeComparisonObservation(band, filters.ageYearA)!;
      const b = getAgeComparisonObservation(band, filters.ageYearB)!;
      return [
        band,
        a.observedAt,
        a.registered,
        a.male,
        a.female,
        a.nationalRegistered,
        a.shareOfNationalRoll,
        b.observedAt,
        b.registered,
        b.male,
        b.female,
        b.nationalRegistered,
        b.shareOfNationalRoll,
        b.registered - a.registered,
        ((b.registered - a.registered) / a.registered) * 100,
        sourceFor(a.record)?.url,
        sourceFor(b.record)?.url,
        a.record.note,
        a.publishedTurnout,
        b.publishedTurnout,
        ageTurnoutDefinition,
      ]
        .map(csvCell)
        .join(",");
    });
    downloadBlob(
      new Blob(
        ["\uFEFF", header.map(csvCell).join(","), "\r\n", data.join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      `mora-age-profiles-${filters.ageYearA}-${filters.ageYearB}.csv`,
    );
    setFeedback(
      "All eight published age bands downloaded with dated rolls, category counts and source references.",
    );
  }

  function renderSelection(side: "A" | "B") {
    const lower = side.toLowerCase() as "a" | "b";
    const label = side === "A" ? labelA : labelB;
    const record = side === "A" ? recordA : recordB;
    const ageObservation = side === "A" ? ageObservationA : ageObservationB;
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
            {filters.mode === "ages"
              ? "National published age-band data"
              : filters.mode === "provinces"
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
                : "Published age band"}
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
              {ageGroups.map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          )}
        </label>
        {filters.mode === "ages" && (
          <label className="field" style={{ marginTop: 14 }}>
            Reference observation
            <select
              className="select"
              value={filters[`ageYear${side}`]}
              onChange={(event) =>
                update(
                  `ageYear${side}`,
                  event.target.value as AgeComparisonYear,
                )
              }
            >
              <option value="2026">29 September 2026 snapshot</option>
              <option value="2016">2016 certified election roll</option>
            </select>
          </label>
        )}
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
          {formatComparisonValue(
            side === "A" ? selected.valueA : selected.valueB,
            filters.metric,
          )}
        </p>
        {supported &&
          record &&
          filters.mode !== "ages" &&
          filters.metric === "turnout" && (
            <p className="muted" style={{ fontSize: 11 }}>
              Published rate basis: {turnoutBasis(record).replaceAll("-", " ")}
            </p>
          )}
        {filters.mode === "ages" && filters.metric === "turnout" && (
          <p className="muted" style={{ fontSize: 11 }}>
            {ageObservation?.publishedTurnout != null
              ? "Published 2016 age turnout · rounded to whole percentages."
              : "2026 is a registration snapshot; age-specific turnout is unavailable."}
          </p>
        )}
        {ageObservation && (
          <div className="breakdown-list" style={{ marginTop: 20 }}>
            <div className="breakdown-row">
              <span>Share of matching national roll</span>
              <span className="mono">
                {ageObservation.shareOfNationalRoll.toFixed(2)}%
              </span>
            </div>
            <div className="breakdown-row">
              <span>National roll · {ageObservation.observedAt}</span>
              <span className="mono">
                {formatMetric(ageObservation.nationalRegistered, "registered")}
              </span>
            </div>
            <div className="breakdown-row">
              <span>Female · published category</span>
              <span className="mono">
                {formatMetric(ageObservation.female, "registered")}
              </span>
            </div>
            <div className="breakdown-row">
              <span>Male · published category</span>
              <span className="mono">
                {formatMetric(ageObservation.male, "registered")}
              </span>
            </div>
          </div>
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
              <option value="ages">Published age band</option>
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
              {availableComparisonMetrics.map((key) => (
                <option key={key} value={key}>
                  {comparisonMetricLabel(key)}
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
        {filters.mode === "ages" && (
          <p
            className="muted"
            style={{ fontSize: 12, marginTop: 16, lineHeight: 1.7 }}
          >
            Compare verified national registration counts in the eight original
            IEC age bands. Each share uses its own dated national voters’ roll.
            Across dates, the same age band describes different cohorts.
            Published age turnout is verified for 2016 only, rounded to whole
            percentages; choose the 2016 reference for both selections to
            compare rates. Exact 18–35 registration and eligible-age
            registration rates are unavailable; the 30–39 band is preserved.
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
              : `${signed(selected.change, metricDecimals(filters.metric))}${metric.unit === "%" ? " pp" : ""}`}
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
          filename={
            filters.mode === "ages"
              ? `mora-age-comparison-${filters.ageYearA}-${filters.ageA}-${filters.ageYearB}-${filters.ageB}`
              : `mora-comparison-${filters.a}-${filters.b}-${filters.metric}`
          }
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
              {filters.mode === "ages"
                ? "Original published national age bands. Registration shares use each dated national roll. Published age turnout is rounded to whole percentages and available for 2016 only."
                : "Rates use registered or eligible voters as defined. Unavailable values are never treated as zero."}
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
                    <span title={comparisonMetricDefinition(row.key)}>
                      {comparisonMetricLabel(row.key)}
                    </span>
                  </th>
                  <td>{formatComparisonValue(row.valueA, row.key)}</td>
                  <td>{formatComparisonValue(row.valueB, row.key)}</td>
                  <td
                    title={
                      !row.comparable
                        ? comparableElectorateRateMetrics.includes(row.key)
                          ? "Turnout denominators are incompatible or unreconciled"
                          : "Different ballot structures are not comparable"
                        : undefined
                    }
                  >
                    {row.change === null
                      ? "Unavailable"
                      : `${signed(row.change, metricDecimals(row.key))}${explorerMetrics[row.key].unit === "%" ? " pp" : ""}`}
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
          or either observation is missing.{" "}
          {filters.mode === "ages"
            ? "A change in registration counts across dates does not track individuals or establish an eligible-population rate. Age turnout differences and relative changes use rounded source percentages; exact participating-person counts are not reconstructed."
            : "Official turnout and non-voter counts use the effective electorate, including documented MEC 7 additions; the certified voters’ roll remains a separate count."}
        </p>
        {filters.mode === "ages" && (
          <section
            style={{ marginTop: 30 }}
            aria-labelledby="age-profile-comparison-title"
          >
            <div className="panel-header">
              <div>
                <span className="eyebrow">Full published age coverage</span>
                <h3 id="age-profile-comparison-title">All eight age bands</h3>
              </div>
              <button
                className="button button-secondary"
                onClick={downloadAgeProfileCsv}
              >
                Download age profiles CSV ↓
              </button>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <caption className="sr-only">
                  All eight national registration age bands. A reference{" "}
                  {filters.ageYearA}; B reference {filters.ageYearB}. Shares use
                  the matching dated national roll.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Age band</th>
                    <th scope="col">A registered · {filters.ageYearA}</th>
                    <th scope="col">A share of roll</th>
                    <th scope="col">B registered · {filters.ageYearB}</th>
                    <th scope="col">B share of roll</th>
                    <th scope="col">A published age turnout</th>
                    <th scope="col">B published age turnout</th>
                    <th scope="col">Change (B − A)</th>
                    <th scope="col">Relative change</th>
                  </tr>
                </thead>
                <tbody>
                  {ageGroups.map((band) => {
                    const a = getAgeComparisonObservation(
                      band,
                      filters.ageYearA,
                    )!;
                    const b = getAgeComparisonObservation(
                      band,
                      filters.ageYearB,
                    )!;
                    return (
                      <tr key={band}>
                        <th scope="row">{band}</th>
                        <td>{formatMetric(a.registered, "registered")}</td>
                        <td>{a.shareOfNationalRoll.toFixed(2)}%</td>
                        <td>{formatMetric(b.registered, "registered")}</td>
                        <td>{b.shareOfNationalRoll.toFixed(2)}%</td>
                        <td>
                          {formatComparisonValue(a.publishedTurnout, "turnout")}
                        </td>
                        <td>
                          {formatComparisonValue(b.publishedTurnout, "turnout")}
                        </td>
                        <td>{signed(b.registered - a.registered)}</td>
                        <td>
                          {signed(
                            ((b.registered - a.registered) / a.registered) *
                              100,
                            2,
                          )}
                          %
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
              The CSV includes male and female source categories, national roll
              denominators, observation dates and source links. Registration
              shares describe the roll distribution. Separate age turnout
              columns use the IEC’s rounded 2016 published rates; 2026 turnout
              is unavailable.
            </p>
          </section>
        )}
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
              {recordA?.votingAgePopulationNote && (
                <> {recordA.votingAgePopulationNote}</>
              )}
            </p>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
              B · {recordB?.note || "No additional source notes."}
              {recordB?.votingAgePopulationNote && (
                <> {recordB.votingAgePopulationNote}</>
              )}
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
