---
name: Blue Line
description: A live diazo sheet for Midtown land use — the city as white linework on Prussian ground.
colors:
  sheet-deep: "#071829"
  sheet: "#0b2239"
  line: "#dce9f2"
  line-soft: "#9cbad3"
  line-quiet: "#6d93b4"
  line-faint: "#3c6386"
  mark: "#e4b33c"
  mark-deep: "#b8862a"
  boundary-line: "#f0c250"
  selected-line: "#ffffff"
  zone-r: "#f0d264"
  zone-c: "#e8836b"
  zone-m: "#b08bd6"
  zone-park: "#6fbf73"
  zone-other: "#7fa8c9"
  danger: "#ff8a73"
  rule: "rgba(157, 189, 214, 0.22)"
  rule-strong: "rgba(157, 189, 214, 0.4)"
typography:
  display:
    fontFamily: "B612 Mono, ui-monospace, SF Mono, monospace"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.04em"
    fontFeature: "tnum 1"
  headline:
    fontFamily: "Archivo Narrow, B612, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.06em"
  title:
    fontFamily: "Archivo Narrow, B612, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.13em"
  body:
    fontFamily: "B612, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo Narrow, B612, sans-serif"
    fontSize: "9.5px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.1em"
  figure:
    fontFamily: "B612 Mono, ui-monospace, SF Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.01em"
    fontFeature: "tnum 1"
  provenance:
    fontFamily: "B612 Mono, ui-monospace, SF Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
    fontFeature: "tnum 1"
rounded:
  none: "0px"
spacing:
  unit: "4px"
  row: "5px"
  tight: "6px"
  control: "7px"
  section: "12px"
  gutter: "14px"
  edge: "16px"
components:
  title-block:
    backgroundColor: "{colors.sheet-deep}"
    textColor: "{colors.line}"
    height: "46px"
    padding: "6px 16px"
    rounded: "{rounded.none}"
  query-input:
    backgroundColor: "transparent"
    textColor: "{colors.line}"
    typography: "{typography.body}"
    padding: "0 16px"
    rounded: "{rounded.none}"
  query-input-focus:
    backgroundColor: "color-mix(in srgb, #e4b33c 7%, transparent)"
  query-submit:
    backgroundColor: "transparent"
    textColor: "{colors.line}"
    typography: "{typography.title}"
    padding: "0 18px"
    rounded: "{rounded.none}"
  query-submit-hover:
    backgroundColor: "color-mix(in srgb, #e4b33c 8%, transparent)"
    textColor: "{colors.mark}"
  query-submit-disabled:
    textColor: "{colors.line-faint}"
  tool:
    backgroundColor: "transparent"
    textColor: "{colors.line-quiet}"
    typography: "{typography.label}"
    padding: "7px 6px"
    rounded: "{rounded.none}"
  tool-hover:
    backgroundColor: "color-mix(in srgb, #dce9f2 6%, transparent)"
    textColor: "{colors.line}"
  tool-pressed:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.sheet-deep}"
  tool-disabled:
    textColor: "{colors.line-faint}"
  legend-row:
    backgroundColor: "transparent"
    textColor: "{colors.line-soft}"
    padding: "3.5px 0"
    height: "auto"
  legend-swatch:
    width: "15px"
    height: "11px"
    rounded: "{rounded.none}"
  clause:
    backgroundColor: "color-mix(in srgb, #dce9f2 4%, transparent)"
    textColor: "{colors.line-soft}"
    padding: "3px 7px"
    rounded: "{rounded.none}"
  schedule-header:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.line-quiet}"
    typography: "{typography.title}"
    padding: "5px 14px"
  schedule-row:
    backgroundColor: "transparent"
    textColor: "{colors.line-soft}"
    padding: "5px 14px"
  schedule-row-hover:
    backgroundColor: "color-mix(in srgb, #dce9f2 6%, transparent)"
  schedule-row-selected:
    backgroundColor: "color-mix(in srgb, #e4b33c 13%, transparent)"
    textColor: "{colors.line}"
  rail-left:
    backgroundColor: "{colors.sheet}"
    width: "232px"
    padding: "12px 14px"
    rounded: "{rounded.none}"
  rail-right:
    backgroundColor: "{colors.sheet}"
    width: "344px"
    padding: "12px 14px"
    rounded: "{rounded.none}"
  revision-strip:
    backgroundColor: "{colors.sheet-deep}"
    textColor: "{colors.line-quiet}"
    typography: "{typography.provenance}"
    height: "26px"
    padding: "5px 16px"
  map-hint:
    backgroundColor: "{colors.sheet-deep}"
    textColor: "{colors.mark}"
    typography: "{typography.label}"
    padding: "5px 12px"
    rounded: "{rounded.none}"
