import type { Metadata, Viewport } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PersonaProvider } from '@/components/PersonaProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContextSheet from '@/components/ContextSheet';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Digital Muse — Adaptive Indian Museum Discovery & Heritage Lineage',
  description:
    'Audience-adapted museum interpretation, mathematical claim verification, spatial heritage discovery, and ancestral roots across Indian museums.',
};

export const viewport: Viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)] antialiased flex flex-col selection:bg-[var(--accent-soft)] selection:text-[var(--accent-patina)] overflow-x-hidden">
        <PersonaProvider>
          {/* Top Sticky Editorial Navigation Bar */}
          <Navbar />

          {/* Main Content Surface */}
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Institutional Museum Colophon Footer */}
          <Footer />

          {/* Global Audience Persona Selection Sheet */}
          <ContextSheet />
        </PersonaProvider>
      </body>
    </html>
  );
}
