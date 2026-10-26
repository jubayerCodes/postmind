'use client';

import * as React from 'react';
import { AppShell } from '@/components/navigation/app-shell';
import { BarChart3, TrendingUp, Users, ThumbsUp, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { useStores } from '@/hooks/use-stores';
import { useSocialStore } from '@/stores/social-store';

export default function AnalyticsPage() {
  const { activeStore } = useStores();
  const { accounts } = useSocialStore();

  return (
    <AppShell activeTab="analytics">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-6 bg-[var(--bg-main)]">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Performance &amp; Social Analytics
                </h1>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Track conversion rates, post reach, and audience sentiment across your connected Facebook Pages.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)]">
              <span>Channel:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {accounts[0]?.accountName || 'All Channels'}
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Total Reach</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">18.4K</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4% vs last week</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Engagement Rate</span>
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">6.8%</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+2.1% benchmark</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Direct Inquiries</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">142</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>Via Facebook Messenger</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Shares &amp; Saves</span>
                <Share2 className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">389</div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] mt-1">
                <span>Organic virality</span>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                AI Optimization Insights
              </h2>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  Posts scheduled between <strong>7:30 PM – 9:00 PM BST</strong> achieve 42% higher click-through to Messenger checkout than morning posts.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>
                  Products with high-contrast studio images generated via <strong>Nano Banana</strong> converted at 2.8x compared to flat text posts.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
