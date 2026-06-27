import type { ConsistencyResult } from '../entities/readiness';

/**
 * Pure domain service: cross-checks the drawing's stated overall dimensions
 * against the CAD model's bounding box. This is the thing extraction-only tools
 * miss — it uses BOTH the drawing and the model and catches the expensive errors
 * (a wrong-revision model, or an inch/mm units mismatch between the two).
 *
 * Takes primitives only (no port/infra types) to stay in the innermost layer.
 */
export class ConsistencyPolicy {
  private static readonly TOLERANCE = 0.03; // 3% per dimension
  private static readonly INCH_MM = 25.4;

  check(
    drawingDimsMm: readonly number[] | null,
    modelDimsMm: readonly number[] | null,
  ): ConsistencyResult {
    if (!modelDimsMm || modelDimsMm.length === 0) {
      return {
        status: 'no_model',
        detail: 'Add the STEP/CAD model to cross-check the drawing against the actual geometry.',
        drawingDimsMm: drawingDimsMm ? [...drawingDimsMm] : null,
        modelDimsMm: null,
      };
    }

    const model = [...modelDimsMm].sort((a, b) => b - a);

    if (!drawingDimsMm || drawingDimsMm.length === 0) {
      return {
        status: 'insufficient',
        detail:
          'Could not read overall dimensions from the drawing, so there is nothing to compare against the model.',
        drawingDimsMm: null,
        modelDimsMm: model,
      };
    }

    const drawing = [...drawingDimsMm].sort((a, b) => b - a);
    const ratio = drawing[0] / model[0];

    if (near(ratio, ConsistencyPolicy.INCH_MM, 0.08) || near(ratio, 1 / ConsistencyPolicy.INCH_MM, 0.08)) {
      return {
        status: 'units_suspect',
        detail: `Drawing's largest dimension (~${fmt(drawing[0])} mm) vs the model's (~${fmt(
          model[0],
        )} mm) differ by ~25.4x — a classic inch/mm units mismatch between drawing and model. Confirm units before quoting.`,
        drawingDimsMm: drawing,
        modelDimsMm: model,
      };
    }

    const n = Math.min(drawing.length, model.length);
    let allWithin = true;
    for (let i = 0; i < n; i++) {
      if (!near(drawing[i] / model[i], 1, ConsistencyPolicy.TOLERANCE)) {
        allWithin = false;
        break;
      }
    }

    if (allWithin) {
      return {
        status: 'match',
        detail: `Drawing's overall size (${drawing.map(fmt).join(' × ')} mm) matches the model bounding box (${model
          .map(fmt)
          .join(' × ')} mm) within 3%.`,
        drawingDimsMm: drawing,
        modelDimsMm: model,
      };
    }

    return {
      status: 'mismatch',
      detail: `Drawing's overall size (${drawing.map(fmt).join(' × ')} mm) does not match the model bounding box (${model
        .map(fmt)
        .join(' × ')} mm). Confirm the drawing and model are the same part and revision.`,
      drawingDimsMm: drawing,
      modelDimsMm: model,
    };
  }
}

function near(value: number, target: number, tol: number): boolean {
  return Math.abs(value - target) <= target * tol;
}

function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
