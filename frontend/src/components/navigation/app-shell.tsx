'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { ProductModal } from '@/components/products/product-modal';
import { SocialAccountsModal } from '@/components/social-feed/social-accounts-modal';
import { ScheduleDialog } from '@/components/calendar/schedule-dialog';
import { useAuthStore } from '@/stores/auth-store';
import { useStores } from '@/hooks/use-stores';
import { useProductsStore } from '@/stores/products-store';
import { useSocialStore } from '@/stores/social-store';
import { Store, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostCardSkeleton } from '@/components/social-feed/post-card-skeleton';

interface AppShellProps {
  activeTab?: string;
  children: React.ReactNode;
}

export function AppShell({ activeTab = 'feed', children }: AppShellProps) {
  const router = useRouter();
  const { user, isDevGuest, isInitialized } = useAuthStore();
  const {
    stores,
    activeStore,
    isLoading: isLoadingStores,
    createStore,
    isCreating: isCreatingStore,
    isSwitchingWorkspace,
  } = useStores();
  const [newStoreInput, setNewStoreInput] = React.useState('');

  const { fetchProducts } = useProductsStore();
  const { fetchAccounts } = useSocialStore();
  const lastLoadedStoreIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (isInitialized && !user && !isDevGuest) {
      router.push('/login');
    }
  }, [isInitialized, user, isDevGuest, router]);

  React.useEffect(() => {
    if (activeStore?.id && !isSwitchingWorkspace && lastLoadedStoreIdRef.current !== activeStore.id) {
      lastLoadedStoreIdRef.current = activeStore.id;
      fetchProducts(activeStore.id);
      fetchAccounts(activeStore.id);
    }
  }, [activeStore?.id, isSwitchingWorkspace, fetchProducts, fetchAccounts]);

  const handleQuickCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreInput.trim()) return;
    await createStore({ name: newStoreInput.trim(), currency: 'BDT' });
    setNewStoreInput('');
  };

  if (!isInitialized || (!user && !isDevGuest)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] antialiased font-sans">
      {/* Global Product Add/Edit Modal */}
      <ProductModal onSwitchToBulk={() => router.push('/products?view=bulk')} />

      {/* Global Facebook Page Connections Modal */}
      <SocialAccountsModal />

      {/* Global Schedule Dialog Modal */}
      <ScheduleDialog />

      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Loading Progress Line for Smooth Workspace Switching */}
        {isSwitchingWorkspace && (
          <div className="absolute top-0 left-0 right-0 z-50 h-[2.5px] overflow-hidden bg-[var(--brand-primary)]/15">
            <div className="h-full w-2/5 bg-[var(--brand-primary)] animate-workspace-progress rounded-full" />
          </div>
        )}

        {/* Top Header */}
        <Header />

        {/* Content with smooth cross-fade transition */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-200 ease-out',
            isSwitchingWorkspace
              ? 'opacity-50 pointer-events-none filter blur-[0.2px]'
              : 'opacity-100 filter blur-0',
          )}
        >
          {/* View Switcher: Loading Skeleton vs No Store Empty State vs Page Content */}
          {isLoadingStores ? (
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-main)]">
              {/* Studio Header Skeleton */}
              <div className="w-full px-6 py-2.5 shrink-0 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/40">
                <div className="h-6 w-52 bg-[var(--bg-hover)] rounded-md animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-7 w-20 bg-[var(--bg-hover)] rounded-md animate-pulse" />
                  <div className="h-7 w-24 bg-[var(--bg-hover)] rounded-md animate-pulse" />
                </div>
              </div>
              {/* Center Feed & Rail Skeletons */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex items-center justify-center p-6">
                  <PostCardSkeleton />
                </div>
                <div className="w-80 border-l border-[var(--border-subtle)] p-4 space-y-3 hidden lg:block">
                  <div className="h-6 w-32 bg-[var(--bg-hover)] rounded animate-pulse" />
                  <div className="space-y-2.5 pt-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 space-y-2 animate-pulse"
                      >
                        <div className="h-4 w-16 bg-[var(--bg-hover)] rounded-full" />
                        <div className="h-3 w-3/4 bg-[var(--bg-hover)] rounded" />
                        <div className="h-2.5 w-full bg-[var(--bg-hover)] rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : !activeStore && stores.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-main)] overflow-y-auto select-none">
              <div className="max-w-md w-full p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/5 dark:shadow-black/30 flex flex-col items-center animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mb-4 shadow-sm">
                  <Store className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  No Store Connected
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6 leading-relaxed">
                  You haven&apos;t created or connected a store yet. Create your store now to start managing products, connecting Facebook Pages, and generating high-converting AI posts.
                </p>

                <form onSubmit={handleQuickCreateStore} className="w-full space-y-3">
                  <div className="text-left">
                    <label
                      htmlFor="quickStoreName"
                      className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
                    >
                      Store / Brand Name
                    </label>
                    <input
                      id="quickStoreName"
                      type="text"
                      required
                      placeholder="e.g. My Brand"
                      value={newStoreInput}
                      onChange={(e) => setNewStoreInput(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingStore || !newStoreInput.trim()}
                    className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingStore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Store...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Store &amp; Get Started</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
