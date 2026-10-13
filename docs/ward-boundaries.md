# Province → municipality → ward navigation boundaries

These display assets were derived from the **2026-labelled SA-Maps mirror**, whose README attributes ward and municipality boundaries to the Municipal Demarcation Board. The original MDB files were not independently matched. These assets are useful for civic navigation; they must not be presented as certified electoral statistics or confirmation of a person's voting ward.

## Frozen source

- Mirror: https://github.com/j-norwood-young/SA-Maps/tree/e79972d7d65283877df3101a24270f5e1415d579
- Mirror commit: `e79972d7d65283877df3101a24270f5e1415d579`, 9 September 2026 at 12:28:25 UTC.
- Ward update commit: `d975f078b6c5bbd14bffb730db9e806e99ed6356`, 9 September 2026 at 12:16:39 UTC.
- Municipal update commit: `c011264b75e631ea503a5e8a16a10a3cfb917793`, 9 September 2026 at 12:19:26 UTC.
- Files retrieved: 13 October 2026. Exact SHA-256 and sizes for all eight original SHP/SHX/DBF/PRJ files appear in `wards.metadata.json`.
- CRS: WGS 84 (EPSG:4326), confirmed by the original PRJ files. Geographic coordinates are retained without reprojection.

## Verified contents

The mirror contains 4,485 distinct ward identifiers, 213 distinct ward-bearing municipalities and all nine provinces. Every ward municipality code occurs exactly once in the municipality boundary set. These are local and metropolitan boundaries; district councils do not have a separate ward layer.

| Province      | Ward features |
| ------------- | ------------: |
| Eastern Cape  |           703 |
| Free State    |           308 |
| Gauteng       |           526 |
| KwaZulu-Natal |           921 |
| Limpopo       |           568 |
| Mpumalanga    |           408 |
| North West    |           402 |
| Northern Cape |           233 |
| Western Cape  |           416 |

The original and final display features are valid, nonempty Polygon/MultiPolygon geometries. Ward IDs and ward numbers are retained exactly from `pklWardId` and `WardNo`. Municipality codes are retained from `MunicCode` (wards) and `MunicCode2` (municipalities). Names are read from the original code/name fields.

## Unresolved source discrepancies

[The IEC's 27 May 2026 campaign announcement](https://www.gov.za/news/media-statements/electoral-commission-launches-2026-local-government-elections-campaign-27-may) reports **4,488 wards and 214 municipalities**. The mirrored files contain **4,485 and 213**. We have not reconciled that difference against an original MDB release.

Merafong City (`GT484`) has 25 ward records numbered 1–28, with 8, 19 and 27 unrepresented. Other mirrored municipalities have contiguous ward numbers from 1 to their maximum. The three-number difference is an observation, not proof of why the official announcement and mirror differ. No replacement records or geometries have been inferred.

An earlier May 2026 file in the same mirror had voting-district attributes and 26,298 records; it is not a reliable alternate ward dataset and was not blended into these assets.

## Display transformation

The conversion uses PyShp 3.1.6 and Shapely 2.2.0. Each source geometry is simplified with tolerance `0.0001` degrees and `preserve_topology=True`, then snapped to six decimal places and checked for validity. The source does not pass joint coverage validation, so the process preserves each feature's topology, rather than claiming to repair or certify all shared municipal/ward edges.

The map loads a single province's wards when needed. Exact SHA-256 hashes, feature counts and sizes of all ten final display assets are included in `displayFiles` in `wards.metadata.json`. Countrywide wards are not loaded into the initial page.

The mirror does not specify a separate data licence. Preserve the MDB and SA-Maps source credit and consult the original publisher's terms for further redistribution.

## Reproduce the display files

Application visitors need no Python setup. Maintainers can install `pyshp==3.1.6` and `shapely==2.2.0` in an isolated Python environment, download the eight pinned URLs listed in `public/data/wards.metadata.json` to one directory, then run:

```sh
python scripts/import-ward-boundaries.py /path/to/source-files --output-dir /tmp/ward-display-check
```

The importer verifies every input hash before reading it, then verifies all ten output hashes against the retained metadata. It refuses source or display integrity mismatches. Run `npm test` to verify the relationships, identifiers, geographic rings, known source gaps and display hashes.
