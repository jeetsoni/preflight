/**
 * Dependency-free STEP (ISO 10303-21) bounding-box reader.
 *
 * It does NOT need a CAD kernel. It prefers the model's true VERTEX points
 * (CARTESIAN_POINTs referenced by VERTEX_POINT) and takes their min/max per axis.
 * Using vertices — rather than every CARTESIAN_POINT — is important: B-spline /
 * NURBS *control* points (e.g. engraved logos, fillets) lie outside the real
 * geometry and would otherwise inflate the box. If a file has no usable vertices
 * we fall back to all points. The result is reported as `approximate`.
 *
 * Length units are normalized to mm (handles MILLIMETRE, METRE, and INCH).
 */

export interface StepBoundingBox {
  /** Bounding-box side lengths in mm, largest-first. */
  readonly dimsMm: readonly number[];
  readonly unit: 'mm' | 'inch' | 'unknown';
  readonly pointCount: number;
  readonly approximate: true;
  /** Whether the box came from true vertices or (fallback) all points. */
  readonly source: 'vertices' | 'points';
}

const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?`;
const POINT_ID_RE = new RegExp(
  String.raw`#(\d+)\s*=\s*CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*(${NUM})\s*,\s*(${NUM})\s*,\s*(${NUM})\s*\)`,
  'g',
);
const VERTEX_RE = /VERTEX_POINT\s*\(\s*'[^']*'\s*,\s*#(\d+)\s*\)/g;

type Pt = [number, number, number];

export function parseStepBoundingBox(content: string): StepBoundingBox | null {
  const byId = new Map<string, Pt>();
  for (const m of content.matchAll(POINT_ID_RE)) {
    const p: Pt = [parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
    if (p.every((v) => Number.isFinite(v))) byId.set(m[1], p);
  }
  if (byId.size === 0) return null;

  const vertices: Pt[] = [];
  for (const m of content.matchAll(VERTEX_RE)) {
    const p = byId.get(m[1]);
    if (p) vertices.push(p);
  }

  const usingVertices = vertices.length >= 2;
  const pts = usingVertices ? vertices : [...byId.values()];

  const min: Pt = [Infinity, Infinity, Infinity];
  const max: Pt = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) {
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i];
      if (p[i] > max[i]) max[i] = p[i];
    }
  }

  const unit = detectLengthUnit(content);
  const scale = unit === 'inch' ? 25.4 : unit === 'm' ? 1000 : 1;
  const dimsMm = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
    .map((d) => round2(d * scale))
    .sort((a, b) => b - a);

  return {
    dimsMm,
    unit: unit === 'inch' ? 'inch' : unit === 'unknown' ? 'unknown' : 'mm',
    pointCount: pts.length,
    approximate: true,
    source: usingVertices ? 'vertices' : 'points',
  };
}

function detectLengthUnit(c: string): 'mm' | 'inch' | 'm' | 'unknown' {
  if (/CONVERSION_BASED_UNIT\s*\(\s*'?\s*INCH/i.test(c)) return 'inch';
  if (/SI_UNIT\s*\(\s*\.MILLI\.\s*,\s*\.METRE\./i.test(c)) return 'mm';
  if (/SI_UNIT\s*\(\s*\$\s*,\s*\.METRE\./i.test(c)) return 'm';
  return 'unknown';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
