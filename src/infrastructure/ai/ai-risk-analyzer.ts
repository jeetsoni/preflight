import { generateObject, type LanguageModel } from 'ai';
import type { RiskAnalyzerPort } from '@/core/application/ports/risk-analyzer.port';
import type { DrawingArtifact } from '@/core/application/ports/drawing-ingest.port';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';
import type { RiskFlag } from '@/core/domain/entities/readiness';
import { RiskListSchema, toRiskFlags } from './schemas';
import { drawingContentPart } from './content';

const SYSTEM = `You are a DFM (design-for-manufacturability) reviewer. Surface only
HIGH-CONFIDENCE, conservative manufacturability risks for the part shown.

Rules:
- Prefer fewer, solid flags over many speculative ones. If nothing clearly stands
  out, return an empty list.
- Base risks on what the drawing and the extracted spec actually show (e.g. a
  tolerance tighter than the named process typically holds, a called-out thin
  wall, sharp internal corners, conflicting callouts).
- Each flag is advisory — something to confirm with the supplier, not a verdict.
- Never invent dimensions that are not present.`;

/**
 * RiskAnalyzerPort implemented with the Vercel AI SDK. Deliberately conservative:
 * the readiness score is the headline (checkable facts); risks are a secondary,
 * clearly-heuristic layer.
 */
export class AiRiskAnalyzer implements RiskAnalyzerPort {
  constructor(private readonly model: LanguageModel) {}

  async assess(artifact: DrawingArtifact, spec: ExtractedSpec): Promise<readonly RiskFlag[]> {
    const { object } = await generateObject({
      model: this.model,
      schema: RiskListSchema,
      system: SYSTEM,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Review this drawing for manufacturability risks. ' +
                'Extracted spec for context:\n' +
                JSON.stringify(spec, null, 2),
            },
            drawingContentPart(artifact),
          ],
        },
      ],
    });

    return toRiskFlags(object);
  }
}