---

# Design System: Blue Line

## Overview

**Creative North Star: "The Diazo Sheet"**

This is a survey print, not a dashboard. The ground is Prussian blue because that is what a
diazo print is made of; the linework is unexposed paper showing through it. Every surface in
the product belongs to one sheet of paper — the title block across the top, the legend
register down the left, the margin schedule down the right, the revision strip along the
bottom, and the print itself running edge to edge behind all of them. Nothing floats. There
are no cards, no panels hovering in a gutter, no radius, no shadow. The rails are ruled
regions of the same sheet, separated from the print by a single hairline and nothing else.

The system's central discipline is that hue is a data channel, not decoration. Outside the
blue ground and its four strengths of ink, only two things are allowed colour: the analyst's
pencil mark (a single warm amber that means *you did this* — the drawn boundary, the matched
lots, the computed figure) and the five zoning classes, which use the hues NYC's own zoning
maps already use so the analyst does not have to re-learn a palette. Nothing else on the
sheet is coloured, and nothing coloured is decorative.

Density is served, not diluted. The type ramp runs from 9px to 44px in a very narrow band —
almost everything sits between 9px and 13px — and hierarchy comes from face, case, tracking
and colour strength rather than from size. Three faces carry three jobs and never trade:
B612 (drawn for cockpit displays) for instrument text, B612 Mono for every figure, Archivo
Narrow in condensed caps for title-block furniture. Motion is exposure: linework develops
across the plate by clip-path and clears. Nothing in this system fades, slides, or scales.

**Key Characteristics:**

- Prussian-blue ground on every surface; white linework, never white panels
- Zero border-radius, zero box-shadow, anywhere in the build
- Four ink strengths (`line` → `line-faint`) do the work shadows and fills would do elsewhere
- Amber is the analyst's mark; five zoning hues are the data; nothing else is coloured
- Every figure set in B612 Mono with tabular numerals
- Motion is clip-path exposure only, ~620ms, and renders developed under reduced motion

## Colors

A drenched Prussian-blue world with four strengths of paper-white ink laid on it, one warm
amber that means *the analyst's own mark*, and five categorical hues borrowed from NYC's
zoning maps. Every colour in the build is either the sheet, the ink on it, or a zoning class.

### Primary

- **Surveyor's Amber** (`{colors.mark}`): the one warm thing on the sheet, and it means
  authorship. It is the drawn boundary's ink, the fill of matched lots (`fill-opacity` 0.3),
  the drawing vertices' stroke, the lettered measurement in the margin, the caret, the focus
  ring, the pressed state of a tool, and the text-selection background. It appears nowhere
  that the analyst did not cause. 8.30:1 on the sheet ground.
- **Amber Shadow** (`{colors.mark-deep}`): the unit suffix beside the big figure (`m²`), and
  only there. It is the amber stepped back so the number reads as the number and the unit as
  a footnote. 4.98:1 — exactly at the AA floor, which is why it is never used below 13px.
- **Struck Amber** (`{colors.boundary-line}`): the closed boundary's dashed outline
  (`line-dasharray [4, 2]`, width 2.6), one step brighter than the fill so the line survives
  over lit zoning.

### Secondary — the zoning classes

Categorical only. These five hues never appear in chrome, type, or state; they appear on the
print, in the legend swatches, and in the district readout, and nowhere else.

- **Zoning Yellow — Residential** (`{colors.zone-r}`): map fill at 0.18 opacity, diagonal hatch.
- **Zoning Coral — Commercial** (`{colors.zone-c}`): map fill at 0.13, vertical hatch at 0.3
  alpha — the lowest of the five, because commercial is the ground class covering 364 of 512
  lots and a hatch at parity would flood the print.
