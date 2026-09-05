import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  SCHEMA_SQL,
  INDEX_SQL,
  SEED_PARCELS_SQL,
  SEED_ZONING_SQL,
  SEED_STREETS_SQL,
} from './schema';

export type Row = Record<string, unknown>;

export type Engine = {
  /** Which Postgres is answering. Surfaced in the UI, because it is a real fact about the result. */
  kind: 'pglite' | 'postgres';
  postgisVersion: string;
  parcelCount: number;
  bootMs: number;
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
};

let enginePromise: Promise<Engine> | null = null;

/**
 * One engine per process, created once and reused across warm invocations.
 * PGlite pays roughly seven seconds to bring up WASM Postgres and PostGIS, so
 * paying it per request would be indefensible; paying it per cold start is
 * merely the cost of running a real database with no server behind it.
 */
export function getEngine(): Promise<Engine> {
  enginePromise ??= createEngine().catch((err) => {
    // A failed boot must not be cached, or one bad cold start poisons the
    // whole instance until it is recycled.
    enginePromise = null;
    throw err;
  });
  return enginePromise;
}

async function createEngine(): Promise<Engine> {
  const url = process.env.DATABASE_URL?.trim();
  return url ? createPostgresEngine(url) : createPgliteEngine();
}

/* ------------------------------------------------------------------ seed data */

type FeatureCollection = { features: unknown[] };

async function readExtract(file: string): Promise<unknown[]> {
  const full = path.join(process.cwd(), 'data', file);
  const raw = await readFile(full, 'utf8');
  const parsed = JSON.parse(raw) as FeatureCollection;
  return parsed.features ?? [];
}

async function seed(run: (sql: string, params: unknown[]) => Promise<unknown>) {
  const [parcels, zoning, streets] = await Promise.all([
    readExtract('midtown-parcels.geojson'),
    readExtract('midtown-zoning.geojson'),
    readExtract('midtown-streets.geojson'),
  ]);

  await run(SEED_PARCELS_SQL, [JSON.stringify(parcels)]);
  await run(SEED_ZONING_SQL, [JSON.stringify(zoning)]);
  await run(SEED_STREETS_SQL, [JSON.stringify(streets)]);
}

/* ---------------------------------------------------------------------- PGlite */

async function createPgliteEngine(): Promise<Engine> {
  const started = Date.now();

  const { PGlite } = await import('@electric-sql/pglite');
  const { postgis } = await import('@electric-sql/pglite-postgis');

  const db = await PGlite.create({ extensions: { postgis } });

  const query = async <T>(text: string, params: unknown[] = []): Promise<T[]> => {
    const res = await db.query<T>(text, params as never[]);
    return res.rows;
  };

  await db.exec(SCHEMA_SQL);
  for (const idx of INDEX_SQL) await db.exec(idx);

  await seed((sql, params) => query(sql, params));

  const [{ v }] = await query<{ v: string }>(`SELECT postgis_version() AS v`);
  const [{ n }] = await query<{ n: string }>(`SELECT count(*)::text AS n FROM parcels`);

  return {
    kind: 'pglite',
    postgisVersion: String(v).split(' ')[0],
    parcelCount: Number(n),
    bootMs: Date.now() - started,
    query,
  };
}

/* -------------------------------------------------------------------- Postgres */

async function createPostgresEngine(url: string): Promise<Engine> {
  const started = Date.now();

  const { default: postgres } = await import('postgres');
  const sql = postgres(url, {
    max: 1,
    idle_timeout: 20,
    prepare: false, // Supabase's pooler does not support prepared statements.
  });

  const query = async <T>(text: string, params: unknown[] = []): Promise<T[]> =>
    (await sql.unsafe(text, params as never[])) as unknown as T[];

  await query(SCHEMA_SQL);
  for (const idx of INDEX_SQL) await query(idx);

  const [{ n: before }] = await query<{ n: string }>(`SELECT count(*)::text AS n FROM parcels`);
  if (Number(before) === 0) await seed((s, p) => query(s, p));

  const [{ v }] = await query<{ v: string }>(`SELECT postgis_version() AS v`);
  const [{ n }] = await query<{ n: string }>(`SELECT count(*)::text AS n FROM parcels`);

  return {
    kind: 'postgres',
    postgisVersion: String(v).split(' ')[0],
    parcelCount: Number(n),
    bootMs: Date.now() - started,
    query,
  };
}
