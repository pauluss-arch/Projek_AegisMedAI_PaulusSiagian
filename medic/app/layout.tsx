import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'AegisMed AI — Clinical Decision Support System',
  description: 'Clinical decision support for differential diagnosis, rare disease exploration, and antibiotic stewardship.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
