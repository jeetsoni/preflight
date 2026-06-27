import type { ReadinessReport } from '../../domain/entities/readiness';
import { ReadinessPolicy } from '../../domain/policies/readiness-policy';
import type { DrawingIngestPort, DrawingInput } from '../ports/drawing-ingest.port';
import type { SpecExtractorPort } from '../ports/spec-extractor.port';
import type { RiskAnalyzerPort } from '../ports/risk-analyzer.port';

export type AnalyzeDrawingInput = DrawingInput;

/**
 * Application use case: orchestrates the Pre-Flight pipeline.
 *
 *   ingest -> extract specs -> assess DFM risk -> score readiness
 *
 * It depends only on ports (interfaces) and the pure ReadinessPolicy. It has no
 * knowledge of HTTP, React, the AI SDK, or any provider — that is the whole
 * point: this class is the stable center the rest of the system plugs into.
 */
export class AnalyzeDrawing {
  constructor(
    private readonly ingest: DrawingIngestPort,
    private readonly extractor: SpecExtractorPort,
    private readonly risk: RiskAnalyzerPort,
    private readonly policy: ReadinessPolicy,
  ) {}

  async execute(input: AnalyzeDrawingInput): Promise<ReadinessReport> {
    const artifact = await this.ingest.toArtifact(input);
    const spec = await this.extractor.extract(artifact);
    const risks = await this.risk.assess(artifact, spec);
    return this.policy.evaluate(spec, risks);
  }
}
