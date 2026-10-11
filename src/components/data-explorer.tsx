"use client";
import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { EChartsOption } from "echarts";
import {
  ageGroups,
  currentAgeRegistration,
  currentProvinceRegistration,
  currentRegistrationObservation,
  elections,
  historicAgeRegistration,
  provinceElections,
  provinces,
  sources,
  type ElectionRecord,
} from "@/lib/data";
import {
  csvCell,
  effectiveElectorate,
  explorerMetrics,
  formatMetric,
  isMetric,
  metricValue,
  metroOptions,
  turnoutBasis,
  type ExplorerChartType,
  type ExplorerMetric,
} from "@/lib/explorer-metrics";
import ElectionChart, { downloadBlob } from "@/components/election-chart";

const ageBrackets = [...ageGroups];
const chartTypes: ExplorerChartType[] = ["line", "bar", "area", "scatter"];
const accent = { national: "#62A7F8", municipal: "#B9F56A" };
type Filters = {
  dataset: "elections" | "registration";
  year: string;
  province: string;
  municipality: string;
  age: string;
  search: string;
  metric: ExplorerMetric;
  chart: ExplorerChartType;
  type: "all" | "national" | "municipal";
};
type ExplorerProps = {
  initialYear?: string | number;
  initialProvince?: string;
  initialMetric?: ExplorerMetric;
};
type ExplorerRow = ElectionRecord & {
  selectedValue: number | null;
  sourceTitle: string;
  geography: string;
  ageBracket: string;
  referenceDate: string;
  rowKind: "election" | "registration";
};

function sourceFor(record: ElectionRecord) {
  return sources.find((source) => source.id === record.sourceId);
}

