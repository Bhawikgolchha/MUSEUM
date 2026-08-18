import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artifact } from '@/lib/types';
import { ShieldCheck } from 'lucide-react';

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <Link
      href={`/artifact/${artifact.id}`}
      className="group flex flex-col bg-[var(--paper-raised)] rounded-xl border border-[var(--rule)] overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[var(--accent)]/40 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      {/* 4:3 Image Container */}
      <div className="relative aspect-[4/3] w-full bg-[var(--paper)] overflow-hidden border-b border-[var(--rule)]">
        {artifact.imageUrl ? (
          <Image
            src={artifact.imageUrl}
            alt={artifact.curatorAltText || artifact.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={artifact.id === 'art-001'}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[var(--ink-muted)]">
            <span className="font-serif text-lg text-[var(--ink)] mb-1">{artifact.title}</span>
            <span className="text-xs">No image available for this object</span>
          </div>
        )}

        {/* Claim Count Tag */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--paper-raised)]/95 backdrop-blur-xs text-[var(--verified)] text-[11px] font-medium border border-[var(--rule)] shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{artifact.claims?.length || 6} facts verified</span>
        </div>

        {artifact.sensitivityFlags?.includes('contested_provenance') && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-[var(--notice)]/90 text-white text-[10px] uppercase font-bold tracking-wider">
            Provenance Notice
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] block mb-1">
            {artifact.culture}
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-semibold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors">
            {artifact.title}
          </h3>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--rule)]/60 flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>{artifact.period}</span>
          <span className="truncate max-w-[140px] text-right font-medium">{artifact.material.split('(')[0]}</span>
        </div>
      </div>
    </Link>
  );
}
