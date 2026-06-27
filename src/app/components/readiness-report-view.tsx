'use client';

import type { ReactNode } from 'react';
import { Card, Progress, Tag, Alert, Typography, Flex, Space } from 'antd';
import { CheckCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ExtractedSpec } from '@/core/domain/entities/extracted-spec';
import type {
  CheckStatus,
  ReadinessGrade,
  ReadinessReport,
  RiskSeverity,
} from '@/core/domain/entities/readiness';

const { Title, Text, Paragraph } = Typography;

const STATUS_META: Record<CheckStatus, { icon: ReactNode }> = {
  pass: { icon: <CheckCircleFilled style={{ color: '#01b39e' }} /> },
  warn: { icon: <WarningFilled style={{ color: '#faad14' }} /> },
  fail: { icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> },
};

const SEVERITY_TYPE: Record<RiskSeverity, 'info' | 'warning' | 'error'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
};

const GRADE_META: Record<ReadinessGrade, { text: string; color: 'success' | 'warning' | 'error' }> = {
  ready: { text: 'Supplier-ready', color: 'success' },
  needs_work: { text: 'Needs work', color: 'warning' },
  not_ready: { text: 'Not ready', color: 'error' },
};

export function ReadinessReportView({
  report,
  fileName,
}: {
  report: ReadinessReport;
  fileName: string | null;
}) {
  const grade = GRADE_META[report.grade];
  const scoreColor = report.score >= 80 ? '#01b39e' : report.score >= 50 ? '#faad14' : '#ff4d4f';
  const spec = report.spec;

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex align="center" gap={28} wrap>
          <Progress
            type="circle"
            percent={report.score}
            size={120}
            strokeColor={scoreColor}
            format={(p) => <span style={{ fontSize: 26, fontWeight: 700 }}>{p}</span>}
          />
          <Flex vertical gap={6} style={{ flex: 1, minWidth: 240 }}>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                Quote-readiness
              </Title>
              <Tag color={grade.color}>{grade.text}</Tag>
            </Space>
            <Paragraph style={{ margin: 0, fontSize: 15 }}>{report.summary}</Paragraph>
            {fileName && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {fileName}
              </Text>
            )}
          </Flex>
        </Flex>
      </Card>

      <Card title="Extracted requirements" size="small">
        <Space size={[8, 8]} wrap>
          <Tag color="#01b39e">{labelProcess(spec.process)}</Tag>
          {spec.material && <Tag color="#01b39e">{spec.material}</Tag>}
          {spec.quantity != null && <Tag color="#01b39e">Qty {spec.quantity}</Tag>}
          {spec.units !== 'unspecified' && <Tag color="#01b39e">{spec.units}</Tag>}
          {spec.tolerances.map((t, i) => (
            <Tag key={`tol-${i}`} color="#01b39e">
              {t.value}
              {t.hasDatum ? '' : ' (no datum)'}
            </Tag>
          ))}
          {spec.surfaceFinishes.map((s, i) => (
            <Tag key={`fin-${i}`} color="#01b39e">
              {s}
            </Tag>
          ))}
          {spec.finishing && <Tag color="#01b39e">{spec.finishing}</Tag>}
          {isSpecEmpty(spec) && <Text type="secondary">No structured requirements detected.</Text>}
        </Space>
      </Card>

      <Card title="Readiness checklist" size="small">
        <Flex vertical>
          {report.checks.map((c, i) => (
            <div
              key={c.id}
              style={{
                padding: '12px 0',
                borderBottom: i < report.checks.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <Flex gap={12} align="flex-start" style={{ width: '100%' }}>
                <span style={{ fontSize: 18, lineHeight: '22px' }}>{STATUS_META[c.status].icon}</span>
                <Flex vertical style={{ flex: 1 }}>
                  <Text strong>{c.label}</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {c.detail}
                  </Text>
                </Flex>
                <Tag>{c.weight} pts</Tag>
              </Flex>
            </div>
          ))}
        </Flex>
      </Card>

      <Card
        title="DFM risk flags"
        size="small"
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            heuristic — confirm with supplier
          </Text>
        }
      >
        {report.risks.length === 0 ? (
          <Text type="secondary">No high-confidence manufacturability risks flagged.</Text>
        ) : (
          <Flex vertical gap={8}>
            {report.risks.map((r, i) => (
              <Alert
                key={`risk-${i}`}
                type={SEVERITY_TYPE[r.severity]}
                showIcon
                title={
                  <Text strong>
                    {r.title}
                    <Tag style={{ marginInlineStart: 6 }}>{r.severity}</Tag>
                  </Text>
                }
                description={r.rationale}
              />
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
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

function isSpecEmpty(s: ExtractedSpec): boolean {
  return (
    s.process === 'unknown' &&
    !s.material &&
    s.quantity == null &&
    s.tolerances.length === 0 &&
    s.surfaceFinishes.length === 0 &&
    !s.finishing
  );
}
