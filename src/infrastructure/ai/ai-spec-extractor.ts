import { generateObject, type LanguageModel } from 'ai';
import type { SpecExtractorPort } from '@/core/application/ports/spec-extractor.port';
import type { DrawingArtifact } from '@/core/application/ports/drawing-ingest.port';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';
import { ExtractedSpecSchema, toExtractedSpec } from './schemas';
import { drawingContentPart } from './content';

const SYSTEM = `You are a senior manufacturing engineer doing intake review on a 2D
engineering drawing before it is sent to suppliers for quoting.

Extract ONLY what is actually present on the drawing. This is critical:
- If a field is not shown, return null or an empty array. NEVER guess or infer a
  value that is not on the drawing — a missing field is a signal we must surface.
- Infer "process" only from clear cues (e.g. machined features, bend notes, layer
  lines). If unclear, use "unknown".
- For each tolerance, set hasDatum=true only if a datum/reference frame (e.g. a
  datum letter or GD&T frame) is actually present for it.
- Put any genuinely conflicting or unclear callouts in "ambiguities". If there are
  none, return an empty array. Do not pad it.`;

/**
 * SpecExtractorPort implemented with the Vercel AI SDK's structured-output API.
 * The model reads the drawing (PDF or image) and returns a schema-validated
 * object, which we map into a pure domain entity at the boundary.
 */
export class AiSpecExtractor implements SpecExtractorPort {
  constructor(private readonly model: LanguageModel) {}

  async extract(artifact: DrawingArtifact): Promise<ExtractedSpec> {
    const { object } = await generateObject({
      model: this.model,
      schema: ExtractedSpecSchema,
      system: SYSTEM,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the manufacturing requirements from this engineering drawing.',
            },
            drawingContentPart(artifact),
          ],
        },
      ],
    });

    return toExtractedSpec(object);
  }
}
