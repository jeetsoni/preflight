/**
 * Port: turns a raw uploaded file into a normalized artifact the rest of the
 * pipeline can consume. Today this is near pass-through, but the abstraction is
 * where future concerns live (e.g. rasterizing a PDF for image-only models, or
 * splitting multi-sheet drawings) without touching the use case.
 */

export interface DrawingInput {
  readonly bytes: Uint8Array;
  /** MIME type, e.g. "application/pdf", "image/png", "image/jpeg". */
  readonly mediaType: string;
  readonly fileName: string;
}

export interface DrawingArtifact {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
  readonly fileName: string;
}

export interface DrawingIngestPort {
  toArtifact(input: DrawingInput): Promise<DrawingArtifact>;
}
