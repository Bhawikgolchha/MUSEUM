import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-2">
        <Landmark className="w-7 h-7" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--ink)]">
        Object Not Found
      </h1>
      <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
        We couldn&apos;t find that artifact in the collection registry. It may have been catalogued under a different accession number or moved.
      </p>
      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Collection</span>
        </Link>
      </div>
    </div>
  );
}
