'use client';

import * as React from 'react';
import { Sparkles, Tag, BookOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingQuickActionsProps {
  currentTone: string;
  onSelectTone: (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => void;
  onSchedule?: () => void;
  onPublish?: () => void;
  isScheduled?: boolean;
  isPublished?: boolean;
}

export function FloatingQuickActions({
  currentTone,
  onSelectTone,
}: FloatingQuickActionsProps) {
  const [loadingTone, setLoadingTone] = React.useState<
    'witty' | 'promo' | 'storytelling' | null
  >(null);

  const handleToneChange = (tone: 'witty' | 'promo' | 'storytelling') => {
    if (loadingTone) return;
    setLoadingTone(tone);
    const nextTone = currentTone === tone ? 'natural' : tone;
    setTimeout(() => {
      onSelectTone(nextTone);
      setLoadingTone(null);
    }, 600);
  };

  const modificationButtons = [
    {
      id: 'witty' as const,
      label: 'Make Witty',
      loadingLabel: 'Generating...',
      icon: Sparkles,
    },
    {
      id: 'promo' as const,
      label: 'Add 20% Promo',
      loadingLabel: 'Applying...',
      icon: Tag,
    },
    {
      id: 'storytelling' as const,
      label: 'Storytelling',
      loadingLabel: 'Writing...',
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* 1. Progressive Blur Background (Smoothly blends to --bg-main) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 select-none overflow-hidden z-20"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[6px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[14px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[24px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 65%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 65%, black 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-main)]/30 to-[var(--bg-main)]/95" />
      </div>

      {/* 2. Floating Modification Buttons Toolbar (Equal-width, reduced radius) */}
      <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <nav
          className="pointer-events-auto max-w-md w-full p-1.5 rounded-lg bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-lg shadow-black/5 dark:shadow-black/60 transition-all"
          aria-label="Tone modifiers"
        >
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {modificationButtons.map((btn) => {
              const Icon = btn.icon;
              const isLoading = loadingTone === btn.id;
              const isOtherLoading = loadingTone !== null && !isLoading;
              const isActive = currentTone === btn.id;

              return (
                <button
                  key={btn.id}
                  onClick={() => handleToneChange(btn.id)}
                  disabled={loadingTone !== null}
                  className={cn(
                    'w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer truncate',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] font-semibold shadow-xs'
                      : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                    isOtherLoading && 'opacity-30 cursor-not-allowed pointer-events-none',
                    isLoading &&
                      'opacity-90 cursor-wait bg-[var(--brand-primary)] text-[var(--brand-primary-fg)]'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span className="truncate">{btn.loadingLabel}</span>
                    </>
                  ) : (
                    <>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{btn.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}

export { FloatingQuickActions as BottomActionBar };
