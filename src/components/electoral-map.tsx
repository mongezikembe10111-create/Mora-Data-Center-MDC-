"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox } from "@turf/turf";
import { geoMercator, geoPath } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { Expand, Layers3, MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import {
  currentRegistrationObservation,
  getSource,
  municipalYears,
  provinces,
} from "@/lib/data";
import {
  electoralMapColor,
  getElectoralMapObservation,
  getMapIntervals,
  REGISTRATION_MAP_DATE,
  REGISTRATION_MAP_YEAR,
  type ElectoralMapObservation,
} from "@/lib/geography";
import "./electoral-map.css";

type ProvinceProperties = {
  name: string;
  iso_3166_2: string;
  label_longitude: number;
  label_latitude: number;
};
type ProvinceFeature = Feature<Polygon | MultiPolygon, ProvinceProperties>;
type Provinces = FeatureCollection<Polygon | MultiPolygon, ProvinceProperties>;
type Props = {
  year: number;
  province: string;
  onProvinceChange: (name: string) => void;
};

const YEARS = municipalYears;
const PROVINCES: readonly string[] = provinces;
const METRICS = {
  registration: "Voter registration",
  turnout: "Voter turnout",
  nonparticipation: "Non-participation",
  youth: "Youth registration",
  change: "Historical turnout change",
  party: "Party performance",
};
type Metric = keyof typeof METRICS;

function formatObservation(observation: ElectoralMapObservation) {
  return observation.unit === "percent"
    ? `${observation.value.toFixed(2)}%`
    : observation.value.toLocaleString("en-ZA");
}

// Keep the downloaded geometry intact. Only the camera and SVG overview focus
// on the largest polygon, so Western Cape's offshore islands do not distort fit.
function mainlandFeature(feature: ProvinceFeature): ProvinceFeature {
  if (feature.geometry.type === "Polygon") return feature;
  const polygons = feature.geometry.coordinates;
  const biggest = polygons.reduce((largest, candidate) => {
    const polygonArea = (ring: number[][]) =>
      Math.abs(
        ring.reduce((total, point, index) => {
          const next = ring[(index + 1) % ring.length];
          return total + point[0] * next[1] - next[0] * point[1];
        }, 0),
      );
    return polygonArea(candidate[0]) > polygonArea(largest[0])
      ? candidate
      : largest;
  });
  return { ...feature, geometry: { type: "Polygon", coordinates: biggest } };
}

function fitProvince(
  map: MapLibreMap,
  collection: Provinces,
  name: string,
  animate = true,
) {
  const selected = collection.features.find(
    (feature) => feature.properties.name === name,
  );
  const target = selected
    ? mainlandFeature(selected)
    : {
        ...collection,
        features: collection.features.map(mainlandFeature),
      };
  const bounds = bbox(target);
  map.fitBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    {
      padding: selected ? 80 : { top: 56, bottom: 58, left: 38, right: 38 },
      duration:
        animate &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 650
          : 0,
      maxZoom: selected ? 7.4 : 5.5,
    },
  );
}

function SvgOverview({
  data,
  province,
  mapYear,
  metric,
  onSelect,
}: {
  data: Provinces;
  province: string;
  mapYear: number;
  metric: Metric;
  onSelect: (name: string) => void;
}) {
  const { path, projection, features } = useMemo(() => {
    const features = data.features.map(mainlandFeature);
    const projection = geoMercator().fitExtent(
      [
        [32, 22],
        [768, 390],
      ],
      { ...data, features },
    );
    return { path: geoPath(projection), projection, features };
  }, [data]);

  return (
    <svg
      className="electoral-map-svg"
      viewBox="0 0 800 430"
      role="group"
      aria-label="South African provinces. Select a province for details."
    >
      {features.map((feature) => {
        const observation = getElectoralMapObservation(
          feature.properties.name,
          mapYear,
          metric,
        );
        return (
          <path
            key={feature.properties.name}
            d={path(feature) ?? undefined}
            className={`province-shape ${province === feature.properties.name ? "selected" : ""} ${observation ? "has-registration" : ""}`}
            style={
              observation
                ? { fill: electoralMapColor(observation.value, metric) }
                : undefined
            }
            role="button"
            tabIndex={0}
            aria-label={`Select ${feature.properties.name}${observation ? `, ${formatObservation(observation)} ${observation.label}` : ", data unavailable"}`}
            aria-pressed={province === feature.properties.name}
            onClick={() => onSelect(feature.properties.name)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(feature.properties.name);
              }
            }}
          >
            <title>
              {feature.properties.name} —{" "}
              {observation
                ? `${formatObservation(observation)} ${observation.label}, ${observation.observedAt}`
                : "provincial electoral data unavailable"}
            </title>
          </path>
        );
      })}
      {features.map((feature) => {
        const point = projection([
          feature.properties.label_longitude,
          feature.properties.label_latitude,
        ]);
        return (
          point && (
            <text
              key={feature.properties.name}
              x={point[0]}
              y={point[1]}
              className="province-svg-label"
              textAnchor="middle"
            >
              {feature.properties.name}
            </text>
          )
        );
      })}
    </svg>
  );
}

