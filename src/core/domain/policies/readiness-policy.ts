import type { ExtractedSpec, ManufacturingProcess } from '../entities/extracted-spec';
import type {
  CheckStatus,
  ConsistencyResult,
  ReadinessCheck,
  ReadinessGrade,
  ReadinessReport,
  RiskFlag,
} from '../entities/readiness';

/**
 * ReadinessPolicy is a pure domain service. It encodes Jiga's real bottleneck:
 * incomplete or ambiguous RFQs force supplier back-and-forth, which slows the
 * human-reviewed quote. Each check reads a *fact* off the extracted spec — not an
 * estimate — so the score holds up to a manufacturing expert.
 *
 * No framework, no I/O, no LLM. 100% unit-testable.
 */
export class ReadinessPolicy {
  evaluate(
    spec: ExtractedSpec,
    risks: readonly RiskFlag[],
    consistency: ConsistencyResult,
  ): ReadinessReport {
    const checks = this.buildChecks(spec);
    const score = this.scoreOf(checks);
    const grade: ReadinessGrade =
      score >= 80 ? 'ready' : score >= 50 ? 'needs_work' : 'not_ready';
    return {
      score,
      grade,
      checks,
      risks,
      consistency,
      spec,
      summary: this.summarize(grade, checks),
    };
  }

  private buildChecks(spec: ExtractedSpec): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    checks.push(
      this.check('material', 'Material specified', 15,
        spec.material !== null
          ? ['pass', `Material: ${spec.material}.`]
          : ['fail', 'No material called out — suppliers cannot quote without it.']),
    );

    const hasTol = spec.tolerances.length > 0;
    checks.push(
      this.check('tolerances', 'Dimensional tolerances present', 15,
        hasTol
          ? ['pass', `${spec.tolerances.length} tolerance callout(s) found.`]
          : ['fail', 'No tolerances found — suppliers assume defaults, which causes re-quotes.']),
    );

    // The datum check is only meaningful once tolerances exist.
    if (!hasTol) {
      checks.push(this.check('datums', 'Tight tolerances reference a datum', 15,
        ['warn', 'Add tolerances first, then anchor the tight ones to a datum.']));
    } else {
      const withDatum = spec.tolerances.filter((t) => t.hasDatum).length;
      const missing = spec.tolerances.length - withDatum;
      const status: CheckStatus =
        missing === 0 ? 'pass' : withDatum > 0 ? 'warn' : 'fail';
      checks.push(this.check('datums', 'Tight tolerances reference a datum', 15, [status,
        missing === 0
          ? 'Tolerances are anchored to datums.'
          : `${missing} tolerance(s) lack a datum reference — ambiguous for inspection.`]));
    }

    checks.push(
      this.check('units', 'Units are explicit', 10,
        spec.units !== 'unspecified'
          ? ['pass', `Units: ${spec.units}.`]
          : ['fail', 'Units not stated (mm vs inch) — a costly ambiguity.']),
    );

    checks.push(
      this.check('finish', 'Surface finish specified', 10,
        spec.surfaceFinishes.length > 0
          ? ['pass', `Finish: ${spec.surfaceFinishes.join(', ')}.`]
          : ['warn', 'No surface finish — confirm whether functional surfaces need one.']),
    );

    checks.push(
      this.check('process', 'Manufacturing process inferable', 10,
        spec.process !== 'unknown'
          ? ['pass', `Process: ${this.processLabel(spec.process)}.`]
          : ['warn', 'Process is not obvious — state it so the RFQ reaches the right suppliers.']),
    );

    const tb = spec.titleBlock;
    const tbStatus: CheckStatus =
      tb.partNumber && tb.revision ? 'pass' : tb.partNumber || tb.revision ? 'warn' : 'fail';
    checks.push(
      this.check('title_block', 'Title block: part no. + revision', 10, [tbStatus,
        tbStatus === 'pass'
          ? `P/N ${tb.partNumber}, Rev ${tb.revision}.`
          : 'Missing part number and/or revision — needed for traceability and re-orders.']),
    );

    checks.push(
      this.check('ambiguities', 'No conflicting / ambiguous callouts', 5,
        spec.ambiguities.length === 0
          ? ['pass', 'No conflicting callouts detected.']
          : ['fail', `Ambiguities: ${spec.ambiguities.join('; ')}`]),
    );

    return checks;
  }

  private check(
    id: string,
    label: string,
    weight: number,
    [status, detail]: [CheckStatus, string],
  ): ReadinessCheck {
    return { id, label, status, detail, weight };
  }

  private scoreOf(checks: readonly ReadinessCheck[]): number {
    const total = checks.reduce((s, c) => s + c.weight, 0);
    const earned = checks.reduce(
      (s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0),
      0,
    );
    return total === 0 ? 0 : Math.round((earned / total) * 100);
  }

  private summarize(grade: ReadinessGrade, checks: readonly ReadinessCheck[]): string {
    const gaps = checks.filter((c) => c.status !== 'pass');
    if (grade === 'ready') {
      return 'Supplier-ready — this RFQ should come back with quotes fast.';
    }
    const top = gaps.slice(0, 3).map((c) => c.label.toLowerCase());
    return `Close ${gaps.length} gap(s) for a faster quote — start with ${top.join(', ')}.`;
  }

  private processLabel(p: ManufacturingProcess): string {
    const labels: Record<ManufacturingProcess, string> = {
      cnc_machining: 'CNC machining',
      sheet_metal: 'Sheet metal',
      '3d_printing': '3D printing',
      injection_molding: 'Injection molding',
      unknown: 'Unknown',
    };
    return labels[p];
  }
}
