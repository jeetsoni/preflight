import type { ExtractedSpec } from './extracted-spec';

/** Outcome of a single readiness check. */
export type CheckStatus = 'pass' | 'warn' | 'fail';

/**
 * One line item on the quote-readiness checklist. Each check maps to a
 * *checkable fact* on the drawing (is there a tolerance? a datum? a quantity?)
 * so the result is defensible to a manufacturing reviewer rather than an opinion.
 */
export interface ReadinessCheck {
  readonly id: string;
  readonly label: string;
  readonly status: CheckStatus;
  /** Why it passed/failed and what to add to get a faster quote. */
  readonly detail: string;
  /** Contribution to the overall score (points). */
  readonly weight: number;
}

export type RiskSeverity = 'low' | 'medium' | 'high';

/**
 * A manufacturability (DFM) risk. Always flagged as a heuristic: this tool
 * surfaces things to confirm with a supplier, it does not replace one.
 */
export interface RiskFlag {
  readonly title: string;
  readonly severity: RiskSeverity;
  readonly rationale: string;
  /** Always true — keeps the product honest about what this is. */
  readonly heuristic: true;
}

export type ReadinessGrade = 'ready' | 'needs_work' | 'not_ready';

/** Result of cross-checking the drawing's stated size against the CAD model. */
export type ConsistencyStatus = 'match' | 'mismatch' | 'units_suspect' | 'no_model' | 'insufficient';

export interface ConsistencyResult {
  readonly status: ConsistencyStatus;
  readonly detail: string;
  /** Drawing overall dims (mm, largest-first) used in the comparison. */
  readonly drawingDimsMm: number[] | null;
  /** Model bounding-box dims (mm, largest-first) from the CAD file. */
  readonly modelDimsMm: number[] | null;
}

/** The full result returned to the caller. */
export interface ReadinessReport {
  /** 0..100 quote-readiness score. */
  readonly score: number;
  readonly grade: ReadinessGrade;
  readonly checks: readonly ReadinessCheck[];
  readonly risks: readonly RiskFlag[];
  /** Drawing↔CAD bounding-box cross-check. */
  readonly consistency: ConsistencyResult;
  readonly spec: ExtractedSpec;
  /** One-line, action-oriented takeaway. */
  readonly summary: string;
}
