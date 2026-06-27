import type { FilePart } from 'ai';
import type { DrawingArtifact } from '@/core/application/ports/drawing-ingest.port';

/**
 * Builds the AI SDK message content part for a drawing artifact. The SDK now
 * accepts images as `file` parts (with an image/* mediaType) too, so a single
 * file part covers both PDFs and raster drawings — and avoids the deprecated
 * "image" content-part path. Centralised so both AI adapters stay in lockstep.
 */
export function drawingContentPart(artifact: DrawingArtifact): FilePart {
  return { type: 'file', data: artifact.bytes, mediaType: artifact.mediaType };
}
