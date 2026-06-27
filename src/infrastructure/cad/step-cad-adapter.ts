import type {
  CadGeometry,
  CadGeometryPort,
  CadInput,
} from '@/core/application/ports/cad-geometry.port';
import { parseStepBoundingBox } from './step-bbox';

const STEP_EXT = /\.(stp|step)$/i;

/**
 * CadGeometryPort backed by the dependency-free STEP reader. Only handles
 * STEP/STP today; returns null for anything else so the use case degrades
 * gracefully (drawing-only analysis still works).
 */
export class StepCadAdapter implements CadGeometryPort {
  async boundingBox(input: CadInput): Promise<CadGeometry | null> {
    if (!STEP_EXT.test(input.fileName)) return null;
    const text = new TextDecoder('utf-8', { fatal: false }).decode(input.bytes);
    const bb = parseStepBoundingBox(text);
    if (!bb || bb.dimsMm.every((d) => d === 0)) return null;
    return { dimsMm: bb.dimsMm, unit: bb.unit, approximate: bb.approximate };
  }
}
