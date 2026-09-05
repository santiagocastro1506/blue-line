# Brief — Spatial Intelligence Platform

> Fields marked **[inferred]** were derived from the project request rather than
> confirmed. Fields marked **[open]** are unanswered and block nothing yet, but should
> be closed before build.

**Status:** confirmed — core decisions closed in the `/impeccable init` interview
**Date:** 2026-09-05
**Source:** kickoff message from the project owner, plus the `/impeccable init` interview
(2026-09-05). `PRODUCT.md` is the authoritative product record.

## Client

- **Organization:** Self-directed — portfolio piece
- **Contact:** Santiago (project owner / sole stakeholder)
- **Sector:** Geospatial software / SaaS — GIS + AI
- **Location / market:** **[open]** — target hiring market not stated. The *demo* covers
  New York City (confirmed).

## Current situation

- **Current site:** Does not exist. Greenfield project.
- **What is wrong with it:** N/A — nothing to replace. The real driver is that the
  portfolio needs a piece that proves *advanced* technical capability, not another CRUD
  app. Interactive geospatial data is the chosen proof.
- **What works and must be kept:** N/A

## Objective

- **What this must achieve:** Demonstrate advanced technical capability in handling
  interactive geospatial data, in an application architected for deployment on Vercel.
- **What success looks like:** A reviewer (recruiter, technical lead, or prospective
  client) opens the deployed app, draws a polygon on a map, gets a real spatial
  calculation back, and filters layers with a plain-language query — without reading
  documentation first. The technical depth is legible from the interaction alone.

## Audience

- **Primary user:** a technical evaluator assessing the owner's engineering ability.
  Arrives from a portfolio link, gives the app two to three minutes, and is looking for
  evidence of real systems work rather than a template. **Confirmed.**
- **The user the product is designed for:** a land-use analyst — urban planning research,
  real-estate diligence, zoning analysis, site selection. Where the two conflict, the
  analyst wins. **Confirmed.**
- **What they need to believe to act:** That the geospatial handling is genuine —
  real PostGIS geometry operations, real GeoJSON ingestion — and not a static map image
  with decoration on top.

## Scope

**In:**
- Dynamic map rendering with OpenStreetMap as the base layer
- Ingestion and visualization of complex spatial data (GeoJSON: parcel boundaries, zoning)
- Interactive dashboard with geometry drawing tools, translating drawn shapes to
  Well-Known Text (WKT) for spatial calculations
- AI-powered natural-language search that filters what the map shows
- Deployment to Vercel

**Also in (decided at init):**
- Anonymous persistent analyses — drawn geometry and computed results save to Postgres
  behind an unguessable token under row-level security, shareable by link

**Out:**
- User accounts, login, signup — no auth wall between a visitor and the product
- Multi-tenant billing or subscription plans
- Mobile-native apps and offline mode
- Raster / satellite imagery analysis
- Free-form model-generated SQL — the search compiles to a validated filter schema instead

## Deliverables

| Deliverable | Description | Date |
|---|---|---|
| Project documents | `BRIEF.md`, `PRODUCT.md`, `DESIGN.md` | 2026-09-05 — this setup |
| `PRODUCT.md` (authoritative) | Product truth via `/impeccable init` | Done 2026-09-05 |
| `DESIGN.md` (authoritative) | Visual system via `/impeccable` new-work flow | **[open]** |
| Deployed application | Live on Vercel | **[open]** |

## Constraints

- **Brand:** No pre-existing brand commitments. Visual identity is open and will be
  decided by the `impeccable` new-work flow — see the direction note in `DESIGN.md`.
- **Technical (fixed by the owner, non-negotiable):**
  - Frontend: Next.js + React
  - Database: Supabase with the PostGIS extension
  - AI: model integration for natural-language processing, compiling to a **validated
    structured filter schema** via tool calling — never free-form generated SQL
  - Deploy target: Vercel — architecture must respect its serverless execution model
  - Base map data: OpenStreetMap
  - Map rendering: **MapLibre GL JS** (delegated decision — rationale in `PRODUCT.md`)
- **Legal / compliance:** OpenStreetMap data carries ODbL attribution requirements —
  attribution must be visible on the map. Any AI provider's usage terms apply. Accessibility
  is not externally mandated but a dark data-heavy UI makes contrast a real risk, so
  WCAG AA on text and interactive elements is a self-imposed floor.
- **Content:** All spatial datasets must be real or credibly sourced open data. Fabricated
  parcel or zoning data would undercut the entire premise of the piece.

## Available material

- **Brand assets:** None.
- **Content:** Region confirmed as **New York City**. Datasets identified but **not yet
  obtained or inspected**: NYC MapPLUTO (tax-lot geometry joined to zoning and land-use
  attributes) and the NYC DCP zoning district boundary layer, both NYC Open Data.
- **References given:** None supplied. Category references (professional analytical tools,
  data-heavy dark interfaces) will be gathered during the design flow.

## Open decisions

| Question | Who decides | Blocks |
|---|---|---|
| Which AI provider powers the search? | Owner | API route design, latency budget, cost. Requirement is reliable strict-schema tool calling; recommendation is Claude (`claude-sonnet-5`) |
| Vector tiles or bbox-scoped GeoJSON for layer delivery? | Owner + build | A real architectural fork — ~850k polygons cannot ship to the browser wholesale |
| Is there a fixed portfolio deadline? | Owner | Scope trimming |

**Closed at init (2026-09-05):** demo region (New York City) · map rendering library
(MapLibre GL JS) · NL search mechanism (validated filter schema, not generated SQL) ·
statefulness (anonymous persistent, shareable by link, no accounts) · the out-of-scope list.
