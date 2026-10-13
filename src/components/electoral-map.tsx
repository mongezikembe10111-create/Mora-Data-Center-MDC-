"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox } from "@turf/turf";
import {
  ArrowLeft,
  ChevronRight,
  Expand,
  Layers3,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  currentRegistrationObservation,
  getSource,
  municipalYears,
  provinces,
} from "@/lib/data";
import {
  getElectoralMapObservation,
  getMapIntervals,
  REGISTRATION_MAP_DATE,
  REGISTRATION_MAP_YEAR,
  type ElectoralMapObservation,
} from "@/lib/geography";
import {
  MUNICIPAL_BOUNDARY_PATH,
  provinceBoundaryPath,
  WARD_BOUNDARY_INFO,
  type MunicipalityCollection,
  type WardCollection,
} from "@/lib/ward-boundaries";
import { publicPath } from "@/lib/public-path";
import MapSvg, {
  mainlandFeature,
  type MapGeometry,
  type Provinces,
} from "./map-svg";
import "./electoral-map.css";

type Props = {
  year: number;
  province: string;
  onProvinceChange: (name: string) => void;
};
const METRICS = {
  registration: "Voter registration",
  turnout: "Voter turnout",
  nonparticipation: "Non-participation",
  youth: "Youth registration",
  change: "Historical turnout change",
  party: "Party performance",
};
type Metric = keyof typeof METRICS;
const EMPTY = { type: "FeatureCollection" as const, features: [] };

function formatObservation(observation: ElectoralMapObservation) {
  return observation.unit === "percent"
    ? `${observation.value.toFixed(2)}%`
    : observation.value.toLocaleString("en-ZA");
}
function duration() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 600;
}
function fitGeometry(
  map: MapLibreMap,
  target: MapGeometry,
  detail: boolean,
  animate = true,
) {
  const bounds = bbox(target);
  if (!bounds.every(Number.isFinite)) return;
  const compact = map.getContainer().clientWidth < 500;
  map.fitBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    {
      padding: {
        top: 34,
        bottom: 34,
        left: compact ? 12 : 34,
        right: compact ? 56 : 72,
      },
      duration: animate ? duration() : 0,
      maxZoom: detail ? 15 : 7.5,
    },
  );
}
async function boundaryFile<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(publicPath(path), { signal });
  if (!response.ok) throw new Error("Boundary file unavailable");
  return response.json() as Promise<T>;
}

