export type Ring = [number, number][];

/**
 * A shared analysis carries its own geometry in the link.
 *
 * PRODUCT.md asks for anonymous, persistent, shareable analyses with no login
 * wall. A token in a database would satisfy the letter of that and fail the
 * spirit: a portfolio link has to still work in a year, and a paused free-tier
 * database is exactly how that breaks. The boundary travels in the URL instead,
 * so the link is the record. Where DATABASE_URL is configured, the same ring
 * can also be persisted server-side; nothing here depends on that.
 */

const P = 5; // ~1 m at this latitude, which is finer than anyone draws by hand.

export function encodeRing(ring: Ring): string {
  return ring.map(([x, y]) => `${x.toFixed(P)},${y.toFixed(P)}`).join(';');
}

export function decodeRing(raw: string | null): Ring | null {
  if (!raw) return null;
  const ring: Ring = [];

  for (const pair of raw.split(';')) {
    const [xs, ys] = pair.split(',');
    const x = Number(xs);
    const y = Number(ys);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    // Anything outside the extract is not an analysis of this sheet.
    if (x < -74.3 || x > -73.6 || y < 40.4 || y > 41.0) return null;
    ring.push([x, y]);
  }

  return ring.length >= 3 && ring.length <= 400 ? ring : null;
}

export function ringToWkt(ring: Ring): string {
  const closed = [...ring, ring[0]];
  return `POLYGON((${closed.map(([x, y]) => `${x} ${y}`).join(',')}))`;
}

/**
 * The sheet opens on a real analysis rather than an empty map: a boundary drawn
 * across Times Square, already measured. Nothing about the product is explained
 * before it is demonstrated.
 */
export const DEFAULT_RING: Ring = [
  [-73.98845, 40.75585],
  [-73.9862, 40.7552],
  [-73.9847, 40.7564],
  [-73.9852, 40.758],
  [-73.9876, 40.7583],
  [-73.989, 40.757],
];
