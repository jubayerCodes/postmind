'use client';

import * as React from 'react';
import {
  ImageIcon,
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';

export function PostCardSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm overflow-hidden select-none">
      {/* 1. Social Card Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2.5">
          {/* Avatar box */}
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)]/70 shrink-0 skeleton-shimmer" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-[var(--bg-card-hover)]/80 skeleton-shimmer" />
            <div className="h-2 w-16 rounded bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
          </div>
        </div>

        {/* Status Pill Placeholder */}
        <div className="h-5 w-20 rounded-md bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
      </div>

      {/* 2. Attached Product Pill Bar */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-[var(--text-secondary)]/30" />
          <div className="h-3 w-36 rounded bg-[var(--bg-card-hover)]/60 skeleton-shimmer" />
        </div>
        <div className="h-2.5 w-12 rounded bg-[var(--bg-card-hover)]/40 skeleton-shimmer" />
      </div>

      {/* 3. Media Showcase Frame (Quiet & Pure - No cluttered corner pills) */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-[var(--bg-card-hover)]/30 border-b border-[var(--border-subtle)] flex items-center justify-center skeleton-shimmer">
        <ImageIcon className="w-10 h-10 text-[var(--text-secondary)]/20 stroke-[1.25]" />
      </div>

      {/* 4. Card Body: Clean 3-line rhythm & Single Action Button */}
      <div className="p-4 space-y-3.5">
        {/* Subtle Social Action Icons (Without individual micro-number boxes) */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]/30">
          <div className="flex items-center gap-4">
            <Heart className="w-3.5 h-3.5" />
            <MessageCircle className="w-3.5 h-3.5" />
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <div className="h-2 w-16 rounded bg-[var(--bg-card-hover)]/40 skeleton-shimmer" />
        </div>

        {/* 3-Line Caption Silhouette (Linear/Vercel standard) */}
        <div className="space-y-2 py-0.5">
          <div className="h-3 w-full rounded bg-[var(--bg-card-hover)]/70 skeleton-shimmer" />
          <div className="h-3 w-4/5 rounded bg-[var(--bg-card-hover)]/70 skeleton-shimmer" />
          <div className="h-3 w-3/5 rounded bg-[var(--bg-card-hover)]/50 skeleton-shimmer" />
        </div>

        {/* Unified Action Button Block */}
        <div className="pt-1">
          <div className="w-full h-8.5 rounded-lg bg-[var(--bg-card-hover)]/50 border border-[var(--border-subtle)]/40 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
