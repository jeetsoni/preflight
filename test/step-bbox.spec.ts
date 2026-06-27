import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseStepBoundingBox } from '@/infrastructure/cad/step-bbox';

const box = readFileSync(fileURLToPath(new URL('./fixtures/box.step', import.meta.url)), 'utf8');

describe('parseStepBoundingBox', () => {
  it('falls back to all points when a file has no vertices', () => {
    const bb = parseStepBoundingBox(box);
    expect(bb).not.toBeNull();
    expect(bb!.dimsMm).toEqual([40, 30, 10]);
    expect(bb!.unit).toBe('mm');
    expect(bb!.source).toBe('points');
  });

  it('uses true vertices and ignores stray spline control points', () => {
    // A 60x60x7 plate (vertices) plus one far-away control point that should be ignored.
    const step = `
      #1=CARTESIAN_POINT('',(0.,0.,0.));
      #2=CARTESIAN_POINT('',(60.,0.,0.));
      #3=CARTESIAN_POINT('',(60.,60.,0.));
      #4=CARTESIAN_POINT('',(0.,60.,0.));
      #5=CARTESIAN_POINT('',(0.,0.,7.));
      #6=CARTESIAN_POINT('',(60.,0.,7.));
      #7=CARTESIAN_POINT('',(60.,60.,7.));
      #8=CARTESIAN_POINT('',(0.,60.,7.));
      #99=CARTESIAN_POINT('',(200.,200.,200.));
      #11=VERTEX_POINT('',#1); #12=VERTEX_POINT('',#2);
      #13=VERTEX_POINT('',#3); #14=VERTEX_POINT('',#4);
      #15=VERTEX_POINT('',#5); #16=VERTEX_POINT('',#6);
      #17=VERTEX_POINT('',#7); #18=VERTEX_POINT('',#8);
      #100=(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.));
    `;
    const bb = parseStepBoundingBox(step)!;
    expect(bb.source).toBe('vertices');
    expect(bb.dimsMm).toEqual([60, 60, 7]); // ignores the (200,200,200) control point
  });

  it('handles metre units by normalizing to mm', () => {
    const step = `
      #1=CARTESIAN_POINT('',(0.,0.,0.));
      #2=CARTESIAN_POINT('',(0.06,0.06,0.007));
      #11=VERTEX_POINT('',#1); #12=VERTEX_POINT('',#2);
      SI_UNIT($,.METRE.);
    `;
    const bb = parseStepBoundingBox(step)!;
    expect(bb.unit).toBe('mm');
    expect(bb.dimsMm).toEqual([60, 60, 7]);
  });

  it('returns null when there are no points', () => {
    expect(parseStepBoundingBox('ISO-10303-21; no points;')).toBeNull();
  });
});
