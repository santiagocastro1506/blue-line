'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { type Map as MLMap, type MapMouseEvent } from 'maplibre-gl';

import 'maplibre-gl/dist/maplibre-gl.css';

export type Ring = [number, number][];

export type Frame = {
  /** The visible print area as a ring, so the current view is itself a query. */
  ring: Ring;
  scaleMetres: number;
  scalePx: number;
};

type Props = {
  drawing: boolean;
  initialRing: Ring | null;
  highlightBbls: string[];
  selectedBbl: string | null;
  hiddenClasses: string[];
  onDrawn: (ring: Ring) => void;
  onCancelDraw: () => void;
  onPickParcel: (bbl: string | null) => void;
  onFrameChange: (frame: Frame) => void;
  onReady: () => void;
};

const BOUNDS: [number, number, number, number] = [-73.9905, 40.7515, -73.9805, 40.7595];
/** Room to look around the extract, but not to lose it off the edge of the sheet. */
const MAX_BOUNDS: [number, number, number, number] = [-73.999, 40.745, -73.972, 40.766];

const CLASS_OF: maplibregl.ExpressionSpecification = [
  'case',
  ['==', ['get', 'zonedist'], 'PARK'], 'PARK',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'R'], 'R',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'C'], 'C',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'M'], 'M',
  'OTHER',
];

const ZONE_COLOR: maplibregl.ExpressionSpecification = [
  'match', CLASS_OF,
  'PARK', '#6fbf73',
  'R', '#f0d264',
  'C', '#e8836b',
  'M', '#b08bd6',
  '#7fa8c9',
];

const EMPTY = { type: 'FeatureCollection' as const, features: [] };

function framePadding(m: MLMap) {
  const w = m.getCanvas().clientWidth;
  if (w < 860) return { top: 24, bottom: 24, left: 24, right: 24 };
  const narrow = w < 1100;
  return { top: 36, bottom: 36, left: narrow ? 216 : 248, right: narrow ? 316 : 360 };
}

/**
 * Zoning class is carried in two channels, not one. Colour alone is unreadable
 * to anyone with a colour-vision deficiency, and a zoning map that encodes its
 * whole meaning in hue is the exact failure PRODUCT.md names. These patterns
 * match the hatches on the legend swatches.
 */
function hatchImage(
  kind: 'vertical' | 'diagonal' | 'cross' | 'dots' | 'horizontal',
  hex: string,
  alpha = 0.55,
) {
  const S = 24; // 12 css px at pixelRatio 2 — wide enough to stay a texture
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  if (!g) return null;

  g.clearRect(0, 0, S, S);
  g.strokeStyle = hex;
  g.fillStyle = hex;
  g.lineWidth = 1.5;
  g.globalAlpha = alpha;

  // Line-based only. A filled tile floods the print and the sheet stops being
  // white linework on Prussian ground, which is the whole thesis.
  g.beginPath();
  if (kind === 'vertical') {
    g.moveTo(S / 2, 0); g.lineTo(S / 2, S);
  } else if (kind === 'horizontal') {
    g.moveTo(0, S / 2); g.lineTo(S, S / 2);
  } else if (kind === 'diagonal') {
    g.moveTo(-S, S); g.lineTo(S, -S);
    g.moveTo(0, S * 2); g.lineTo(S * 2, 0);
  } else if (kind === 'cross') {
    g.moveTo(-S, S); g.lineTo(S, -S);
    g.moveTo(0, S * 2); g.lineTo(S * 2, 0);
    g.moveTo(-S, 0); g.lineTo(S, S * 2);
    g.moveTo(0, -S); g.lineTo(S * 2, S);
  }
  g.stroke();

  if (kind === 'dots') {
    g.beginPath();
    g.arc(S / 2, S / 2, 1.7, 0, Math.PI * 2);
    g.fill();
  }

  return { width: S, height: S, data: new Uint8Array(g.getImageData(0, 0, S, S).data) };
}

/** A scale bar reads in round numbers or it is decoration. */
const NICE = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

