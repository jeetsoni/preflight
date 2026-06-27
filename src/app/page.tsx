'use client';

import { useRef, useState } from 'react';
import { Upload, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { ReadinessReport } from '@/core/domain/entities/readiness';
import { AppHeader } from './components/app-header';
import { ReadinessReportView } from './components/readiness-report-view';

const { Dragger } = Upload;

const DRAWING_RE = /\.(pdf|png|jpe?g|webp)$/i;
const CAD_RE = /\.(step|stp)$/i;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // antd's Dragger fires beforeUpload once per file; batch them into one request.
  const batch = useRef<File[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function queue(file: File) {
    batch.current.push(file);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const files = batch.current;
      batch.current = [];
      void analyze(files);
    }, 60);
  }

  async function analyze(files: File[]) {
    const drawing = files.find((f) => DRAWING_RE.test(f.name));
    const cad = files.find((f) => CAD_RE.test(f.name));
    if (!drawing) {
      setError('Please include a drawing (PDF, PNG or JPEG). You can drop a STEP model alongside it.');
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    setFileName(cad ? `${drawing.name}  +  ${cad.name}` : drawing.name);
    try {
      const fd = new FormData();
      fd.append('file', drawing);
      if (cad) fd.append('cad', cad);
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed.');
      setReport(data as ReadinessReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setReport(null);
    setError(null);
    setFileName(null);
  }

  return (
    <>
      <AppHeader />
      <main className="pf-main">
        {!report && !loading && (
          <>
            <h1 className="pf-h1">Is your drawing ready to quote?</h1>
            <p className="pf-sub">
              Drop a 2D engineering drawing — and optionally its STEP model. Get an instant
              quote-readiness score, a checklist of exactly what&apos;s missing, a drawing↔model
              consistency check, and conservative DFM risk flags. In seconds, before you talk to a
              supplier.
            </p>
            <div className="pf-drop">
              <Dragger
                multiple
                showUploadList={false}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.step,.stp"
                beforeUpload={(file) => {
                  queue(file as unknown as File);
                  return false;
                }}
              >
                <div className="pf-drop-ic">
                  <InboxOutlined />
                </div>
                <div className="pf-drop-title">Click or drag your drawing here</div>
                <div className="pf-drop-hint">
                  PDF / PNG · add the STEP model for a drawing↔CAD cross-check · nothing is stored
                </div>
              </Dragger>
            </div>
            {error && (
              <div className="pf-banner bad" style={{ marginTop: 16 }}>
                <span className="pf-banner-ic">!</span>
                <div>
                  <div className="pf-banner-title">Couldn&apos;t analyze that file</div>
                  <div className="pf-banner-detail">{error}</div>
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="pf-loading">
            <div className="pf-spinner" />
            <ul className="pf-steps">
              <li>Reading drawing</li>
              <li>Extracting requirements</li>
              <li>Checking readiness</li>
              <li>Cross-checking model</li>
            </ul>
            {fileName && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{fileName}</div>}
          </div>
        )}

        {report && !loading && (
          <>
            <div className="pf-report-head">
              <h2 className="pf-report-title">Pre-Flight report</h2>
              <Button onClick={reset}>Analyze another</Button>
            </div>
            <ReadinessReportView report={report} fileName={fileName} />
          </>
        )}
      </main>
    </>
  );
}
