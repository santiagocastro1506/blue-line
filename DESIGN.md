# DESIGN.md — pending

> **This file is intentionally unwritten. Do not fill it in by hand or improvise it.**

`DESIGN.md` is the visual authority of the project: color tokens, type scale, spacing,
component character, motion. All UI work is measured against it. That is exactly why a
scaffold does not write it — `impeccable` does, running a real interview, deriving the
system from the product, and emitting the file per the
[official DESIGN.md spec](https://github.com/google-labs-code/design.md): YAML frontmatter
with machine-readable tokens, plus the canonical sections in fixed order.

## How to fill it

**Step 1 — done (2026-09-05).**

`/impeccable init` has run. `PRODUCT.md` is written and authoritative: users, purpose,
positioning, capabilities, durable constraints, product principles. It deliberately touches
nothing visual — the visual system is derived from the product, not the other way around.

**Step 2 — next. This project takes the new-work path.** The visual identity is new: there is no
existing site and no brand to preserve.

```
/impeccable
```

Describe what you want to design and enter the *new-work* flow: it derives visual
directions from the audience's cultural world, presents materially distinct options, and
writes the new `DESIGN.md` from the one you choose.

`/impeccable document` is **not** applicable here — there is no existing code to extract a
system from.

## Meanwhile

Any UI decision made before this file exists is inventing its own criteria, and will be
redone. If you need to move anyway, keep the work on a branch and record your assumptions
below so the real `DESIGN.md` can confirm or overturn them.

### Provisional assumptions

Direction stated by the project owner at kickoff. **Input to the design flow, not the
outcome of it** — `impeccable` may honor, sharpen, or argue with any of it.

- **Character:** a professional analytical tool. Data-heavy. It should read as an
  instrument, not as a marketing page for an instrument.
- **Interface:** technical, clean, minimalist.
- **Mode:** dark mode preferred, for a stated functional reason — dark chrome lets the map's
  data layers carry the color and separate from the base map. The rationale matters more
  than the preference: whatever the flow decides must still make the layers pop.
- **Consequences worth carrying into the flow:**
  - Color is a *data* channel here, not decoration. Categorical layer colors (zoning
    classes, parcel states) need a palette that stays distinguishable against a dark
    OpenStreetMap base and survives overlap and transparency. This constrains the accent
    palette more than a typical dark UI would.
  - Contrast is a real accessibility risk in dark data UIs. WCAG AA on text and interactive
    elements is the self-imposed floor — see `BRIEF.md`.
  - Dense analytical interfaces live or die on typographic hierarchy at small sizes and on
    the numeral set: measurements, coordinates, and areas need tabular figures.
  - There must be one memorable element and the rest should stay quiet. In a tool this
    dense, the drawing-to-calculation moment is the obvious candidate — but that is a
    proposal, not a decision.
- **Anti-slop note:** "near-black with one acid accent" is one of the default looks AI
  reaches for unprompted. The dark direction here is *requested and justified*, so it is
  not disqualified — but the flow should reach it deliberately, not by reflex, and the
  accent strategy has to answer to the data-layer requirement above rather than to taste.
