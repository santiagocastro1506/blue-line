---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

## Scope

The analytical dashboard — the single surface that is the product. Visitor mode: **Operate**.

## Audience and job

A land-use analyst reading NYC parcels and zoning; and a technical evaluator deciding, in
two or three minutes, whether the spatial work is real. Job: constrain an area, draw a
boundary against it, read the measurement, send it to someone.

## Action and content

Primary actions: the natural-language query field, and the draw tool. Content is real —
MapPLUTO tax lots and DCP zoning districts over OpenStreetMap. The visitor lands inside a
completed analysis, not an empty map.

## Constraints

Teaching is inline only: example query as placeholder, instructive empty states, a legend
that reads as documentation. No overlay, no tour, no login. Hard negative, stated by the
owner: the generic dark SaaS dashboard.

## Memorable moment and signature interaction

**Closing a boundary letters its measurement into the sheet's margin.** The drawn line
prints onto the sheet rather than appearing on it; when the ring closes, the figure is
lettered into the margin schedule the way a surveyor letters a computed area into a plat,
with its provenance beneath it.

**Motion grammar:** exposure, not transition. Linework develops by stroke draw-on; nothing
fades, slides, or scales. One grammar, orchestrated once — and it holds under
`prefers-reduced-motion` by rendering developed.

## Direction contract

**THESIS:** A live diazo sheet, not a dark dashboard: the city as white linework on Prussian
ground. Refuses the floating-panel map.

**OWN-WORLD:** Drenched Prussian blue owns every surface; hue outside it is reserved for data
classification. B612 and B612 Mono for instrument text and figures, Archivo Narrow for
title-block furniture.

**STORY:** The visitor sees a measurement already lettered on the sheet, believes it was
computed rather than asserted, redraws the boundary, watches a new figure develop.

**FIRST VIEWPORT:** Full-bleed sheet. Title-block strip on top carrying the query field;
legend register left; margin schedule right holding the reading and its provenance; revision
strip below with SRID and attribution.

**FORM:** Blue Line (cyanotype/diazo), candidate 1 of the ordered list, pick card; seed key
4032c4e7.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- AI provider and key — blocks the query field's compile step
- Supabase project and credentials — blocks every PostGIS call
- Vector tiles vs bbox-scoped GeoJSON for layer delivery
- MapPLUTO and DCP zoning not yet downloaded or inspected