export default function ElectoralMap({
  year,
  province,
  onProvinceChange,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const callbacks = useRef({
    onProvinceChange,
    municipality: "",
    province: "",
  });
  const refreshLabelsRef = useRef(() => {});
  const markers = useRef<maplibregl.Marker[]>([]);
  const municipalityCache = useRef<MunicipalityCollection | null>(null);
  const wardCache = useRef(new Map<string, WardCollection>());
  const [data, setData] = useState<Provinces | null>(null);
  const [municipalities, setMunicipalities] =
    useState<MunicipalityCollection | null>(null);
  const [wardData, setWardData] = useState<WardCollection | null>(null);
  const [municipality, setMunicipality] = useState("");
  const [ward, setWard] = useState("");
  const [mapYear, setMapYear] = useState(REGISTRATION_MAP_YEAR);
  const [metric, setMetric] = useState<Metric>("registration");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapDrawn, setMapDrawn] = useState(false);
  const [useSvg, setUseSvg] = useState(false);
  const [boundaryError, setBoundaryError] = useState(false);
  const [wardStatus, setWardStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [provinceReload, setProvinceReload] = useState(0);
  const [wardReload, setWardReload] = useState(0);
  const [svgZoom, setSvgZoom] = useState(1);
  const selectedProvince = provinces.includes(
    province as (typeof provinces)[number],
  )
    ? province
    : "";
  callbacks.current = {
    onProvinceChange,
    municipality,
    province: selectedProvince,
  };
  const hasRegistration =
    metric === "registration" && mapYear === REGISTRATION_MAP_YEAR;
  const hasHistoricalMeasure =
    mapYear === 2016 &&
    ["registration", "turnout", "nonparticipation"].includes(metric);
  const hasMappedValues = hasRegistration || hasHistoricalMeasure;
  const intervals = getMapIntervals(metric);
  const selectedObservation = getElectoralMapObservation(
    selectedProvince,
    mapYear,
    metric,
  );
  const hoveredObservation = hoveredProvince
    ? getElectoralMapObservation(hoveredProvince, mapYear, metric)
    : null;
  const registrationSource = getSource(currentRegistrationObservation.sourceId);
  const historicalSource = getSource("iec-municipal-2016");
  const formattedSnapshotDate = new Date(
    `${REGISTRATION_MAP_DATE}T12:00:00Z`,
  ).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
  const provinceMunicipalities = useMemo<MunicipalityCollection | null>(
    () =>
      municipalities && {
        ...municipalities,
        features: municipalities.features.filter(
          (feature) => feature.properties.province === selectedProvince,
        ),
      },
    [municipalities, selectedProvince],
  );
  const provinceWards = useMemo<WardCollection | null>(
    () =>
      wardData && {
        ...wardData,
        features: wardData.features.filter(
          (feature) => feature.properties.province === selectedProvince,
        ),
      },
    [wardData, selectedProvince],
  );
  const visibleWards = useMemo<WardCollection | null>(
    () =>
      provinceWards && {
        ...provinceWards,
        features: municipality
          ? provinceWards.features.filter(
              (feature) => feature.properties.municipalityCode === municipality,
            )
          : provinceWards.features,
      },
    [provinceWards, municipality],
  );
  const selectedMunicipality = provinceMunicipalities?.features.find(
    (feature) => feature.properties.code === municipality,
  );
  const selectedWard = visibleWards?.features.find(
    (feature) => feature.properties.wardId === ward,
  );
  const missingWardNumbers = WARD_BOUNDARY_INFO.sourceAnomalies.find(
    (entry) => entry.municipalityCode === municipality,
  );
  const municipalityOptions = useMemo(
    () =>
      [...(provinceMunicipalities?.features ?? [])].sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name),
      ),
    [provinceMunicipalities],
  );
  const wardOptions = useMemo(
    () =>
      municipality
        ? [...(visibleWards?.features ?? [])].sort(
            (a, b) => a.properties.wardNumber - b.properties.wardNumber,
          )
        : [],
    [visibleWards, municipality],
  );
  const target = useMemo<MapGeometry | null>(() => {
    if (selectedWard) return selectedWard;
    if (selectedMunicipality) return selectedMunicipality;
    const selected = data?.features.find(
      (feature) => feature.properties.name === selectedProvince,
    );
    if (selected) return mainlandFeature(selected);
    return data
      ? { ...data, features: data.features.map(mainlandFeature) }
      : null;
  }, [selectedWard, selectedMunicipality, data, selectedProvince]);

  useEffect(() => {
    setMapYear((currentYear) =>
      currentYear === REGISTRATION_MAP_YEAR ? currentYear : year,
    );
  }, [year]);
  useEffect(() => {
    const controller = new AbortController();
    setBoundaryError(false);
    boundaryFile<Provinces>("/data/provinces.geojson", controller.signal)
      .then(setData)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setBoundaryError(true);
      });
    return () => controller.abort();
  }, [provinceReload]);
  useEffect(() => {
    setMunicipality("");
    setWard("");
    setSvgZoom(1);
    setHoveredProvince(null);
    if (!selectedProvince) {
      setWardStatus("idle");
      setWardData(null);
      return;
    }
    const path = provinceBoundaryPath(selectedProvince);
    if (!path) {
      setWardStatus("error");
      setWardData(null);
      return;
    }
    const controller = new AbortController();
    setWardStatus("loading");
    setWardData(null);
    Promise.all([
      municipalityCache.current
        ? Promise.resolve(municipalityCache.current)
        : boundaryFile<MunicipalityCollection>(
            MUNICIPAL_BOUNDARY_PATH,
            controller.signal,
          ),
      wardCache.current.has(selectedProvince)
        ? Promise.resolve(wardCache.current.get(selectedProvince)!)
        : boundaryFile<WardCollection>(path, controller.signal),
    ])
      .then(([municipal, wards]) => {
        if (controller.signal.aborted) return;
        municipalityCache.current = municipal;
        wardCache.current.set(selectedProvince, wards);
        setMunicipalities(municipal);
        setWardData(wards);
        setWardStatus("ready");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setWardStatus("error");
      });
    return () => controller.abort();
  }, [selectedProvince, wardReload]);
  useEffect(() => {
    setSvgZoom(1);
  }, [municipality, ward]);

  useEffect(() => {
    if (!data || !mapContainer.current) return;
    let map: MapLibreMap;
    let observer: ResizeObserver | null = null;
    let sourceWatchdog: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    setMapReady(false);
    setMapDrawn(false);
    try {
      // MapLibre 6 uses a separate module worker. Its import.meta.url default
      // cannot resolve through Next's bundle, so serve matching local assets.
      maplibregl.setWorkerUrl(
        publicPath("/vendor/maplibre/maplibre-gl-worker.mjs"),
      );
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#0b1523" },
            },
          ],
        },
        center: [25, -29],
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: false,
        touchPitch: false,
        pitchWithRotate: false,
        // fitGeometry frames each selection. A national maxBounds would impose
        // a minimum zoom on wide canvases and clip the north/south provinces.
      });
      mapRef.current = map;
      const refreshLabels = () => {
        if (disposed) return;
        const frame = map.getContainer().getBoundingClientRect();
        const occupied: DOMRect[] = [];
        for (const marker of markers.current) {
          const element = marker.getElement();
          element.style.display =
            !callbacks.current.province && frame.width >= 500 ? "" : "none";
          element.hidden = !!callbacks.current.province || frame.width < 500;
          if (element.hidden) continue;
          const rect = element.getBoundingClientRect();
          const outside =
            rect.left < frame.left + 8 ||
            rect.right > frame.right - 8 ||
            rect.top < frame.top + 8 ||
            rect.bottom > frame.bottom - 8;
          const overlaps = occupied.some(
            (other) =>
              rect.left < other.right + 5 &&
              rect.right + 5 > other.left &&
              rect.top < other.bottom + 5 &&
              rect.bottom + 5 > other.top,
          );
          if (outside || overlaps) {
            element.style.display = "none";
            element.hidden = true;
          } else occupied.push(rect);
        }
      };
      refreshLabelsRef.current = refreshLabels;
      map.touchZoomRotate.disableRotation();
      // Preserve page scrolling; explicit controls, pinch and keyboard still zoom.
      map.scrollZoom.disable();
      map.on("load", () => {
        map.addSource("provinces", { type: "geojson", data, generateId: true });
        map.addSource("municipalities", {
          type: "geojson",
          data: EMPTY,
          promoteId: "code",
        });
        map.addSource("wards", {
          type: "geojson",
          data: EMPTY,
          promoteId: "wardId",
        });
        map.addLayer({
          id: "province-fill",
          type: "fill",
          source: "provinces",
          paint: { "fill-color": "#34384c", "fill-opacity": 0.9 },
        });
        map.addLayer({
          id: "province-lines",
          type: "line",
          source: "provinces",
          paint: { "line-color": "#8994b3", "line-width": 1.3 },
        });
        map.addLayer({
          id: "municipality-fill",
          type: "fill",
          source: "municipalities",
          paint: { "fill-color": "#14355a", "fill-opacity": 0.7 },
        });
        map.addLayer({
          id: "ward-fill",
          type: "fill",
          source: "wards",
          paint: { "fill-color": "#3b82f6", "fill-opacity": 0.13 },
        });
        map.addLayer({
          id: "ward-lines",
          type: "line",
          source: "wards",
          paint: {
            "line-color": "#78a8e2",
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0.45,
              10,
              1.2,
              15,
              2,
            ],
            "line-opacity": 0.8,
          },
        });
        map.addLayer({
          id: "municipality-lines",
          type: "line",
          source: "municipalities",
          paint: { "line-color": "#a3bbdc", "line-width": 1.8 },
        });
        map.addLayer({
          id: "selected-ward",
          type: "line",
          source: "wards",
          filter: ["==", ["get", "wardId"], ""],
          paint: { "line-color": "#a3ff3d", "line-width": 3 },
        });
        // Native Worker errors can leave MapLibre's actor pending without a
        // map error. Keep the SVG alternative available in that case too.
        sourceWatchdog = setTimeout(() => {
          if (!disposed && !map.isSourceLoaded("provinces")) setUseSvg(true);
        }, 12_000);
        for (const feature of data.features) {
          const button = document.createElement("button");
          button.className = "province-map-label";
          button.textContent = feature.properties.name;
          button.type = "button";
          button.setAttribute(
            "aria-label",
            `Explore ${feature.properties.name} wards`,
          );
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            callbacks.current.onProvinceChange(feature.properties.name);
          });
          markers.current.push(
            new maplibregl.Marker({ element: button })
              .setLngLat([
                feature.properties.label_longitude,
                feature.properties.label_latitude,
              ])
              .addTo(map),
          );
        }
        map.on("mousemove", (event) => {
          const hit = map.queryRenderedFeatures(event.point, {
            layers: ["ward-fill", "municipality-fill", "province-fill"],
          })[0];
          map.getCanvas().style.cursor = hit ? "pointer" : "";
          setHoveredProvince(
            hit?.layer.id === "province-fill"
              ? String(hit.properties.name)
              : null,
          );
        });
        map.on("mouseout", () => setHoveredProvince(null));
        map.on("click", (event) => {
          const hits = map.queryRenderedFeatures(event.point, {
            layers: ["ward-fill", "municipality-fill", "province-fill"],
          });
          const wardHit = hits.find(
            (feature) => feature.layer.id === "ward-fill",
          );
          const municipalHit = hits.find(
            (feature) => feature.layer.id === "municipality-fill",
          );
          if (wardHit) {
            const code = String(wardHit.properties.municipalityCode);
            setMunicipality(code);
            setWard(
              callbacks.current.municipality
                ? String(wardHit.properties.wardId)
                : "",
            );
          } else if (municipalHit) {
            setMunicipality(String(municipalHit.properties.code));
            setWard("");
          } else {
            const name = hits.find(
              (feature) => feature.layer.id === "province-fill",
            )?.properties.name;
            if (name) callbacks.current.onProvinceChange(String(name));
          }
        });
        setMapReady(true);
      });
      map.on("sourcedata", (event) => {
        if (disposed || !map.getSource("provinces")) return;
        if (event.sourceId === "provinces" && map.isSourceLoaded("provinces")) {
          clearTimeout(sourceWatchdog);
          setMapDrawn(true);
          refreshLabels();
        }
      });
      map.on("moveend", refreshLabels);
      map.on("error", () => setUseSvg(true));
      map
        .getCanvas()
        .addEventListener("webglcontextlost", () => setUseSvg(true));
      observer = new ResizeObserver(() => {
        map.resize();
        requestAnimationFrame(refreshLabels);
      });
      observer.observe(mapContainer.current);
    } catch {
      setUseSvg(true);
      return;
    }
    return () => {
      disposed = true;
      clearTimeout(sourceWatchdog);
      refreshLabelsRef.current = () => {};
      observer?.disconnect();
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data || !map.getLayer("province-fill")) return;
    refreshLabelsRef.current();
    map.setFilter(
      "province-fill",
      selectedProvince ? ["==", ["get", "name"], selectedProvince] : null,
    );
    map.setFilter(
      "province-lines",
      selectedProvince ? ["==", ["get", "name"], selectedProvince] : null,
    );
    const municipalSource = map.getSource("municipalities") as GeoJSONSource;
    const wardSource = map.getSource("wards") as GeoJSONSource;
    municipalSource.setData(provinceMunicipalities ?? EMPTY);
    wardSource.setData(visibleWards ?? EMPTY);
    map.setFilter("selected-ward", ["==", ["get", "wardId"], ward]);
    map.setPaintProperty("ward-fill", "fill-color", [
      "case",
      ["==", ["get", "wardId"], ward],
      "#a3ff3d",
      "#3b82f6",
    ]);
    map.setPaintProperty("ward-fill", "fill-opacity", [
      "case",
      ["==", ["get", "wardId"], ward],
      0.28,
      0.13,
    ]);
    map.setPaintProperty(
      "municipality-fill",
      "fill-opacity",
      municipality ? 0.3 : 0.7,
    );
    // Sub-provincial geometry never inherits a province's election measure.
    map.setPaintProperty(
      "province-fill",
      "fill-color",
      selectedProvince
        ? "#10253c"
        : hasMappedValues
          ? [
              "case",
              ["<", ["coalesce", ["feature-state", "mapValue"], -1], 0],
              "#34384c",
              [
                "step",
                ["coalesce", ["feature-state", "mapValue"], 0],
                intervals[0].color,
                ...intervals
                  .slice(1)
                  .flatMap((interval) => [interval.min, interval.color]),
              ],
            ]
          : "#34384c",
    );
    data.features.forEach((feature, index) => {
      const observation = getElectoralMapObservation(
        feature.properties.name,
        mapYear,
        metric,
      );
      map.setFeatureState(
        { source: "provinces", id: feature.id ?? index },
        { mapValue: observation?.value ?? null },
      );
    });
  }, [
    mapReady,
    data,
    selectedProvince,
    provinceMunicipalities,
    visibleWards,
    municipality,
    ward,
    hasMappedValues,
    intervals,
    mapYear,
    metric,
  ]);
  useEffect(() => {
    if (mapRef.current && mapReady && target)
      fitGeometry(mapRef.current, target, !!(municipality || ward));
  }, [mapReady, target, municipality, ward]);

  function selectProvince(name: string) {
    setMunicipality("");
    setWard("");
    setSvgZoom(1);
    onProvinceChange(name || "All provinces");
  }
  function selectMunicipality(code: string) {
    setMunicipality(code);
    setWard("");
    setSvgZoom(1);
  }
  function selectWard(id: string, code: string) {
    setMunicipality(code);
    setWard(id);
    setSvgZoom(1);
  }
  function resetMap() {
    selectProvince("");
  }
  function fitSelection() {
    setSvgZoom(1);
    if (mapRef.current && mapReady && target)
      fitGeometry(mapRef.current, target, !!(municipality || ward));
  }
  function goBack() {
    if (ward) setWard("");
    else if (municipality) selectMunicipality("");
    else resetMap();
  }
  function zoomMap(direction: 1 | -1) {
    if (useSvg)
      setSvgZoom((zoom) => Math.min(6, Math.max(1, zoom + direction * 0.5)));
    else if (mapRef.current)
      direction === 1
        ? mapRef.current.zoomIn({ duration: duration() })
        : mapRef.current.zoomOut({ duration: duration() });
  }
  function changeMetric(next: Metric) {
    setMetric(next);
    if (next === "registration") setMapYear(REGISTRATION_MAP_YEAR);
    else if (
      (next === "turnout" || next === "nonparticipation") &&
      mapYear === REGISTRATION_MAP_YEAR
    )
      setMapYear(2016);
    else if (mapYear === REGISTRATION_MAP_YEAR) setMapYear(year);
  }

  return (
    <section
      className="panel electoral-map-panel"
      aria-labelledby="electoral-map-title"
    >
      <div className="panel-header">
        <div>
          <p className="eyebrow">GEOGRAPHIC EXPLORER</p>
          <h2 id="electoral-map-title">The electoral landscape</h2>
          <p className="muted">
            From your province to your municipality and ward.
          </p>
        </div>
        <span className="map-scope-badge">
          <Layers3 size={14} /> Provinces · municipalities · wards
        </span>
      </div>
      <div className="map-filter-bar">
        <label className="map-field">
          Map dataset
          <select
            className="select"
            aria-label="Map dataset"
            value={mapYear}
            onChange={(event) => setMapYear(Number(event.target.value))}
          >
            <option value={REGISTRATION_MAP_YEAR}>
              2026 registration snapshot
            </option>
            {municipalYears.map((item) => (
              <option key={item} value={item}>
                {item} municipal election
              </option>
            ))}
          </select>
        </label>
        <label className="map-field">
          Map measure
          <select
            className="select"
            aria-label="Map measure"
            value={metric}
            onChange={(event) => changeMetric(event.target.value as Metric)}
          >
            {Object.entries(METRICS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="map-field map-province-field">
          Province
          <select
            className="select"
            aria-label="Province"
            value={selectedProvince}
            onChange={(event) => selectProvince(event.target.value)}
          >
            <option value="">All provinces</option>
            {provinces.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button map-reset-button"
          onClick={resetMap}
        >
          <RotateCcw size={14} /> Reset view
        </button>
      </div>
      {selectedProvince && (
        <div className="map-drilldown-fields">
          <label className="map-field">
            Municipality
            <select
              className="select"
              aria-label="Municipality"
              value={selectedMunicipality ? municipality : ""}
              disabled={wardStatus !== "ready"}
              onChange={(event) => selectMunicipality(event.target.value)}
            >
              <option value="">
                All mapped municipalities in {selectedProvince}
              </option>
              {municipalityOptions.map((feature) => (
                <option
                  key={feature.properties.code}
                  value={feature.properties.code}
                >
                  {feature.properties.name} ({feature.properties.code})
                </option>
              ))}
            </select>
          </label>
          <label className="map-field">
            Ward
            <select
              className="select"
              aria-label="Ward"
              value={selectedWard ? ward : ""}
              disabled={!municipality || wardStatus !== "ready"}
              onChange={(event) => selectWard(event.target.value, municipality)}
            >
              <option value="">
                {municipality
                  ? "All mapped wards in this municipality"
                  : "Choose a municipality first"}
              </option>
              {wardOptions.map((feature) => (
                <option
                  key={feature.properties.wardId}
                  value={feature.properties.wardId}
                >
                  Ward {feature.properties.wardNumber} ·{" "}
                  {feature.properties.wardId}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div
        className={`map-dataset-status ${hasMappedValues ? "verified" : "unavailable"}`}
        aria-live="polite"
      >
        <span className="map-status-dot" />
        {hasRegistration
          ? `Province statistics: IEC registration snapshot · ${formattedSnapshotDate}`
          : hasHistoricalMeasure
            ? "Province statistics: IEC 2016 municipal election data"
            : `Verified ${mapYear} provincial ${METRICS[metric].toLowerCase()} is not mapped.`}
        <span className="map-global-year">Global election: {year}</span>
      </div>
      {selectedProvince && (
        <p className="map-snapshot-qualification">
          Boundary snapshot · 2026-labelled ·{" "}
          {WARD_BOUNDARY_INFO.wardCount.toLocaleString("en-ZA")} mapped wards.
          Three Merafong City ward numbers are absent from this source; this is
          not a certified IEC ward register.
        </p>
      )}
      <nav className="map-breadcrumbs" aria-label="Map location">
        <button
          type="button"
          onClick={resetMap}
          aria-current={!selectedProvince ? "location" : undefined}
        >
          South Africa
        </button>
        {selectedProvince && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <button
              type="button"
              onClick={() => selectMunicipality("")}
              aria-current={!municipality ? "location" : undefined}
            >
              {selectedProvince}
            </button>
          </>
        )}
        {selectedMunicipality && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <button
              type="button"
              onClick={() => setWard("")}
              aria-current={!ward ? "location" : undefined}
            >
              {selectedMunicipality.properties.name}
            </button>
          </>
        )}
        {selectedWard && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="location">
              Ward {selectedWard.properties.wardNumber}
            </span>
          </>
        )}
        {selectedProvince && (
          <button type="button" className="map-back-button" onClick={goBack}>
            <ArrowLeft size={14} /> Back one level
          </button>
        )}
      </nav>
      <div
        className="electoral-map-stage"
        aria-busy={!useSvg && !boundaryError && !mapDrawn}
      >
        <div
          ref={mapContainer}
          className={`electoral-map-canvas ${useSvg ? "map-canvas-hidden" : ""}`}
          aria-label="Interactive South African province, municipality and ward map"
        />
        {useSvg && data && target && (
          <MapSvg
            provinces={data}
            municipalities={provinceMunicipalities}
            wards={visibleWards}
            province={selectedProvince}
            municipality={municipality}
            ward={ward}
            target={target}
            mapYear={mapYear}
            metric={metric}
            zoom={svgZoom}
            onProvince={selectProvince}
            onMunicipality={selectMunicipality}
            onWard={selectWard}
          />
        )}
        {!mapDrawn && !useSvg && !boundaryError && (
          <div className="map-loading" role="status">
            <span className="map-loading-dot" /> Loading geography…
          </div>
        )}
        {boundaryError && (
          <div className="map-loading empty-state" role="alert">
            Province boundaries could not be loaded.
          </div>
        )}
        <div className="map-compass" aria-hidden="true">
          <span>N</span>
          <svg viewBox="0 0 20 32">
            <path d="M10 0 18 29 10 22 2 29Z" fill="#b7cbe4" />
            <path d="M10 0 10 22 2 29Z" fill="#536c87" />
          </svg>
        </div>
        <div className="map-zoom-controls" aria-label="Map zoom controls">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={
              boundaryError ||
              (!mapReady && !useSvg) ||
              (useSvg && svgZoom >= 6)
            }
            onClick={() => zoomMap(1)}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={
              boundaryError ||
              (!mapReady && !useSvg) ||
              (useSvg && svgZoom <= 1)
            }
            onClick={() => zoomMap(-1)}
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            aria-label="Fit selected geography"
            title="Fit selected geography"
            disabled={!target}
            onClick={fitSelection}
          >
            <Expand size={18} />
          </button>
        </div>
      </div>
      <div className="map-interaction-note" aria-live="polite">
        {boundaryError ? (
          <>
            <span>Try loading the boundary files again.</span>
            <button
              type="button"
              className="button"
              onClick={() => setProvinceReload((value) => value + 1)}
            >
              Retry boundaries
            </button>
          </>
        ) : !selectedProvince ? (
          <span>
            {hoveredProvince
              ? `${hoveredProvince}${hoveredObservation ? ` · ${formatObservation(hoveredObservation)} ${hoveredObservation.label.toLowerCase()}` : ""}. `
              : ""}
            Select a province to zoom into its municipalities and wards.
          </span>
        ) : wardStatus === "loading" ? (
          <span role="status">Loading {selectedProvince} ward boundaries…</span>
        ) : wardStatus === "error" ? (
          <>
            <span>
              Ward boundaries could not be loaded. Your province statistics are
              still available below.
            </span>
            <button
              type="button"
              className="button"
              onClick={() => setWardReload((value) => value + 1)}
            >
              Retry ward boundaries
            </button>
          </>
        ) : (
          <span>
            {selectedWard
              ? `Ward ${selectedWard.properties.wardNumber} · ${selectedWard.properties.municipalityName} · ID ${selectedWard.properties.wardId}`
              : municipality
                ? `${wardOptions.length} wards. Select a ward on the map or use the ward selector.`
                : `${municipalityOptions.length} municipalities · ${provinceWards?.features.length.toLocaleString("en-ZA") ?? "—"} wards. Select a municipality to explore its wards.`}{" "}
            {useSvg
              ? "Use the zoom buttons; drag the zoomed map to pan."
              : "Drag to pan; pinch or use the buttons to zoom."}
          </span>
        )}
      </div>
      {selectedProvince && (
        <div className="map-details-grid">
          <aside className="map-geography-card">
            <p className="eyebrow">
              {selectedWard
                ? "SELECTED WARD"
                : selectedMunicipality
                  ? "SELECTED MUNICIPALITY"
                  : "SELECTED PROVINCE"}
            </p>
            <h3>
              {selectedWard
                ? `Ward ${selectedWard.properties.wardNumber}`
                : (selectedMunicipality?.properties.name ?? selectedProvince)}
            </h3>
            <p>
              {selectedWard
                ? `${selectedWard.properties.municipalityName} · ${selectedProvince}`
                : selectedMunicipality
                  ? `${selectedProvince} · ${selectedMunicipality.properties.code}`
                  : "Choose a municipality, then a ward, to explore local boundaries."}
            </p>
            {selectedWard && (
              <p>
                <strong>Ward identifier:</strong>{" "}
                {selectedWard.properties.wardId}
              </p>
            )}
            <p>
              <strong>Boundary snapshot:</strong>{" "}
              {WARD_BOUNDARY_INFO.vintageLabel}
            </p>
            <p className="map-boundary-caveat">
              Ward boundaries show geography. Verified ward election statistics
              are not yet included.
            </p>
            {missingWardNumbers && (
              <p className="map-coverage-warning">
                Coverage gap: this source has no geometry for{" "}
                {missingWardNumbers.municipalityName} ward numbers{" "}
                {missingWardNumbers.unrepresentedNumbersWithinRange.join(", ")}.
                This source gap has not been reconciled with the primary
                boundary set.
              </p>
            )}
            <a
              href="https://registertovote.elections.org.za/"
              target="_blank"
              rel="noreferrer"
            >
              Check your registration with the IEC ↗
            </a>
            <a
              href={WARD_BOUNDARY_INFO.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              View attributed boundary files ↗
            </a>
          </aside>
          <aside className="map-selection-card" aria-live="polite">
            <span className="eyebrow">
              PROVINCE CONTEXT ·{" "}
              {selectedObservation?.kind === "snapshot"
                ? "REGISTRATION SNAPSHOT"
                : mapYear}
            </span>
            <h3>{selectedProvince}</h3>
            <div className="map-selection-metric">
              <span>{selectedObservation?.label ?? METRICS[metric]}</span>
              <strong>
                {selectedObservation
                  ? formatObservation(selectedObservation)
                  : "Unavailable"}
              </strong>
            </div>
            {selectedObservation && metric === "registration" && (
              <div className="map-selection-metric map-national-share">
                <span>Share of national roll</span>
                <strong>
                  {selectedObservation.shareOfNationalRoll?.toFixed(2)}%
                </strong>
              </div>
            )}
            {selectedObservation?.kind === "election" && (
              <div className="map-selection-metric map-national-share">
                <span>Participating voters</span>
                <strong>
                  {selectedObservation.voters?.toLocaleString("en-ZA") ??
                    "Unavailable"}
                </strong>
              </div>
            )}
            <p>
              {selectedObservation
                ? `${selectedObservation.kind === "snapshot" ? `Observed ${formattedSnapshotDate}.` : "2016 municipal election."} ${selectedObservation.note}`
                : hasHistoricalMeasure && metric === "nonparticipation"
                  ? "Unavailable: conflicting roll counts in the 2016 report prevent a compatible non-participation calculation for this province."
                  : "Verified provincial results are not mapped for this measure and reference year."}
            </p>
          </aside>
        </div>
      )}
      {!selectedProvince &&
        (hasMappedValues ? (
          <div className="registration-map-legend">
            <span className="registration-legend-title">
              {METRICS[metric].toUpperCase()} · EXACT{" "}
              {metric === "turnout" ? "PERCENTAGE" : "COUNT"} INTERVALS
            </span>
            <div>
              {intervals.map((interval) => (
                <span key={interval.min}>
                  <i style={{ backgroundColor: interval.color }} />
                  {interval.label}
                </span>
              ))}
              {metric === "nonparticipation" && (
                <span>
                  <i style={{ backgroundColor: "#34384c" }} />
                  Unavailable
                </span>
              )}
            </div>
            <p>
              Province colours show the selected statistical measure.
              Municipality and ward views show boundaries only.
            </p>
          </div>
        ) : (
          <div className="map-legend">
            <span>
              Provincial data unavailable · {mapYear} · {METRICS[metric]}
            </span>
          </div>
        ))}
      <div className="map-source-note">
        <p>
          <strong>Province overview:</strong>{" "}
          <a
            href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth
          </a>{" "}
          v5.1.2 (2022), generalised province boundaries; reference year
          unspecified.{" "}
          {hasHistoricalMeasure
            ? "This later overview cannot establish historical boundary equivalence for 2016."
            : "No historical election geography is implied."}
        </p>
        <p>
          <strong>Municipalities and wards:</strong>{" "}
          <a
            href={WARD_BOUNDARY_INFO.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            SA-Maps mirror, attributed to the Municipal Demarcation Board
          </a>{" "}
          · {WARD_BOUNDARY_INFO.vintageLabel} ·{" "}
          {WARD_BOUNDARY_INFO.wardCount.toLocaleString("en-ZA")} mapped wards.
          This boundary vintage is separate from the statistical dataset
          selected above. No province totals are assigned to wards.
        </p>
        <p>
          {WARD_BOUNDARY_INFO.verificationNote}{" "}
          <a
            href={publicPath("/data/wards.metadata.json")}
            target="_blank"
            rel="noreferrer"
          >
            Ward source details
          </a>
        </p>
        <p>
          {hasRegistration ? (
            <>
              Counts:{" "}
              <a
                href={registrationSource?.url}
                target="_blank"
                rel="noreferrer"
              >
                IEC voter registration statistics
              </a>
              , observed {formattedSnapshotDate}. Current counts are not
              historical election rolls.
            </>
          ) : hasHistoricalMeasure ? (
            <>
              Data:{" "}
              <a href={historicalSource?.url} target="_blank" rel="noreferrer">
                IEC 2016 municipal election report
              </a>
              . Published turnout is retained; certified rolls differ from
              effective rolls including MEC7 additions. Non-participation is
              unavailable for Eastern Cape and Limpopo because report roll
              counts conflict.
            </>
          ) : (
            "Electoral values are unavailable for this measure and reference year."
          )}{" "}
          {useSvg &&
            "Your browser is using the accessible SVG map because the interactive renderer is unavailable."}{" "}
          <a
            href={publicPath("/data/boundaries.metadata.json")}
            target="_blank"
            rel="noreferrer"
          >
            Source details
          </a>
        </p>
      </div>
    </section>
  );
}
