'use client';

import type { ReactNode } from 'react';
import { Progress } from 'antd';
import { CheckCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';
import type { CheckStatus, ReadinessGrade, ReadinessReport } from '@/core/domain/entities/readiness';
import DrawingPreview from './drawing-preview';
import ModelViewer from './model-viewer';

const STATUS_ICON: Record<CheckStatus, ReactNode> = {
  pass: <CheckCircleFilled />,
  warn: <WarningFilled />,
  fail: <CloseCircleFilled />,
};

const GRADE_LABEL: Record<ReadinessGrade, string> = {
  ready: 'Supplier-ready',
  needs_work: 'Needs work',
  not_ready: 'Not ready',
};

export function ReadinessReportView({
  report,
  fileName,
  drawingFile,
  cadFile,
}: {
  report: ReadinessReport;
  fileName: string | null;
  drawingFile?: File | null;
  cadFile?: File | null;
}) {
  const ringColor =
    report.score >= 80 ? '#01b39e' : report.score >= 50 ? '#e8950c' : '#e5484d';

  return (
    <div className="pf-stack">
      {(drawingFile || cadFile) && (
        <section className="pf-preview-row">
          {drawingFile && (
            <div className="pf-preview-card">
              <div className="pf-preview-head">Drawing</div>
              <DrawingPreview file={drawingFile} />
            </div>
          )}
          {cadFile && (
            <div className="pf-preview-card">
              <div className="pf-preview-head">3D model</div>
              <ModelViewer file={cadFile} />
            </div>
          )}
        </section>
      )}

      {/* score */}
      <section className="pf-card">
        <div className="pf-hero">
          <div className="pf-gauge">
            <Progress
              type="circle"
              percent={report.score}
              size={132}
              strokeWidth={9}
              railColor="#eef2f3"
              strokeColor={ringColor}
              format={() => (
                <div>
                  <div className="pf-gauge-num">{report.score}</div>
                  <div className="pf-gauge-cap">/ 100</div>
                </div>
              )}
            />
          </div>
          <div className="pf-hero-body">
            <div className="pf-hero-row">
              <span className="pf-hero-title">Quote-readiness</span>
              <span className={`pf-grade ${report.grade}`}>{GRADE_LABEL[report.grade]}</span>
            </div>
            <p className="pf-summary">{report.summary}</p>
            {fileName && <div className="pf-file">{fileName}</div>}
          </div>
        </div>
      </section>

      {/* consistency */}
      <section className="pf-card">
        <div className="pf-card-head">
          <span className="pf-card-title">Drawing ↔ Model consistency</span>
          <span className="pf-card-note">checks the drawing against the STEP geometry</span>
        </div>
        <Consistency consistency={report.consistency} />
      </section>

      {/* extracted requirements */}
      <section className="pf-card">
        <div className="pf-card-head">
          <span className="pf-card-title">Extracted requirements</span>
        </div>
        <Chips spec={report.spec} />
      </section>

      {/* checklist */}
      <section className="pf-card">
        <div className="pf-card-head">
          <span className="pf-card-title">Readiness checklist</span>
        </div>
        {report.checks.map((c) => (
          <div className="pf-check" key={c.id}>
            <span className={`pf-check-ic ${c.status}`}>{STATUS_ICON[c.status]}</span>
            <div className="pf-check-body">
              <div className="pf-check-label">{c.label}</div>
              <div className="pf-check-detail">{c.detail}</div>
            </div>
            <span className="pf-pts">{c.weight} pts</span>
          </div>
        ))}
      </section>

      {/* DFM risks */}
      <section className="pf-card">
        <div className="pf-card-head">
          <span className="pf-card-title">DFM risk flags</span>
          <span className="pf-card-note">heuristic — confirm with supplier</span>
        </div>
        {report.risks.length === 0 ? (
          <div className="pf-empty">No high-confidence manufacturability risks flagged.</div>
        ) : (
          report.risks.map((r, i) => (
            <div className={`pf-risk ${r.severity}`} key={`risk-${i}`}>
              <div className="pf-risk-top">
                <span className="pf-risk-title">{r.title}</span>
                <span className={`pf-sev ${r.severity}`}>{r.severity}</span>
              </div>
              <div className="pf-risk-detail">{r.rationale}</div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const CONSISTENCY_META: Record<
  ReadinessReport['consistency']['status'],
  { cls: string; icon: string; title: string }
> = {
  match: { cls: 'match', icon: '✓', title: 'Drawing matches the model' },
  mismatch: { cls: 'bad', icon: '✕', title: 'Drawing and model disagree' },
  units_suspect: { cls: 'bad', icon: '!', title: 'Possible inch / mm units mismatch' },
  insufficient: { cls: 'warn', icon: '?', title: 'Not enough to compare' },
  no_model: { cls: 'neutral', icon: '+', title: 'No CAD model uploaded' },
};

function Consistency({ consistency }: { consistency: ReadinessReport['consistency'] }) {
  const m = CONSISTENCY_META[consistency.status];
  return (
    <>
      <div className={`pf-banner ${m.cls}`}>
        <span className="pf-banner-ic">{m.icon}</span>
        <div>
          <div className="pf-banner-title">{m.title}</div>
          <div className="pf-banner-detail">{consistency.detail}</div>
        </div>
      </div>
      {consistency.modelDimsMm && (
        <div className="pf-dims">
          <div className="pf-dim">
            <div className="pf-dim-label">Drawing</div>
            <div className="pf-dim-val">
              {consistency.drawingDimsMm ? `${consistency.drawingDimsMm.join(' × ')} mm` : '—'}
            </div>
          </div>
          <div className="pf-dim-sep">{consistency.status === 'match' ? '≈' : '≠'}</div>
          <div className="pf-dim">
            <div className="pf-dim-label">Model (STEP bbox)</div>
            <div className="pf-dim-val">{`${consistency.modelDimsMm.join(' × ')} mm`}</div>
          </div>
        </div>
      )}
    </>
  );
}

function Chips({ spec }: { spec: ExtractedSpec }) {
  const items: string[] = [labelProcess(spec.process)];
  if (spec.material) items.push(spec.material);
  if (spec.units !== 'unspecified') items.push(spec.units);
  if (spec.overallDimensionsMm) items.push(`${spec.overallDimensionsMm.join(' × ')} mm`);
  spec.tolerances.forEach((t) => items.push(t.hasDatum ? t.value : `${t.value} (no datum)`));
  spec.surfaceFinishes.forEach((s) => items.push(s));
  if (spec.finishing) items.push(spec.finishing);

  if (items.length <= 1 && spec.process === 'unknown') {
    return <div className="pf-empty">No structured requirements detected.</div>;
  }
  return (
    <div className="pf-chips">
      {items.map((t, i) => (
        <span className="pf-chip" key={`${t}-${i}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

function labelProcess(p: ExtractedSpec['process']): string {
  const labels: Record<ExtractedSpec['process'], string> = {
    cnc_machining: 'CNC machining',
    sheet_metal: 'Sheet metal',
    '3d_printing': '3D printing',
    injection_molding: 'Injection molding',
    unknown: 'Process: unknown',
  };
  return labels[p];
}
