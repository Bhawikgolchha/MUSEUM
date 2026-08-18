import React from 'react';
import { Eye } from 'lucide-react';

interface LookCloserListProps {
  items: string[];
}

export default function LookCloserList({ items }: LookCloserListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[var(--accent-soft)]/40 border border-[var(--accent)]/20 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
        <Eye className="w-4 h-4" />
        <span>Look Closely At The Object</span>
      </div>
      <ol className="space-y-2 text-xs sm:text-sm text-[var(--ink)] list-decimal list-inside leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx} className="pl-1">
            <span className="font-medium">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
