import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { PersonaProvider } from '@/components/PersonaProvider';
import PersonaChip from '@/components/PersonaChip';
import ContextSheet from '@/components/ContextSheet';
import Link from 'next/link';
import { Sparkles, PlusCircle, Compass, Grid, Heart } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Muse — Adaptive Museum Interpretation & Heritage Roots',
  description: 'Audience-adapted museum interpretation, spatial discovery, and cultural lineage connection across museums in India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen bg-[var(--paper)] text-[var(--ink)] antialiased flex flex-col selection:bg-[var(--accent-soft)] selection:text-[var(--accent)]">
        <PersonaProvider>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-[var(--paper)]/90 backdrop-blur-md border-b border-[var(--rule)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
              {/* Logo / Brand */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2.5 group focus-visible:outline-none">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:scale-105 transition-transform">
                    M
                  </div>
                  <div>
                    <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)] block leading-none">
                      MUSE
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--ink-muted)] tracking-wider uppercase font-medium">
                      Adaptive Interpretation
                    </span>
                  </div>
                </Link>

                {/* Main Navigation Links */}
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Collection</span>
                  </Link>

                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Find Museums</span>
                  </Link>

                  <Link
                    href="/roots"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)]/60 hover:bg-[var(--accent-soft)] transition-colors border border-[var(--accent)]/20"
                  >
                    <Heart className="w-3.5 h-3.5 fill-[var(--accent)] text-[var(--accent)]" />
                    <span>Connect to Roots</span>
                  </Link>
                </nav>
              </div>

              {/* Header Right: Persona Chip + Curator Add Link */}
              <div className="flex items-center gap-2 sm:gap-3">
                <PersonaChip />

                <Link
                  href="/add"
                  aria-label="Add artifact / Curator demo"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors border border-[var(--rule)] min-h-[44px]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Curator Ingest</span>
                </Link>
              </div>
            </div>

            {/* Mobile Navigation Strip */}
            <div className="md:hidden flex items-center justify-around border-t border-[var(--rule)]/60 py-2 bg-[var(--paper-raised)] px-2 text-xs font-semibold">
              <Link
                href="/"
                className="flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)] py-1 px-1.5"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Collection</span>
              </Link>
              <Link
                href="/explore"
                className="flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)] py-1 px-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Museums</span>
              </Link>
              <Link
                href="/roots"
                className="flex items-center gap-1 text-[var(--accent)] font-bold py-1 px-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-[var(--accent)] text-[var(--accent)]" />
                <span>Roots</span>
              </Link>
              <Link
                href="/add"
                className="flex items-center gap-1 text-[var(--ink-muted)] hover:text-[var(--ink)] py-1 px-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add</span>
              </Link>
            </div>
          </header>

          {/* Main Content Surface */}
          <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </main>

          {/* Global Footer */}
          <footer className="mt-auto border-t border-[var(--rule)] bg-[var(--paper-raised)] py-6 text-xs text-[var(--ink-muted)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>
                  <strong>Digital Muse</strong> · Adaptive Museum Interpretation &amp; Heritage Lineage.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/roots" className="hover:text-[var(--accent)] transition-colors">
                  Lineage &amp; Living Roots
                </Link>
                <span>·</span>
                <Link href="/explore" className="hover:text-[var(--accent)] transition-colors">
                  Museum Directory
                </Link>
                <span>·</span>
                <span>Factual fidelity mathematically verified.</span>
              </div>
            </div>
          </footer>

          {/* Global Persona Selection Sheet */}
          <ContextSheet />
        </PersonaProvider>
      </body>
    </html>
  );
}
