import type { ExtractedSpec } from '../../domain/entities/extracted-spec';
import type { RiskFlag } from '../../domain/entities/readiness';
import type { DrawingArtifact } from './drawing-ingest.port';

/**
 * Port: surfaces conservative manufacturability (DFM) risks for the part. Takes
 * both the artifact and the already-extracted spec so an implementation can
 * reason over the drawing and the structured data together.
 */
export interface RiskAnalyzerPort {
  assess(artifact: DrawingArtifact, spec: ExtractedSpec): Promise<readonly RiskFlag[]>;
}
