import type { ExtractedSpec } from '../../domain/entities/extracted-spec';
import type { DrawingArtifact } from './drawing-ingest.port';

/**
 * Port: reads structured manufacturing requirements from a drawing. The concrete
 * implementation (LLM via the Vercel AI SDK) lives in the infrastructure layer;
 * the use case only ever sees this interface, which is what makes the model and
 * provider swappable from config alone.
 */
export interface SpecExtractorPort {
  extract(artifact: DrawingArtifact): Promise<ExtractedSpec>;
}