- **Zoning Violet — Manufacturing** (`{colors.zone-m}`): map fill at 0.13, cross hatch.
- **Zoning Green — Park** (`{colors.zone-park}`): map fill at 0.15, dot hatch.
- **Zoning Slate — Unclassified** (`{colors.zone-other}`): map fill at 0.06, horizontal hatch.
  Deliberately the weakest and the closest to the ink family: an unclassified lot should not
  claim a class.

The zoning hexes are the normative values above; the build restates them as literals in three
places (`:root` custom properties, `CLASS_META` in the legend, and `ZONE_COLOR` /
`hatchImage()` on the map) and all three agree. If one changes, all three change.

### Tertiary

- **Alarm Coral** (`{colors.danger}`): negative FAR headroom in the schedule, the destructive
  hover on a filter clause's dismiss control, and warning notes (`.note-warn`). 7.02:1.
- **Selected White** (`{colors.selected-line}`): the 2.2px outline on the lot picked in the
  schedule or on the print. Pure white is reserved for this one job — it is the only value on
  the sheet brighter than the ink, which is what makes selection unmistakable over any class.

### Neutral

- **Plate Shadow** (`{colors.sheet-deep}`): the page ground, the title block, the revision
  strip, the scrollbar track, the map hint's fill, and the vertex centres. The recessed
  register of the sheet.
- **Prussian Sheet** (`{colors.sheet}`): the sheet proper — the rails, the sticky schedule
  header, and the map's `background` layer. The map ground and the rail ground are literally
  the same value, which is what makes the rails read as ruled regions of one print rather
  than as chrome beside a map.
- **Unexposed Paper** (`{colors.line}`): body text, the sheet title, addresses, selected-row
  text, and the parcel linework on the print (0.65 line opacity, 0.045 fill). 13.04:1.
- **Soft Ink** (`{colors.line-soft}`): legend rows, schedule cells, street labels, the north
  arrow's head, and the `<strong>` inside notes. The default reading weight for secondary
  text. 7.97:1.
- **Quiet Ink** (`{colors.line-quiet}`): block labels, table headers, provenance lines, the
  revision strip, counts, BBLs, the scale bar, and the trim's corner ticks. 4.98:1 — this is
  **the floor for any text on the sheet**.
- **Faint Ink** (`{colors.line-faint}`): 2.55:1. Fails AA as text and is therefore restricted
  to non-text and exempt roles only: scrollbar thumbs, the underline colour of revision-strip
  links, disabled-control labels, and street linework on the print.
- **Rule** / **Rule Strong** (`{colors.rule}`, `{colors.rule-strong}`): the two hairline
  weights. `rule` separates rows and sub-sections; `rule-strong` separates registers — rail
  from print, title block from body, reading from schedule.

### Named Rules

**The Two-Channel Rule.** Zoning class is never carried by hue alone. Every class carries a
hue *and* a hatch pattern *and* a word. On the print this is a `fill` layer plus a
`fill-pattern` layer at 0.34 opacity; in the legend it is an SVG pattern inside the swatch
plus the class name spelled out. Removing either channel is a defect, not a simplification.

**The Faint-Ink Rule.** `{colors.line-faint}` never renders text a sighted user must read.
It computes to 2.55:1 on the sheet and exists for rules, scrollbars, disabled controls, and
map linework. `{colors.line-quiet}` at 4.98:1 is the darkest ink any text may use.

**The Authored-Mark Rule.** Amber marks only what the analyst caused — the boundary they
drew, the lots their filter matched, the figure their boundary produced, the control they
pressed, the element they focused. It is never a brand accent, never a heading colour, and
never applied to something the system decided on its own.

## Typography

**Display Font:** B612 Mono (with `ui-monospace`, `SF Mono`, `monospace`)
**Body Font:** B612 (with `ui-sans-serif`, `system-ui`, `sans-serif`)
**Label/Block Font:** Archivo Narrow (with B612, `sans-serif`)

All three are self-hosted through `next/font/google` with `display: swap`, bound to
`--font-b612`, `--font-b612-mono`, `--font-archivo-narrow`, and consumed through three
semantic aliases — `--font-sheet`, `--font-figure`, `--font-block`. Components reference the
aliases, never the raw font variables.

