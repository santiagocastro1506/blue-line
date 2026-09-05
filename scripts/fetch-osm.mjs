/**
 * Pulls real OpenStreetMap street centrelines for the extract bbox via Overpass.
 *
 * The surface is a diazo sheet, so the base map is drawn as linework rather than
 * served as photographic raster tiles: a blue-line plat shows the street grid as
 * lines, not as imagery. Overpass gives us the real OSM ways to draw, keyless,
 * and the ODbL attribution rides on the sheet's revision strip.
 *
 *   node scripts/fetch-osm.mjs
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Overpass's usage policy wants a descriptive agent; without one the main
// instance answers 406, and the mirrors rate-limit anonymous traffic harder.
const UA = 'spatial-intelligence-platform/0.1 (portfolio project; bounded one-off extract)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Classes worth drawing on a sheet at this scale, coarsest first.
const CLASS_OF = {
  motorway: 'arterial', trunk: 'arterial', primary: 'arterial',
  secondary: 'secondary', tertiary: 'secondary',
  residential: 'local', unclassified: 'local', living_street: 'local',
  pedestrian: 'pedestrian', footway: 'pedestrian', path: 'pedestrian', steps: 'pedestrian',
  service: 'service',
};

const main = async () => {
  const metaPath = join(process.cwd(), 'data', 'extract-metadata.json');
  const { bbox } = JSON.parse(await readFile(metaPath, 'utf8'));

  // Overpass takes south,west,north,east.
  const bb = `${bbox.ymin},${bbox.xmin},${bbox.ymax},${bbox.xmax}`;
  const query = `
    [out:json][timeout:90];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|footway|path|steps|service)$"](${bb});
    );
    out geom;
  `;

  let json = null;
  let lastErr = null;

  outer: for (const endpoint of ENDPOINTS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        process.stdout.write(`  ${new URL(endpoint).host} (try ${attempt}) ... `);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': UA,
            Accept: 'application/json',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(120_000),
        });
        if (res.status === 429 || res.status === 504) throw new Error(`HTTP ${res.status} (busy)`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        json = await res.json();
        console.log(`ok (${json.elements?.length ?? 0} ways)`);
        break outer;
      } catch (err) {
        console.log(`failed (${err.message})`);
        lastErr = err;
        if (attempt < 3) await sleep(attempt * 4000);
      }
    }
  }

  if (!json) throw new Error(`every Overpass endpoint failed: ${lastErr?.message}`);

  const features = (json.elements ?? [])
    .filter((el) => el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length > 1)
    .map((el) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: el.geometry.map((p) => [
          Number(p.lon.toFixed(6)),
          Number(p.lat.toFixed(6)),
        ]),
      },
      properties: {
        osm_id: el.id,
        name: el.tags?.name ?? null,
        highway: el.tags?.highway ?? null,
        class: CLASS_OF[el.tags?.highway] ?? 'service',
        oneway: el.tags?.oneway === 'yes' || undefined,
      },
    }));

  const out = {
    type: 'FeatureCollection',
    metadata: {
      source: 'OpenStreetMap contributors, via Overpass API',
      licence: 'ODbL 1.0 — attribution required and rendered on the sheet',
      bbox,
      srid: 4326,
      retrieved: new Date().toISOString(),
      counts: { ways: features.length },
    },
    features,
  };

  const dir = join(process.cwd(), 'data');
  await mkdir(dir, { recursive: true });
  const path = join(dir, 'midtown-streets.geojson');
  await writeFile(path, JSON.stringify(out));

  const { size } = await (await import('node:fs/promises')).stat(path);
  const named = features.filter((f) => f.properties.name).length;
  const byClass = features.reduce((a, f) => ((a[f.properties.class] = (a[f.properties.class] ?? 0) + 1), a), {});

  console.log(`  wrote midtown-streets.geojson  ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  ways: ${features.length}  named: ${named}`);
  console.log(`  by class:`, byClass);
};

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
