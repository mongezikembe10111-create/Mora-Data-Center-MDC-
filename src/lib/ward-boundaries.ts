import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import metadata from "../../public/data/wards.metadata.json";

export type WardProperties = {
  wardId: string;
  wardNumber: number;
  municipalityCode: string;
  municipalityName: string;
  province: string;
};

export type MunicipalityProperties = {
  code: string;
  name: string;
  province: string;
};

export type WardCollection = FeatureCollection<
  Polygon | MultiPolygon,
  WardProperties
>;
export type MunicipalityCollection = FeatureCollection<
  Polygon | MultiPolygon,
  MunicipalityProperties
>;

const provinceCodes: Record<string, string> = {
  "Eastern Cape": "EC",
  "Free State": "FS",
  Gauteng: "GT",
  "KwaZulu-Natal": "KZN",
  Limpopo: "LIM",
  Mpumalanga: "MP",
  "North West": "NW",
  "Northern Cape": "NC",
  "Western Cape": "WC",
};

/** Returns a local asset path; callers apply publicPath for hosted project sites. */
export function provinceBoundaryPath(province: string): string | null {
  const code = Object.hasOwn(provinceCodes, province)
    ? provinceCodes[province]
    : null;
  return code ? `/data/wards/${code}.geojson` : null;
}

export const MUNICIPAL_BOUNDARY_PATH = "/data/municipal-boundaries.geojson";
export const WARD_BOUNDARY_INFO = metadata;
