import React from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

export type NoticeSeverity = 'info' | 'warning' | 'flagged' | 'success';

interface NoticeBannerProps {
  severity?: NoticeSeverity;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function NoticeBanner({
  severity = 'info',
  title,
  children,
  action,
}: NoticeBannerProps) {
  const styles: Record<
    NoticeSeverity,
    { border: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      border: 'border-l-[var(--accent)]',
      bg: 'bg-[var(--accent-soft)]/40',
      text: 'text-[var(--accent)]',
      icon: <Info className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />,
    },
    warning: {
      border: 'border-l-[var(--notice)]',
      bg: 'bg-[var(--notice)]/10',
      text: 'text-[var(--notice)]',
      icon: <AlertTriangle className="w-4 h-4 text-[var(--notice)] flex-shrink-0" />,
    },
    flagged: {
      border: 'border-l-[var(--flagged)]',
      bg: 'bg-[var(--flagged)]/10',
      text: 'text-[var(--flagged)]',
      icon: <AlertCircle className="w-4 h-4 text-[var(--flagged)] flex-shrink-0" />,
    },
    success: {
      border: 'border-l-[var(--verified)]',
      bg: 'bg-[var(--verified)]/10',
      text: 'text-[var(--verified)]',
      icon: <CheckCircle className="w-4 h-4 text-[var(--verified)] flex-shrink-0" />,
    },
  };

  const current = styles[severity];

  return (
    <div
      className={`p-4 rounded-r-xl border border-l-4 border-[var(--rule)] ${current.border} ${current.bg} text-xs sm:text-sm text-[var(--ink)] leading-relaxed space-y-1.5`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{current.icon}</span>
        <div className="flex-1">
          {title && (
            <div className={`font-semibold ${current.text} text-xs uppercase tracking-wider mb-0.5`}>
              {title}
            </div>
          )}
          <div className="text-[var(--ink)]">{children}</div>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
