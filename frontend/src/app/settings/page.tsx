'use client';

import * as React from 'react';
import { AppShell } from '@/components/navigation/app-shell';
import { Settings, Store, CreditCard, Sparkles, Key, Shield, Check, Globe } from 'lucide-react';
import { useStores } from '@/hooks/use-stores';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const { activeStore } = useStores();
  const { user } = useAuthStore();

  return (
    <AppShell activeTab="settings">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto p-6 bg-[var(--bg-main)]">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Store Settings
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Manage store configurations, AI engines, payment gateways, and connected accounts.
              </p>
            </div>
          </div>

          {/* Store Profile Card */}
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[var(--brand-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                General Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Active Store Name</label>
                <div className="p-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] font-medium text-[var(--text-primary)]">
                  {activeStore?.name || 'Default Store'}
                </div>
              </div>
              <div>
                <label className="text-[var(--text-secondary)] block mb-1">Default Currency</label>
                <div className="p-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] font-medium text-[var(--text-primary)] flex items-center gap-2">
                  <span>{activeStore?.currency === 'BDT' ? '🇧🇩 BDT (Bangladeshi Taka)' : '🌐 USD (US Dollar)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Providers Card */}
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                AI Generation Providers
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Google Nano Banana</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    High-quality commercial e-commerce studio imagery with Gemini 3.1 multimodal vision.
                  </p>
                </div>
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Pollinations Flux Engine</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">Fallback</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Zero-config instantaneous fallback engine for peak traffic and offline resilience.
                  </p>
                </div>
                <Check className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
            </div>
          </div>

          {/* Dual Billing Gateways Card */}
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Dual Payment Gateway Integrations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]">
                <div className="text-xs font-semibold text-[var(--text-primary)]">SSLCommerz (Bangladesh)</div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  bKash, Nagad, Rocket, and local debit/credit card billing for Bangladeshi merchants.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]">
                <div className="text-xs font-semibold text-[var(--text-primary)]">Stripe (International)</div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Global card recurring subscriptions and customer portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
