import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Methodz AI Core',
  description: 'Persistent multi-provider intelligence workspace — Methodz ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
