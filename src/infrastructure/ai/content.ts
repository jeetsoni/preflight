import type { FilePart, ImagePart } from 'ai';
import type { DrawingArtifact } from '@/core/application/ports/drawing-ingest.port';

/**
 * Builds the correct AI SDK message content part for a drawing artifact:
 * images go as image parts, everything else (PDFs) as file parts. Centralised so
 * both AI adapters stay in lockstep.
 */
export function drawingContentPart(artifact: DrawingArtifact): ImagePart | FilePart {
  if (artifact.mediaType.startsWith('image/')) {
    return { type: 'image', image: artifact.bytes, mediaType: artifact.mediaType };
  }
  return { type: 'file', data: artifact.bytes, mediaType: artifact.mediaType };
}
