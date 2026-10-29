import type { Metadata } from 'next';
import '../src/index.css';
import { NavLink } from '../src/components/NavLink';

const navigationLinks = [
  { href: '/', label: 'Workspace' },
  { href: '/clinical-tools', label: 'Clinical tools' },
  { href: '/about', label: 'About' },
  { href: '/masuk', label: 'Login' },
];

export const metadata: Metadata = {
  title: 'AegisMed AI — Clinical Decision Support System',
  description: 'Clinical decision support for differential diagnosis, rare disease exploration, and antibiotic stewardship.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-800 bg-[#050819]">
          <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:px-6">
            {navigationLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} />
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
