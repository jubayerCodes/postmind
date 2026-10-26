'use client';

import * as React from 'react';
import { Sparkles, Tag, BookOpen, Feather, Send, Loader2, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContentStore } from '@/stores/content-store';
import { useStores } from '@/hooks/use-stores';
import { useProductsStore } from '@/stores/products-store';

interface FloatingQuickActionsProps {
  currentTone?: 'natural' | 'witty' | 'promo' | 'storytelling';
  onSelectTone?: (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => void;
}

export function FloatingQuickActions({
  currentTone: propTone,
  onSelectTone,
}: FloatingQuickActionsProps) {
  const {
    currentTone: storeTone,
    isGenerating,
    customPrompt,
    setTone,
    setCustomPrompt,
    generatePost,
  } = useContentStore();

  const { activeStore } = useStores();
  const { selectedProduct } = useProductsStore();

  const [promptInput, setPromptInput] = React.useState('');
  const [isPromptExpanded, setIsPromptExpanded] = React.useState(false);

  const activeTone = propTone || storeTone;

  const handleToneClick = async (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => {
    if (isGenerating) return;
    setTone(tone);
    if (onSelectTone) onSelectTone(tone);

    if (activeStore?.id) {
      try {
        await generatePost(activeStore.id, {
          productId: selectedProduct?.id,
          tone,
          customPrompt: promptInput.trim() || customPrompt || undefined,
        });
      } catch (err) {
        console.warn('Tone switch generation error:', err);
      }
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || isGenerating) return;

    setCustomPrompt(promptInput.trim());
    try {
      await generatePost(activeStore.id, {
        productId: selectedProduct?.id,
        tone: activeTone,
        customPrompt: promptInput.trim() || undefined,
      });
      setIsPromptExpanded(false);
    } catch (err) {
      console.warn('Prompt generation error:', err);
    }
  };

  const tones = [
    {
      id: 'natural' as const,
      label: 'Natural',
      icon: Feather,
    },
    {
      id: 'witty' as const,
      label: 'Witty',
      icon: Sparkles,
    },
    {
      id: 'promo' as const,
      label: 'Promo Offer',
      icon: Tag,
    },
    {
      id: 'storytelling' as const,
      label: 'Storytelling',
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* 1. Progressive Blur Background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 select-none overflow-hidden z-20"
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
          className="absolute inset-0 backdrop-blur-[8px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[16px]"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-main)]/40 to-[var(--bg-main)]/95" />
      </div>

      {/* 2. Floating AI Control Dock */}
      <div className="absolute bottom-5 inset-x-0 z-30 flex flex-col items-center px-4 pointer-events-none gap-2">
        {/* Custom AI Instruction Bar */}
        <div className="pointer-events-auto max-w-lg w-full">
          {isPromptExpanded ? (
            <form
              onSubmit={handlePromptSubmit}
              className="p-2 rounded-lg bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl flex items-center gap-2 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <input
                type="text"
                autoFocus
                placeholder="Custom instruction (e.g. Focus on Eid festive delivery, highlight 20% discount)..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Generate</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPromptExpanded(false)}
                className="px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Close
              </button>
            </form>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsPromptExpanded(true)}
                className="px-3 py-1 rounded-full text-[11px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)]/80 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:border-[var(--brand-primary)]"
              >
                <Sparkles className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>Give AI Custom Instructions...</span>
                <ChevronUp className="w-3 h-3 text-[var(--text-secondary)]" />
              </button>
            </div>
          )}
        </div>

        {/* Tone Selector Buttons */}
        <nav
          className="pointer-events-auto max-w-lg w-full p-1.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl shadow-black/5 dark:shadow-black/60 transition-all"
          aria-label="Tone modifiers"
        >
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {tones.map((btn) => {
              const Icon = btn.icon;
              const isActive = activeTone === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => handleToneClick(btn.id)}
                  disabled={isGenerating}
                  className={cn(
                    'py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border select-none disabled:opacity-60',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white border-transparent font-semibold shadow-xs'
                      : 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-card)]'
                  )}
                >
                  {isGenerating && isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
