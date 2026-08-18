'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function Sheet({ isOpen, onClose, title, subtitle, children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Focus sheet or first interactive element
      setTimeout(() => {
        sheetRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="sheet-title"
    >
      <div
        ref={sheetRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-[var(--paper-raised)] text-[var(--ink)] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[var(--rule)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 focus:outline-none"
      >
        {/* Sheet Grab Handle / Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--rule)] bg-[var(--paper-raised)]">
          <div>
            <h2 id="sheet-title" className="text-xl font-semibold font-serif text-[var(--ink)] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--ink-muted)] mt-0.5 tracking-wide">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/40 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Content Scrollable Area */}
        <div className="px-6 py-5 overflow-y-auto overscroll-contain space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
