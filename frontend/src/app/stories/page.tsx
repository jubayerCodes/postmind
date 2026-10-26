'use client';

import * as React from 'react';
import { AppShell } from '@/components/navigation/app-shell';
import { Layers, Sparkles, Video, Play, Plus, Clock } from 'lucide-react';
import { useStores } from '@/hooks/use-stores';
import { useProductsStore } from '@/stores/products-store';

export default function StoriesPage() {
  const { activeStore } = useStores();
  const { products } = useProductsStore();

  return (
    <AppShell activeTab="stories">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-6 bg-[var(--bg-main)]">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Stories &amp; Reels Studio
                </h1>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Generate vertical, short-form viral product stories and reels for Facebook &amp; Instagram.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-3.5 py-2 text-xs font-semibold rounded-md bg-[var(--brand-primary)] text-white opacity-60 cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Reel</span>
              </button>
            </div>
          </div>

          {/* Quick Stats / Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Active Stories</span>
                <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">0</div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">No active stories in the last 24h</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Reel Templates</span>
                <Video className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">6 Available</div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Product spotlight, sale countdown &amp; drops</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">AI Generation</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">Ready</div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">Connected to Google Nano Banana &amp; Gemini</p>
            </div>
          </div>

          {/* Coming Soon / Workspace Placeholder */}
          <div className="p-12 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)]/50 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mb-4">
              <Video className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Stories &amp; Reels Automation Engine
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mt-2 mb-4 leading-relaxed">
              Auto-render 9:16 vertical motion graphics with product zoom, animated price tags, and Bangla/English promotional audio tracks ready for Facebook Stories.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[11px] font-mono text-[var(--text-secondary)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              Feature currently in roadmap preview
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
