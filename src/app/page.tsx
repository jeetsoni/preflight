'use client';

import { useRef, useState } from 'react';
import { Upload, Button, Typography, Card, Spin, Alert, Flex } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { ReadinessReport } from '@/core/domain/entities/readiness';
import { AppHeader } from './components/app-header';
import { ReadinessReportView } from './components/readiness-report-view';

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;

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
    setFileName(cad ? `${drawing.name} + ${cad.name}` : drawing.name);
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
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 64px' }}>
        {!report && !loading && (
          <>
            <Title level={2} style={{ marginBottom: 4 }}>
              Is your drawing ready to quote?
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16, marginTop: 0 }}>
              Drop a 2D engineering drawing — and optionally its STEP model. Get an instant
              quote-readiness score, a checklist of exactly what&apos;s missing, a drawing↔model
              consistency check, and conservative DFM risk flags — in seconds, before you talk to a
              supplier.
            </Paragraph>
            <Card style={{ marginTop: 16 }}>
              <Dragger
                multiple
                showUploadList={false}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.step,.stp"
                beforeUpload={(file) => {
                  queue(file as unknown as File);
                  return false;
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag your drawing here</p>
                <p className="ant-upload-hint">
                  PDF / PNG drawing — drop the STEP model too for a drawing↔CAD cross-check · nothing
                  is stored
                </p>
              </Dragger>
            </Card>
            {error && (
              <Alert
                style={{ marginTop: 16 }}
                type="error"
                showIcon
                title="Couldn't analyze that file"
                description={error}
              />
            )}
          </>
        )}

        {loading && (
          <Flex vertical align="center" justify="center" gap={16} style={{ padding: '80px 0' }}>
            <Spin size="large" />
            <Text type="secondary">
              Reading {fileName} — extracting specs, checking readiness…
            </Text>
          </Flex>
        )}

        {report && !loading && (
          <>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>
                Pre-Flight report
              </Title>
              <Button onClick={reset}>Analyze another</Button>
            </Flex>
            <ReadinessReportView report={report} fileName={fileName} />
          </>
        )}
      </main>
    </>
  );
}
