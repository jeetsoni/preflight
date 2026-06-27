import { describe, it, expect } from 'vitest';
import { ConsistencyPolicy } from '@/core/domain/policies/consistency-policy';

const policy = new ConsistencyPolicy();

describe('ConsistencyPolicy', () => {
  it('matches when drawing and model agree within tolerance', () => {
    expect(policy.check([64, 64, 7], [64.19, 64.19, 7]).status).toBe('match');
  });

  it('flags a gross mismatch (wrong revision / wrong file)', () => {
    expect(policy.check([64, 64, 7], [40, 30, 10]).status).toBe('mismatch');
  });

  it('suspects an inch/mm mix-up when the ratio is ~25.4', () => {
    // drawing read as 1625.6 mm (really 64 in) vs model 64 mm
    expect(policy.check([1625.6], [64]).status).toBe('units_suspect');
  });

  it('reports no_model when CAD is absent', () => {
    expect(policy.check([64, 64, 7], null).status).toBe('no_model');
  });

  it('reports insufficient when the drawing dimensions are unknown', () => {
    expect(policy.check(null, [64, 64, 7]).status).toBe('insufficient');
  });
});
