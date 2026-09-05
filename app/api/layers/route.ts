import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Serves the committed extract to the sheet for drawing.
 *
 * Rendering and computing are deliberately separate paths. Drawing the sheet
 * must not wait on a WASM Postgres cold start, and it does not need to: the
 * extract is the same real DCP and OSM data the database is seeded from. Every
 * number, by contrast, comes from PostGIS and nowhere else.
 */

const LAYERS: Record<string, string> = {
  parcels: 'midtown-parcels.geojson',
  zoning: 'midtown-zoning.geojson',
  streets: 'midtown-streets.geojson',
};

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name') ?? '';
  const file = LAYERS[name];

  if (!file) {
    return NextResponse.json(
      { error: `Unknown layer. Available: ${Object.keys(LAYERS).join(', ')}.` },
      { status: 404 },
    );
  }

  try {
    const raw = await readFile(path.join(process.cwd(), 'data', file), 'utf8');
    return new NextResponse(raw, {
      headers: {
        'Content-Type': 'application/geo+json; charset=utf-8',
        // The extract is a fixed artefact of the repo; it changes when the repo does.
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'The extract could not be read.', detail: String(err) },
      { status: 500 },
    );
  }
}
