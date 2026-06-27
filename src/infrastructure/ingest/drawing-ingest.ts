import type {
  DrawingArtifact,
  DrawingIngestPort,
  DrawingInput,
} from '@/core/application/ports/drawing-ingest.port';

/** Media types we accept today. PDFs and raster images are sent to the model directly. */
const SUPPORTED = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

export class UnsupportedDrawingTypeError extends Error {
  constructor(mediaType: string) {
    super(`Unsupported drawing type: ${mediaType || 'unknown'}. Upload a PDF or PNG/JPEG.`);
    this.name = 'UnsupportedDrawingTypeError';
  }
}

/**
 * DrawingIngestPort adapter. Today it validates and normalizes the upload. The
 * port exists so future ingestion concerns (rasterizing PDFs for image-only
 * models, splitting multi-sheet drawings) can be added without touching the use
 * case.
 */
export class DrawingIngestAdapter implements DrawingIngestPort {
  async toArtifact(input: DrawingInput): Promise<DrawingArtifact> {
    if (!SUPPORTED.has(input.mediaType)) {
      throw new UnsupportedDrawingTypeError(input.mediaType);
    }
    return {
      bytes: input.bytes,
      mediaType: input.mediaType,
      fileName: input.fileName,
    };
  }
}
