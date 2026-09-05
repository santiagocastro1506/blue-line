import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getEngine } from '@/lib/db';
import { compileFilter, filterSchema } from '@/lib/filters';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * The centrepiece. A boundary drawn on the sheet arrives here as Well-Known
 * Text, goes into PostGIS unmodified, and every number that comes back is
 * computed there — areas on the geography type, so they are real square metres
 * rather than square degrees.
 */

const bodySchema = z.object({
  wkt: z.string().min(12).max(200_000),
  filter: filterSchema.optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A boundary is required, as Well-Known Text.', detail: parsed.error.issues },
      { status: 400 },
    );
  }

  const { wkt, filter } = parsed.data;

  let engine;
  try {
    engine = await getEngine();
  } catch (err) {
    return NextResponse.json(
      { error: 'The spatial engine did not start.', detail: String(err) },
      { status: 503 },
    );
  }

  // $1 is the drawn geometry; the filter's parameters are bound after it.
  const compiled = filter ? compileFilter(filter, 2) : null;
  const filterClause = compiled ? `AND ${compiled.where}` : '';
  const params: unknown[] = [wkt, ...(compiled?.params ?? [])];

  const started = Date.now();

  try {
    const [summary] = await engine.query<{
      drawn_m2: string;
      perimeter_m: string;
      centroid: string;
      valid: boolean;
    }>(
      `
      WITH drawn AS (SELECT ST_SetSRID(ST_GeomFromText($1), 4326) AS raw)
      SELECT
        ROUND(ST_Area(ST_MakeValid(raw)::geography)::numeric, 1)      AS drawn_m2,
        ROUND(ST_Perimeter(ST_MakeValid(raw)::geography)::numeric, 1) AS perimeter_m,
        ST_AsText(ST_Centroid(ST_MakeValid(raw)))                     AS centroid,
        ST_IsValid(raw)                                               AS valid
      FROM drawn
      `,
      [wkt],
    );

    const rows = await engine.query<Record<string, unknown>>(
      `
      WITH drawn AS (SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromText($1), 4326)) AS g)
      SELECT
        p.bbl,
        p.address,
        p.zonedist1,
        p.overlay1,
        p.spdist1,
        p.landuse,
        p.lotarea,
        p.bldgarea,
        p.numfloors,
        p.yearbuilt,
        p.builtfar,
        GREATEST(COALESCE(p.residfar,0), COALESCE(p.commfar,0), COALESCE(p.facilfar,0))
          - COALESCE(p.builtfar,0)                                            AS far_headroom,
        ROUND(ST_Area(p.geom::geography)::numeric, 1)                         AS lot_m2,
        ROUND(ST_Area(ST_Intersection(p.geom, d.g)::geography)::numeric, 1)   AS overlap_m2,
        ROUND((ST_Area(ST_Intersection(p.geom, d.g)::geography)
               / NULLIF(ST_Area(p.geom::geography), 0) * 100)::numeric, 1)    AS pct_covered,
        ST_Within(p.geom, d.g)                                                AS fully_inside
      FROM parcels p, drawn d
      WHERE ST_Intersects(p.geom, d.g)
        ${filterClause}
      ORDER BY overlap_m2 DESC
      LIMIT 512
      `,
      params,
    );

    const zoning = await engine.query<{ zonedist: string; overlap_m2: string }>(
      `
      WITH drawn AS (SELECT ST_MakeValid(ST_SetSRID(ST_GeomFromText($1), 4326)) AS g)
      SELECT
        z.zonedist,
        ROUND(ST_Area(ST_Intersection(z.geom, d.g)::geography)::numeric, 1) AS overlap_m2
      FROM zoning_districts z, drawn d
      WHERE ST_Intersects(z.geom, d.g)
      ORDER BY overlap_m2 DESC
      `,
      [wkt],
    );

    const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
    const totals = rows.reduce<{
      lotAreaSqFt: number;
      bldgAreaSqFt: number;
      overlapM2: number;
      fullyInside: number;
    }>(
      (acc, r) => {
        acc.lotAreaSqFt += num(r.lotarea);
        acc.bldgAreaSqFt += num(r.bldgarea);
        acc.overlapM2 += num(r.overlap_m2);
        if (r.fully_inside === true) acc.fullyInside += 1;
        return acc;
      },
      { lotAreaSqFt: 0, bldgAreaSqFt: 0, overlapM2: 0, fullyInside: 0 },
    );

    return NextResponse.json({
      drawn: {
        areaM2: Number(summary?.drawn_m2 ?? 0),
        perimeterM: Number(summary?.perimeter_m ?? 0),
        centroid: summary?.centroid ?? null,
        selfIntersecting: summary?.valid === false,
      },
      parcels: rows,
      zoning,
      totals: { ...totals, parcelCount: rows.length },
      provenance: {
        engine: engine.kind,
        postgis: engine.postgisVersion,
        srid: 4326,
        areaBasis: 'geography (WGS 84 spheroid), square metres',
        operations: ['ST_GeomFromText', 'ST_MakeValid', 'ST_Intersects', 'ST_Intersection', 'ST_Area', 'ST_Within'],
        elapsedMs: Date.now() - started,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'The spatial query failed.', detail: String(err) },
      { status: 500 },
    );
  }
}
