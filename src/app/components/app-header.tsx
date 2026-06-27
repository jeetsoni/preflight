'use client';

import { Flex, Typography, Tag } from 'antd';

const { Text } = Typography;

export function AppHeader() {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 20px' }}>
      <Flex
        align="center"
        justify="space-between"
        style={{ maxWidth: 960, margin: '0 auto', height: 56 }}
      >
        <Flex align="center" gap={10}>
          <Text strong style={{ fontSize: 20, letterSpacing: -0.4 }}>
            preflight<span style={{ color: '#01b39e' }}>.</span>
          </Text>
          <Tag>instant quote-readiness</Tag>
        </Flex>
        <Text type="secondary" style={{ fontSize: 12 }}>
          built by Jeet · inspired by Jiga&apos;s RFQ flow
        </Text>
      </Flex>
    </header>
  );
}