export default function MapSheet({
  drawing,
  initialRing,
  highlightBbls,
  selectedBbl,
  hiddenClasses,
  onDrawn,
  onCancelDraw,
  onPickParcel,
  onFrameChange,
  onReady,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const vertices = useRef<Ring>([]);
  const [loaded, setLoaded] = useState(false);
  const [labels, setLabels] = useState<{ name: string; x: number; y: number }[]>([]);
  const [scale, setScale] = useState<{ metres: number; px: number } | null>(null);

  const live = useRef({ drawing, onDrawn, onCancelDraw, onPickParcel, onFrameChange });
  live.current = { drawing, onDrawn, onCancelDraw, onPickParcel, onFrameChange };

  /* ------------------------------------------------------------- draw state */

  const paintDraw = useCallback((cursor?: [number, number]) => {
    const m = map.current;
    if (!m) return;
    const pts = vertices.current;

    const lineCoords = cursor && pts.length ? [...pts, cursor] : pts;
    (m.getSource('draw-line') as maplibregl.GeoJSONSource | undefined)?.setData(
      lineCoords.length > 1
        ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoords } }
        : EMPTY,
    );

    (m.getSource('draw-vertices') as maplibregl.GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: pts.map((p, i) => ({
        type: 'Feature' as const,
        properties: { first: i === 0 },
        geometry: { type: 'Point' as const, coordinates: p },
      })),
    });
  }, []);

  const setBoundary = useCallback((ring: Ring | null) => {
    const m = map.current;
    if (!m) return;
    const src = m.getSource('boundary') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    if (!ring || ring.length < 3) {
      src.setData(EMPTY);
      return;
    }
    src.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
    });

    // The mark develops onto the print: the line is drawn on, it does not fade in.
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = 0.075;
    if (reduce) {
      m.setPaintProperty('boundary-fill', 'fill-opacity', target);
      return;
    }
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 620));
      const eased = 1 - Math.pow(1 - t, 3);
      if (!map.current?.getLayer('boundary-fill')) return;
      map.current.setPaintProperty('boundary-fill', 'fill-opacity', target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const finish = useCallback(() => {
    const pts = vertices.current;
    if (pts.length < 3) return;
    const ring = [...pts];
    vertices.current = [];
    paintDraw();
    setBoundary(ring);
    live.current.onDrawn(ring);
  }, [paintDraw, setBoundary]);

  /* ------------------------------------------------------------------ setup */

  useEffect(() => {
    if (map.current || !container.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'ground', type: 'background', paint: { 'background-color': '#0b2239' } }],
      },
      bounds: BOUNDS,
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 13.5,
      dragRotate: false,
      pitchWithRotate: false,
    });

    map.current = m;
    m.touchZoomRotate.disableRotation();
    m.keyboard.enable();

    m.on('load', async () => {
      const load = async (name: string) => (await fetch(`/api/layers?name=${name}`)).json();
      const [parcels, zoning, streets] = await Promise.all([
        load('parcels'), load('zoning'), load('streets'),
      ]);

      for (const [id, kind, hex, alpha] of [
        ['hatch-C', 'vertical', '#e8836b', 0.3],
        ['hatch-R', 'diagonal', '#f0d264', 0.6],
        ['hatch-M', 'cross', '#b08bd6', 0.6],
        ['hatch-PARK', 'dots', '#6fbf73', 0.7],
        ['hatch-OTHER', 'horizontal', '#7fa8c9', 0.5],
      ] as const) {
        const img = hatchImage(kind, hex, alpha);
        if (img && !m.hasImage(id)) m.addImage(id, img, { pixelRatio: 2 });
      }

      m.addSource('zoning', { type: 'geojson', data: zoning });
      m.addSource('parcels', { type: 'geojson', data: parcels });
      m.addSource('streets', { type: 'geojson', data: streets });
      m.addSource('boundary', { type: 'geojson', data: EMPTY });
      m.addSource('draw-line', { type: 'geojson', data: EMPTY });
      m.addSource('draw-vertices', { type: 'geojson', data: EMPTY });

      m.addLayer({
        id: 'zoning-fill',
        type: 'fill',
        source: 'zoning',
        paint: {
          'fill-color': ZONE_COLOR,
          'fill-opacity': [
            'match', CLASS_OF,
            'PARK', 0.15, 'R', 0.18, 'C', 0.13, 'M', 0.13,
            0.06,
          ],
        },
      });

      // Second channel: the same hatch the legend shows, on the print itself.
      m.addLayer({
        id: 'zoning-hatch',
        type: 'fill',
        source: 'zoning',
        paint: {
          'fill-pattern': ['match', CLASS_OF,
            'C', 'hatch-C', 'R', 'hatch-R', 'M', 'hatch-M', 'PARK', 'hatch-PARK',
            'hatch-OTHER'],
          'fill-opacity': 0.34,
        },
      });

      m.addLayer({
        id: 'zoning-line',
        type: 'line',
        source: 'zoning',
        paint: { 'line-color': ZONE_COLOR, 'line-width': 0.8, 'line-opacity': 0.32 },
      });

      m.addLayer({
        id: 'streets-line',
        type: 'line',
        source: 'streets',
        filter: ['!=', ['get', 'class'], 'pedestrian'],
        paint: {
          'line-color': '#3c6386',
          'line-width': ['match', ['get', 'class'],
            'arterial', 2.2, 'secondary', 1.4, 'local', 0.9, 0.5],
          'line-opacity': 0.9,
        },
      });

      m.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'parcels',
        paint: { 'fill-color': '#dce9f2', 'fill-opacity': 0.045 },
      });
      m.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'parcels',
        paint: { 'line-color': '#dce9f2', 'line-width': 0.7, 'line-opacity': 0.65 },
      });

      m.addLayer({
        id: 'parcels-match',
        type: 'fill',
        source: 'parcels',
        filter: ['in', ['get', 'bbl'], ['literal', []]],
        paint: { 'fill-color': '#e4b33c', 'fill-opacity': 0.3 },
      });
      m.addLayer({
        id: 'parcels-match-line',
        type: 'line',
        source: 'parcels',
        filter: ['in', ['get', 'bbl'], ['literal', []]],
        paint: { 'line-color': '#e4b33c', 'line-width': 1.3 },
      });

      m.addLayer({
        id: 'parcels-selected',
        type: 'line',
        source: 'parcels',
        filter: ['==', ['get', 'bbl'], ''],
        paint: { 'line-color': '#ffffff', 'line-width': 2.2 },
      });

      m.addLayer({
        id: 'boundary-fill',
        type: 'fill',
        source: 'boundary',
        paint: { 'fill-color': '#e4b33c', 'fill-opacity': 0 },
      });
      m.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#f0c250', 'line-width': 2.6, 'line-dasharray': [4, 2] },
      });

      m.addLayer({
        id: 'draw-line-layer',
        type: 'line',
        source: 'draw-line',
        paint: { 'line-color': '#e4b33c', 'line-width': 1.6, 'line-dasharray': [2, 1.4] },
      });
      m.addLayer({
        id: 'draw-vertex-layer',
        type: 'circle',
        source: 'draw-vertices',
        paint: {
          'circle-radius': ['case', ['get', 'first'], 5, 3.2],
          'circle-color': '#0b2239',
          'circle-stroke-color': '#e4b33c',
          'circle-stroke-width': 1.6,
        },
      });

      m.resize();
      m.fitBounds(BOUNDS, { padding: framePadding(m), duration: 0 });

      setLoaded(true);
      onReady();
      onMove();
    });

    const ro = new ResizeObserver(() => {
      m.resize();
      m.fitBounds(BOUNDS, { padding: framePadding(m), duration: 0 });
    });
    ro.observe(container.current);

    /* ------------------------------------------------------- interaction */

    m.on('click', (e: MapMouseEvent) => {
      if (live.current.drawing) {
        const pts = vertices.current;
        const p: [number, number] = [
          Number(e.lngLat.lng.toFixed(6)),
          Number(e.lngLat.lat.toFixed(6)),
        ];
        if (pts.length >= 3) {
          const first = m.project(pts[0] as [number, number]);
          if (Math.hypot(first.x - e.point.x, first.y - e.point.y) < 11) {
            finish();
            return;
          }
        }
        vertices.current = [...pts, p];
        paintDraw();
        return;
      }

      const hit = m.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] })[0];
      live.current.onPickParcel(hit ? String(hit.properties?.bbl ?? '') : null);
    });

    m.on('mousemove', (e: MapMouseEvent) => {
      if (live.current.drawing && vertices.current.length) {
        paintDraw([e.lngLat.lng, e.lngLat.lat]);
      }
      if (!live.current.drawing) {
        const hit = m.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] });
        m.getCanvas().style.cursor = hit.length ? 'pointer' : '';
      }
    });

    m.on('dblclick', (e) => {
      if (live.current.drawing) {
        e.preventDefault();
        finish();
      }
    });

    const onMove = () => {
      if (!m.getLayer('streets-line')) return;
      const w = m.getCanvas().clientWidth;
      const h = m.getCanvas().clientHeight;
      const narrow = w < 860;
      const leftEdge = narrow ? 14 : w < 1100 ? 216 : 250;
      const rightEdge = narrow ? w - 14 : w - (w < 1100 ? 316 : 356);

      // The visible print area, as a ring. This makes the current view itself a
      // query, which is the non-pointer path to a spatial measurement.
      const nw = m.unproject([leftEdge + 8, 20]);
      const se = m.unproject([rightEdge - 8, h - 20]);
      const r6 = (n: number) => Number(n.toFixed(6));
      const ring: Ring = [
        [r6(nw.lng), r6(nw.lat)],
        [r6(se.lng), r6(nw.lat)],
        [r6(se.lng), r6(se.lat)],
        [r6(nw.lng), r6(se.lat)],
      ];

      // Scale bar, in round metres.
      const y = Math.round(h / 2);
      const mPerPx = m.unproject([0, y]).distanceTo(m.unproject([100, y])) / 100;
      const target = NICE.find((n) => n / mPerPx > 60) ?? NICE[NICE.length - 1];
      setScale({ metres: target, px: Math.round(target / mPerPx) });

      live.current.onFrameChange({ ring, scaleMetres: target, scalePx: Math.round(target / mPerPx) });

      const seen = new Set<string>();
      const placed: { name: string; x: number; y: number }[] = [];
      for (const f of m.queryRenderedFeatures({ layers: ['streets-line'] })) {
        const name = f.properties?.name as string | undefined;
        const cls = f.properties?.class as string | undefined;
        if (!name || (cls !== 'arterial' && cls !== 'secondary')) continue;
        if (seen.has(name)) continue;
        const geom = f.geometry;
        if (geom.type !== 'LineString') continue;
        const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)] as [number, number];
        const pt = m.project(mid);
        if (pt.x < leftEdge || pt.x > rightEdge) continue;
        if (pt.y < 14 || pt.y > h - 40) continue;
        if (placed.some((p) => Math.abs(p.x - pt.x) < 130 && Math.abs(p.y - pt.y) < 22)) continue;
        seen.add(name);
        placed.push({ name, x: pt.x, y: pt.y });
        if (placed.length >= 9) break;
      }
      setLabels(placed);
    };

    m.on('moveend', onMove);
    m.on('idle', onMove);

    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------- keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!live.current.drawing) return;
      if (e.key === 'Escape') {
        vertices.current = [];
        paintDraw();
        live.current.onCancelDraw();
      }
      if (e.key === 'Enter') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, paintDraw]);

  /* --------------------------------------------------------- prop syncing */

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    m.getCanvas().style.cursor = drawing ? 'crosshair' : '';
    if (!drawing && vertices.current.length) {
      vertices.current = [];
      paintDraw();
    }
    if (drawing) {
      m.doubleClickZoom.disable();
      setBoundary(null);
    } else {
      m.doubleClickZoom.enable();
    }
  }, [drawing, loaded, paintDraw, setBoundary]);

  useEffect(() => {
    if (loaded && initialRing) setBoundary(initialRing);
  }, [loaded, initialRing, setBoundary]);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    const f: maplibregl.FilterSpecification = ['in', ['get', 'bbl'], ['literal', highlightBbls]];
    m.setFilter('parcels-match', f);
    m.setFilter('parcels-match-line', f);
  }, [highlightBbls, loaded]);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    m.setFilter('parcels-selected', ['==', ['get', 'bbl'], selectedBbl ?? '']);
  }, [selectedBbl, loaded]);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded) return;
    const visible = hiddenClasses.length
      ? (['!', ['in', ['slice', ['get', 'zonedist'], 0, 1], ['literal', hiddenClasses]]] as maplibregl.FilterSpecification)
      : null;
    for (const id of ['zoning-fill', 'zoning-hatch', 'zoning-line']) m.setFilter(id, visible);
  }, [hiddenClasses, loaded]);

  return (
    <div className="map-canvas">
      <div
        ref={container}
        className="map-gl"
        role="application"
        aria-label="Midtown Manhattan tax lot and zoning print. Pan with the arrow keys and zoom with plus and minus once focused. Every lot shown is also listed in the schedule beside this print."
      />

      {/* Trim border and corner ticks: a print has a frame, and the frame is
          where the sheet ends and the paper begins. */}
      <div className="trim" aria-hidden>
        <span className="tick tl" />
        <span className="tick tr" />
        <span className="tick bl" />
        <span className="tick br" />
      </div>

      {labels.map((l) => (
        <span key={l.name} className="street-label" style={{ left: l.x, top: l.y }}>
          {l.name}
        </span>
      ))}

      {/* Survey furniture. A plat without a scale bar and a north arrow is not
          a plat, and an analyst reading coverage has no reference without them. */}
      <div className="sheet-furniture" aria-hidden>
        <svg className="north" viewBox="0 0 24 44" width="18" height="33">
          <path d="M12 3 L18 20 L12 16 L6 20 Z" fill="#9cbad3" />
          <path d="M12 16 L18 20 L12 37 L6 20 Z" fill="none" stroke="#6d93b4" strokeWidth="1" />
          <text x="12" y="44" textAnchor="middle" fontSize="9" fill="#9cbad3"
            fontFamily="var(--font-block)" letterSpacing="1">N</text>
        </svg>
        {scale && (
          <div className="scalebar">
            <div className="scalebar-rule" style={{ width: scale.px }}>
              <span /><span /><span /><span />
            </div>
            <div className="scalebar-label figure">
              0<span style={{ float: 'right' }}>{scale.metres} m</span>
            </div>
          </div>
        )}
      </div>

      {drawing && (
        <div className="map-hint" role="status">
          Click to set corners · click the first corner or press Enter to close · Esc to cancel
        </div>
      )}
    </div>
  );
}
