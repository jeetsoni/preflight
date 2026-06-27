import { AnalyzeDrawing } from '@/core/application/use-cases/analyze-drawing';
import { ReadinessPolicy } from '@/core/domain/policies/readiness-policy';
import { ConsistencyPolicy } from '@/core/domain/policies/consistency-policy';
import { DrawingIngestAdapter } from '@/infrastructure/ingest/drawing-ingest';
import { AiSpecExtractor } from '@/infrastructure/ai/ai-spec-extractor';
import { AiRiskAnalyzer } from '@/infrastructure/ai/ai-risk-analyzer';
import { StepCadAdapter } from '@/infrastructure/cad/step-cad-adapter';
import { getLanguageModel } from '@/infrastructure/ai/model-provider';

/**
 * Composition root — the ONLY place where concrete implementations are wired to
 * the ports they satisfy (manual constructor injection, no magic container).
 * Swap an adapter here and nothing in the core changes.
 */
export function makeAnalyzeDrawing(): AnalyzeDrawing {
  const model = getLanguageModel();
  return new AnalyzeDrawing(
    new DrawingIngestAdapter(),
    new AiSpecExtractor(model),
    new AiRiskAnalyzer(model),
    new StepCadAdapter(),
    new ReadinessPolicy(),
    new ConsistencyPolicy(),
  );
}
