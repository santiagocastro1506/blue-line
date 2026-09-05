# Spatial Intelligence Platform

A GIS + AI SaaS web application, built as a portfolio piece to demonstrate advanced
handling of interactive geospatial data. Next.js + React on the front, Supabase with
PostGIS behind it, AI-powered natural-language search over the map, deployed on Vercel.
Greenfield — no existing site, no prior brand.

## Project authorities

These files outrank any improvised judgment. Read them before touching UI:

| File | Authority over | Written by |
|---|---|---|
| `BRIEF.md` | Client, scope, audience, deliverables, constraints | Human / workspace setup |
| `PRODUCT.md` | Product truth: users, purpose, stack, capabilities | `/impeccable init` — **authoritative** as of 2026-09-05 |
| `DESIGN.md` | Visual system: tokens, type, palette, components, motion | `/impeccable` new-work flow — currently a **stub** |
| `CONTENT.md` | Not created — greenfield project, no site to inventory | n/a |

If something contradicts `DESIGN.md`, `DESIGN.md` wins. `DESIGN.md` does not exist yet in
any real sense, so **UI work right now would be inventing its own criteria**. `/impeccable init`
is done; the next step is the `/impeccable` new-work flow, which writes `DESIGN.md`.

## Which skill to use when

- **Redesign, shape, critique, audit, or polish an interface** → `impeccable`. It is the
  engine. Subcommands: `shape` (plan before coding), `document` (extract DESIGN.md from
  code), `critique` (UX review), `audit` (a11y, perf, responsive), `polish`, `animate`,
  `typeset`, `colorize`, `extract`.
- **Decide visual direction before writing CSS** → `frontend-design` (Anthropic). It sets
  *what* palette, type, and layout to choose and why. See below.
- **Aesthetic direction, avoiding the generic AI look** → `design-taste-frontend`,
  `high-end-visual-design`, or a specific style skill (`minimalist-ui`,
  `industrial-brutalist-ui`).
- **Look up palettes, type pairings, UX guidelines, motion presets, chart types** →
  `ui-ux-pro-max`.
- **Interaction and motion detail** → `emil-design-eng`, `animate`,
  `animation-vocabulary`, `improve-animations`.
- **Brand identity and guideline boards** → `brandkit`.
- **Charts, dashboards, any data visualization** → the `dataviz` skill, before writing the
  first line of chart code. This project is data-heavy; it will come up.

### When to use `frontend-design` specifically

It is the **judgment** skill, not the execution one. It generates no code and queries no
database: it tells you how to make the design decision and how to know when you made it
badly. Use it when:

- **A new interface starts** and the visual character is undecided. Before the first line
  of CSS, not after. That is exactly where this project sits.
- **Choosing palette and typography** without falling into defaults. Two-pass process:
  a compact token plan (4–6 named hexes, 2+ families by role, layout concept, one signature
  element), then self-critique against the brief, then code.
- **The design came out bland or "AI-made"** and you cannot say why. It carries the
  calibrator: the three looks AI defaults into — cream #F4F1EA with high-contrast serif and
  terracotta accent; near-black with an acid green or vermilion accent; broadsheet with hair
  rules, zero radius, dense columns. **Note for this project:** the requested dark direction
  is adjacent to the second one. The brief asks for dark with a stated functional reason
  (data layers must pop), so the brief wins — but reach it deliberately, and let the accent
  strategy answer to the data-legibility requirement rather than to taste.
- **Writing interface copy** — labels, buttons, empty states, errors.
- **Deciding where to spend boldness.** One memorable thing; everything else quiet.

**When NOT to:** once `DESIGN.md` exists, the direction is settled and the document rules —
`frontend-design` does not override it. To execute a defined system use `impeccable`; for a
specific type pairing use `ui-ux-pro-max`.

**How they combine:** `frontend-design` decides direction → `impeccable` formalizes it into
`DESIGN.md` and executes → `ui-ux-pro-max` supplies concrete data → `emil-design-eng` and
`animate` polish the interaction.

## Stack

Fixed by the owner — see `PRODUCT.md` for the full table.

- **Framework:** Next.js + React
- **Database:** Supabase (PostgreSQL + PostGIS)
- **AI:** model integration for NLP, compiling to a validated filter schema via tool
  calling — provider undecided; needs reliable strict-schema tool calling
- **Base map:** OpenStreetMap
- **Map rendering library:** MapLibre GL JS
- **Styling / build:** undecided — falls out of `DESIGN.md`
- **Deploy:** Vercel

## How to run the project

Not scaffolded yet. No `package.json` exists. The dev command will be added once the
Next.js app is initialized — which happens after `DESIGN.md`, not before.

## Rules that are not cosmetic

- **Spatial computation happens in PostGIS.** Drawn geometry goes to WKT and to the
  database. Computing a result client-side to make a demo look good defeats the entire
  premise of the project.
- **The AI never generates SQL.** It emits a validated structured filter object via tool
  calling; the app compiles that into parameterized PostGIS queries. The filter is shown to
  the user so a misread query is visible and correctable.
- **No auth wall.** Analyses persist anonymously behind an unguessable token under RLS.
  There is no login between a visitor and the product.
- **~850k parcel polygons cannot ship to the browser.** Layer delivery is vector tiles or
  bbox-scoped responses — an open architectural decision, not an implementation detail.
- **Spatial data must be real.** Parcel and zoning data comes from actual open sources.
  Fabricated boundaries are not acceptable, even as placeholders — if data is missing, mark
  it missing.
- **OpenStreetMap attribution is legally required** (ODbL) and must be visible on the map.
- **Vercel's serverless model is a design constraint, not a deployment detail.** Function
  execution limits mean heavy spatial work belongs in the database and large GeoJSON
  ingestion needs a strategy that survives them.
- **WCAG AA on text and interactive elements** is a self-imposed floor. A dark, dense,
  data-heavy UI makes contrast failures easy and invisible.
- **Secrets stay in environment variables.** Supabase service keys and AI provider keys
  never reach the client bundle. The anon key and RLS policies are the client-side story.

## What not to touch

- `.claude/skills/` — vendored design skill packages. Do not edit them in place; they are
  versioned with the repo so the project stays reproducible. Refresh them through the
  installer, not by hand.
- `skills-lock.json` — managed by the skills installer.
- `DESIGN.md` — do not hand-write it. `impeccable` owns it. Provisional assumptions go in
  its designated section at the bottom, nowhere else.