**Character:** B612 was drawn for aircraft cockpit displays — a face built to be read off a
screen, at speed, when the number matters. On a sheet whose entire claim is a measurement you
can trust, it is the argument made typographically. Archivo Narrow's condensed caps do the
job engineering lettering does on a real drawing: naming registers without consuming the
sheet. The pairing is instrument, not editorial.

### Hierarchy

- **Display** (`{typography.display}`, B612 Mono 44px / 1.02, `-0.04em`, tabular, amber): the
  boundary measurement, and nothing else. Exactly one instance per sheet. Its unit suffix
  drops to 13px in `{colors.mark-deep}`.
- **Headline** (`{typography.headline}`, Archivo Narrow 15px / 700, `0.06em`, uppercase): the
  sheet's own name in the title block. One per document.
- **Title** (`{typography.title}`, Archivo Narrow 10px / 600, `0.13em`, uppercase,
  `{colors.line-quiet}`): the `.block-label` register captions — "Zoning class", "Boundary
  area", "Filter", "Districts under the boundary" — plus the filter submit. Table headers are
  the same role one step tighter (9px, `0.1em`).
- **Body** (`{typography.body}`, B612 13px / 1.45): the base. The query field runs one half-step
  up at 13.5px with `0.005em`; its placeholder is italic in `{colors.line-quiet}` and carries a
  real example query, which is the only teaching the sheet does. Notes run 11px / 1.5.
- **Label** (`{typography.label}`, Archivo Narrow 9.5px / 600, `0.1em`, uppercase): tool
  buttons, street labels on the print (`0.14em`, with a triple `text-shadow` in
  `{colors.sheet}` to knock back the linework beneath), the map hint (`0.12em`), the scale bar.
- **Figure** (`{typography.figure}`, B612 Mono, tabular, `-0.01em`): every number on the sheet.
  Applied by the `.figure` class or inherited by `.num` table cells, `.legend-count`, `.bbl`.
- **Provenance** (`{typography.provenance}`, B612 Mono 10px / 1.6, `{colors.line-quiet}`): the
  four-line trace under the measurement (sq ft, perimeter, lot counts, area basis, SRID,
  PostGIS version, elapsed ms), the filter's match count and predicate, and the revision strip.

### Named Rules

**The Tabular Figure Rule.** Every number on this sheet is set in B612 Mono with
`font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum" 1`. A column of
figures that does not align is a column that lies. This applies to counts in the legend, cells
in the schedule, the big reading, and every value in the provenance and revision lines.

**The Thin-Space Rule.** Large figures group their digits with a thin space, not a comma
(`si()` in the sheet component). In a tabular mono face a comma opens a gap wide enough to
read as two numbers, and survey and SI practice groups with space regardless.

**The Three-Faces Rule.** Three faces, three jobs, no crossover. Archivo Narrow letters
furniture (titles, register captions, tool labels, map furniture) and never sets prose. B612
Mono sets figures and provenance and never sets prose. B612 sets everything else and never
sets a figure.

## Layout

**The sheet is a three-row grid** — `grid-template-rows: auto 1fr auto` at `100dvh` — holding
the title block, the sheet body, and the revision strip. `body` is `overflow: hidden` on
desktop: the sheet is one printed page, and pages do not scroll.

**The print runs to all four edges of the body.** The map canvas is `position: absolute;
inset: 0`. The two rails are absolutely positioned over it at `z-index: 5`, filled with
`{colors.sheet}` and separated from the print by a single `rule-strong` hairline. This is the
refusal of the floating-panel map made structural: the rails do not sit *on* the map, they are
regions of the same sheet the map is printed on.

**Rail widths are tokens** (`--rail-l: 232px`, `--rail-r: 344px`) because three independent
systems have to agree on where the print aperture starts: the trim border insets to
`calc(var(--rail-r) + 10px)` and `calc(var(--rail-l) + 10px)`; the survey furniture anchors at
`calc(var(--rail-l) + 30px)`; and the map's `fitBounds` padding and street-label clipping use
matching pixel values in `framePadding()` (`left: 248 / right: 360` at full width,
`216 / 316` below 1100px, `24` all round below 860px). Change a rail width and all three follow.

