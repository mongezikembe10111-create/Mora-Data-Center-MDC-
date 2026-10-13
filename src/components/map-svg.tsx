"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import { electoralMapColor, getElectoralMapObservation } from "@/lib/geography";
import type {
  MunicipalityCollection,
  WardCollection,
} from "@/lib/ward-boundaries";

export type ProvinceProperties = {
  name: string;
  iso_3166_2: string;
  label_longitude: number;
  label_latitude: number;
};
export type ProvinceFeature = Feature<
  Polygon | MultiPolygon,
  ProvinceProperties
>;
export type Provinces = FeatureCollection<
  Polygon | MultiPolygon,
  ProvinceProperties
>;
export type MapGeometry =
  Feature<Polygon | MultiPolygon> | FeatureCollection<Polygon | MultiPolygon>;

// Camera fits omit offshore islands; the source geometry remains unchanged.
export function mainlandFeature<P>(
  feature: Feature<Polygon | MultiPolygon, P>,
): Feature<Polygon | MultiPolygon, P> {
  if (feature.geometry.type === "Polygon") return feature;
  const area = (ring: number[][]) =>
    Math.abs(
      ring.reduce((sum, point, index) => {
        const next = ring[(index + 1) % ring.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0),
    );
  const biggest = feature.geometry.coordinates.reduce((largest, candidate) =>
    area(candidate[0]) > area(largest[0]) ? candidate : largest,
  );
  return { ...feature, geometry: { type: "Polygon", coordinates: biggest } };
}

// D3's spherical polygons use the opposite winding convention to RFC 7946.
// Normalise copies for SVG only, so official GeoJSON is never rewritten here.
function svgFeature<P>(
  feature: Feature<Polygon | MultiPolygon, P>,
): Feature<Polygon | MultiPolygon, P> {
  const polygon = (rings: number[][][]) =>
    rings.map((ring, index) => {
      const area = ring.reduce((sum, point, pointIndex) => {
        const next = ring[(pointIndex + 1) % ring.length];
        return sum + point[0] * next[1] - next[0] * point[1];
      }, 0);
      return (index === 0 ? area > 0 : area < 0) ? [...ring].reverse() : ring;
    });
  return {
    ...feature,
    geometry:
      feature.geometry.type === "Polygon"
        ? {
            type: "Polygon",
            coordinates: polygon(feature.geometry.coordinates),
          }
        : {
            type: "MultiPolygon",
            coordinates: feature.geometry.coordinates.map(polygon),
          },
  };
}

function svgGeometry(target: MapGeometry): MapGeometry {
  return target.type === "FeatureCollection"
    ? { ...target, features: target.features.map(svgFeature) }
    : svgFeature(target);
}

export default function MapSvg({
  provinces,
  municipalities,
  wards,
  province,
  municipality,
  ward,
  target,
  mapYear,
  metric,
  zoom,
  onProvince,
  onMunicipality,
  onWard,
}: {
  provinces: Provinces;
  municipalities: MunicipalityCollection | null;
  wards: WardCollection | null;
  province: string;
  municipality: string;
  ward: string;
  target: MapGeometry;
  mapYear: number;
  metric:
    | "registration"
    | "turnout"
    | "nonparticipation"
    | "youth"
    | "change"
    | "party";
  zoom: number;
  onProvince: (name: string) => void;
  onMunicipality: (code: string) => void;
  onWard: (id: string, code: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragged = useRef(false);
  const [size, setSize] = useState({ width: 800, height: 450 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const { path, projection } = useMemo(() => {
    const compact = size.width < 500;
    const projection = geoMercator().fitExtent(
      [
        [compact ? 12 : 28, 34],
        [Math.max(100, size.width - (compact ? 56 : 68)), size.height - 34],
      ],
      svgGeometry(target),
    );
    return { projection, path: geoPath(projection) };
  }, [target, size]);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const provinceLabels = useMemo(() => {
    if (size.width < 500) return [];
    const boxes: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }[] = [];
    return provinces.features.flatMap((feature) => {
      const point = projection([
        feature.properties.label_longitude,
        feature.properties.label_latitude,
      ]);
      if (!point) return [];
      const halfWidth = feature.properties.name.length * 3.6;
      const box = {
        left: point[0] - halfWidth,
        right: point[0] + halfWidth,
        top: point[1] - 11,
        bottom: point[1] + 4,
      };
      if (
        box.left < 8 ||
        box.right > size.width - 8 ||
        box.top < 8 ||
        box.bottom > size.height - 8 ||
        boxes.some(
          (other) =>
            box.left < other.right + 5 &&
            box.right + 5 > other.left &&
            box.top < other.bottom + 5 &&
            box.bottom + 5 > other.top,
        )
      )
        return [];
      boxes.push(box);
      return [{ name: feature.properties.name, point }];
    });
  }, [projection, provinces, size]);
  const key = `${province}:${municipality}:${ward}:${zoom}`;
  const [previousKey, setPreviousKey] = useState(key);
  if (key !== previousKey) {
    setPreviousKey(key);
    setPan({ x: 0, y: 0 });
  }
  const activate = (
    event: React.KeyboardEvent<SVGPathElement>,
    callback: () => void,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };
  return (
    <svg
      ref={svgRef}
      className="electoral-map-svg"
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="group"
      aria-label={
        province
          ? `${province} municipality and ward boundaries. Use the selectors above for keyboard navigation.`
          : "South African provinces. Select a province to explore wards."
      }
      onPointerDown={(event) => {
        dragged.current = false;
        if (zoom <= 1 || event.button !== 0) return;
        setDrag({
          x: event.clientX,
          y: event.clientY,
          panX: pan.x,
          panY: pan.y,
        });
      }}
      onPointerMove={(event) => {
        if (!drag) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!dragged.current && Math.hypot(dx, dy) < 5) return;
        dragged.current = true;
        if (!event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.setPointerCapture(event.pointerId);
        const ratio =
          size.width / event.currentTarget.getBoundingClientRect().width;
        setPan({
          x: drag.panX + (event.clientX - drag.x) * ratio,
          y: drag.panY + (event.clientY - drag.y) * ratio,
        });
      }}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }
      }}
    >
      <g
        transform={`translate(${pan.x + size.width / 2} ${pan.y + size.height / 2}) scale(${zoom}) translate(${-size.width / 2} ${-size.height / 2})`}
      >
        {provinces.features
          .filter(
            (feature) => !province || feature.properties.name === province,
          )
          .map((original) => {
            const feature = svgFeature(mainlandFeature(original));
            const observation = getElectoralMapObservation(
              feature.properties.name,
              mapYear,
              metric,
            );
            const description = `${feature.properties.name} — ${observation ? `${observation.unit === "percent" ? `${observation.value.toFixed(2)}%` : observation.value.toLocaleString("en-ZA")} ${observation.label}, ${observation.observedAt}` : "provincial electoral data unavailable"}`;
            return (
              <path
                key={feature.properties.name}
                d={path(feature) ?? undefined}
                className={`province-shape ${province ? "province-context" : ""}`}
                style={
                  !province && observation
                    ? { fill: electoralMapColor(observation.value, metric) }
                    : undefined
                }
                role="button"
                tabIndex={province ? -1 : 0}
                aria-label={`Select ${feature.properties.name}`}
                aria-pressed={province === feature.properties.name}
                onClick={() => onProvince(feature.properties.name)}
                onKeyDown={(event) =>
                  activate(event, () => onProvince(feature.properties.name))
                }
                vectorEffect="non-scaling-stroke"
              >
                <title>{description}</title>
              </path>
            );
          })}
        {province &&
          municipalities?.features.map((feature) => (
            <path
              key={feature.properties.code}
              d={path(svgFeature(feature)) ?? undefined}
              className={`municipality-shape ${municipality === feature.properties.code ? "selected" : ""}`}
              role="button"
              tabIndex={municipality ? -1 : 0}
              aria-label={`Explore ${feature.properties.name} wards`}
              aria-pressed={municipality === feature.properties.code}
              onClick={() => onMunicipality(feature.properties.code)}
              onKeyDown={(event) =>
                activate(event, () => onMunicipality(feature.properties.code))
              }
              vectorEffect="non-scaling-stroke"
            >
              <title>{feature.properties.name}</title>
            </path>
          ))}
        {province &&
          wards?.features.map((feature) => (
            <path
              key={feature.properties.wardId}
              d={path(svgFeature(feature)) ?? undefined}
              className={`ward-shape ${ward === feature.properties.wardId ? "selected" : ""}`}
              role="button"
              tabIndex={ward === feature.properties.wardId ? 0 : -1}
              aria-label={`Ward ${feature.properties.wardNumber}, ${feature.properties.municipalityName}`}
              aria-pressed={ward === feature.properties.wardId}
              onClick={() =>
                municipality
                  ? onWard(
                      feature.properties.wardId,
                      feature.properties.municipalityCode,
                    )
                  : onMunicipality(feature.properties.municipalityCode)
              }
              onKeyDown={(event) =>
                activate(event, () =>
                  onWard(
                    feature.properties.wardId,
                    feature.properties.municipalityCode,
                  ),
                )
              }
              vectorEffect="non-scaling-stroke"
            >
              <title>{`Ward ${feature.properties.wardNumber}, ${feature.properties.municipalityName} · ${feature.properties.wardId}`}</title>
            </path>
          ))}
        {!province &&
          provinceLabels.map(({ name, point }) => (
            <text
              key={name}
              x={point[0]}
              y={point[1]}
              className="province-svg-label"
              textAnchor="middle"
            >
              {name}
            </text>
          ))}
      </g>
    </svg>
  );
}
