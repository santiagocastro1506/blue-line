/**
 * The schema is written once and runs unchanged on both engines: PGlite's WASM
 * Postgres in-process, or a real Postgres+PostGIS server (Supabase) when
 * DATABASE_URL is set. Nothing here is engine-specific, which is the point —
 * the spatial work is the same spatial work either way.
 */

export const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS parcels (
  bbl         text PRIMARY KEY,
  address     text,
  owner       text,
  bldgclass   text,
  landuse     text,
  zonedist1   text,
  zonedist2   text,
  overlay1    text,
  spdist1     text,
  lotarea     numeric,
  bldgarea    numeric,
  comarea     numeric,
  resarea     numeric,
  officearea  numeric,
  retailarea  numeric,
  numfloors   numeric,
  numbldgs    integer,
  unitsres    integer,
  unitstotal  integer,
  yearbuilt   integer,
  yearalter1  integer,
  builtfar    numeric,
  residfar    numeric,
  commfar     numeric,
  facilfar    numeric,
  lotfront    numeric,
  lotdepth    numeric,
  borough     text,
  block       integer,
  lot         integer,
  geom        geometry(MultiPolygon, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS zoning_districts (
  id       serial PRIMARY KEY,
  zonedist text NOT NULL,
  geom     geometry(MultiPolygon, 4326) NOT NULL
);

CREATE TABLE IF NOT EXISTS streets (
  osm_id  bigint PRIMARY KEY,
  name    text,
  highway text,
  class   text,
  geom    geometry(LineString, 4326) NOT NULL
);
`;

/**
 * Indexes run separately: PGlite is happier with one statement per exec call
 * than with a script that mixes DDL kinds, and a failure here should not take
 * the table creation down with it.
 */
export const INDEX_SQL = [
  `CREATE INDEX IF NOT EXISTS parcels_geom_idx ON parcels USING GIST (geom)`,
  `CREATE INDEX IF NOT EXISTS parcels_zone_idx ON parcels (zonedist1)`,
  `CREATE INDEX IF NOT EXISTS parcels_landuse_idx ON parcels (landuse)`,
  `CREATE INDEX IF NOT EXISTS zoning_geom_idx ON zoning_districts USING GIST (geom)`,
  `CREATE INDEX IF NOT EXISTS streets_geom_idx ON streets USING GIST (geom)`,
];

/**
 * Seeds unpack a whole FeatureCollection as one jsonb parameter rather than one
 * statement per row: 512 lots is 512 round trips otherwise, which is the
 * difference between a cold start you can live with and one you cannot.
 */
export const SEED_PARCELS_SQL = `
INSERT INTO parcels (
  bbl, address, owner, bldgclass, landuse,
  zonedist1, zonedist2, overlay1, spdist1,
  lotarea, bldgarea, comarea, resarea, officearea, retailarea,
  numfloors, numbldgs, unitsres, unitstotal,
  yearbuilt, yearalter1,
  builtfar, residfar, commfar, facilfar,
  lotfront, lotdepth, borough, block, lot, geom
)
SELECT
  p->>'bbl', p->>'address', p->>'owner', p->>'bldgclass', p->>'landuse',
  p->>'zonedist1', p->>'zonedist2', p->>'overlay1', p->>'spdist1',
  (p->>'lotarea')::numeric, (p->>'bldgarea')::numeric, (p->>'comarea')::numeric,
  (p->>'resarea')::numeric, (p->>'officearea')::numeric, (p->>'retailarea')::numeric,
  (p->>'numfloors')::numeric, (p->>'numbldgs')::integer,
  (p->>'unitsres')::integer, (p->>'unitstotal')::integer,
  (p->>'yearbuilt')::integer, (p->>'yearalter1')::integer,
  (p->>'builtfar')::numeric, (p->>'residfar')::numeric,
  (p->>'commfar')::numeric, (p->>'facilfar')::numeric,
  (p->>'lotfront')::numeric, (p->>'lotdepth')::numeric,
  p->>'borough', (p->>'block')::integer, (p->>'lot')::integer,
  ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326))
FROM jsonb_array_elements($1::jsonb) AS f,
     LATERAL (SELECT f->'properties' AS p) AS q
WHERE f->>'geometry' IS NOT NULL
ON CONFLICT (bbl) DO NOTHING
`;

export const SEED_ZONING_SQL = `
INSERT INTO zoning_districts (zonedist, geom)
SELECT
  f->'properties'->>'zonedist',
  ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326))
FROM jsonb_array_elements($1::jsonb) AS f
WHERE f->>'geometry' IS NOT NULL
`;

export const SEED_STREETS_SQL = `
INSERT INTO streets (osm_id, name, highway, class, geom)
SELECT
  (f->'properties'->>'osm_id')::bigint,
  f->'properties'->>'name',
  f->'properties'->>'highway',
  f->'properties'->>'class',
  ST_SetSRID(ST_GeomFromGeoJSON(f->>'geometry'), 4326)
FROM jsonb_array_elements($1::jsonb) AS f
WHERE f->>'geometry' IS NOT NULL
ON CONFLICT (osm_id) DO NOTHING
`;
