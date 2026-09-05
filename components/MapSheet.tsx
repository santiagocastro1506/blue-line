'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { type Map as MLMap, type MapMouseEvent } from 'maplibre-gl';

import 'maplibre-gl/dist/maplibre-gl.css';

export type Ring = [number, number][];

type Props = {
  drawing: boolean;
  initialRing: Ring | null;
  highlightBbls: string[];
  selectedBbl: string | null;
  hiddenClasses: string[];
  onDrawn: (ring: Ring) => void;
  onCancelDraw: () => void;
  onPickParcel: (bbl: string | null) => void;
  onReady: () => void;
};

const BOUNDS: [number, number, number, number] = [-73.9905, 40.7515, -73.9805, 40.7595];

/** Zoning class from the district symbol, in NYC's own terms. */
const ZONE_COLOR: maplibregl.ExpressionSpecification = [
  'case',
  ['==', ['get', 'zonedist'], 'PARK'], '#6fbf73',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'R'], '#f0d264',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'C'], '#e8836b',
  ['==', ['slice', ['get', 'zonedist'], 0, 1], 'M'], '#b08bd6',
  '#7fa8c9',
];

const ringToWkt = (ring: Ring) => {
  const closed = [...ring, ring[0]];
  return `POLYGON((${closed.map(([x, y]) => `${x} ${y}`).join(',')}))`;
};

export const ringToWktString = ringToWkt;

const EMPTY = { type: 'FeatureCollection' as const, features: [] };

/**
 * The rails sit on top of the print rather than beside it, so the visible frame
 * is inset by their widths. Below 860px they stack underneath instead and the
 * whole width is print again.
 */
function framePadding(m: MLMap) {
  const w = m.getCanvas().clientWidth;
  if (w < 860) return { top: 24, bottom: 24, left: 24, right: 24 };
  const narrow = w < 1100;
  return { top: 36, bottom: 36, left: narrow ? 216 : 248, right: narrow ? 316 : 360 };
}