**Spacing rhythm** is small and consistent: `12px 14px` for a rail section, `5px 14px` for a
table cell or schedule header, `14px 14px 12px` for the reading block, `16px` horizontal at the
sheet edges (title block, revision strip, query field). `--gutter: 14px` is the horizontal
constant inside the rails. Gaps run 6px (icon to label), 9px (swatch to name), 18px (north
arrow to scale bar), 20px (revision-strip fields).

**Breakpoints.**

- **≤ 1100px** — rails narrow to `--rail-l: 200px`, `--rail-r: 300px`. The layout is otherwise
  unchanged; the map's padding follows.
- **≤ 860px** — the sheet stops being a fixed page. `body` scrolls, the grid height goes
  `auto` with `min-height: 100dvh`, the body becomes a flex column, and the rails go
  `position: static; width: 100%` with `--rail-l`/`--rail-r` set to `0px` so the trim frames
  all four edges of the print. The print itself becomes `58dvh` / `min-height: 340px` at
  `order: 1`. The right rail is dissolved with **`display: contents`** so its children take
  their own places in the stack: the reading at `order: 2`, the left rail (tools and legend) at
  `order: 3`, the filter section at `order: 4`, the schedule at `order: 5`. The legend switches
  to a two-column grid so four classes take one line instead of four rows.

### Named Rules

**The One-Page Rule.** On desktop the sheet is exactly one viewport and does not scroll.
Overflow is solved inside a register — the rail scrolls, the schedule scrolls under a sticky
header, the revision strip scrolls horizontally — never by extending the page.

**The Measurement-First Rule.** Below 860px, demote the schedule, never the reading. The first
viewport must show a completed analysis, and the measurement *is* the analysis. `display:
contents` on the right rail exists solely to let the reading stay above the fold while the
40-odd row schedule falls to the bottom of the stack.

## Elevation & Depth

**This system has no elevation.** There is not one `box-shadow` in the build, and the only
`text-shadow` is a functional knockout behind street labels on the print. Nothing is lifted,
nothing is layered in z-space beyond the flat stacking the print requires (trim at `z-index:
2`, street labels at 3, survey furniture at 4, rails at 5, map hint at 6, title block and
revision strip at 10).

Depth is carried entirely by **ink strength and hairline rules**. Two ground values
(`{colors.sheet-deep}` recessed, `{colors.sheet}` the sheet face) and four ink strengths do
everything a shadow scale would do elsewhere: a register is separated by a `rule-strong`
hairline, a row by a `rule` hairline, an emphasis by moving one step up the ink ramp. Hover
and selection are tonal washes generated with `color-mix` at 4–13% — never a lift, never a
border change.

### Named Rules

**The No-Lift Rule.** Nothing on this sheet is raised. If an element needs to separate from
what is behind it, rule it with a hairline or step its ink; do not shadow it, do not tint its
background lighter than `{colors.sheet}`, and never introduce a blur, a glow, or a
`backdrop-filter`.

**The Wash Rule.** State is a tonal wash over the sheet, expressed as `color-mix(in srgb,
<ink or mark> N%, transparent)`. The established percentages are 4% (a resting filter clause),
6% (row and tool hover), 7% (focused query field), 8% (submit hover), 13% (selected schedule
row). Use one of these; do not invent a sixth.

## Shapes

**Every corner in this system is square.** There is no `border-radius` anywhere in the build
and no radius token beyond `{rounded.none}`. The only curves on the sheet are drawn geometry:
the map's drawing vertices (`circle-radius` 5 for the closing vertex, 3.2 for the rest), the
dots in the Park hatch, and the rounded stroke caps inside the icon set.

**Borders are always exactly 1px**, in one of the two rule values, with two exceptions that
are both deliberate marks rather than containers: the focus ring (1.5px solid
`{colors.mark}`, offset 2px) and the trim's corner ticks (11px L-shaped brackets in
`{colors.line-quiet}`, drawn with one-sided 1px borders).

**Geometry is drafted, not styled.** The icon set is authored in one language: a 16×16
viewBox, `stroke-width: 1.4`, `currentColor`, round caps and joins, no fills except deliberate
solid vertex dots. Six icons exist — draw, clear, share, close, alert, frame — and each is a
shape a surveyor's legend would carry. There is no icon library in the project and none should
be added.

