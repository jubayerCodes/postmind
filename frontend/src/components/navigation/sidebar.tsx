'use client';

import * as React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  BarChart3,
  Settings,
  Layers,
  Store,
  ChevronDown,
  Command,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/use-stores';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'feed', label: 'Feed Studio', icon: Sparkles, badge: 'Live' },
    { id: 'stories', label: 'Stories & Reels', icon: Layers },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: '3' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const { stores, activeStore, setActiveStoreId, createStore, isCreating } = useStores();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newStoreName, setNewStoreName] = React.useState('');

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    await createStore({ name: newStoreName.trim(), currency: 'BDT' });
    setNewStoreName('');
    setIsCreatingNew(false);
    setIsDropdownOpen(false);
  };

  return (
    <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col justify-between p-3 shrink-0 transition-colors z-20 select-none">
      <div className="space-y-3.5">
        {/* 1. Brand Logo Header */}
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Command className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
              PostMind
            </span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              AI
            </span>
          </div>
        </div>

        {/* 2. Store Selector with Dropdown */}
        <div className="px-1 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group shadow-2xs text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                  <Store className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {activeStore?.name || 'UrbanWear Dhaka'}
                  </h2>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                    <span>{activeStore?.currency === 'BDT' ? '🇧🇩 BDT' : '🌐 USD'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 shrink-0',
                  isDropdownOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {/* Store Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-1 right-1 mt-1.5 p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg z-50 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-2 py-1">
                Your Workspaces
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveStoreId(s.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors cursor-pointer',
                      s.id === activeStore?.id
                        ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold dark:bg-[var(--brand-primary)]/15 dark:text-[var(--brand-primary)]'
                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <span className="truncate">{s.name}</span>
                    {s.id === activeStore?.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
                    )}
                  </button>
                ))}
              </div>

              {isCreatingNew ? (
                <form onSubmit={handleCreateStore} className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                  <input
                    type="text"
                    placeholder="Store name..."
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-2 py-0.5 text-[10px] bg-[var(--brand-primary)] text-white font-semibold rounded hover:brightness-110"
                    >
                      {isCreating ? 'Adding...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full mt-1 pt-1.5 border-t border-[var(--border-subtle)] flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create New Store</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Navigation List */}
        <nav className="space-y-0.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left',
                  isActive
                    ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold dark:bg-[var(--brand-primary)]/15 dark:text-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.2 rounded',
                      isActive
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Store Plan Status */}
      <div className="p-2.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-[var(--text-secondary)]">Monthly AI Quota</span>
          <span className="font-mono text-[var(--text-primary)] font-semibold">14 / 50</span>
        </div>
        <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--brand-primary)] rounded-full w-[28%]" />
        </div>
      </div>
    </aside>
  );
}
