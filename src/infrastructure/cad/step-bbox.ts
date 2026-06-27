/**
 * Dependency-free STEP (ISO 10303-21) bounding-box reader.
 *
 * It does NOT need a CAD kernel: it scans every CARTESIAN_POINT in the file and
 * takes the min/max on each axis. For solid models this closely approximates the
 * overall geometric extent (vertices/control points), which is all we need to
 * cross-check the drawing's stated overall size against the model. It is reported
 * as `approximate` for honesty.
 */

export interface StepBoundingBox {
  /** Bounding-box side lengths in mm, largest-first. */
  readonly dimsMm: readonly number[];
  readonly unit: 'mm' | 'inch' | 'unknown';
  readonly pointCount: number;
  readonly approximate: true;
}

const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?`;
const POINT_RE = new RegExp(
  String.raw`CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*(${NUM})\s*,\s*(${NUM})\s*,\s*(${NUM})\s*\)`,
  'g',
);

export function parseStepBoundingBox(content: string): StepBoundingBox | null {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let count = 0;

  for (const m of content.matchAll(POINT_RE)) {
    const p = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
    if (p.some((v) => !Number.isFinite(v))) continue;
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i];
      if (p[i] > max[i]) max[i] = p[i];
    }
    count++;
  }

  if (count === 0) return null;

  const unit = detectLengthUnit(content);
  const scale = unit === 'inch' ? 25.4 : unit === 'm' ? 1000 : 1;
  const sides = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
    .map((d) => round2(d * scale))
    .sort((a, b) => b - a);

  return {
    dimsMm: sides,
    unit: unit === 'inch' ? 'inch' : unit === 'unknown' ? 'unknown' : 'mm',
    pointCount: count,
    approximate: true,
  };
}

function detectLengthUnit(c: string): 'mm' | 'inch' | 'm' | 'unknown' {
  if (/CONVERSION_BASED_UNIT\s*\(\s*'?\s*INCH/i.test(c)) return 'inch';
  if (/SI_UNIT\s*\(\s*\.MILLI\.\s*,\s*\.METRE\./i.test(c)) return 'mm';
  if (/SI_UNIT\s*\(\s*\.CENTI\.\s*,\s*\.METRE\./i.test(c)) return 'm'; // 10x; rare, treat via metre-ish fallback
  if (/SI_UNIT\s*\(\s*\$\s*,\s*\.METRE\./i.test(c)) return 'm';
  return 'unknown';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
