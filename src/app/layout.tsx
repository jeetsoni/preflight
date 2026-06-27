import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pre-Flight — instant quote-readiness for engineering drawings',
  description:
    'Drop an engineering drawing and get an instant quote-readiness score, a missing-spec checklist, and DFM risk flags — before you ever talk to a supplier.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
