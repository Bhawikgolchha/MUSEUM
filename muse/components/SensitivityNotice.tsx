'use client';

import React from 'react';
import { AlertTriangle, Shield, Check } from 'lucide-react';

interface SensitivityNoticeProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  noticeText: string;
  museumName: string;
}

export default function SensitivityNotice({
  isOpen,
  onAcknowledge,
  noticeText,
  museumName,
}: SensitivityNoticeProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sensitivity-title"
    >
      <div className="w-full max-w-lg bg-[var(--paper-raised)] text-[var(--ink)] rounded-2xl p-6 sm:p-8 shadow-2xl border-l-4 border-l-[var(--notice)] border border-[var(--rule)] space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--notice)]/15 text-[var(--notice)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="sensitivity-title" className="text-lg font-serif font-semibold text-[var(--ink)]">
              Cultural &amp; Provenance Notice
            </h2>
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
              Official Statement from {museumName}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--rule)] text-xs sm:text-sm text-[var(--ink)] leading-relaxed space-y-2">
          <p className="font-serif italic text-base sm:text-lg text-[var(--ink)]">
            &ldquo;{noticeText}&rdquo;
          </p>
        </div>

        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
          Digital Muse reproduces sensitive acquisition and provenance notices verbatim to ensure full institutional transparency.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full py-3.5 px-5 rounded-xl font-medium text-sm bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink)]/90 transition-colors shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>Acknowledge &amp; View Artifact</span>
          </button>
        </div>
      </div>
    </div>
  );
}
