# Blue Line

A land-use analysis sheet for Midtown Manhattan. Draw a boundary over the print and get a
real measurement back: which tax lots it crosses, how much of each, what the zoning permits,
and how much development right is left unused.

The spatial work is genuine. A drawn ring is serialised to Well-Known Text, handed to
PostGIS, and intersected against real parcel geometry; areas are computed on the geography
type, so the figures are true square metres rather than square degrees. Nothing is
approximated in the browser to make a demo look good.

---

## What it does

**Draw → WKT → PostGIS.** Close a ring on the sheet and its measurement is lettered into the
margin the way a surveyor letters a computed area onto a plat. Every figure carries its
provenance: the operation, the SRID, the engine that produced it.

**Real parcels and zoning.** 512 Midtown tax lots and 23 zoning districts, pulled from the
New York City Department of City Planning's own ArcGIS services — MapPLUTO lot geometry
joined to zoning and land-use attributes, plus the NYZD district boundaries. Street
centrelines come from OpenStreetMap.

**Natural-language filtering that shows its work.** Type *"C6 lots with unused FAR over 10,
built before 1930"* and the sheet compiles it into a filter, prints the filter back in
readable clauses, and shows the exact SQL predicate underneath. When the model misreads you,
you can see precisely how.

**Unused FAR as a first-class field.** `far_headroom` — the highest permitted floor-area
ratio minus the built one — is the question a land-use analyst actually asks, so it is
queryable directly rather than left as arithmetic. It is what separates 1515 Broadway
(−12.2, overbuilt and non-conforming) from 1514 Broadway (+11.3, substantial unused
development right) on the same block.

---

## Running it

```bash
npm install
npm run dev
```

That is the whole setup. **No database to provision and no API key required** for the map,
the drawing, or any spatial measurement.

To enable the natural-language field, add one key to `.env.local`:

```bash
GEMINI_API_KEY=...        # or ANTHROPIC_API_KEY=...
```

Both are supported. Anthropic wins if both are present; `LLM_PROVIDER=gemini` forces one.
Without a key the query field refuses honestly rather than guessing — everything else works.

See [`.env.example`](.env.example) for the full set, including optional model overrides.

### Refreshing the data

```bash
npm run data     # re-pulls parcels, zoning, and streets
```

Both scripts are bounded by one bbox constant and widen to any area of the city.

---

## How it works

### The spatial engine

PostGIS 3.6 with GEOS and PROJ, running **in-process** as WebAssembly Postgres via
[PGlite](https://pglite.dev). The consequence worth stating plainly: this app performs real
`ST_Intersection` on real geometry with **zero external services**, so a deployed link cannot
break because a free-tier database went to sleep.

Setting `DATABASE_URL` points the identical SQL at a Postgres server instead — Supabase, or
anything else with PostGIS. Not a fallback path or a second implementation: the same schema,
the same queries, one connection string apart.

```
lib/schema.ts   schema + seeds, engine-agnostic
lib/db.ts       one engine per process, PGlite or Postgres
```

Cold start is around 7–9 seconds while WASM Postgres boots and seeds. The sheet warms it on
load, before anyone draws anything, and the diazo exposure state makes the wait legible
rather than mysterious.

### The AI layer

The model never writes SQL and never sees the database. It is given exactly one tool, forced,
and its only job is to fill a strict schema:

```
phrase → forced tool call → zod validation → parameterised SQL (column whitelist) → PostGIS
```

Free-form SQL generation is never attempted, so there is no injection surface to defend.
The validated filter object is also what makes the interface honest: because a real object
exists, it can be rendered in the analyst's own words and corrected by hand.

```
lib/filters.ts  schema, compiler, readable rendering
lib/model.ts    Claude and Gemini behind one call
```

One JSON Schema serves both providers — the clause union uses `anyOf`, which Claude and
Gemini both support natively.

### Layer delivery

Citywide MapPLUTO is roughly 850,000 lots, which cannot ship to a browser. The extract is
bounded on purpose: one dense, legible district proves the pipeline. Rendering reads the
committed extract so drawing the sheet never waits on a database cold start; **every number
comes from PostGIS and nowhere else.**

### The interface

A cyanotype sheet rather than a dashboard. Prussian ground, white linework, one ochre mark
for the drawn boundary. Dark is a property of the material — a blue-line print is blue —
rather than a mode toggle.

Zoning classes carry the colours NYC's own zoning maps use, so the vocabulary is already
familiar, and class is never signalled by hue alone: each legend swatch also carries a hatch
pattern and every row is named in words.

Type is [B612](https://b612-font.com), the family drawn for aircraft cockpit displays — a
face built to be read off a screen when the number matters.

There is no basemap tile provider. Street centrelines are drawn from OSM geometry, and
street names are set as HTML in the sheet's own type rather than a generic map glyph stack.

---

## Stack

Next.js 15 · React 19 · TypeScript · MapLibre GL · PGlite + PostGIS · zod · Gemini or Claude

Deploys to Vercel as-is. Five serverless routes, ~109 kB first load.

---

## Data & licensing

| Layer | Source | Licence |
|---|---|---|
| Tax lots, zoning & land use | [NYC Dept. of City Planning](https://www.nyc.gov/site/planning/data-maps/open-data.page) — MapPLUTO, NYZD | NYC Open Data terms |
| Street centrelines | [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, via Overpass | ODbL 1.0 |

Attribution for both is rendered on the sheet's revision strip, as ODbL requires.

All spatial data is real and unmodified. None of it is synthesised — a fabricated parcel
boundary would defeat the entire point of the project.

---

## Honest limitations

- **Bounded to one district.** Times Square through Bryant Park. The pipeline is the
  deliverable; the extent is a deliberate constraint, not a limit of the approach.
- **Share links carry geometry in the URL** rather than a database token. `PRODUCT.md`
  specifies persisted anonymous analyses, and this deviates from it on purpose: a portfolio
  link has to still resolve in a year, and the link is a more durable record than a database
  that can be paused. Reasoning is in [`lib/share.ts`](lib/share.ts).
- **Drawing is pointer-only.** There is no keyboard path to a spatial query. Stated here
  rather than left for someone to discover.
- **First request is slow** while WASM Postgres boots. Warm requests measure in single-digit
  to low-hundreds of milliseconds.
- **Two transitive npm advisories** in `postcss`, inside Next's own build chain.
  `npm audit fix --force` downgrades Next, so they are left in place knowingly.

---

## Project documents

`BRIEF.md` scope and constraints · `PRODUCT.md` product truth · `DESIGN.md` the visual
system, recorded from the built world
