'use client';

import * as React from 'react';
import { ShoppingBag, Sparkles, Edit2, Trash2 } from 'lucide-react';

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden flex flex-col justify-between shadow-2xs select-none">
      <div>
        {/* Product Image Area Placeholder */}
        <div className="relative aspect-4/3 bg-[var(--bg-hover)]/60 overflow-hidden flex items-center justify-center skeleton-shimmer">
          <ShoppingBag className="w-10 h-10 text-[var(--text-secondary)]/20" />

          {/* Top overlay category badge */}
          <div className="absolute top-2 left-2">
            <div className="h-4 w-16 rounded bg-[var(--bg-card)]/80 skeleton-shimmer" />
          </div>
        </div>

        {/* Card Info */}
        <div className="p-4 space-y-2">
          {/* Price & Stock status */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-20 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            <div className="h-3.5 w-16 rounded bg-[var(--bg-hover)]/70 skeleton-shimmer" />
          </div>

          {/* Title */}
          <div className="h-3.5 w-3/4 rounded bg-[var(--bg-hover)] skeleton-shimmer" />

          {/* Tagline lines */}
          <div className="space-y-1 pt-0.5">
            <div className="h-2.5 w-full rounded bg-[var(--bg-hover)]/60 skeleton-shimmer" />
            <div className="h-2.5 w-4/5 rounded bg-[var(--bg-hover)]/60 skeleton-shimmer" />
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-1 pt-1">
            <div className="h-3.5 w-16 rounded bg-[var(--bg-hover)] border border-[var(--border-subtle)] skeleton-shimmer" />
            <div className="h-3.5 w-20 rounded bg-[var(--bg-hover)] border border-[var(--border-subtle)] skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/40 flex items-center justify-between gap-1.5">
        <div className="flex-1 py-1.5 px-2.5 rounded-md bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 skeleton-shimmer flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[var(--brand-primary)]/40" />
          <div className="h-2.5 w-16 rounded bg-[var(--brand-primary)]/30 skeleton-shimmer" />
        </div>

        <div className="p-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-[var(--text-secondary)]/30 skeleton-shimmer">
          <Edit2 className="w-3.5 h-3.5" />
        </div>

        <div className="p-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-[var(--text-secondary)]/30 skeleton-shimmer">
          <Trash2 className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
