import { NextResponse } from 'next/server';

import { getEngine } from '@/lib/db';
import { resolveProvider } from '@/lib/model';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Boots the spatial engine and reports what is actually answering.
 *
 * The sheet calls this on load, before anyone draws anything, so the WASM
 * Postgres cold start happens while the reader is still looking at the first
 * viewport rather than while they are waiting on their first measurement.
 */
export async function GET() {
  const started = Date.now();

  try {
    const engine = await getEngine();

    // The legend's figures come from the database, not from a hand-kept list.
    const classes = await engine.query<{ cls: string; n: string }>(`
      SELECT
        CASE
          WHEN zonedist1 = 'PARK' THEN 'PARK'
          WHEN zonedist1 LIKE 'R%' THEN 'R'
          WHEN zonedist1 LIKE 'C%' THEN 'C'
          WHEN zonedist1 LIKE 'M%' THEN 'M'
          ELSE 'OTHER'
        END AS cls,
        count(*)::text AS n
      FROM parcels
      GROUP BY 1
      ORDER BY 1
    `);

    const districts = await engine.query<{ zonedist1: string; n: string }>(`
      SELECT zonedist1, count(*)::text AS n
      FROM parcels
      WHERE zonedist1 IS NOT NULL
      GROUP BY 1
      ORDER BY count(*) DESC
    `);

    return NextResponse.json({
      ready: true,
      engine: engine.kind,
      postgis: engine.postgisVersion,
      parcels: engine.parcelCount,
      bootMs: engine.bootMs,
      warmedInMs: Date.now() - started,
      modelConfigured: Boolean(resolveProvider()),
      modelProvider: resolveProvider(),
      classes: classes.map((c) => ({ cls: c.cls, count: Number(c.n) })),
      districts: districts.map((d) => ({ district: d.zonedist1, count: Number(d.n) })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ready: false,
        error: 'The spatial engine did not start.',
        detail: err instanceof Error ? err.message : String(err),
        modelConfigured: Boolean(resolveProvider()),
      },
      { status: 503 },
    );
  }
}