export default function DataExplorer({
  initialYear = "all",
  initialProvince = "all",
  initialMetric = "turnout",
}: ExplorerProps) {
  const defaults: Filters = {
    dataset: "elections",
    year: String(initialYear),
    province: initialProvince,
    municipality: "all",
    age: "all",
    search: "",
    metric: initialMetric,
    chart: "line",
    type: "all",
  };
  const [filters, setFilters] = useState<Filters>(defaults);
  const [restored, setRestored] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "year", desc: true },
  ]);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [feedback, setFeedback] = useState("");
  const allYears = useMemo(
    () =>
      Array.from(
        new Set([...elections.map((record) => record.year), 2026]),
      ).sort((a, b) => b - a),
    [],
  );
  const years =
    filters.dataset === "registration"
      ? [2026, 2016]
      : allYears.filter((year) => year !== 2026);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get("year");
    const province = params.get("province");
    const municipality = params.get("municipality");
    const age = params.get("age");
    const metric = params.get("metric");
    const chart = params.get("chart");
    const type = params.get("type");
    const dataset =
      params.get("dataset") === "registration" ? "registration" : "elections";
    setFilters((current) => ({
      ...current,
      dataset,
      year:
        year && (year === "all" || allYears.includes(Number(year)))
          ? year
          : current.year,
      province:
        province &&
        (province === "all" || provinces.some((name) => name === province))
          ? province
          : current.province,
      municipality:
        municipality &&
        (municipality === "all" ||
          metroOptions.some((metro) => metro.name === municipality))
          ? municipality
          : current.municipality,
      age:
        age && (age === "all" || ageBrackets.some((bracket) => bracket === age))
          ? age
          : current.age,
      metric:
        isMetric(metric) &&
        (dataset !== "registration" ||
          ["registered", "eligible", "registrationRate"].includes(metric))
          ? metric
          : dataset === "registration"
            ? "registered"
            : current.metric,
      chart: chartTypes.includes(chart as ExplorerChartType)
        ? (chart as ExplorerChartType)
        : current.chart,
      type: type === "national" || type === "municipal" ? type : "all",
      search: (params.get("search") || "").slice(0, 100),
    }));
    setRestored(true);
  }, [allYears]);

  useEffect(() => {
    if (!restored) return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(filters)) {
      if (value === "all" || !value) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState(null, "", url);
  }, [filters, restored]);

  const hasUnsupportedScope =
    filters.municipality !== "all" ||
    (filters.dataset === "elections" && filters.age !== "all") ||
    (filters.dataset === "registration" &&
      filters.province !== "all" &&
      filters.age !== "all");
  const rows = useMemo<ExplorerRow[]>(() => {
    if (hasUnsupportedScope) return [];
    const search = filters.search.trim().toLowerCase();
    const geography =
      filters.province === "all" ? "South Africa" : filters.province;
    const ageBracket = filters.age === "all" ? "All ages" : filters.age;
    const observations: (ElectionRecord & { referenceDate?: string })[] = [];
    if (filters.dataset === "elections") {
      observations.push(
        ...(filters.province === "all"
          ? elections
          : provinceElections.filter(
              (record) => record.province === filters.province,
            )),
      );
    } else {
      const snapshot = (
        registered: number,
        year: number,
        sourceId: string,
        observedAt: string,
      ) => ({
        year,
        label: `${observedAt} registration observation`,
        type: "municipal" as const,
        registered,
        voters: null,
        eligible: null,
        validBallots: null,
        turnout: null,
        turnoutDenominator: null,
        sourceId,
        referenceDate: observedAt,
        note: "Registration observation only. It does not measure eligible citizens or participation. The 2016 observation is an election-roll baseline; 2026 is the 29 September registration snapshot.",
      });
      if (filters.age !== "all") {
        for (const observation of [
          ...historicAgeRegistration,
          ...currentAgeRegistration,
        ].filter((item) => item.ageGroup === filters.age))
          observations.push(
            snapshot(
              observation.registered,
              Number(observation.observedAt.slice(0, 4)),
              observation.sourceId,
              observation.observedAt,
            ),
          );
      } else if (filters.province !== "all") {
        const baseline = provinceElections.find(
          (record) =>
            record.province === filters.province && record.year === 2016,
        );
        if (baseline?.registered !== null && baseline?.registered !== undefined)
          observations.push(
            snapshot(baseline.registered, 2016, baseline.sourceId, "2016"),
          );
        const current = currentProvinceRegistration.find(
          (record) => record.province === filters.province,
        );
        if (current)
          observations.push(
            snapshot(
              current.registered,
              2026,
              current.sourceId,
              current.observedAt,
            ),
          );
      } else {
        const baseline = elections.find((record) => record.year === 2016);
        if (baseline?.registered !== null && baseline?.registered !== undefined)
          observations.push(
            snapshot(baseline.registered, 2016, baseline.sourceId, "2016"),
          );
        observations.push(
          snapshot(
            currentRegistrationObservation.registered,
            2026,
            currentRegistrationObservation.sourceId,
            currentRegistrationObservation.observedAt,
          ),
        );
      }
    }
    if (
      search &&
      ![
        geography.toLowerCase(),
        ...(geography === "South Africa"
          ? ["national", "nationwide", "all provinces"]
          : []),
      ].some((name) => name.includes(search))
    )
      return [];
    return observations
      .filter(
        (record) =>
          (filters.year === "all" || record.year === Number(filters.year)) &&
          (filters.dataset === "registration" ||
            filters.type === "all" ||
            record.type === filters.type),
      )
      .map((record) => ({
        ...record,
        selectedValue: metricValue(record, filters.metric),
        sourceTitle: sourceFor(record)?.title || "Source not available",
        geography,
        ageBracket,
        referenceDate: record.referenceDate || String(record.year),
        rowKind:
          filters.dataset === "registration" ? "registration" : "election",
      }));
  }, [filters, hasUnsupportedScope]);
  const plotted = rows.filter((row) => row.selectedValue !== null);
  const metric = explorerMetrics[filters.metric];
  const sourceIds = [...new Set(rows.map((row) => row.sourceId))];
  const sourceNote = sourceIds.length
    ? `Sources: ${sourceIds
        .map((id) => {
          const source = sources.find((item) => item.id === id);
          return source
            ? `${source.organisation} — ${source.title} (observed ${source.observedAt})`
            : id;
        })
        .join(
          "; ",
        )}. Reference: dates shown in the table. Geography: ${filters.province === "all" ? "South Africa" : filters.province}. Age coverage: ${filters.age === "all" ? "all ages" : filters.age}.`
    : "Source: MORA source registry. No verified observations available for the selected scope.";

  const option = useMemo<EChartsOption>(() => {
    const chronological = [...rows].sort((a, b) => a.year - b.year);
    const xYears = Array.from(
      new Set(chronological.map((record) => record.year)),
    );
    const percentage = explorerMetrics[filters.metric].unit === "%";
    return {
      backgroundColor: "transparent",
      textStyle: { fontFamily: "Inter, Arial, sans-serif", color: "#94A3B8" },
      grid: { top: 36, left: 65, right: 22, bottom: 60 },
      legend: {
        bottom: 0,
        textStyle: { color: "#94A3B8", fontSize: 11 },
        icon: "circle",
      },
      tooltip: {
        trigger: filters.chart === "scatter" ? "item" : "axis",
        backgroundColor: "#172235",
        borderColor: "#29374C",
        textStyle: { color: "#F5F7FB" },
        valueFormatter: (value) =>
          typeof value === "number"
            ? formatMetric(value, filters.metric)
            : "Unavailable",
      },
      xAxis: {
        type: "category",
        data: xYears.map(String),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#29374C" } },
        axisLabel: { color: "#94A3B8", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: percentage ? 100 : undefined,
        axisLabel: {
          color: "#94A3B8",
          formatter: (value: number) =>
            percentage
              ? `${value}%`
              : value >= 1000000
                ? `${(value / 1000000).toFixed(0)}m`
                : new Intl.NumberFormat("en-ZA", {
                    notation: "compact",
                  }).format(value),
        },
        splitLine: { lineStyle: { color: "#29374C", type: "dashed" } },
      },
      series: [
        ...(["national", "municipal"] as const)
          .filter((type) =>
            chronological.some((record) => record.type === type),
          )
          .map((type) => ({
            name:
              filters.dataset === "registration"
                ? `${filters.province === "all" ? "South Africa" : filters.province} · registration`
                : type === "national"
                  ? "National elections"
                  : "Municipal elections",
            type: filters.chart === "area" ? "line" : filters.chart,
            data: xYears.map((year) => {
              const record = chronological.find(
                (item) => item.year === year && item.type === type,
              );
              return record &&
                !(
                  filters.metric === "turnout" &&
                  turnoutBasis(record) !== "effective-electorate"
                )
                ? record.selectedValue
                : null;
            }),
            connectNulls: false,
            smooth: false,
            symbol: "circle",
            symbolSize: filters.chart === "scatter" ? 11 : 7,
            itemStyle: {
              color: accent[type],
              borderRadius: filters.chart === "bar" ? [3, 3, 0, 0] : undefined,
            },
            lineStyle: { color: accent[type], width: 3 },
            areaStyle:
              filters.chart === "area"
                ? { color: accent[type], opacity: 0.09 }
                : undefined,
            barMaxWidth: 34,
            emphasis: { focus: "series" as const },
          })),
        ...(["ballot-pool", "unreconciled"] as const)
          .filter(
            (basis) =>
              filters.metric === "turnout" &&
              chronological.some((record) => turnoutBasis(record) === basis),
          )
          .map((basis) => ({
            name:
              basis === "ballot-pool"
                ? "2006 · ballot-pool basis"
                : "2000 · unreconciled denominator",
            type: "scatter" as const,
            data: xYears.map(
              (year) =>
                chronological.find(
                  (record) =>
                    record.year === year && turnoutBasis(record) === basis,
                )?.selectedValue ?? null,
            ),
            symbol: basis === "ballot-pool" ? "diamond" : "rect",
            symbolSize: 11,
            itemStyle: {
              color: basis === "ballot-pool" ? "#F4B76A" : "#94A3B8",
            },
          })),
      ],
    };
  }, [rows, filters.chart, filters.metric, filters.dataset, filters.province]);

  const columns = useMemo<ColumnDef<ExplorerRow>[]>(
    () => [
      {
        accessorKey: "year",
        header: "Year",
        cell: ({ row }) => <strong>{row.original.year}</strong>,
      },
      {
        accessorKey: "type",
        header: "Observation",
        cell: ({ row }) => (
          <span style={{ textTransform: "capitalize" }}>
            {row.original.rowKind === "registration"
              ? "Registration"
              : row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "geography",
        header: "Geography / age",
        cell: ({ row }) => (
          <span>
            {row.original.geography}
            <small className="muted" style={{ display: "block", fontSize: 10 }}>
              {row.original.ageBracket}
            </small>
          </span>
        ),
      },
      {
        accessorKey: "selectedValue",
        header: metric.label,
        sortUndefined: "last",
        cell: ({ row }) => (
          <span
            title={
              row.original.selectedValue === null
                ? "Official comparable data unavailable"
                : undefined
            }
          >
            {formatMetric(row.original.selectedValue, filters.metric)}
            {filters.metric === "turnout" &&
              turnoutBasis(row.original) === "ballot-pool" && (
                <small
                  style={{ display: "block", color: "#F4B76A", fontSize: 10 }}
                >
                  Ballot-pool denominator
                </small>
              )}
          </span>
        ),
      },
      {
        accessorKey: "sourceTitle",
        header: "Source",
        cell: ({ row }) => {
          const source = sourceFor(row.original);
          return source ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11 }}
            >
              {source.title} ↗
            </a>
          ) : (
            <span className="muted">Unavailable</span>
          );
        },
      },
      {
        accessorKey: "referenceDate",
        header: "Reference date",
        cell: ({ row }) => (
          <span className="muted" style={{ fontSize: 11 }}>
            {row.original.referenceDate}
          </span>
        ),
      },
      {
        id: "note",
        header: "Notes",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.note ? (
            <details style={{ minWidth: 120, maxWidth: 260 }}>
              <summary
                className="muted"
                style={{ cursor: "pointer", fontSize: 11 }}
              >
                Source notes
              </summary>
              <p
                className="muted"
                style={{ fontSize: 11, marginTop: 9, lineHeight: 1.7 }}
              >
                {row.original.note}
              </p>
            </details>
          ) : (
            <span className="muted">—</span>
          ),
      },
    ],
    [filters.metric, metric.label],
  );
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => {
      const geographyMatch =
        key === "search"
          ? provinces.find(
              (province) =>
                province.toLowerCase() === String(value).trim().toLowerCase(),
            )
          : undefined;
      return {
        ...current,
        [key]: value,
        ...(key === "province" ? { municipality: "all" } : {}),
        ...(key === "dataset"
          ? {
              year: "all",
              type: "all" as const,
              metric:
                value === "registration"
                  ? ("registered" as const)
                  : ("turnout" as const),
            }
          : {}),
        ...(geographyMatch
          ? { province: geographyMatch, search: "", municipality: "all" }
          : {}),
      };
    });
    setFeedback("");
  }

  function downloadCsv(allMetrics = false) {
    const headers = [
      "Reference year",
      "Observation type",
      "Geography",
      "Age bracket",
      "Variable",
      "Value",
      "Unit",
      "Variable definition",
      "Effective turnout denominator",
      "Published turnout basis",
      "Source organisation",
      "Source title",
      "Source URL",
      "Reference date",
      "Source observation date",
      "Verification status",
      "Notes",
    ];
    const keys = allMetrics
      ? (Object.keys(explorerMetrics).filter(
          (key) =>
            filters.dataset === "elections" ||
            ["registered", "eligible", "registrationRate"].includes(key),
        ) as ExplorerMetric[])
      : [filters.metric];
    const data = table.getRowModel().rows.flatMap(({ original: row }) => {
      const source = sourceFor(row);
      return keys.map((key) =>
        [
          row.year,
          row.rowKind === "registration"
            ? "Registration observation"
            : row.type,
          row.geography,
          row.ageBracket,
          explorerMetrics[key].label,
          metricValue(row, key),
          explorerMetrics[key].unit,
          explorerMetrics[key].definition,
          effectiveElectorate(row),
          row.rowKind === "registration"
            ? "Not a turnout observation"
            : turnoutBasis(row),
          source?.organisation,
          source?.title,
          source?.url,
          row.referenceDate,
          source?.observedAt,
          source?.verified ? "Verified source" : "Not verified",
          row.note || "",
        ]
          .map(csvCell)
          .join(","),
      );
    });
    downloadBlob(
      new Blob(
        ["\uFEFF", headers.map(csvCell).join(","), "\r\n", data.join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      `mora-${filters.dataset}-${allMetrics ? "filtered-dataset" : filters.metric}-${filters.year}.csv`,
    );
    setFeedback(
      `${rows.length} observations downloaded with definitions and source references.`,
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback("Chart permalink copied.");
    } catch {
      setFeedback(`Chart permalink: ${window.location.href}`);
    }
  }

  const emptyDescription = hasUnsupportedScope
    ? "Municipal detail, age-level turnout and combined province-by-age counts are not verified. Choose the registration dataset for published age bands; national totals are not substituted for smaller groups."
    : filters.search.trim()
      ? `No verified geographic observations match “${filters.search}”. Select a suggested province or clear the search.`
      : `No verified ${metric.label.toLowerCase()} observations match the selected years. Provincial election coverage is currently 2016; registration observations cover 2016 and 29 September 2026.`;

  return (
    <div className="explorer-workspace">
      <section
        className="panel"
        aria-label="Data explorer filters"
        style={{ marginBottom: 22 }}
      >
        <div className="panel-header">
          <div>
            <span className="eyebrow">Build your view</span>
            <h2>Explore the evidence</h2>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setFilters(defaults);
              setFeedback("Filters reset.");
            }}
          >
            Reset filters ↺
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          <label className="field">
            Dataset
            <select
              className="select"
              value={filters.dataset}
              onChange={(event) =>
                update("dataset", event.target.value as Filters["dataset"])
              }
            >
              <option value="elections">Election participation</option>
              <option value="registration">Registration observations</option>
            </select>
          </label>
          <label className="field">
            Reference year
            <select
              className="select"
              value={filters.year}
              onChange={(event) => update("year", event.target.value)}
            >
              <option value="all">All available years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          {filters.dataset === "elections" && (
            <label className="field">
              Election type
              <select
                className="select"
                value={filters.type}
                onChange={(event) =>
                  update("type", event.target.value as Filters["type"])
                }
              >
                <option value="all">All election types</option>
                <option value="national">National</option>
                <option value="municipal">Municipal</option>
              </select>
            </label>
          )}
          <label className="field">
            Province
            <select
              className="select"
              value={filters.province}
              onChange={(event) => update("province", event.target.value)}
            >
              <option value="all">South Africa · all provinces</option>
              {provinces.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Municipality
            <select
              className="select"
              value={filters.municipality}
              onChange={(event) => update("municipality", event.target.value)}
            >
              <option value="all">All municipalities</option>
              {metroOptions
                .filter(
                  (metro) =>
                    filters.province === "all" ||
                    metro.province === filters.province,
                )
                .map((metro) => (
                  <option key={metro.name} value={metro.name}>
                    {metro.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Age bracket
            <select
              className="select"
              value={filters.age}
              onChange={(event) => update("age", event.target.value)}
            >
              <option value="all">All ages</option>
              {ageBrackets.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Search geography
            <input
              className="select"
              type="search"
              value={filters.search}
              placeholder="South Africa, Gauteng…"
              onChange={(event) => update("search", event.target.value)}
              list="mora-geographies"
            />
            <datalist id="mora-geographies">
              <option value="South Africa" />
              {provinces.map((province) => (
                <option key={province} value={province} />
              ))}
              {metroOptions.map((metro) => (
                <option key={metro.name} value={metro.name} />
              ))}
            </datalist>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">
              {filters.province === "all" ? "South Africa" : filters.province} ·{" "}
              {filters.year === "all" ? "Historical series" : filters.year}
            </span>
            <h2>{metric.label}</h2>
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            {plotted.length} available values / {rows.length} observations
          </span>
        </div>
        <div
          className="toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 22,
            alignItems: "end",
          }}
        >
          <label className="field" style={{ minWidth: 210, flex: 1 }}>
            Metric
            <select
              className="select"
              value={filters.metric}
              onChange={(event) =>
                update("metric", event.target.value as ExplorerMetric)
              }
            >
              {Object.entries(explorerMetrics)
                .filter(
                  ([key]) =>
                    filters.dataset === "elections" ||
                    ["registered", "eligible", "registrationRate"].includes(
                      key,
                    ),
                )
                .map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="field" style={{ minWidth: 150 }}>
            Chart type
            <select
              className="select"
              value={filters.chart}
              onChange={(event) =>
                update("chart", event.target.value as ExplorerChartType)
              }
            >
              {chartTypes.map((type) => (
                <option key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <div className="toolbar" role="group" aria-label="Data presentation">
            <button
              type="button"
              className={`button ${view === "chart" ? "button-primary" : "button-secondary"}`}
              onClick={() => setView("chart")}
              aria-pressed={view === "chart"}
            >
              Chart
            </button>
            <button
              type="button"
              className={`button ${view === "table" ? "button-primary" : "button-secondary"}`}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
            >
              Table
            </button>
          </div>
          <button
            type="button"
            className="button button-secondary"
            disabled={!rows.length}
            onClick={() => downloadCsv()}
          >
            Download CSV ↓
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={!rows.length}
            onClick={() => downloadCsv(true)}
          >
            Filtered dataset ↓
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void copyLink()}
          >
            Copy permalink ↗
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12 }}>
          More views:{" "}
          <Link className="text-link" href="/registration#composition-studio">
            Registration composition
          </Link>
          {" · "}
          <Link className="text-link" href="/registration#participation-sankey">
            Participation flows
          </Link>
          {" · "}
          <Link className="text-link" href="/map">
            Provincial map
          </Link>
        </p>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
          {metric.definition}{" "}
          {filters.dataset === "elections"
            ? "National and municipal elections are separate series. Provincial election coverage is 2016 using that election's boundaries."
            : "The 2016 certified election roll and the 29 September 2026 registration snapshot are distinct reference observations. Official age bands cannot establish an exact 18–35 split."}{" "}
          Missing observations remain unavailable.
        </p>
        {filters.metric === "turnout" &&
          rows.some((record) => turnoutBasis(record) === "ballot-pool") && (
            <p className="muted" style={{ fontSize: 12, color: "#F4B76A" }}>
              The 2006 official rate describes ballot-pool participation. Its
              amber diamond is separate from the person-level series; abstention
              and cross-basis rate changes are unavailable.
            </p>
          )}
        {filters.metric === "turnout" &&
          rows.some((record) => turnoutBasis(record) === "unreconciled") && (
            <p className="muted" style={{ fontSize: 12 }}>
              The 2000 published rate is a separate grey square because its
              electorate denominator is unreconciled. Person-level abstention
              and turnout-rate changes are unavailable for that observation.
            </p>
          )}
        {view === "chart" && (
          <ElectionChart
            option={option}
            title={`${metric.label} · ${filters.province === "all" ? "South Africa" : filters.province}`}
            filename={`mora-${filters.dataset}-${filters.metric}`}
            sourceNote={sourceNote}
            definition={metric.definition}
            unavailable={!plotted.length}
            emptyMessage={emptyDescription}
          />
        )}
        <div
          className="table-wrap"
          style={{ overflowX: "auto", marginTop: 24 }}
        >
          <p className="eyebrow">
            Underlying observations · sort any labelled column
          </p>
          {rows.length ? (
            <table className="data-table">
              <caption
                style={{
                  textAlign: "left",
                  marginBottom: 12,
                  color: "#94A3B8",
                  fontSize: 12,
                }}
              >
                {metric.label},{" "}
                {filters.province === "all" ? "South Africa" : filters.province}
                . Null values are unavailable, not zero.
              </caption>
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            style={{
                              color: "inherit",
                              background: "none",
                              border: 0,
                              padding: 0,
                              cursor: "pointer",
                              font: "inherit",
                              textAlign: "left",
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}{" "}
                            {header.column.getIsSorted() === "asc"
                              ? "↑"
                              : header.column.getIsSorted() === "desc"
                                ? "↓"
                                : "↕"}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <h3>Official comparable data unavailable</h3>
              <p className="muted">{emptyDescription}</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setFilters(defaults)}
              >
                Return to national series
              </button>
            </div>
          )}
        </div>
        <p
          role="status"
          aria-live="polite"
          className="muted"
          style={{ fontSize: 12, overflowWrap: "anywhere" }}
        >
          {feedback}
        </p>
      </section>
    </div>
  );
}