### Named Rules

**The Square-Corner Rule.** Radius is zero. Panels, buttons, inputs, chips, swatches and
notes are all rectangles. A rounded corner on this sheet reads as a web widget pasted onto a
drawing.

**The One-Stroke Rule.** New icons are drawn at 16×16 with `stroke-width: 1.4`,
`stroke-linecap`/`stroke-linejoin: round`, `fill: none`, and `stroke: currentColor`, so they
inherit whatever ink strength their context sets. Never mix stroke weights inside the set, and
never introduce a glyph or emoji as an icon.

## Components

Everything here is flat, square, hairline-ruled, and inherits its colour from the ink ramp.
The character line for all of them is the same: *drafting furniture, not UI chrome*.

### Buttons

- **Shape:** square (`{rounded.none}`), no border of its own — separation comes from the rules
  of the container it sits in.
- **Tool** (`{components.tool}`): the four-up drawing controls (Draw / Frame / Clear / Share)
  in a 2×2 grid inside a `rule-strong` box, with `rule` hairlines between cells. Archivo Narrow
  9.5px caps at `0.1em`, `{colors.line-quiet}`, 12×12 icon, 6px gap.
- **Hover:** ink steps to `{colors.line}` over a 6% ink wash, `140ms ease-out` on colour and
  background only.
- **Pressed** (`aria-pressed="true"`): full amber fill with `{colors.sheet-deep}` text — the
  only inverted surface in the system, reserved for a tool that is actively armed.
- **Disabled:** `{colors.line-faint}`, `cursor: not-allowed`, no background change.
- **Filter submit** (`{components.query-submit}`): a full-height cell at the right end of the
  title block, separated by a `rule` hairline, resting in `{colors.line}`, hovering to amber
  over an 8% amber wash. Its label swaps to "Compiling" while the phrase is in flight.

### Chips

- **Filter clause** (`{components.clause}`): what the model understood, printed back so it can
  be corrected. A 1px `rule-strong` rectangle over a 4% ink wash, 10.5px, `{colors.line-soft}`,
  3px × 7px padding, laid out in a wrapping 5px-gap row.
- **State:** clauses are read-only; the last chip in the row is the Clear control, identically
  styled, carrying the 9×9 close icon. Its icon steps to `{colors.danger}` on hover — the
  destructive tint appears only on that one mark, never on the chip body.

### Cards / Containers

There are no cards. The container primitive is the **rail section** (`{components.rail-left}` /
`{components.rail-right}`): `12px 14px` of padding, closed by a bottom `rule` hairline, with
the last section in a rail dropping its rule. Sections carry a `.block-label` caption and stack
inside a `.rail-scroll` that owns the overflow (`flex: 1; min-height: 0`).

### Inputs / Fields

- **Query field** (`{components.query-input}`): borderless and transparent, filling the title
  block's remaining width at full height — it reads as the description field on a drawing, not
  as a search box. 13.5px, 16px horizontal padding.
- **Focus:** the default focus ring is suppressed in favour of a 7% amber wash across the whole
  field. The caret is amber globally (`caret-color`).
- **Placeholder:** italic `{colors.line-quiet}`, and it carries a real, runnable example query.
- **Disabled:** the field is disabled while a phrase is compiling.

### Navigation

There is no navigation. The product is one surface. The **revision strip**
(`{components.revision-strip}`) is the closest thing: a 26px-tall footer on
`{colors.sheet-deep}`, B612 Mono 10px in `{colors.line-quiet}`, carrying SRID, data
attribution, engine status and model provenance in a 20px-gapped row that scrolls horizontally
rather than wrapping. Links are underlined at 1px with a `{colors.line-faint}` underline and
2px offset; on hover both text and underline go amber.

### The Legend

The left rail's zoning register, and the system's accessibility keystone. Each row is a
button: a 15×11 swatch, the class name in words, and a right-aligned tabular count read from
the database. Toggled off, a row goes `{colors.line-quiet}` with a 1px line-through and
`aria-pressed="false"`, and the corresponding map layers are filtered out.

