'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import { DEFAULT_RING, decodeRing, encodeRing, ringToWkt, type Ring } from '@/lib/share';
import { AlertIcon, ClearIcon, CloseIcon, DrawIcon, ShareIcon } from '@/components/icons';

const MapSheet = dynamic(() => import('@/components/MapSheet'), { ssr: false });

/* ---------------------------------------------------------------- types */

type Parcel = Record<string, unknown>;

type Analysis = {
  drawn: { areaM2: number; perimeterM: number; centroid: string | null; selfIntersecting: boolean };
  parcels: Parcel[];
  zoning: { zonedist: string; overlap_m2: string }[];
  totals: { lotAreaSqFt: number; bldgAreaSqFt: number; overlapM2: number; fullyInside: number; parcelCount: number };
  provenance: Record<string, unknown>;
};

type Status = {
  ready: boolean;
  engine?: string;
  postgis?: string;
  parcels?: number;
  bootMs?: number;
  modelConfigured?: boolean;
  modelProvider?: 'anthropic' | 'gemini' | null;
  classes?: { cls: string; count: number }[];
};

const PROVIDER_NAME: Record<string, string> = { anthropic: 'Claude', gemini: 'Gemini' };

type QueryState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; readable: string[]; matched: number; predicate: string; ms: number }
  | { kind: 'error'; message: string; unconfigured?: boolean };

/* ------------------------------------------------------------- formatting */

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/**
 * Survey and SI practice groups digits with a thin space, not a comma — and in
 * a tabular mono face a comma opens a gap wide enough to read as two numbers.
 */
const si = (n: number) => int.format(n).replace(/,/g, ' ');

const SQM_PER_SQFT = 0.09290304;

const CLASS_META: Record<string, { name: string; colour: string; hatch: string }> = {
  C: { name: 'Commercial', colour: '#e8836b', hatch: 'solid' },
  R: { name: 'Residential', colour: '#f0d264', hatch: 'diagonal' },
  M: { name: 'Manufacturing', colour: '#b08bd6', hatch: 'cross' },
  PARK: { name: 'Park', colour: '#6fbf73', hatch: 'dots' },
  OTHER: { name: 'Unclassified', colour: '#7fa8c9', hatch: 'solid' },
};

