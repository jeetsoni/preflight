import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseStepBoundingBox } from '@/infrastructure/cad/step-bbox';

const box = readFileSync(fileURLToPath(new URL('./fixtures/box.step', import.meta.url)), 'utf8');

describe('parseStepBoundingBox', () => {
  it('reads the bounding box and unit from a real STEP body', () => {
    const bb = parseStepBoundingBox(box);
    expect(bb).not.toBeNull();
    expect(bb!.dimsMm).toEqual([40, 30, 10]);
    expect(bb!.unit).toBe('mm');
    expect(bb!.pointCount).toBe(8);
    expect(bb!.approximate).toBe(true);
  });

  it('handles inch units by normalizing to mm', () => {
    const inchStep = `
      #1=CARTESIAN_POINT('',(0.,0.,0.));
      #2=CARTESIAN_POINT('',(1.,2.,0.));
      CONVERSION_BASED_UNIT('INCH',#9);
    `;
    const bb = parseStepBoundingBox(inchStep);
    expect(bb!.unit).toBe('inch');
    // 2 inch -> 50.8 mm, 1 inch -> 25.4 mm
    expect(bb!.dimsMm).toEqual([50.8, 25.4, 0]);
  });

  it('returns null when there are no points', () => {
    expect(parseStepBoundingBox('ISO-10303-21; no points;')).toBeNull();
  });
});
