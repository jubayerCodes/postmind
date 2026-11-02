'use client';

import * as React from 'react';
import { ShoppingBag } from 'lucide-react';

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden flex flex-col justify-between shadow-2xs select-none">
      <div>
        {/* Product Image Area Placeholder (Pure & Quiet) */}
        <div className="relative aspect-4/3 bg-[var(--bg-card-hover)]/30 overflow-hidden flex items-center justify-center skeleton-shimmer">
          <ShoppingBag className="w-10 h-10 text-[var(--text-secondary)]/15 stroke-[1.25]" />
        </div>

        {/* Card Info */}
        <div className="p-4 space-y-2.5">
          {/* Price & Stock status */}
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 w-20 rounded bg-[var(--bg-card-hover)]/80 skeleton-shimmer" />
            <div className="h-3 w-14 rounded bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
          </div>

          {/* Title */}
          <div className="h-3.5 w-4/5 rounded bg-[var(--bg-card-hover)]/70 skeleton-shimmer" />

          {/* Description snippet */}
          <div className="space-y-1 pt-0.5">
            <div className="h-2.5 w-full rounded bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
            <div className="h-2.5 w-3/4 rounded bg-[var(--bg-card-hover)]/40 skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Card Actions Footer: Single Unified Action Block */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/50">
        <div className="w-full h-8 rounded-lg bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
      </div>
    </div>
  );
}
