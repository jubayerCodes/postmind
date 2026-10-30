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
  Pencil,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/use-stores';
import { useAuthStore } from '@/stores/auth-store';
import { useProductsStore } from '@/stores/products-store';
import { useSocialStore } from '@/stores/social-store';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const productsCount = useProductsStore((state) => state.products.length);
  const { accounts, selectedAccountId, setModalOpen: setSocialModalOpen } = useSocialStore();
  const activeFacebookPage =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts[0] ||
    null;

  const navItems = [
    { id: 'feed', label: 'Feed Studio', icon: Sparkles, href: '/', badge: 'Live' },
    { id: 'stories', label: 'Stories & Reels', icon: Layers, href: '/stories' },
    {
      id: 'products',
      label: 'Products',
      icon: ShoppingBag,
      href: '/products',
      count: productsCount > 0 ? String(productsCount) : undefined,
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', badge: '3' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const { user } = useAuthStore();
  const {
    stores,
    activeStore,
    isLoading: isLoadingStores,
    setActiveStoreId,
    isSwitchingWorkspace,
    switchingTargetId,
    switchWorkspace,
    createStore,
    isCreating,
    updateStore,
    isUpdating,
  } = useStores();

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newStoreName, setNewStoreName] = React.useState('');
  const [renameValue, setRenameValue] = React.useState('');

  const defaultStoreDisplayName = user?.name ? `${user.name}'s Store` : 'My Store';

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    await createStore({ name: newStoreName.trim(), currency: 'BDT' });
    setNewStoreName('');
    setIsCreatingNew(false);
    setIsDropdownOpen(false);
  };

  const handleRenameStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || !renameValue.trim()) return;
    await updateStore({ storeId: activeStore.id, name: renameValue.trim() });
    setIsRenaming(false);
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
            disabled={isSwitchingWorkspace}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'w-full p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer group shadow-2xs text-left',
              isSwitchingWorkspace && 'opacity-90',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors',
                    isLoadingStores
                      ? 'bg-[var(--bg-hover)]'
                      : isSwitchingWorkspace
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : activeStore
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  )}
                >
                  {isLoadingStores ? (
                    <div className="w-3 h-3 rounded-full bg-[var(--border-subtle)] animate-pulse" />
                  ) : isSwitchingWorkspace ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-primary)]" />
                  ) : (
                    <Store className="w-3 h-3" />
                  )}
                </div>
                <div className="min-w-0">
                  {isLoadingStores ? (
                    <div className="space-y-1 py-0.5 animate-pulse">
                      <div className="h-3 w-20 bg-[var(--bg-hover)] rounded" />
                      <div className="h-2 w-14 bg-[var(--bg-hover)] rounded" />
                    </div>
                  ) : (
                    <>
                      <h2
                        className={cn(
                          'text-xs font-semibold truncate',
                          isSwitchingWorkspace
                            ? 'text-[var(--brand-primary)]'
                            : activeStore
                              ? 'text-[var(--text-primary)]'
                              : 'text-amber-600 dark:text-amber-400',
                        )}
                      >
                        {isSwitchingWorkspace
                          ? stores.find((s) => s.id === switchingTargetId)?.name || 'Switching...'
                          : activeStore
                            ? activeStore.name
                            : 'No Store Selected'}
                      </h2>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                        {isSwitchingWorkspace ? (
                          <span className="text-[var(--brand-primary)] font-medium animate-pulse">
                            Switching workspace...
                          </span>
                        ) : activeStore ? (
                          <>
                            <span>{activeStore.currency === 'BDT' ? '🇧🇩 BDT' : '🌐 USD'}</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                          </>
                        ) : (
                          <span className="text-amber-600/90 dark:text-amber-400/90 font-medium">
                            Create a store first
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {isSwitchingWorkspace ? (
                <Loader2 className="w-3.5 h-3.5 text-[var(--brand-primary)] animate-spin shrink-0" />
              ) : (
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 shrink-0',
                    isDropdownOpen && 'rotate-180',
                  )}
                />
              )}
            </div>
          </button>

          {/* Store Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-1 right-1 mt-1.5 p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-lg z-50 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] px-2 py-1">
                Your Workspaces
              </div>
              {stores.length === 0 ? (
                <div className="p-3 text-center rounded-md bg-[var(--bg-main)]/50 border border-dashed border-[var(--border-subtle)] my-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">No stores found</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 mb-2.5 leading-relaxed">
                    Create your first store to start managing products and publishing posts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(true);
                      setIsRenaming(false);
                    }}
                    className="w-full py-1.5 px-2 rounded-md text-[11px] font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create a Store First</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {stores.map((s) => {
                    const isTarget = isSwitchingWorkspace && switchingTargetId === s.id;
                    const isCurrent = !isSwitchingWorkspace && s.id === activeStore?.id;
                    return (
                      <button
                        key={s.id}
                        disabled={isSwitchingWorkspace}
                        onClick={async () => {
                          setIsRenaming(false);
                          setIsCreatingNew(false);
                          setIsDropdownOpen(false);
                          await switchWorkspace(s.id);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors cursor-pointer disabled:cursor-not-allowed',
                          isTarget || isCurrent
                            ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold dark:bg-[var(--brand-primary)]/15 dark:text-[var(--brand-primary)]'
                            : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        <span className="truncate">{s.name}</span>
                        {isTarget ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[var(--brand-primary)] shrink-0" />
                        ) : isCurrent ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {isRenaming ? (
                <form onSubmit={handleRenameStore} className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] px-1">Rename Active Store</div>
                  <input
                    type="text"
                    placeholder="New store name..."
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRenaming(false)}
                      className="px-2 py-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-2 py-0.5 text-[10px] bg-[var(--brand-primary)] text-white font-semibold rounded hover:brightness-110 flex items-center gap-1"
                    >
                      {isUpdating && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              ) : isCreatingNew ? (
                <form onSubmit={handleCreateStore} className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] px-1">Create New Store</div>
                  <input
                    type="text"
                    placeholder="Store name..."
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
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
                      className="px-2 py-0.5 text-[10px] bg-[var(--brand-primary)] text-white font-semibold rounded hover:brightness-110 flex items-center gap-1"
                    >
                      {isCreating && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      <span>{isCreating ? 'Adding...' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-1.5 border-t border-[var(--border-subtle)] flex flex-col gap-0.5">
                  {activeStore && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenameValue(activeStore.name);
                        setIsRenaming(true);
                        setIsCreatingNew(false);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-[var(--brand-primary)]" />
                      <span>Edit Store Name</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(true);
                      setIsRenaming(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create New Store</span>
                  </button>
                </div>
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
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab?.(item.id)}
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
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2">
        {/* Connected Facebook Page Section */}
        <div className="p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-[var(--text-secondary)] font-medium">Facebook Channel</span>
            <button
              onClick={() => setSocialModalOpen(true)}
              className="text-[10px] text-[var(--brand-primary)] hover:underline cursor-pointer font-medium"
            >
              Manage
            </button>
          </div>
          <button
            onClick={() => setSocialModalOpen(true)}
            className="w-full flex items-center justify-between p-1.5 rounded-md bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]/80 transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                f
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                {activeFacebookPage ? activeFacebookPage.accountName : 'Not connected'}
              </span>
            </div>
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                activeFacebookPage ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-zinc-400'
              )}
            />
          </button>
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
      </div>
    </aside>
  );
}
