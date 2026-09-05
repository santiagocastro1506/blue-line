import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getEngine } from '@/lib/db';
import { compileFilter, describeFilter, filterSchema } from '@/lib/filters';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Runs a validated filter against the lots and returns which ones match. The
 * filter arrives as an object — from the model, or from the user editing the
 * model's output by hand — and is compiled to parameterised SQL here.
 */

const bodySchema = z.object({ filter: filterSchema });

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
      { error: 'A valid filter is required.', detail: parsed.error.issues },
      { status: 400 },
    );
  }

  const filter = parsed.data.filter;

  let engine;
  try {
    engine = await getEngine();
  } catch (err) {
    return NextResponse.json(
      { error: 'The spatial engine did not start.', detail: String(err) },
      { status: 503 },
    );
  }

  const compiled = compileFilter(filter, 1);
  const started = Date.now();

  try {
    const rows = await engine.query<Record<string, unknown>>(
      `
      SELECT
        bbl, address, zonedist1, overlay1, spdist1, landuse,
        lotarea, bldgarea, numfloors, yearbuilt, builtfar,
        GREATEST(COALESCE(residfar,0), COALESCE(commfar,0), COALESCE(facilfar,0))
          - COALESCE(builtfar,0) AS far_headroom
      FROM parcels
      WHERE ${compiled.where}
      ${compiled.orderBy}
      LIMIT ${compiled.limit}
      `,
      compiled.params,
    );

    const [{ total }] = await engine.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM parcels`,
    );

    return NextResponse.json({
      matches: rows,
      bbls: rows.map((r) => String(r.bbl)),
      readable: describeFilter(filter),
      counts: { matched: rows.length, universe: Number(total) },
      provenance: {
        engine: engine.kind,
        postgis: engine.postgisVersion,
        // The exact predicate, so a wrong answer is inspectable rather than mysterious.
        predicate: compiled.where,
        elapsedMs: Date.now() - started,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'The filter query failed.', detail: String(err) },
      { status: 500 },
    );
  }
}
