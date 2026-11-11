/**
 * Builds src/content/map-paths.ts: static SVG path strings for the Service
 * Journey map. d3 and GeoJSON are used here only, never shipped to the client.
 *
 * Sources (see the attribution emitted into map-paths.ts):
 *  - India outline: DataMeet "india-composite.geojson", the land area of India
 *    including the disputed territories per the official Survey of India
 *    boundary (all of Jammu & Kashmir and Ladakh). License: CC0.
 *  - Uttarakhand + districts: Census of India 2011 district boundaries as
 *    published by DataMeet (CC BY 2.5 India).
 *
 * Usage: node scripts/build-map.mjs   (downloads raw data to scripts/data/ on first run)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { geoConicEqualArea, geoMercator, geoContains } from "d3-geo";
import * as shapefile from "shapefile";
import { topology } from "topojson-server";
import { feature, merge, mesh } from "topojson-client";
import { presimplify, simplify, planarTriangleArea } from "topojson-simplify";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "scripts", "data");
const outFile = path.join(root, "src", "content", "map-paths.ts");
const BASE = "https://raw.githubusercontent.com/datameet/maps/master";
const FILES = {
  "india-composite.geojson": `${BASE}/Country/india-composite.geojson`,
  "2011_Dist.shp": `${BASE}/Districts/Census_2011/2011_Dist.shp`,
  "2011_Dist.dbf": `${BASE}/Districts/Census_2011/2011_Dist.dbf`,
};

// Tunables
const UK_W = 600; // main map viewBox width
const UK_PAD = 14;
const UK_MIN_WEIGHT = 0.12; // px^2, simplification threshold for the state map
const INSET_W = 160; // locator inset viewBox width
const INSET_PAD = 3;
const INSET_MIN_WEIGHT = 0.5; // px^2

const { profile } = await import(
  pathToFileURL(path.join(root, "src", "content", "profile.ts")).href
);

async function ensureData() {
  fs.mkdirSync(dataDir, { recursive: true });
  for (const [name, url] of Object.entries(FILES)) {
    const file = path.join(dataDir, name);
    if (fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    console.log(`downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
}

// ---- helpers --------------------------------------------------------------
const polysOf = (geom) =>
  geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

function projectGeometry(geom, proj) {
  return {
    type: "MultiPolygon",
    coordinates: polysOf(geom).map((poly) =>
      poly.map((ring) => ring.map((c) => proj(c))),
    ),
  };
}

function ringsToPath(multi, digits) {
  const f = (n) => String(+n.toFixed(digits));
  let d = "";
  for (const poly of polysOf(multi))
    for (const ring of poly) {
      if (ring.length < 4) continue;
      d += "M" + ring.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
    }
  return d;
}

function linesToPath(multiLine, digits) {
  const f = (n) => String(+n.toFixed(digits));
  return multiLine.coordinates
    .filter((l) => l.length >= 2)
    .map((l) => "M" + l.map(([x, y]) => `${f(x)} ${f(y)}`).join("L"))
    .join("");
}

function pathBounds(multi) {
  let x1 = -Infinity,
    y1 = -Infinity;
  for (const poly of polysOf(multi))
    for (const ring of poly)
      for (const [x, y] of ring) {
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  return [x1, y1];
}

/** Even-odd point-in-polygon over a projected (Multi)Polygon. */
function insideProjected(multi, pt) {
  let inside = false;
  for (const poly of polysOf(multi))
    for (const ring of poly)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i],
          [xj, yj] = ring[j];
        if (
          yi > pt[1] !== yj > pt[1] &&
          pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi
        )
          inside = !inside;
      }
  return inside;
}

function simplified(objects, minWeight) {
  let topo = topology(objects);
  topo = presimplify(topo, planarTriangleArea);
  return simplify(topo, minWeight);
}

// ---- load -----------------------------------------------------------------
await ensureData();

const india = JSON.parse(
  fs.readFileSync(path.join(dataDir, "india-composite.geojson"), "utf8"),
);
const indiaGeom = india.features[0].geometry;
const indiaFeature = { type: "Feature", properties: {}, geometry: indiaGeom };

// Hard compliance gate: the source boundary must include all of J&K and Ladakh.
const JK_CHECKS = [
  ["Leh (Ladakh)", 77.58, 34.15],
  ["Kargil (Ladakh)", 76.13, 34.55],
  ["Srinagar (Kashmir valley)", 74.8, 34.08],
  ["Muzaffarabad (PoK, claimed)", 73.47, 34.37],
  ["Gilgit (claimed)", 74.31, 35.92],
  ["Skardu (claimed)", 75.63, 35.3],
  ["Aksai Chin (claimed)", 79.5, 35.3],
  ["Siachen", 77.1, 35.42],
];
for (const [name, lng, lat] of JK_CHECKS) {
  if (!geoContains(indiaFeature, [lng, lat]))
    throw new Error(`India outline does not contain ${name}; refusing to build.`);
}
console.log(
  `source boundary check OK: ${JK_CHECKS.length} J&K / Ladakh points inside`,
);

const sf = await shapefile.read(
  path.join(dataDir, "2011_Dist.shp"),
  path.join(dataDir, "2011_Dist.dbf"),
);
const ukDistricts = sf.features.filter(
  (f) => f.properties.ST_NM === "Uttarakhand",
);
if (ukDistricts.length !== 13)
  throw new Error(`Expected 13 Uttarakhand districts, got ${ukDistricts.length}`);

