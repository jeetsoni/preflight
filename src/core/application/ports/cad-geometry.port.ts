/**
 * Port: derives geometry (today: the overall bounding box) from a CAD model file.
 * The concrete adapter (a STEP reader) lives in infrastructure; swapping in a
 * real CAD kernel later would not touch the use case.
 */

export interface CadInput {
  readonly bytes: Uint8Array;
  readonly fileName: string;
}

export interface CadGeometry {
  /** Bounding-box side lengths in mm, largest-first. */
  readonly dimsMm: readonly number[];
  readonly unit: 'mm' | 'inch' | 'unknown';
  /** Whether the bounding box is approximate (e.g. derived from points, not a kernel). */
  readonly approximate: boolean;
}

export interface CadGeometryPort {
  boundingBox(input: CadInput): Promise<CadGeometry | null>;
}
