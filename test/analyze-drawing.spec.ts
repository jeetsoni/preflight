import { describe, it, expect } from 'vitest';
import { AnalyzeDrawing } from '@/core/application/use-cases/analyze-drawing';
import { ReadinessPolicy } from '@/core/domain/policies/readiness-policy';
import type { SpecExtractorPort } from '@/core/application/ports/spec-extractor.port';
import type { RiskAnalyzerPort } from '@/core/application/ports/risk-analyzer.port';
import type {
  DrawingArtifact,
  DrawingIngestPort,
  DrawingInput,
} from '@/core/application/ports/drawing-ingest.port';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';

/**
 * These tests exercise the use case + readiness policy with FAKE adapters and
 * zero network. That is the entire payoff of ports + dependency injection: the
 * business logic is verifiable in milliseconds, independent of any LLM.
 */

class PassthroughIngest implements DrawingIngestPort {
  async toArtifact(input: DrawingInput): Promise<DrawingArtifact> {
    return { ...input };
  }
}

class StubExtractor implements SpecExtractorPort {
  constructor(private readonly spec: ExtractedSpec) {}
  async extract(): Promise<ExtractedSpec> {
    return this.spec;
  }
}

class NoRisks implements RiskAnalyzerPort {
  async assess() {
    return [];
  }
}

function spec(overrides: Partial<ExtractedSpec> = {}): ExtractedSpec {
  return {
    process: 'cnc_machining',
    material: 'Aluminum 6061-T6',
    quantity: 10,
    units: 'mm',
    tolerances: [{ value: '±0.10 mm', appliesTo: 'bore', hasDatum: true }],
    surfaceFinishes: ['Ra 1.6'],
    finishing: 'Anodize, clear',
    titleBlock: { partNumber: 'PN-1024', revision: 'A', title: 'Mounting bracket' },
    ambiguities: [],
    rawNotes: [],
    ...overrides,
  };
}

const input: DrawingInput = {
  bytes: new Uint8Array(),
  mediaType: 'application/pdf',
  fileName: 'part.pdf',
};

function useCase(s: ExtractedSpec): AnalyzeDrawing {
  return new AnalyzeDrawing(
    new PassthroughIngest(),
    new StubExtractor(s),
    new NoRisks(),
    new ReadinessPolicy(),
  );
}

describe('AnalyzeDrawing', () => {
  it('scores a complete drawing as supplier-ready', async () => {
    const report = await useCase(spec()).execute(input);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.grade).toBe('ready');
  });

  it('penalizes a drawing missing material, quantity, units and tolerances', async () => {
    const sparse = spec({
      process: 'unknown',
      material: null,
      quantity: null,
      units: 'unspecified',
      tolerances: [],
      surfaceFinishes: [],
      finishing: null,
      titleBlock: { partNumber: null, revision: null, title: null },
    });
    const report = await useCase(sparse).execute(input);
    expect(report.score).toBeLessThan(50);
    expect(report.grade).toBe('not_ready');
    const failed = report.checks.filter((c) => c.status === 'fail').map((c) => c.id);
    expect(failed).toContain('material');
    expect(failed).toContain('quantity');
    expect(failed).toContain('units');
  });

  it('warns when a tolerance lacks a datum reference', async () => {
    const report = await useCase(
      spec({ tolerances: [{ value: '±0.05 mm', appliesTo: null, hasDatum: false }] }),
    ).execute(input);
    const datums = report.checks.find((c) => c.id === 'datums');
    expect(datums?.status).toBe('fail');
  });

  it('fails the ambiguity check when conflicting callouts exist', async () => {
    const report = await useCase(
      spec({ ambiguities: ['Two views show different overall lengths'] }),
    ).execute(input);
    expect(report.checks.find((c) => c.id === 'ambiguities')?.status).toBe('fail');
  });
});
