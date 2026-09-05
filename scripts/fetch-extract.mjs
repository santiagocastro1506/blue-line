/**
 * Pulls a bounded, real extract of NYC parcel and zoning geometry from the
 * NYC Department of City Planning's own ArcGIS services and writes it to data/.
 *
 * Nothing here is synthesised. Both services are DCP_GIS-owned and public:
 *   MAPPLUTO — tax lot geometry joined to zoning and land-use attributes
 *   NYZD     — zoning district boundaries
 *
 * The extract is bounded on purpose. Citywide MapPLUTO is ~850,000 lots, which
 * cannot ship to a browser and cannot be committed to a repo. One dense,
 * legible district proves the pipeline; the same script widens to any bbox.
 *
 *   node scripts/fetch-extract.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const HOST = 'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services';

// Times Square through Bryant Park: dense, mixed-use, and full of
// non-conforming built-FAR, which is what makes the zoning readable.
const BBOX = { xmin: -73.9905, ymin: 40.7515, xmax: -73.9805, ymax: 40.7595 };

const PARCEL_FIELDS = [
  'BBL', 'Address', 'OwnerName', 'BldgClass', 'LandUse',
  'ZoneDist1', 'ZoneDist2', 'Overlay1', 'SPDist1',
  'LotArea', 'BldgArea', 'ComArea', 'ResArea', 'OfficeArea', 'RetailArea',
  'NumFloors', 'NumBldgs', 'UnitsRes', 'UnitsTotal',
  'YearBuilt', 'YearAlter1',
  'BuiltFAR', 'ResidFAR', 'CommFAR', 'FacilFAR',
  'LotFront', 'LotDepth', 'Borough', 'Block', 'Lot',
];

const ZONING_FIELDS = ['ZONEDIST'];

async function queryLayer({ service, layer, fields, label }) {
  const out = [];
  let offset = 0;
  const page = 1000;

  for (;;) {
    const params = new URLSearchParams({
      where: '1=1',
      geometry: `${BBOX.xmin},${BBOX.ymin},${BBOX.xmax},${BBOX.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: fields.join(','),
      outSR: '4326',
      returnGeometry: 'true',
      geometryPrecision: '6',
      resultOffset: String(offset),
      resultRecordCount: String(page),
      f: 'geojson',
    });

    const url = `${HOST}/${service}/FeatureServer/${layer}/query?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${label}: HTTP ${res.status} ${res.statusText}`);

    const json = await res.json();
    if (json.error) throw new Error(`${label}: ${JSON.stringify(json.error).slice(0, 300)}`);

    const feats = json.features ?? [];
    out.push(...feats.filter((f) => f.geometry));
    process.stdout.write(`  ${label}: ${out.length} features\r`);

    if (feats.length < page) break;
    offset += page;
  }

  process.stdout.write(`  ${label}: ${out.length} features\n`);
  return out;
}

function normaliseParcel(f) {
  const p = f.properties ?? {};
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
  return {
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      bbl: String(p.BBL ?? ''),
      address: p.Address ?? null,
      owner: p.OwnerName ?? null,
      bldgclass: p.BldgClass ?? null,
      landuse: p.LandUse ?? null,
      zonedist1: p.ZoneDist1 ?? null,
      zonedist2: p.ZoneDist2 ?? null,
      overlay1: p.Overlay1 ?? null,
      spdist1: p.SPDist1 ?? null,
      lotarea: num(p.LotArea),
      bldgarea: num(p.BldgArea),
      comarea: num(p.ComArea),
      resarea: num(p.ResArea),
      officearea: num(p.OfficeArea),
      retailarea: num(p.RetailArea),
      numfloors: num(p.NumFloors),
      numbldgs: num(p.NumBldgs),
      unitsres: num(p.UnitsRes),
      unitstotal: num(p.UnitsTotal),
      yearbuilt: num(p.YearBuilt),
      yearalter1: num(p.YearAlter1),
      builtfar: num(p.BuiltFAR),
      residfar: num(p.ResidFAR),
      commfar: num(p.CommFAR),
      facilfar: num(p.FacilFAR),
      lotfront: num(p.LotFront),
      lotdepth: num(p.LotDepth),
      borough: p.Borough ?? null,
      block: num(p.Block),
      lot: num(p.Lot),
    },
  };
}

function normaliseZoning(f) {
  return {
    type: 'Feature',
    geometry: f.geometry,
    properties: { zonedist: f.properties?.ZONEDIST ?? null },
  };
}

const main = async () => {
  console.log('Fetching real DCP extract for bbox', BBOX);

  const parcelsRaw = await queryLayer({
    service: 'MAPPLUTO', layer: 0, fields: PARCEL_FIELDS, label: 'MAPPLUTO ',
  });
  const zoningRaw = await queryLayer({
    service: 'nyzd', layer: 0, fields: ZONING_FIELDS, label: 'NYZD     ',
  });

  const parcels = parcelsRaw
    .map(normaliseParcel)
    .filter((f) => f.properties.bbl)
    // One row per lot: the service can hand back the same lot twice at page edges.
    .filter((f, i, a) => a.findIndex((x) => x.properties.bbl === f.properties.bbl) === i);

  const zoning = zoningRaw.map(normaliseZoning).filter((f) => f.properties.zonedist);

  const dir = join(process.cwd(), 'data');
  await mkdir(dir, { recursive: true });

  const meta = {
    source: 'NYC Department of City Planning (DCP_GIS) ArcGIS Feature Services',
    services: {
      parcels: `${HOST}/MAPPLUTO/FeatureServer/0`,
      zoning: `${HOST}/nyzd/FeatureServer/0`,
    },
    bbox: BBOX,
    srid: 4326,
    retrieved: new Date().toISOString(),
    counts: { parcels: parcels.length, zoning: zoning.length },
    note: 'Bounded extract. Real data, unmodified attributes. Not a citywide dataset.',
  };

  const write = async (name, fc) => {
    const path = join(dir, name);
    await writeFile(path, JSON.stringify(fc));
    const { size } = await (await import('node:fs/promises')).stat(path);
    console.log(`  wrote ${name}  ${(size / 1024 / 1024).toFixed(2)} MB`);
  };

  await write('midtown-parcels.geojson', {
    type: 'FeatureCollection', metadata: meta, features: parcels,
  });
  await write('midtown-zoning.geojson', {
    type: 'FeatureCollection', metadata: meta, features: zoning,
  });
  await writeFile(join(dir, 'extract-metadata.json'), JSON.stringify(meta, null, 2));

  const zones = [...new Set(parcels.map((p) => p.properties.zonedist1).filter(Boolean))].sort();
  console.log(`\n  parcels: ${parcels.length}   zoning districts: ${zoning.length}`);
  console.log(`  distinct zoning on lots: ${zones.join(', ')}`);
};

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