export default function MapSheet({
  drawing,
  initialRing,
  highlightBbls,
  selectedBbl,
  hiddenClasses,
  onDrawn,
  onCancelDraw,
  onPickParcel,
  onReady,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const vertices = useRef<Ring>([]);
  const [loaded, setLoaded] = useState(false);
  const [labels, setLabels] = useState<{ name: string; x: number; y: number }[]>([]);

  // Latest props for use inside map event handlers, which are bound once.
  const live = useRef({ drawing, onDrawn, onCancelDraw, onPickParcel });
  live.current = { drawing, onDrawn, onCancelDraw, onPickParcel };

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

    // The mark develops onto the print rather than appearing on it.
    const start = performance.now();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A drawn mark, not a filled region: the wash only has to say "inside".
    const target = 0.075;
    if (reduce) {
      m.setPaintProperty('boundary-fill', 'fill-opacity', target);
      return;
    }
    const tick = (now: number) => {
      // Clamp both ends: rAF can hand back a timestamp fractionally before the
      // start reading, and a negative opacity is a hard error in MapLibre.
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
      // No tile provider and no raster imagery: a blue-line plat is drawn, and
      // every line on it comes from the extract.
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'ground', type: 'background', paint: { 'background-color': '#0b2239' } }],
      },
      bounds: BOUNDS,
      fitBoundsOptions: { padding: { top: 40, bottom: 40, left: 248, right: 360 } },
      attributionControl: false,
      maxZoom: 19,
      minZoom: 12,
      dragRotate: false,
      pitchWithRotate: false,
    });

    map.current = m;
    m.touchZoomRotate.disableRotation();

    m.on('load', async () => {
      const load = async (name: string) =>
        (await fetch(`/api/layers?name=${name}`)).json();

      const [parcels, zoning, streets] = await Promise.all([
        load('parcels'),
        load('zoning'),
        load('streets'),
      ]);

      m.addSource('zoning', { type: 'geojson', data: zoning });
      m.addSource('parcels', { type: 'geojson', data: parcels });
      m.addSource('streets', { type: 'geojson', data: streets });
      m.addSource('boundary', { type: 'geojson', data: EMPTY });
      m.addSource('draw-line', { type: 'geojson', data: EMPTY });
      m.addSource('draw-vertices', { type: 'geojson', data: EMPTY });

      // Zoning: a wash of class colour, the way a zoning sheet is tinted.
      // Opacity is tuned per class, not shared: green and blue read far heavier
      // than salmon at the same alpha, and a wash that shouts is a wash that
      // competes with the linework it is supposed to sit under.
      m.addLayer({
        id: 'zoning-fill',
        type: 'fill',
        source: 'zoning',
        paint: {
          'fill-color': ZONE_COLOR,
          'fill-opacity': [
            'case',
            ['==', ['get', 'zonedist'], 'PARK'], 0.17,
            ['==', ['slice', ['get', 'zonedist'], 0, 1], 'R'], 0.2,
            ['==', ['slice', ['get', 'zonedist'], 0, 1], 'C'], 0.15,
            ['==', ['slice', ['get', 'zonedist'], 0, 1], 'M'], 0.15,
            0.07,
          ],
        },
      });
      m.addLayer({
        id: 'zoning-line',
        type: 'line',
        source: 'zoning',
        paint: { 'line-color': ZONE_COLOR, 'line-width': 0.8, 'line-opacity': 0.32 },
      });

      // Streets as drawn centrelines, weighted by class.
      m.addLayer({
        id: 'streets-line',
        type: 'line',
        source: 'streets',
        filter: ['!=', ['get', 'class'], 'pedestrian'],
        paint: {
          'line-color': '#3c6386',
          'line-width': [
            'match', ['get', 'class'],
            'arterial', 2.2, 'secondary', 1.4, 'local', 0.9,
            0.5,
          ],
          'line-opacity': 0.9,
        },
      });

      // Tax lots: white linework, the unexposed paper of the print.
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

      // Lots the current filter matched.
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

      // The drawn boundary.
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

      // The sheet's grid resolves its row heights after the map is constructed,
      // so MapLibre can latch a fallback canvas height and keep it. Re-measure
      // once the layers are in, then fit the print to the real frame.
      m.resize();
      m.fitBounds(BOUNDS, {
        padding: framePadding(m),
        duration: 0,
      });

      setLoaded(true);
      onReady();
    });

    // Any later change to the frame — window resize, rails stacking at a narrow
    // width — has to reach the canvas too.
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

        // Clicking the first vertex closes the ring, as it does in every
        // drafting tool this audience has ever used.
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
      const src = m.getSource('streets') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      // Street names are set in the sheet's own type, as HTML over the print,
      // rather than in a generic map glyph stack.
      const feats = m.queryRenderedFeatures({ layers: ['streets-line'] });
      const w = m.getCanvas().clientWidth;
      const h = m.getCanvas().clientHeight;
      const narrow = w < 860;
      const leftEdge = narrow ? 14 : w < 1100 ? 216 : 250;
      const rightEdge = narrow ? w - 14 : w - (w < 1100 ? 316 : 356);

      const seen = new Set<string>();
      const placed: { name: string; x: number; y: number }[] = [];

      for (const f of feats) {
        const name = f.properties?.name as string | undefined;
        const cls = f.properties?.class as string | undefined;
        if (!name || (cls !== 'arterial' && cls !== 'secondary')) continue;
        if (seen.has(name)) continue;

        const geom = f.geometry;
        if (geom.type !== 'LineString') continue;
        const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)] as [number, number];
        const pt = m.project(mid);
        if (pt.x < leftEdge || pt.x > rightEdge) continue;
        if (pt.y < 14 || pt.y > h - 14) continue;

        // Lettering on a sheet never overlaps other lettering.
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
    // Bound once on purpose; live props are read through the ref above.
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
    m.setFilter('zoning-fill', visible);
    m.setFilter('zoning-line', visible);
  }, [hiddenClasses, loaded]);

  return (
    <div className="map-canvas">
      <div ref={container} className="map-gl" aria-hidden />
      {labels.map((l) => (
        <span
          key={l.name}
          style={{
            position: 'absolute',
            left: l.x,
            top: l.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 3,
            fontFamily: 'var(--font-block)',
            fontSize: 9.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#9cbad3',
            textShadow: '0 0 5px #0b2239, 0 0 5px #0b2239',
            whiteSpace: 'nowrap',
          }}
        >
          {l.name}
        </span>
      ))}
      {drawing && (
        <div className="map-hint" role="status">
          Click to set corners · click the first corner or press Enter to close · Esc to cancel
        </div>
      )}
    </div>
  );
}