The swatch carries the class's hatch as an SVG `<pattern>` on a 4×4 tile in the class hue:
vertical (1px stroke) for Commercial, diagonal (1px) for Residential, cross (0.8px) for
Manufacturing, dots (r 0.9) for Park, and horizontal (1px) for Unclassified. On the print the
same five classes carry canvas `fill-pattern` tiles — 24px at `pixelRatio: 2`, 1.5px line
width — in the same five patterns, at per-class alpha: Commercial 0.3, Unclassified 0.5,
Residential and Manufacturing 0.6, Park 0.7.

**The legend's pattern and the print's pattern must stay identical, class for class.** The
legend is what teaches the encoding; a swatch showing a pattern the print does not use is not
a cosmetic mismatch but the second channel returning a wrong answer, and it fails hardest for
exactly the reader the second channel exists for. Commercial's lower alpha is a density
concession, not a pattern difference — it is the ground class at 364 of 512 lots, so its
texture covers nearly the whole print and only needs to register at the boundaries with other
classes.

### The Margin Reading

The signature component. A `.reading` block at the head of the right rail, closed by a
`rule-strong` hairline, holding a `.block-label` caption, the 44px amber figure with its
`{colors.mark-deep}` unit, and four lines of B612 Mono provenance beneath it — square feet,
perimeter, lots touched and lots wholly inside, area basis and SRID, and `ST_Intersection in
PostGIS <version> · <n> ms`. When a self-intersecting ring is repaired, a `.note-warn` line
says so. Its empty state is instructive prose, not a placeholder graphic; its loading state is
the exposure animation.

### The Print (map layers)

The map is styled as linework on the sheet ground, with `background-color` set to
`{colors.sheet}` so print and rail are one surface. Paint values, in draw order:

- **Zoning fill** — class hue at 0.18 (R) / 0.15 (PARK) / 0.13 (C, M) / 0.06 (OTHER).
- **Zoning hatch** — `fill-pattern` per class at `fill-opacity: 0.34`. Tiles are line-based
  only; a filled tile would flood the print and the sheet would stop being white linework on
  Prussian ground. Per-tile alphas: C 0.3, R 0.6, M 0.6, PARK 0.7, OTHER 0.5.
- **Zoning line** — class hue, 0.8px, 0.32 opacity.
- **Streets** — `{colors.line-faint}` at 0.9 opacity, width by class (arterial 2.2, secondary
  1.4, local 0.9, else 0.5); pedestrian ways filtered out entirely.
- **Parcels** — `{colors.line}` fill at 0.045 and line at 0.7px / 0.65 opacity. The parcels are
  the linework; everything else is under them.
- **Matched lots** — amber fill at 0.3 with a 1.3px amber line.
- **Selected lot** — `{colors.selected-line}` at 2.2px.
- **Boundary** — amber fill developing to 0.075, outlined in `{colors.boundary-line}` at 2.6px,
  `dasharray [4, 2]`.
- **Drawing in progress** — amber line at 1.6px, `dasharray [2, 1.4]`; vertices are
  `{colors.sheet}`-filled circles with a 1.6px amber stroke, the closing vertex at r5 and the
  rest at r3.2.

Rotation and pitch are disabled; zoom is clamped to 13.5–19; MapLibre's own controls and
attribution are hidden with `display: none !important` because the sheet draws its own.

### Sheet Furniture

Non-interactive drafting apparatus, all `pointer-events: none`:

- **Trim** — a 1px `{colors.rule}` frame inset 10px from the print aperture, with four 11px
  L-shaped corner ticks in `{colors.line-quiet}`. It is what tells you the print has a boundary
  and you are seeing all of it.
- **North arrow** — an 18×33 SVG: solid head in `{colors.line-soft}`, hollow tail stroked in
  `{colors.line-quiet}` at 1px, "N" lettered beneath in Archivo Narrow at 9px.
- **Scale bar** — a 7px-tall ruled bar in `{colors.line-quiet}` with four alternating cells
  (odd cells filled), sized to a round-number distance chosen from a fixed nice-number ladder
  (10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000 m) so it always reads in whole units, labelled
  `0 … <n> m` in tabular figures.
- **Map hint** — during drawing only: a 1px amber-outlined strip on `{colors.sheet-deep}`,
  centred 18px from the bottom of the print, `role="status"`, in amber Archivo Narrow caps.

### Motion

Two authored animations and four short state transitions. That is the entire motion system.

