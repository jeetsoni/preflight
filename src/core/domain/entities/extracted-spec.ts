/**
 * Domain entity: the structured manufacturing requirements read off a 2D
 * engineering drawing. This is Jiga's "front door" data, modelled as plain,
 * immutable domain types with no dependency on any framework, LLM, or library.
 *
 * Everything here is intentionally nullable: a drawing that omits a field is a
 * fact we want to surface (it is exactly what slows a quote), never something to
 * guess at.
 */

export type ManufacturingProcess =
  | 'cnc_machining'
  | 'sheet_metal'
  | '3d_printing'
  | 'injection_molding'
  | 'unknown';

export type Units = 'mm' | 'inch' | 'unspecified';

/** A single tolerance callout and whether it is anchored to a datum/reference. */
export interface ToleranceCallout {
  /** As written on the drawing, e.g. "±0.10 mm" or "+0.05/-0.00". */
  readonly value: string;
  /** The feature/dimension it applies to, if stated; otherwise null. */
  readonly appliesTo: string | null;
  /** Whether a datum / reference frame is specified for this tolerance. */
  readonly hasDatum: boolean;
}

/** Title-block fields used for traceability and revision control. */
export interface TitleBlock {
  readonly partNumber: string | null;
  readonly revision: string | null;
  readonly title: string | null;
}

export interface ExtractedSpec {
  readonly process: ManufacturingProcess;
  readonly material: string | null;
  readonly quantity: number | null;
  readonly units: Units;
  readonly tolerances: readonly ToleranceCallout[];
  /** Surface roughness / finish callouts, e.g. ["Ra 0.8", "Ra 1.6"]. */
  readonly surfaceFinishes: readonly string[];
  /** Secondary finishing, e.g. "Brushed finish, clear lacquer coat". */
  readonly finishing: string | null;
  readonly titleBlock: TitleBlock;
  /** Conflicting or unclear callouts the reviewer flagged. */
  readonly ambiguities: readonly string[];
  /** Other free-text notes captured verbatim from the drawing. */
  readonly rawNotes: readonly string[];
}