export default function ElectoralMap({
  year,
  province,
  onProvinceChange,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const callbackRef = useRef(onProvinceChange);
  const selectedRef = useRef(province);
  const [data, setData] = useState<Provinces | null>(null);
  const [mapYear, setMapYear] = useState(REGISTRATION_MAP_YEAR);
  const [metric, setMetric] = useState<Metric>("registration");
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [useSvg, setUseSvg] = useState(false);
  const [boundaryError, setBoundaryError] = useState(false);

  const selectedProvince = PROVINCES.includes(province) ? province : "";
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
  callbackRef.current = onProvinceChange;
  selectedRef.current = province;

  // Keep the observed snapshot separate from the global municipal election year.
  useEffect(() => {
    setMapYear((currentYear) =>
      currentYear === REGISTRATION_MAP_YEAR ? currentYear : year,
    );
  }, [year]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/provinces.geojson", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Boundary file unavailable");
        return response.json() as Promise<Provinces>;
      })
      .then(setData)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setBoundaryError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!data || !mapContainer.current) return;
    let map: MapLibreMap;
    let hoverId: string | number | undefined;
    const markers: maplibregl.Marker[] = [];
    let resizeObserver: ResizeObserver | null = null;
    try {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#0e1421" },
            },
          ],
        },
        center: [25, -29],
        zoom: 4,
        minZoom: 3,
        maxZoom: 9,
        attributionControl: false,
        renderWorldCopies: false,
        dragRotate: false,
        touchPitch: false,
        pitchWithRotate: false,
        maxBounds: [
          [12, -38],
          [37, -19],
        ],
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      // Preserve normal page scrolling. Explicit controls and touch gestures
      // still offer zoom; keyboard navigation also remains available.
      map.scrollZoom.disable();
      map.on("load", () => {
        map.addSource("provinces", { type: "geojson", data });
        map.addLayer({
          id: "province-fill",
          type: "fill",
          source: "provinces",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#8470e8",
              ["boolean", ["feature-state", "hover"], false],
              "#544e72",
              "#34384c",
            ],
            "fill-opacity": 0.88,
          },
        });
        map.addLayer({
          id: "province-lines",
          type: "line",
          source: "provinces",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#c7baff",
              "#6c7391",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2,
              1.1,
            ],
          },
        });
        for (const feature of data.features) {
          const button = document.createElement("button");
          button.className = "province-map-label";
          button.textContent = feature.properties.name;
          button.type = "button";
          button.setAttribute(
            "aria-label",
            `Select ${feature.properties.name}`,
          );
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            callbackRef.current(feature.properties.name);
          });
          markers.push(
            new maplibregl.Marker({ element: button })
              .setLngLat([
                feature.properties.label_longitude,
                feature.properties.label_latitude,
              ])
              .addTo(map),
          );
        }
        map.on("mousemove", "province-fill", (event) => {
          if (hoverId !== undefined)
            map.setFeatureState(
              { source: "provinces", id: hoverId },
              { hover: false },
            );
          const feature = event.features?.[0];
          hoverId = feature?.id;
          if (hoverId !== undefined)
            map.setFeatureState(
              { source: "provinces", id: hoverId },
              { hover: true },
            );
          setHoveredProvince(feature?.properties?.name ?? null);
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "province-fill", () => {
          if (hoverId !== undefined)
            map.setFeatureState(
              { source: "provinces", id: hoverId },
              { hover: false },
            );
          hoverId = undefined;
          setHoveredProvince(null);
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "province-fill", (event) => {
          const name = event.features?.[0]?.properties?.name;
          if (name) callbackRef.current(String(name));
        });
        for (const feature of data.features) {
          map.setFeatureState(
            { source: "provinces", id: feature.id! },
            { selected: feature.properties.name === selectedRef.current },
          );
        }
        fitProvince(map, data, selectedRef.current, false);
        setMapReady(true);
      });
      map.on("error", () => setUseSvg(true));
      map
        .getCanvas()
        .addEventListener("webglcontextlost", () => setUseSvg(true));
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(mapContainer.current);
    } catch {
      setUseSvg(true);
      return;
    }
    return () => {
      resizeObserver?.disconnect();
      markers.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data) return;
    for (const feature of data.features) {
      map.setFeatureState(
        { source: "provinces", id: feature.id! },
        { selected: feature.properties.name === selectedProvince },
      );
    }
    fitProvince(map, data, selectedProvince);
  }, [selectedProvince, data, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data) return;
    for (const feature of data.features) {
      const observation = getElectoralMapObservation(
        feature.properties.name,
        mapYear,
        metric,
      );
      map.setFeatureState(
        { source: "provinces", id: feature.id! },
        { mapValue: observation?.value ?? null },
      );
    }
    map.setPaintProperty(
      "province-fill",
      "fill-color",
      hasMappedValues
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
        : [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#8470e8",
            ["boolean", ["feature-state", "hover"], false],
            "#544e72",
            "#34384c",
          ],
    );
    map.setPaintProperty("province-fill", "fill-opacity", [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      1,
      0.9,
    ]);
  }, [hasMappedValues, mapYear, metric, mapReady, data, intervals]);

  function changeMetric(nextMetric: Metric) {
    setMetric(nextMetric);
    if (nextMetric === "registration") setMapYear(REGISTRATION_MAP_YEAR);
    else if (
      (nextMetric === "turnout" || nextMetric === "nonparticipation") &&
      mapYear === REGISTRATION_MAP_YEAR
    )
      setMapYear(2016);
    else if (mapYear === REGISTRATION_MAP_YEAR) setMapYear(year);
  }

  function resetMap() {
    onProvinceChange("All provinces");
    if (mapRef.current && data && mapReady)
      fitProvince(mapRef.current, data, "");
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
          <p className="muted">Explore South Africa, province by province.</p>
        </div>
        <span className="map-scope-badge">
          <Layers3 size={13} /> Province boundaries
        </span>
      </div>

      <div className="map-filter-bar">
        <label className="map-field">
          Map dataset
          <select
            className="select"
            value={mapYear}
            onChange={(event) => setMapYear(Number(event.target.value))}
          >
            <option value={REGISTRATION_MAP_YEAR}>
              2026 registration snapshot
            </option>
            {YEARS.map((item) => (
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
            value={selectedProvince}
            onChange={(event) =>
              onProvinceChange(event.target.value || "All provinces")
            }
          >
            <option value="">All provinces</option>
            {PROVINCES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button className="button map-reset-button" onClick={resetMap}>
          <RotateCcw size={14} /> Reset view
        </button>
      </div>

      <div
        className={`map-dataset-status ${hasMappedValues ? "verified" : "unavailable"}`}
        aria-live="polite"
      >
        {hasRegistration ? (
          <>
            <span className="map-status-dot" /> Verified IEC registration
            snapshot · {formattedSnapshotDate}{" "}
            <span className="map-global-year">Global election: {year}</span>
          </>
        ) : hasHistoricalMeasure ? (
          <>
            <span className="map-status-dot" /> Verified IEC 2016 municipal
            election data{" "}
            <span className="map-global-year">
              {metric === "nonparticipation"
                ? "7 provinces · 2 missing roll denominators"
                : "9 provinces"}
            </span>
          </>
        ) : (
          <>
            <span className="map-status-dot" />{" "}
            {mapYear === REGISTRATION_MAP_YEAR
              ? "This snapshot provides registration counts only."
              : `Verified ${mapYear} provincial ${METRICS[metric].toLowerCase()} is not mapped.`}{" "}
            <span className="map-global-year">
              Historical values are not substituted.
            </span>
          </>
        )}
      </div>

      <div className="electoral-map-stage">
        <div
          ref={mapContainer}
          className={`electoral-map-canvas ${useSvg ? "map-canvas-hidden" : ""}`}
          aria-label="Interactive South African province map"
        />
        {useSvg && data && (
          <SvgOverview
            data={data}
            province={selectedProvince}
            mapYear={mapYear}
            metric={metric}
            onSelect={onProvinceChange}
          />
        )}
        {!mapReady && !useSvg && !boundaryError && (
          <div className="map-loading" role="status">
            <span className="map-loading-dot" /> Loading province geography…
          </div>
        )}
        {boundaryError && (
          <div className="map-loading empty-state" role="alert">
            Province boundaries could not be loaded. Select a province above to
            view its data status.
          </div>
        )}

        <div className="map-compass" aria-hidden="true">
          <span>N</span>
          <svg viewBox="0 0 20 32">
            <path d="M10 0 18 29 10 22 2 29Z" fill="#b7b9cc" />
            <path d="M10 0 10 22 2 29Z" fill="#515b74" />
          </svg>
        </div>
        {!useSvg && (
          <div className="map-zoom-controls" aria-label="Map zoom controls">
            <button
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => mapRef.current?.zoomIn()}
            >
              <Plus size={16} />
            </button>
            <button
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus size={16} />
            </button>
            <button
              aria-label="Fit all provinces"
              title="Fit all provinces"
              onClick={resetMap}
            >
              <Expand size={15} />
            </button>
          </div>
        )}

        <div className="map-location-pill">
          <MapPin size={12} /> SOUTH AFRICA{" "}
          <span>{selectedProvince || "9 PROVINCES"}</span>
        </div>
        {hoveredProvince && !selectedProvince && (
          <div className="map-hover-card" role="status">
            <strong>{hoveredProvince}</strong>
            <span>
              {hoveredObservation
                ? `${formatObservation(hoveredObservation)} ${hoveredObservation.label.toLowerCase()} · ${hoveredObservation.observedAt}`
                : "Click to explore · results unavailable"}
            </span>
          </div>
        )}
        {selectedProvince && (
          <aside className="map-selection-card" aria-live="polite">
            <span className="eyebrow">
              SELECTED PROVINCE ·{" "}
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
                  : "Verified provincial results are not mapped for this measure and reference year."}{" "}
              Municipality and ward boundaries are unavailable.
            </p>
          </aside>
        )}
        <div className="map-ocean-label" aria-hidden="true">
          SOUTH ATLANTIC OCEAN
        </div>
      </div>

      {hasMappedValues ? (
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
            Values are also available through the province selector. A bright
            outline marks the selected province.
          </p>
        </div>
      ) : (
        <div className="map-legend">
          <div>
            <span className="map-legend-swatch" /> Provincial data unavailable{" "}
            <span className="map-legend-selected" /> Selected province
          </div>
          <span>
            {mapYear} · {METRICS[metric]}
          </span>
        </div>
      )}
      <div className="map-source-note">
        <p>
          <strong>Administrative geography.</strong>{" "}
          <a
            href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth
          </a>{" "}
          v5.1.2, released 2022; boundary reference year unspecified. These are
          generalised province boundaries, not official IEC election boundaries.{" "}
          {hasHistoricalMeasure
            ? "The 2016 data uses election-year administrative provinces; this later geography is an overview and cannot establish historical boundary equivalence."
            : "No historical election geography is implied."}
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
              historical election rolls; no eligible-population rates or voting
              behaviour are inferred.
            </>
          ) : hasHistoricalMeasure ? (
            <>
              Data:{" "}
              <a href={historicalSource?.url} target="_blank" rel="noreferrer">
                IEC 2016 municipal election report
              </a>
              . Published turnout is retained; certified rolls differ from
              effective rolls including MEC7 additions. Non-participation is
              unavailable for Eastern Cape and Limpopo because the report&apos;s
              roll counts conflict.
            </>
          ) : (
            "Map shading indicates selection only. Electoral values are unavailable for this map measure and reference year."
          )}{" "}
          {useSvg &&
            "Your browser is using the accessible map overview because WebGL is unavailable."}{" "}
          <a
            href="/data/boundaries.metadata.json"
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
