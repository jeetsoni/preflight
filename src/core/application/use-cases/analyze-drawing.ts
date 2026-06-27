import type { ReadinessReport } from '../../domain/entities/readiness';
import { ReadinessPolicy } from '../../domain/policies/readiness-policy';
import { ConsistencyPolicy } from '../../domain/policies/consistency-policy';
import type { DrawingIngestPort, DrawingInput } from '../ports/drawing-ingest.port';
import type { SpecExtractorPort } from '../ports/spec-extractor.port';
import type { RiskAnalyzerPort } from '../ports/risk-analyzer.port';
import type { CadGeometryPort, CadInput } from '../ports/cad-geometry.port';

export interface AnalyzeDrawingInput extends DrawingInput {
  /** Optional CAD model (STEP) to cross-check the drawing against. */
  readonly cad?: CadInput;
}

/**
 * Application use case: orchestrates the Pre-Flight pipeline.
 *
 *   ingest -> (extract specs ‖ read CAD bounding box) -> assess DFM risk
 *          -> cross-check drawing vs model -> score readiness
 *
 * Depends only on ports (interfaces) and pure domain policies. It has no
 * knowledge of HTTP, React, the AI SDK, or any provider — this class is the
 * stable center the rest of the system plugs into.
 */
export class AnalyzeDrawing {
  constructor(
    private readonly ingest: DrawingIngestPort,
    private readonly extractor: SpecExtractorPort,
    private readonly risk: RiskAnalyzerPort,
    private readonly cad: CadGeometryPort,
    private readonly readiness: ReadinessPolicy,
    private readonly consistency: ConsistencyPolicy,
  ) {}

  async execute(input: AnalyzeDrawingInput): Promise<ReadinessReport> {
    const artifact = await this.ingest.toArtifact(input);

    const [spec, model] = await Promise.all([
      this.extractor.extract(artifact),
      input.cad ? this.cad.boundingBox(input.cad) : Promise.resolve(null),
    ]);

    const risks = await this.risk.assess(artifact, spec);
    const consistency = this.consistency.check(spec.overallDimensionsMm, model?.dimsMm ?? null);

    return this.readiness.evaluate(spec, risks, consistency);
  }
}
