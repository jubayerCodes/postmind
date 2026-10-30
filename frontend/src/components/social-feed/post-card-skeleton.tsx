'use client';

import * as React from 'react';

export function PostCardSkeleton() {
  return (
    <div className="max-w-lg w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden select-none animate-pulse">
      {/* Header Bar Skeleton */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-subtle)]/60 bg-[var(--bg-card)]/60">
        <div className="flex items-center gap-3">
          {/* Page Avatar Skeleton */}
          <div className="w-9 h-9 rounded-full bg-[var(--bg-hover)] shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-[var(--bg-hover)] rounded-md" />
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-16 bg-[var(--bg-hover)] rounded" />
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--bg-hover)]" />
              <div className="h-2.5 w-20 bg-[var(--bg-hover)] rounded" />
            </div>
          </div>
        </div>

        {/* Status Badge Skeleton */}
        <div className="h-6 w-24 rounded-full bg-[var(--bg-hover)]" />
      </div>

      {/* Product Tag Bar Skeleton */}
      <div className="px-4 py-2.5 border-b border-[var(--border-subtle)]/40 flex items-center gap-2">
        <div className="h-3 w-14 bg-[var(--bg-hover)] rounded" />
        <div className="h-6 w-40 bg-[var(--bg-hover)] rounded-md" />
      </div>

      {/* Media / Image Box Skeleton */}
      <div className="w-full aspect-square bg-[var(--bg-hover)]/70 relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--border-subtle)]/60 flex items-center justify-center opacity-60">
          <div className="w-6 h-6 rounded-md border-2 border-[var(--text-secondary)]/40" />
        </div>
        {/* Media Overlay Bottom Pill Skeleton */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between">
          <div className="h-4 w-36 bg-white/20 rounded-md" />
          <div className="h-4 w-20 bg-white/20 rounded-md" />
        </div>
      </div>

      {/* Post Content Area Skeleton */}
      <div className="p-4 space-y-4">
        {/* Engagement Actions Skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]/50">
          <div className="flex items-center gap-3">
            <div className="h-7 w-14 rounded-lg bg-[var(--bg-hover)]" />
            <div className="h-7 w-14 rounded-lg bg-[var(--bg-hover)]" />
            <div className="h-7 w-8 rounded-lg bg-[var(--bg-hover)]" />
          </div>
          <div className="h-3.5 w-28 rounded bg-[var(--bg-hover)]" />
        </div>

        {/* Caption Text Lines Skeleton */}
        <div className="space-y-2 py-1">
          <div className="h-3.5 bg-[var(--bg-hover)] rounded w-11/12" />
          <div className="h-3.5 bg-[var(--bg-hover)] rounded w-full" />
          <div className="h-3.5 bg-[var(--bg-hover)] rounded w-4/5" />
          <div className="h-3.5 bg-[var(--bg-hover)] rounded w-2/3" />
        </div>

        {/* Hashtags Skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-4 w-16 rounded bg-[var(--bg-hover)]" />
          <div className="h-4 w-20 rounded bg-[var(--bg-hover)]" />
          <div className="h-4 w-14 rounded bg-[var(--bg-hover)]" />
        </div>

        {/* CTA Button Skeleton */}
        <div className="pt-2">
          <div className="h-10 w-full rounded-xl bg-[var(--bg-hover)]" />
        </div>
      </div>
    </div>
  );
}