/** Class is never carried by colour alone; each swatch also carries a pattern. */
function Swatch({ cls }: { cls: string }) {
  const meta = CLASS_META[cls] ?? CLASS_META.OTHER;
  const id = `h-${cls}`;
  return (
    <span className="legend-swatch" style={{ color: meta.colour }}>
      <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden style={{ display: 'block' }}>
        <defs>
          <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
            {meta.hatch === 'diagonal' && <path d="M0 4L4 0" stroke={meta.colour} strokeWidth="1" />}
            {meta.hatch === 'cross' && <path d="M0 4L4 0M0 0L4 4" stroke={meta.colour} strokeWidth="0.8" />}
            {meta.hatch === 'dots' && <circle cx="1.4" cy="1.4" r="0.9" fill={meta.colour} />}
          </pattern>
        </defs>
        <rect
          width="15"
          height="11"
          fill={meta.hatch === 'solid' ? meta.colour : `url(#${id})`}
          opacity={meta.hatch === 'solid' ? 0.55 : 1}
        />
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------- component */

export default function Sheet() {
  const [ring, setRing] = useState<Ring | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>({ ready: false });
  const [q, setQ] = useState('');
  const [queryState, setQueryState] = useState<QueryState>({ kind: 'idle' });
  const [matchBbls, setMatchBbls] = useState<string[]>([]);

  const [selectedBbl, setSelectedBbl] = useState<string | null>(null);
  const [hiddenClasses, setHiddenClasses] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const mapReady = useRef(false);

  /* ------------------------------------------------------- boot the sheet */

  useEffect(() => {
    const fromUrl = decodeRing(new URLSearchParams(window.location.search).get('b'));
    setRing(fromUrl ?? DEFAULT_RING);

    // Warm the engine while the reader is still looking at the first viewport,
    // so the WASM Postgres cold start is not spent on their first measurement.
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ready: false }));
  }, []);

  const analyse = useCallback(async (r: Ring) => {
    setAnalysing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wkt: ringToWkt(r) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'The measurement failed.');
      setAnalysis(json as Analysis);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
      setAnalysis(null);
    } finally {
      setAnalysing(false);
    }
  }, []);

  useEffect(() => {
    if (ring) void analyse(ring);
  }, [ring, analyse]);

  /* ------------------------------------------------------------- handlers */

  const onDrawn = useCallback((r: Ring) => {
    setDrawing(false);
    setSelectedBbl(null);
    setRing(r);
    const url = new URL(window.location.href);
    url.searchParams.set('b', encodeRing(r));
    window.history.replaceState(null, '', url);
  }, []);

  const clearBoundary = useCallback(() => {
    setDrawing(false);
    setAnalysis(null);
    setRing(null);
    setSelectedBbl(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('b');
    window.history.replaceState(null, '', url);
  }, []);

  const share = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }, []);

  const runQuery = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const phrase = q.trim();
      if (!phrase) return;

      setQueryState({ kind: 'running' });
      try {
        const compiled = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: phrase }),
        });
        const cj = await compiled.json();

        if (!compiled.ok) {
          setQueryState({
            kind: 'error',
            message: cj.message ?? 'The phrase could not be compiled.',
            unconfigured: cj.error === 'unconfigured',
          });
          return;
        }

        const ran = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter: cj.filter }),
        });
        const rj = await ran.json();
        if (!ran.ok) {
          setQueryState({ kind: 'error', message: rj.error ?? 'The filter failed to run.' });
          return;
        }

        setMatchBbls(rj.bbls ?? []);
        setQueryState({
          kind: 'done',
          readable: rj.readable ?? [],
          matched: rj.counts?.matched ?? 0,
          predicate: rj.provenance?.predicate ?? '',
          ms: rj.provenance?.elapsedMs ?? 0,
        });
      } catch (err) {
        setQueryState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    },
    [q],
  );

  const clearFilter = useCallback(() => {
    setMatchBbls([]);
    setQueryState({ kind: 'idle' });
    setQ('');
  }, []);

  const toggleClass = useCallback((cls: string) => {
    setHiddenClasses((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]));
  }, []);

  /* ------------------------------------------------------------ derived */

  const classRows = useMemo(() => {
    const counts = new Map((status.classes ?? []).map((c) => [c.cls, c.count]));
    return ['C', 'R', 'M', 'PARK'].map((cls) => ({
      cls,
      name: CLASS_META[cls].name,
      count: counts.get(cls),
    }));
  }, [status.classes]);

  const areaSqFt = analysis ? analysis.drawn.areaM2 / SQM_PER_SQFT : 0;

  /* --------------------------------------------------------------- render */

  return (
    <div className="sheet">
      {/* Title block: the sheet names itself, and the query field sits in it as
          the description field sits on a drawing. */}
      <header className="title-block">
        <div className="title-block-name">
          <h1>Blue Line</h1>
          <p>Midtown Manhattan · tax lots &amp; zoning</p>
        </div>
        <div className="title-block-field">
          <form className="query-form" onSubmit={runQuery} role="search">
            <input
              className="query-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="C6 lots with more than 10 floors of unused FAR, built before 1930"
              aria-label="Filter the lots in plain language"
              spellCheck={false}
              disabled={queryState.kind === 'running'}
            />
            <button className="query-submit" type="submit" disabled={!q.trim() || queryState.kind === 'running'}>
              {queryState.kind === 'running' ? 'Compiling' : 'Filter'}
            </button>
          </form>
        </div>
      </header>

      <div className="sheet-body">
        <MapSheet
          drawing={drawing}
          initialRing={ring}
          highlightBbls={matchBbls}
          selectedBbl={selectedBbl}
          hiddenClasses={hiddenClasses}
          onDrawn={onDrawn}
          onCancelDraw={() => setDrawing(false)}
          onPickParcel={setSelectedBbl}
          onReady={() => {
            mapReady.current = true;
          }}
        />

        {/* Left rail: the legend, as a drawing's legend. */}
        <aside className="rail rail-left" aria-label="Sheet legend and tools">
          <div className="rail-scroll">
            <div className="rail-section">
              <div className="tool-row">
                <button
                  className="tool"
                  type="button"
                  aria-pressed={drawing}
                  onClick={() => setDrawing((d) => !d)}
                >
                  <DrawIcon />
                  {drawing ? 'Drawing' : 'Draw'}
                </button>
                <button className="tool" type="button" onClick={clearBoundary} disabled={!ring}>
                  <ClearIcon />
                  Clear
                </button>
                <button className="tool" type="button" onClick={share} disabled={!ring}>
                  <ShareIcon />
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
              <p className="note" style={{ marginTop: 9, marginBottom: 0 }}>
                {drawing
                  ? 'Click the print to set corners. Close the ring to measure it.'
                  : 'The boundary travels in the link, so a shared sheet stays measurable.'}
              </p>
            </div>

            <div className="rail-section">
              <div className="block-label" style={{ marginBottom: 8 }}>
                Zoning class
              </div>
              <div className="legend-grid">
              {classRows.map((row) => {
                const off = hiddenClasses.includes(row.cls === 'PARK' ? 'P' : row.cls);
                return (
                  <button
                    key={row.cls}
                    className="legend-row"
                    type="button"
                    data-off={off}
                    aria-pressed={!off}
                    onClick={() => toggleClass(row.cls === 'PARK' ? 'P' : row.cls)}
                  >
                    <Swatch cls={row.cls} />
                    <span>{row.name}</span>
                    <span className="legend-count">
                      {row.count === undefined ? '—' : int.format(row.count)}
                    </span>
                  </button>
                );
              })}
              </div>
              <p className="note" style={{ marginTop: 9, marginBottom: 0, fontSize: 10 }}>
                Counts are read from the database, not kept by hand.
              </p>
            </div>

            {analysis && analysis.zoning.length > 0 && (
              <div className="rail-section">
                <div className="block-label" style={{ marginBottom: 8 }}>
                  Districts under the boundary
                </div>
                {analysis.zoning.map((z) => (
                  <div key={z.zonedist} className="legend-row" style={{ cursor: 'default' }}>
                    <Swatch cls={z.zonedist === 'PARK' ? 'PARK' : z.zonedist.slice(0, 1)} />
                    <span className="figure">{z.zonedist}</span>
                    <span className="legend-count">{int.format(Number(z.overlap_m2))} m²</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right rail: the margin schedule, where the figures are lettered. */}
        <aside className="rail rail-right" aria-label="Measurement and lot schedule">
          <div className="reading">
            <div className="block-label" style={{ marginBottom: 6 }}>
              Boundary area
            </div>

            {analysing && !analysis && (
              <div className="developing" style={{ height: 34, width: '72%' }} aria-live="polite">
                <span className="note">Developing…</span>
              </div>
            )}

            {analysisError && (
              <p className="note note-warn" style={{ display: 'flex', gap: 6 }}>
                <AlertIcon />
                <span>{analysisError}</span>
              </p>
            )}

            {!analysing && !analysis && !analysisError && (
              <p className="note">
                No boundary on the sheet. Draw one and it will be measured against every lot it
                touches.
              </p>
            )}

            {analysis && (
              <div key={analysis.provenance.elapsedMs as number} className="lettered">
                <span className="reading-figure">
                  {si(Math.round(analysis.drawn.areaM2))}
                  <span className="reading-unit">m²</span>
                </span>
                <div className="reading-provenance">
                  {si(Math.round(areaSqFt))} sq ft · perimeter{' '}
                  {one.format(analysis.drawn.perimeterM)} m
                  <br />
                  {analysis.totals.parcelCount} lots touched · {analysis.totals.fullyInside} wholly
                  inside
                  <br />
                  {String(analysis.provenance.areaBasis)} · SRID{' '}
                  {String(analysis.provenance.srid)}
                  <br />
                  ST_Intersection in PostGIS {String(analysis.provenance.postgis)} ·{' '}
                  {String(analysis.provenance.elapsedMs)} ms
                </div>
                {analysis.drawn.selfIntersecting && (
                  <p className="note note-warn" style={{ marginTop: 8 }}>
                    The ring crosses itself. It was repaired with ST_MakeValid before measuring.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* What the model understood, printed back so it can be corrected. */}
          {queryState.kind !== 'idle' && (
            <div className="rail-section">
              <div className="block-label" style={{ marginBottom: 8 }}>
                Filter
              </div>

              {queryState.kind === 'running' && (
                <div className="developing" style={{ height: 22 }}>
                  <span className="note">Compiling the phrase…</span>
                </div>
              )}

              {queryState.kind === 'error' && (
                <p className="note note-warn" style={{ display: 'flex', gap: 6 }}>
                  <AlertIcon />
                  <span>{queryState.message}</span>
                </p>
              )}

              {queryState.kind === 'done' && (
                <>
                  <div className="filter-print">
                    {queryState.readable.map((line) => (
                      <span className="clause" key={line}>
                        {line}
                      </span>
                    ))}
                    <button className="clause" type="button" onClick={clearFilter}>
                      <CloseIcon />
                      Clear
                    </button>
                  </div>
                  <p className="reading-provenance" style={{ marginTop: 8 }}>
                    {int.format(queryState.matched)} of {int.format(status.parcels ?? 512)} lots ·{' '}
                    {queryState.ms} ms
                    <br />
                    {queryState.predicate}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="rail-scroll">
            <table className="schedule">
              <thead>
                <tr>
                  <th scope="col">Lot</th>
                  <th scope="col">Zoning</th>
                  <th scope="col" className="num">
                    Covered
                  </th>
                  <th scope="col" className="num">
                    Unused FAR
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis?.parcels.map((p) => {
                  const bbl = String(p.bbl);
                  const headroom = Number(p.far_headroom ?? 0);
                  return (
                    <tr
                      key={bbl}
                      data-selected={selectedBbl === bbl}
                      onClick={() => setSelectedBbl(selectedBbl === bbl ? null : bbl)}
                    >
                      <td>
                        <span className="addr">{String(p.address ?? 'No address on file')}</span>
                        <span className="bbl">BBL {bbl}</span>
                      </td>
                      <td className="figure">{String(p.zonedist1 ?? '—')}</td>
                      <td className="num">{one.format(Number(p.pct_covered ?? 0))}%</td>
                      <td
                        className="num"
                        style={{ color: headroom < 0 ? 'var(--danger)' : undefined }}
                      >
                        {headroom > 0 ? '+' : ''}
                        {one.format(headroom)}
                      </td>
                    </tr>
                  );
                })}
                {!analysis && !analysing && (
                  <tr>
                    <td colSpan={4}>
                      <span className="note">
                        The schedule fills in from whatever the boundary touches.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      {/* Revision strip: where a sheet carries its sources and its stamp. */}
      <footer className="revision-strip">
        <span>SRID 4326</span>
        <span>
          Lots &amp; zoning ·{' '}
          <a href="https://www.nyc.gov/site/planning/data-maps/open-data.page" target="_blank" rel="noreferrer">
            NYC City Planning
          </a>{' '}
          MapPLUTO + NYZD
        </span>
        <span>
          Streets ·{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            © OpenStreetMap contributors
          </a>{' '}
          (ODbL)
        </span>
        <span className="revision-spacer">
          {status.ready
            ? `PostGIS ${status.postgis} · ${status.engine === 'pglite' ? 'PGlite (WASM), in-process' : 'Postgres'} · ${int.format(status.parcels ?? 0)} lots`
            : 'Spatial engine developing…'}
        </span>
        {status.ready && status.modelConfigured === false && (
          <span style={{ color: 'var(--line-quiet)' }}>
            Query field needs ANTHROPIC_API_KEY or GEMINI_API_KEY
          </span>
        )}
        {status.ready && status.modelProvider && (
          <span>Query compiled by {PROVIDER_NAME[status.modelProvider] ?? status.modelProvider}</span>
        )}
      </footer>
    </div>
  );
}
