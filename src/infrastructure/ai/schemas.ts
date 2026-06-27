import { z } from 'zod';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';
import type { RiskFlag } from '@/core/domain/entities/readiness';

/**
 * Zod schemas are an AI-SDK concern (they drive structured output + validation),
 * so they live in infrastructure. The mappers below translate the validated DTOs
 * into pure domain entities, keeping Zod out of the core entirely.
 */

export const ExtractedSpecSchema = z.object({
  process: z
    .enum(['cnc_machining', 'sheet_metal', '3d_printing', 'injection_molding', 'unknown'])
    .describe('Primary manufacturing process implied by the drawing.'),
  material: z.string().nullable().describe('Material spec exactly as written, or null if absent.'),
  quantity: z.number().int().positive().nullable().describe('Order quantity if stated, else null.'),
  units: z.enum(['mm', 'inch', 'unspecified']),
  overallDimensionsMm: z
    .array(z.number())
    .nullable()
    .describe("Part's overall bounding dimensions in mm (largest-first), or null if not determinable."),
  tolerances: z
    .array(
      z.object({
        value: z.string().describe('Tolerance as written, e.g. "±0.10 mm".'),
        appliesTo: z.string().nullable().describe('Feature/dimension it applies to, if stated.'),
        hasDatum: z.boolean().describe('True if a datum/reference frame is specified for it.'),
      }),
    )
    .describe('All dimensional/geometric tolerance callouts found.'),
  surfaceFinishes: z.array(z.string()).describe('Surface roughness/finish callouts, e.g. "Ra 0.8".'),
  finishing: z.string().nullable().describe('Secondary finishing, e.g. "Brushed, clear lacquer".'),
  titleBlock: z.object({
    partNumber: z.string().nullable(),
    revision: z.string().nullable(),
    title: z.string().nullable(),
  }),
  ambiguities: z
    .array(z.string())
    .describe('Conflicting or unclear callouts. Empty if none. Do NOT invent issues.'),
  rawNotes: z.array(z.string()).describe('Other notes captured verbatim.'),
});

export type ExtractedSpecDTO = z.infer<typeof ExtractedSpecSchema>;

export const RiskListSchema = z.object({
  risks: z.array(
    z.object({
      title: z.string().describe('Short risk title.'),
      severity: z.enum(['low', 'medium', 'high']),
      rationale: z.string().describe('Why this is a manufacturability risk, in one sentence.'),
    }),
  ),
});

export type RiskListDTO = z.infer<typeof RiskListSchema>;

export function toExtractedSpec(dto: ExtractedSpecDTO): ExtractedSpec {
  // Shapes are aligned by design; the explicit return keeps the boundary obvious.
  return {
    process: dto.process,
    material: dto.material,
    quantity: dto.quantity,
    units: dto.units,
    overallDimensionsMm: dto.overallDimensionsMm,
    tolerances: dto.tolerances,
    surfaceFinishes: dto.surfaceFinishes,
    finishing: dto.finishing,
    titleBlock: dto.titleBlock,
    ambiguities: dto.ambiguities,
    rawNotes: dto.rawNotes,
  };
}

export function toRiskFlags(dto: RiskListDTO): RiskFlag[] {
  return dto.risks.map((r) => ({
    title: r.title,
    severity: r.severity,
    rationale: r.rationale,
    heuristic: true as const,
  }));
}
