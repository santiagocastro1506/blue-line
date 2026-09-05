# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fixed by the owner:

- **Frontend:** Next.js + React
- **Database:** Supabase — PostgreSQL with the **PostGIS** extension
- **AI:** a model integration for natural-language processing. Provider undecided; the hard
  requirement is reliable **structured tool/function calling against a strict schema**,
  because the search compiles to a validated filter object rather than to free-form SQL.
  Default recommendation is Claude (`claude-sonnet-5`) unless the owner prefers otherwise.
- **Base map data:** OpenStreetMap
- **Deploy:** Vercel

**Delegated:** the map rendering library — **MapLibre GL JS**. Chosen over Leaflet because
Leaflet renders through the DOM and degrades badly at the polygon counts this dataset
implies; chosen over deck.gl because deck.gl is an overlay renderer and this product needs
the base map, the data layers, and the drawing surface to be one interactive system.
MapLibre also styles the base map through a style document, which is what makes a genuinely
dark, recessive base map possible rather than a filtered raster tile.

**Undecided:** which AI provider; whether spatial data reaches the client as vector tiles or
as bbox-scoped GeoJSON responses (see Capabilities and Constraints).

## Users

**Primary user — the evaluator.** A technical reviewer, hiring manager, or prospective
client who opens the deployed application cold from a portfolio link. They give it two to
three minutes and they interact before they read. Their job is to decide whether the person
who built this can handle real systems work. They are looking for evidence that the spatial
computation is genuine and not a map image with decoration on it.

**The user the product is designed *for* — the land-use analyst.** Someone doing urban
planning research, real-estate diligence, zoning analysis, or site selection. Today they
open desktop GIS software for questions the web ought to answer. They are comfortable with
dense information and impatient with ceremony; they know what a parcel, a zoning district,
and a floor-area ratio are, and they do not need those explained.

Both audiences are served by the same interface. Where they conflict, the analyst wins:
building a real tool is what convinces the evaluator, while building for the evaluator
directly produces a demo.

## Product Purpose

A web application that renders, ingests, and reasons over geospatial data, with natural
language as a first-class query interface.

It exists to answer land-use questions in a browser that currently require desktop GIS: what
is in this area, what does the zoning permit, how much of this parcel does my proposed
boundary cover, which lots match this description.

Success is a reviewer drawing a polygon on the map, receiving a real spatial calculation
back, filtering the layers with a plain-language query, and sharing the resulting analysis
by link — without reading documentation first, and without at any point suspecting the
computation was faked.

## Positioning

The spatial work is genuine and happens in PostGIS. User-drawn geometry is serialized to
Well-Known Text and handed to the database, which computes area, intersection, containment,
and proximity against real parcel geometry. Nothing is approximated client-side to make a
demonstration look good.

The natural-language layer is honest about its mechanism: it does not pretend to arbitrary
intelligence. It compiles a phrase into a validated, inspectable filter, and the user can
see and correct what it understood. A neighboring product can claim "AI-powered map search";
it cannot truthfully claim its filter is legible and correctable unless it built it that way.

The combination is what neither competitor category offers: web GIS demos are usually either
a styled base map with pins on it, or desktop-grade software ported badly to the browser.

## Operating Context

- Used in a desktop browser, in a single sitting, on one screen. The map holds most of the
  viewport and the surrounding controls compete with it for very little space.
- The evaluator arrives from a portfolio link with no account, no onboarding, and no
  patience. The first viewport has to be the product working, not an explanation of it.
- The analyst's real workflow is comparative: look at an area, constrain it, draw a boundary
  against it, read numbers off the result, then show someone else. The share step is part of
  the work, not an afterthought.
- Domain vocabulary is used as-is: parcel, tax lot, zoning district, land use, lot area,
  floor-area ratio, overlay. These are the terms the data ships with and the terms the
  analyst already uses.

## Capabilities and Constraints

### Capabilities

1. **Dynamic map rendering.** An interactive map with OpenStreetMap as the base layer — pan,
   zoom, layer control. The base map orients; it does not compete with the data.

2. **Spatial data ingestion and visualization.** Parcel boundaries and zoning designations
   ingested from GeoJSON and rendered as styled layers, with categorical styling by zoning
   class and land use.

3. **Draw → WKT → PostGIS calculation.** The user draws a geometry on the map. It is
   serialized to WKT and used as input to spatial calculations executed in PostGIS: area,
   intersection with parcels, containment, proximity. This round trip is the technical
   centerpiece of the product.

