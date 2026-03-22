import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppShell } from '@/components/app-shell';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UPH Finance',
  description: 'Sistema web para gestão de mensalidades, despesas, doações e fluxo de caixa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