// State outline in geographic coords (for fitting projections)
const ukGeoTopo = topology({
  d: { type: "FeatureCollection", features: ukDistricts },
});
const ukGeoMerged = {
  type: "Feature",
  properties: {},
  geometry: merge(ukGeoTopo, ukGeoTopo.objects.d.geometries),
};

// ---- main Uttarakhand map -------------------------------------------------
const ukProj = geoMercator();
ukProj.fitWidth(UK_W - 2 * UK_PAD, ukGeoMerged);
{
  // fitWidth puts the fitted extent's top-left at (0,0); shift by padding
  const [tx, ty] = ukProj.translate();
  ukProj.translate([tx + UK_PAD, ty + UK_PAD]);
}
const ukProjFn = (c) => ukProj(c);
const ukProjectedMerged = projectGeometry(ukGeoMerged.geometry, ukProjFn);
const [, ukMaxY] = pathBounds(ukProjectedMerged);
const UK_H = Math.ceil(ukMaxY + UK_PAD);

const projectedDistricts = {
  type: "FeatureCollection",
  features: ukDistricts.map((f) => ({
    type: "Feature",
    properties: { name: f.properties.DISTRICT },
    geometry: projectGeometry(f.geometry, ukProjFn),
  })),
};
const ukTopo = simplified({ d: projectedDistricts }, UK_MIN_WEIGHT);
const ukState = {
  type: "MultiPolygon",
  coordinates: merge(ukTopo, ukTopo.objects.d.geometries).coordinates,
};
const ukInterior = mesh(ukTopo, ukTopo.objects.d, (a, b) => a !== b);

const postings = profile.postings.map((p) => {
  const [x, y] = ukProj([p.lng, p.lat]);
  return { id: p.id, x: +x.toFixed(1), y: +y.toFixed(1) };
});
for (const p of postings) {
  if (!insideProjected(ukState, [p.x, p.y]))
    console.warn(`warning: posting ${p.id} falls outside simplified state outline`);
}

// ---- India locator inset --------------------------------------------------
const inProj = geoConicEqualArea()
  .rotate([-80.5, 0])
  .center([0, 22.5])
  .parallels([12.5, 28.5]);
inProj.fitWidth(INSET_W - 2 * INSET_PAD, indiaFeature);
{
  const [tx, ty] = inProj.translate();
  inProj.translate([tx + INSET_PAD, ty + INSET_PAD]);
}
const inFn = (c) => inProj(c);
const indiaProjected = projectGeometry(indiaGeom, inFn);
const [, inMaxY] = pathBounds(indiaProjected);
const INSET_H = Math.ceil(inMaxY + INSET_PAD);
const inTopo = simplified(
  {
    india: indiaProjected,
    uk: projectGeometry(ukGeoMerged.geometry, inFn),
  },
  INSET_MIN_WEIGHT,
);
const indiaOut = feature(inTopo, inTopo.objects.india).geometry;
const ukInsetOut = feature(inTopo, inTopo.objects.uk).geometry;

// Re-verify the simplified, projected outline still contains J&K / Ladakh.
for (const [name, lng, lat] of JK_CHECKS) {
  const pt = inFn([lng, lat]);
  if (!insideProjected(indiaOut, pt))
    throw new Error(`Simplified outline lost ${name}; lower INSET_MIN_WEIGHT.`);
}
console.log("simplified outline check OK");

// ---- emit -----------------------------------------------------------------
const ATTRIBUTION =
  "Map data: Census of India 2011 district boundaries; India outline per Survey of India (compiled by DataMeet, CC BY 2.5 IN / CC0).";

const out = `// GENERATED by scripts/build-map.mjs. Do not edit by hand.
// Pre-projected SVG paths only: no d3 or GeoJSON is shipped to the client.
//
// India outline: DataMeet india-composite (CC0), follows the official Survey of
// India boundary including all of Jammu & Kashmir and Ladakh.
// Uttarakhand state and district boundaries: Census of India 2011 via DataMeet
// (CC BY 2.5 India). https://github.com/datameet/maps

export const MAP_ATTRIBUTION =
  ${JSON.stringify(ATTRIBUTION)};

/** Main Uttarakhand map. Coordinates are in viewBox units. */
export const UK_MAP = {
  width: ${UK_W},
  height: ${UK_H},
  state: ${JSON.stringify(ringsToPath(ukState, 1))},
  districts: ${JSON.stringify(linesToPath(ukInterior, 1))},
} as const;

/** Locator inset: India outline with Uttarakhand highlighted. */
export const INDIA_INSET = {
  width: ${INSET_W},
  height: ${INSET_H},
  india: ${JSON.stringify(ringsToPath(indiaOut, 1))},
  uttarakhand: ${JSON.stringify(ringsToPath(ukInsetOut, 1))},
} as const;

/** Projected position of each posting in UK_MAP viewBox units, keyed by posting id. */
export const POSTING_POINTS: Record<string, { x: number; y: number }> = ${JSON.stringify(
  Object.fromEntries(postings.map((p) => [p.id, { x: p.x, y: p.y }])),
  null,
  2,
)};
`;
fs.writeFileSync(outFile, out);
const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(
  `wrote ${path.relative(root, outFile)} (${kb} KB); UK ${UK_W}x${UK_H}, inset ${INSET_W}x${INSET_H}`,
);