4. **Natural-language search over the map.** A phrase is compiled by the model into a
   **validated structured filter object** via tool calling against a strict schema. The
   application translates that object into parameterized PostGIS queries. Free-form SQL is
   never generated and never executed. The filter is shown to the user in readable form, so
   a misunderstanding is visible and correctable rather than silent.

5. **Anonymous persistent analyses.** Drawn geometry and its computed results persist to
   Postgres and receive a shareable link. There is no login wall between a visitor and the
   product. Access is governed by an unguessable token under row-level security, not by user
   accounts.

### Data

- **Region: New York City.** Confirmed.
- **Parcels: MapPLUTO**, published by the NYC Department of City Planning — tax-lot geometry
  joined to zoning and land-use attributes (zoning districts and overlays, land use
  category, lot area, built and permitted floor-area ratios, year built, number of floors).
  On the order of 850,000 tax lots citywide.
- **Zoning districts:** the NYC DCP zoning district boundary layer, a polygon dataset
  separate from the lot geometry.
- Both are open data under NYC Open Data terms. Real data only — see Evidence on Hand.

### Constraints

- **Spatial computation happens in PostGIS.** Computing a result client-side to make a demo
  look good defeats the entire premise of the project.
- **The dataset cannot be shipped to the browser.** Hundreds of thousands of polygons rule
  out loading GeoJSON wholesale. Delivery is either server-generated vector tiles or
  bbox-scoped GeoJSON responses; this is undecided and is a real architectural fork, not a
  detail.
- **Vercel's serverless execution model is a design constraint.** Function time and payload
  limits mean heavy spatial work belongs in the database, and bulk GeoJSON ingestion needs a
  path that does not run inside a request.
- **No fabricated spatial data.** If data is missing, it is marked missing. Invented parcel
  or zoning boundaries would destroy the credibility the project exists to establish.
- **OpenStreetMap attribution is legally required** under ODbL and must be visible on the
  map. NYC Open Data attribution applies to the parcel and zoning layers.
- **Secrets stay server-side.** Supabase service keys and AI provider keys never enter the
  client bundle. The anon key plus row-level security is the client-side story.
- **Density is the design problem, not a flaw to reduce.** This is an analytical instrument.
  A great deal is on screen at once and the job is to make it legible, not to hide it.
- **AI failure is a first-class state.** A misread query is a normal outcome, and the
  interface must show what was understood and let the user fix it.

## Evidence on Hand

- **Real:** NYC MapPLUTO and the NYC DCP zoning district boundaries, both openly published
  and obtainable. OpenStreetMap base map tiles.
- **Not yet obtained:** the datasets have not been downloaded, inspected, or loaded. Nothing
  in this project has been verified against the actual files.
- **Does not exist and must not be invented:** users, customers, testimonials, usage numbers,
  case studies, performance benchmarks, press, pricing, or any claim of production
  deployment. This is a portfolio piece with no users. Any surface that would conventionally
  carry social proof must either omit it or state plainly what the project is.

## Product Principles

1. **The computation is real or the project is pointless.** Every spatial answer traces to a
   PostGIS operation on real geometry. This constrains the architecture, and it wins every
   argument against a shortcut that would look better faster.
2. **Show the machine's reasoning.** The natural-language layer earns trust by being
   inspectable — the user sees the filter it produced and can correct it. Opacity would be
   easier to build and would forfeit the product's actual claim.
3. **No wall between the visitor and the work.** No login, no onboarding, no explanation
   before the first interaction. The product introduces itself by working.
4. **Density served, not diluted.** The analyst wants everything visible at once. Legibility
   comes from hierarchy and typography, never from removing information.
5. **The map is the product; the interface is the frame.** Chrome recedes so the data can
   carry the color and the attention.

## Accessibility & Inclusion

WCAG 2.1 AA on text and interactive elements is a self-imposed floor. A dark, dense,
data-heavy interface makes contrast failures both easy to introduce and easy to miss.

Two product-specific requirements follow from the data:

- **Categorical layer color cannot be the only channel** distinguishing zoning classes. A
  meaningful share of users has some form of color-vision deficiency, and a zoning map that
  encodes its entire meaning in hue is unreadable to them. Pattern, label, or explicit legend
  interrogation must carry the same information.
- **Drawing is a pointer-driven interaction** with no natural keyboard equivalent. Either a
  non-pointer path to a spatial query exists, or the limitation is stated honestly rather
  than left for the user to discover.