- **`letter-in`** (620ms, `cubic-bezier(0.16, 1, 0.3, 1)`, `both`): the signature. A closed
  boundary's figure is lettered into the margin left-to-right by `clip-path: inset(0 100% 0 0)`
  → `inset(0)`. Re-keyed on each new measurement. No fade — ink has either reached a point on
  the plate or it has not.
- **`expose`** (1.9s, `cubic-bezier(0.33, 0, 0.2, 1)`, infinite): the loading state. A 2px/6px
  repeating stripe field at 14% ink develops across the element and clears, again by clip-path.
  It is not a sweep: the band never travels as an object.
- **Boundary develop** (620ms, cubic ease-out, driven by `requestAnimationFrame`): the drawn
  polygon's `fill-opacity` rises 0 → 0.075. The line is drawn on; it does not fade in.
- **State transitions:** 140ms `ease-out` on tool and submit colour/background, 120ms on legend
  rows, 110ms on schedule rows. Colour and background only — never transform, never opacity on
  an element as a whole.
- **Reduced motion:** both keyframe animations are set to `none` (the boundary renders at its
  target opacity directly) and all transitions are clamped to `1ms !important`. The sheet
  renders already developed.

### Named Rules

**The Exposure Rule.** Motion in this system is exposure, not transition. The only permitted
mechanism for an element appearing is `clip-path` revealing it in place. Nothing fades, slides,
scales, bounces, or springs — and the reduced-motion path is always "already developed", never
a shorter version of the same movement.

**The Ruled-Register Rule.** A region of the sheet is defined by a hairline, a
`{colors.sheet}` ground, and a `.block-label` caption. It is never defined by a card, a radius,
a shadow, a tint, or a gap.

## Do's and Don'ts

### Do:

- **Do** put every new surface on `{colors.sheet}` or `{colors.sheet-deep}` and separate it
  with a 1px `{colors.rule}` or `{colors.rule-strong}` hairline.
- **Do** set every number in B612 Mono with `font-variant-numeric: tabular-nums`, and group
  large figures with a thin space rather than a comma.
- **Do** carry any categorical encoding in at least two channels — hue plus pattern plus the
  word — matching the hatch between legend swatch and map tile.
- **Do** keep text at `{colors.line-quiet}` (4.98:1) or stronger; drop to
  `{colors.line-faint}` only for rules, scrollbars, disabled controls, and map linework.
- **Do** express hover and selection as a `color-mix` wash at one of the established
  percentages (4 / 6 / 7 / 8 / 13%).
- **Do** letter new figures in with `clip-path` exposure at 620ms, and render them developed
  under `prefers-reduced-motion`.
- **Do** route rail geometry through `--rail-l` / `--rail-r` so the trim, the furniture, and
  the map's `fitBounds` padding stay in agreement.
- **Do** draw new icons at 16×16, `stroke-width: 1.4`, round caps, `currentColor`.
- **Do** keep the measurement in the first viewport at every width; demote the schedule
  instead.

### Don't:

- **Don't** add a `border-radius` or a `box-shadow`. There are none in this build and there is
  no scale to draw from.
- **Don't** float a panel over the print. Rails are ruled regions of the sheet, positioned edge
  to edge and separated by a hairline — never cards in a gutter.
- **Don't** use a zoning hue for anything that is not a zoning class, and don't use amber for
  anything the analyst did not cause. There is no third source of colour on this sheet.
- **Don't** render text in `{colors.line-faint}` — 2.55:1 fails AA.
- **Don't** encode class in colour alone, and don't ship a hatch tile that is a filled block
  rather than lines; a solid tile floods the print and breaks the linework thesis.
- **Don't** introduce a fade, a slide, a scale, a spring, or a skeleton shimmer. Loading is the
  `expose` band; appearance is `clip-path`.
- **Don't** set prose in Archivo Narrow or B612 Mono, and don't set a figure in B612.
- **Don't** add an icon library, an emoji, or a glyph icon; the six authored marks are the set.
- **Don't** let the desktop sheet scroll. Solve overflow inside a register.
- **Don't** re-enable MapLibre's default controls or attribution UI; the revision strip carries
  the required OpenStreetMap (ODbL) and NYC City Planning attribution.
