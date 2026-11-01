'use client';

import * as React from 'react';
import {
  ImageIcon,
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';

export function PostCardSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm overflow-hidden select-none">
      {/* 1. Social Card Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]/30">
        <div className="flex items-center gap-2.5">
          {/* Avatar box */}
          <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)]/20 shrink-0 border border-[var(--border-subtle)] relative overflow-hidden skeleton-shimmer" />
          <div>
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-20 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--brand-primary)]/20 skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-1">
              <div className="h-2.5 w-16 rounded bg-[var(--bg-hover)]/70 skeleton-shimmer" />
              <span className="text-[var(--text-secondary)]/40">•</span>
              <div className="h-2.5 w-14 rounded bg-[var(--brand-primary)]/20 skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Post Actions & Status Badge Placeholder */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] skeleton-shimmer" />
          <div className="p-1 text-[var(--text-secondary)]/40">
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Attached Products Bar */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]/70 flex items-center gap-1 shrink-0">
            <ShoppingBag className="w-3 h-3 text-[var(--brand-primary)]/60" />
            <span>Products:</span>
          </span>
          <div className="h-5 w-36 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] skeleton-shimmer" />
        </div>
        <div className="h-3 w-16 rounded bg-[var(--bg-hover)]/60 skeleton-shimmer ml-auto" />
      </div>

      {/* 3. Media Image / Visual Showcase Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-[var(--bg-hover)]/25 border-b border-[var(--border-subtle)] overflow-hidden flex items-center justify-center select-none">
        {/* Center subtle image icon */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <ImageIcon className="w-10 h-10 text-[var(--text-secondary)]/25 stroke-[1.25]" />
        </div>

        {/* Floating Product Tag Overlay Pill (matches real post layout) */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] shadow-sm select-none">
          <ShoppingBag className="w-3 h-3 text-zinc-400" />
          <div className="h-3 w-28 rounded bg-zinc-700/80 skeleton-shimmer" />
          <div className="h-3 w-14 rounded bg-zinc-600/80 skeleton-shimmer" />
          <div className="h-3.5 w-9 rounded bg-zinc-800 border border-zinc-700 skeleton-shimmer" />
        </div>
      </div>

      {/* 4. Card Body / Caption & Engagement */}
      <div className="p-4 space-y-3">
        {/* Interactive Social Actions Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]/50">
              <Heart className="w-3.5 h-3.5" />
              <div className="h-2.5 w-4 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]/50">
              <MessageCircle className="w-3.5 h-3.5" />
              <div className="h-2.5 w-4 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]/50">
              <Share2 className="w-3.5 h-3.5" />
              <div className="h-2.5 w-4 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono">
            <div className="h-2.5 w-24 rounded bg-[var(--bg-hover)]/60 skeleton-shimmer" />
          </div>
        </div>

        {/* Caption Section */}
        <div className="space-y-2 py-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-20 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            <div className="h-3.5 w-1/2 rounded bg-[var(--bg-hover)]/80 skeleton-shimmer" />
          </div>
          <div className="h-3 w-full rounded bg-[var(--bg-hover)]/80 skeleton-shimmer" />
          <div className="h-3 w-11/12 rounded bg-[var(--bg-hover)]/80 skeleton-shimmer" />
          <div className="h-3 w-4/5 rounded bg-[var(--bg-hover)]/80 skeleton-shimmer" />
          <div className="h-2.5 w-16 rounded bg-[var(--bg-hover)]/50 skeleton-shimmer pt-0.5" />
        </div>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <div className="h-3 w-16 rounded bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 skeleton-shimmer" />
          <div className="h-3 w-24 rounded bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 skeleton-shimmer" />
          <div className="h-3 w-16 rounded bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 skeleton-shimmer" />
          <div className="h-3 w-20 rounded bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 skeleton-shimmer" />
        </div>

        {/* CTA Button Preview */}
        <div className="pt-1.5">
          <div className="w-full py-2 px-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 flex items-center justify-center gap-2 select-none">
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--text-secondary)]/50" />
            <div className="h-3 w-36 rounded bg-[var(--bg-hover)] skeleton-shimmer" />
            <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
