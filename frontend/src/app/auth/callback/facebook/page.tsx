'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocialStore, SocialAccountItem } from '@/stores/social-store';
import { useStores } from '@/hooks/use-stores';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Share2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    handleOAuthCallback,
    connectDevAccount,
    disconnectAccount,
    setSelectedAccount,
  } = useSocialStore();
  const { activeStore } = useStores();

  const [status, setStatus] = React.useState<
    'loading' | 'select_pages' | 'saving_selection' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [discoveredPages, setDiscoveredPages] = React.useState<SocialAccountItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [primaryTargetId, setPrimaryTargetId] = React.useState<string | null>(null);
  const [resolvedStoreId, setResolvedStoreId] = React.useState<string | null>(null);

  const hasProcessedRef = React.useRef(false);

  React.useEffect(() => {
    async function processCallback() {
      const errorParam =
        searchParams.get('error') || searchParams.get('error_description');
      if (errorParam) {
        setStatus('error');
        setErrorMessage(
          searchParams.get('error_description') ||
            searchParams.get('error_reason') ||
            'Facebook authorization was cancelled or denied.',
        );
        return;
      }

      const code = searchParams.get('code');
      const devMode = searchParams.get('dev_mode');
      const storeIdParam = searchParams.get('store_id');
      const stateParam = searchParams.get('state');

      // Extract storeId from OAuth state if present (format: postmind_<storeId>_<timestamp>)
      let stateStoreId: string | null = null;
      if (stateParam && stateParam.startsWith('postmind_')) {
        const parts = stateParam.split('_');
        if (parts.length >= 2) {
          stateStoreId = parts[1];
        }
      }

      const storeId = storeIdParam || stateStoreId || activeStore?.id;

      if (!storeId) {
        // Wait for store context if not available yet
        return;
      }

      // Guard against duplicate execution (Meta codes are single-use)
      if (hasProcessedRef.current) {
        return;
      }
      hasProcessedRef.current = true;
      setResolvedStoreId(storeId);

      try {
        let pages: SocialAccountItem[] = [];

        if (devMode === 'true' || !code) {
          // Dev sandbox fallback
          const devAcc = await connectDevAccount(storeId);
          pages = [devAcc];
        } else {
          // Real Meta OAuth code exchange
          const redirectUri = `${window.location.origin}/auth/callback/facebook`;
          pages = await handleOAuthCallback(storeId, code, redirectUri);
        }

        if (pages && pages.length > 1) {
          // Multiple pages discovered: let the user select which ones to keep
          setDiscoveredPages(pages);
          setSelectedIds(new Set(pages.map((p) => p.id)));
          setPrimaryTargetId(pages[0]?.id || null);
          setStatus('select_pages');
        } else {
          // Single page: auto-connect and redirect
          setStatus('success');
          setTimeout(() => {
            router.push('/');
          }, 1200);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authorize Facebook Page');
      }
    }

    processCallback();
  }, [
    searchParams,
    activeStore?.id,
    handleOAuthCallback,
    connectDevAccount,
    router,
  ]);

  const togglePageSelection = (pageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
        // If unchecking the active primary target, pick another selected one
        if (primaryTargetId === pageId) {
          const remaining = Array.from(next);
          setPrimaryTargetId(remaining.length > 0 ? remaining[0] : null);
        }
      } else {
        next.add(pageId);
        if (!primaryTargetId) {
          setPrimaryTargetId(pageId);
        }
      }
      return next;
    });
  };

  const handleConfirmSelection = async () => {
    const storeId = resolvedStoreId || activeStore?.id;
    if (!storeId) return;

    if (selectedIds.size === 0) {
      setErrorMessage('Please select at least one Facebook Page to connect.');
      return;
    }

    setStatus('saving_selection');

    try {
      // Disconnect any unselected pages so only chosen ones remain in this store
      const unselected = discoveredPages.filter((p) => !selectedIds.has(p.id));
      await Promise.all(
        unselected.map((p) =>
          disconnectAccount(storeId, p.id).catch((err) => {
            console.warn(`Failed to disconnect unselected page ${p.id}:`, err);
          }),
        ),
      );

      // Set user's chosen primary publishing page
      if (primaryTargetId) {
        setSelectedAccount(primaryTargetId);
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err.message || 'Failed to save your selected Facebook Pages.',
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl space-y-5">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] mx-auto flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Connecting Facebook...
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Securely retrieving your authorized Facebook Pages.
            </p>
          </div>
        )}

        {/* Multi-Page Selection Screen */}
        {(status === 'select_pages' || status === 'saving_selection') && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                f
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                  Select Facebook Pages
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  We found {discoveredPages.length} Pages on your Facebook account.
                  Choose which ones to link to{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {activeStore?.name || 'this store'}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] px-1 pt-1 border-t border-[var(--border-subtle)]">
              <span>
                {selectedIds.size} of {discoveredPages.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds(new Set(discoveredPages.map((p) => p.id)));
                    if (!primaryTargetId && discoveredPages.length > 0) {
                      setPrimaryTargetId(discoveredPages[0].id);
                    }
                  }}
                  className="hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setPrimaryTargetId(null);
                  }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Pages List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {discoveredPages.map((page) => {
                const isChecked = selectedIds.has(page.id);
                const isPrimary = primaryTargetId === page.id;

                return (
                  <div
                    key={page.id}
                    onClick={() => togglePageSelection(page.id)}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3',
                      isChecked
                        ? 'border-[#1877F2] bg-[#1877F2]/5 shadow-xs'
                        : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]/40 bg-[var(--bg-card)] opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0',
                          isChecked
                            ? 'border-[#1877F2] bg-[#1877F2] text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-main)]'
                        )}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {/* Page Metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {page.accountName}
                          </span>
                          {isPrimary && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active Target
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
                          ID: {page.platformAccountId}
                        </p>
                      </div>
                    </div>

                    {/* Button for default active publishing target */}
                    {isChecked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryTargetId(page.id);
                        }}
                        title="Make Default Active Target"
                        className={cn(
                          'text-[10px] px-2 py-1 rounded-md border font-medium transition-all shrink-0 cursor-pointer',
                          isPrimary
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        {isPrimary ? 'Default' : 'Set as Default'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelection}
                disabled={status === 'saving_selection' || selectedIds.size === 0}
                className="flex-2 py-2.5 px-4 rounded-lg text-xs font-semibold bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'saving_selection' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Choices...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Connect ({selectedIds.size})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Connected Successfully!
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Your selected Facebook Page(s) are ready. Redirecting to Feed
              Studio...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Connection Failed
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {errorMessage ||
                'An error occurred while connecting your Facebook Page.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-5 py-2.5 rounded-lg text-xs font-medium bg-[var(--brand-primary)] text-white hover:brightness-110 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <FacebookCallbackContent />
    </React.Suspense>
  );
}
