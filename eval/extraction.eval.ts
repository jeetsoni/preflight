import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AiSpecExtractor } from '@/infrastructure/ai/ai-spec-extractor';
import { getLanguageModel } from '@/infrastructure/ai/model-provider';
import { DrawingIngestAdapter } from '@/infrastructure/ingest/drawing-ingest';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';

/**
 * Extraction accuracy eval.
 *
 * Measures field-level accuracy of the LLM extractor against hand-labelled real
 * drawings — the difference between "it looks right" and a number you can defend.
 * Labels live in cases.json; drawings live locally in ./samples (gitignored), so
 * point EVAL_DIR at wherever you keep them. Run with `npm run eval`.
 */

// Load .env.local so the provider key is available (vitest doesn't do this).
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  // no .env.local — rely on the ambient environment
}

interface EvalCase {
  file: string;
  mediaType: string;
  label: string;
  expect: Record<string, unknown>;
}

const EVAL_DIR = process.env.EVAL_DIR || resolve(process.cwd(), 'samples');
const cases: EvalCase[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('./cases.json', import.meta.url)), 'utf8'),
);

describe('extraction accuracy eval', () => {
  it('measures field-level accuracy on labelled real drawings', async () => {
    const extractor = new AiSpecExtractor(getLanguageModel());
    const ingest = new DrawingIngestAdapter();

    let total = 0;
    let correct = 0;
    const rows: { file: string; score: string; fails: string }[] = [];
    const perCheck: Record<string, { ok: number; n: number }> = {};

    for (const c of cases) {
      let bytes: Buffer;
      try {
        bytes = readFileSync(resolve(EVAL_DIR, c.file));
      } catch {
        console.warn(`SKIP (drawing not found in ${EVAL_DIR}): ${c.file}`);
        continue;
      }
      const artifact = await ingest.toArtifact({
        bytes: new Uint8Array(bytes),
        mediaType: c.mediaType,
        fileName: c.file,
      });
      const spec = await extractor.extract(artifact);
      const checks = scoreCase(spec, c.expect);
      const caseCorrect = checks.filter((x) => x.ok).length;
      total += checks.length;
      correct += caseCorrect;
      for (const ch of checks) {
        perCheck[ch.name] ??= { ok: 0, n: 0 };
        perCheck[ch.name].n++;
        if (ch.ok) perCheck[ch.name].ok++;
      }
      rows.push({
        file: c.file,
        score: `${caseCorrect}/${checks.length}`,
        fails: checks.filter((x) => !x.ok).map((x) => x.name).join(', ') || '—',
      });
    }

    const acc = total ? correct / total : 0;
    const model = `${process.env.AI_PROVIDER || 'google'}:${process.env.AI_MODEL || 'gemini-3.5-flash'}`;
    console.log('\n=== Extraction accuracy eval ===');
    console.log(`Model: ${model}`);
    console.table(rows);
    console.log(
      `Overall field accuracy: ${(acc * 100).toFixed(1)}%  (${correct}/${total} across ${rows.length} drawings)`,
    );
    console.log(
      'Per-check:',
      Object.fromEntries(Object.entries(perCheck).map(([k, v]) => [k, `${v.ok}/${v.n}`])),
    );

    try {
      writeFileSync(
        resolve(process.cwd(), 'eval', 'last-run.json'),
        JSON.stringify(
          { model, accuracyPct: +(acc * 100).toFixed(1), correct, total, drawings: rows.length, rows, perCheck },
          null,
          2,
        ),
      );
    } catch {
      // reporting only
    }

    expect(rows.length, 'no drawings found — set EVAL_DIR or add them to ./samples').toBeGreaterThan(0);
    expect(acc, 'extraction accuracy regressed below 80%').toBeGreaterThanOrEqual(0.8);
  });
});

interface Check {
  name: string;
  ok: boolean;
}

function scoreCase(spec: ExtractedSpec, exp: Record<string, unknown>): Check[] {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean) => checks.push({ name, ok });
  const has = (s: string | null, sub: string) => !!s && s.toLowerCase().includes(sub.toLowerCase());

  if (exp.process) add('process', spec.process === exp.process);
  if (exp.units) add('units', spec.units === exp.units);
  if (exp.materialNull) add('material=null', spec.material === null);
  if (exp.materialContains) add(`material~${exp.materialContains}`, has(spec.material, exp.materialContains as string));
  if (exp.overallDimensionsMm) add('overallDims', dimsMatch(spec.overallDimensionsMm, exp.overallDimensionsMm as number[], 0.05));
  if (Array.isArray(exp.surfaceFinishesContain)) {
    for (const f of exp.surfaceFinishesContain as string[]) {
      add(`finish~${f}`, spec.surfaceFinishes.some((s) => s.includes(f)));
    }
  }
  if (exp.finishingPresent) add('finishing', spec.finishing !== null);
  if (exp.titleBlockPartNumberNull) add('partNumber=null', spec.titleBlock.partNumber === null);
  if (exp.titleBlockPartNumberContains) add(`partNumber~${exp.titleBlockPartNumberContains}`, has(spec.titleBlock.partNumber, exp.titleBlockPartNumberContains as string));
  if (exp.titleBlockRevision) add('revision', spec.titleBlock.revision === exp.titleBlockRevision);
  if (exp.titleBlockTitleContains) add(`title~${exp.titleBlockTitleContains}`, has(spec.titleBlock.title, exp.titleBlockTitleContains as string));
  if (exp.ambiguitiesEmpty) add('no-ambiguities', spec.ambiguities.length === 0);

  return checks;
}

function dimsMatch(got: readonly number[] | null, exp: number[], tol: number): boolean {
  if (!got || got.length !== exp.length) return false;
  const g = [...got].sort((a, b) => b - a);
  const e = [...exp].sort((a, b) => b - a);
  return g.every((v, i) => Math.abs(v - e[i]) <= e[i] * tol);
}
