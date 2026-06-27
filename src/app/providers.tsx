'use client';

import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { jigaTheme } from './theme';

export function Providers({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={jigaTheme}>{children}</ConfigProvider>;
}
