'use client';

import * as React from 'react';
import { useSocialStore, SocialAccountItem } from '@/stores/social-store';
import { useStores } from '@/hooks/use-stores';
import {
  X,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SocialAccountsModal() {
  const {
    accounts,
    selectedAccountId,
    isModalOpen,
    isLoading,
    isConnecting,
    error,
    setModalOpen,
    setSelectedAccount,
    fetchAccounts,
    connectDevAccount,
    disconnectAccount,
    getConnectUrl,
  } = useSocialStore();

  const { activeStore } = useStores();
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isModalOpen && activeStore?.id) {
      fetchAccounts(activeStore.id);
    }
  }, [isModalOpen, activeStore?.id, fetchAccounts]);

  if (!isModalOpen) return null;

  const handleRealFacebookConnect = async () => {
    if (!activeStore?.id) return;
    setActionError(null);
    try {
      const url = await getConnectUrl(activeStore.id);
      window.location.href = url;
    } catch (err: any) {
      setActionError(err.message || 'Failed to initiate Facebook OAuth');
    }
  };

  const handleDevSandboxConnect = async () => {
    if (!activeStore?.id) return;
    setActionError(null);
    try {
      await connectDevAccount(
        activeStore.id,
        `${activeStore.name} (Official Facebook Page)`,
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to connect test page');
    }
  };

  const handleDisconnect = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeStore?.id) return;
    if (confirm('Are you sure you want to disconnect this Facebook Page?')) {
      try {
        await disconnectAccount(activeStore.id, id);
      } catch (err: any) {
        setActionError(err.message || 'Failed to disconnect account');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                Connected Social Pages
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage Facebook Pages linked to{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {activeStore?.name || 'this store'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {(error || actionError) && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError || error}</span>
            </div>
          )}

          {/* Connected Pages Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] px-1">
              <span>Connected Facebook Pages ({accounts.length})</span>
              <span>Publishing Target</span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                <span className="text-xs">Loading linked accounts...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-8 px-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] mx-auto flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    No Facebook Pages connected yet
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                    Connect your Facebook Business Page to publish AI-generated posts with 1-click.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.id)}
                      className={cn(
                        'p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3',
                        isSelected
                          ? 'border-[#1877F2] bg-[#1877F2]/5 shadow-xs'
                          : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)]/40 bg-[var(--bg-card)]'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          f
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {acc.accountName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Connected
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
                            ID: {acc.platformAccountId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                            isSelected
                              ? 'border-[#1877F2] bg-[#1877F2]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-main)]'
                          )}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDisconnect(acc.id, e)}
                          title="Disconnect Page"
                          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connection Actions */}
          <div className="pt-2 space-y-2 border-t border-[var(--border-subtle)]">
            <span className="text-[11px] font-medium text-[var(--text-secondary)] block">
              Add Facebook Connection
            </span>

            {/* Real Meta OAuth Button */}
            <button
              onClick={handleRealFacebookConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-60"
            >
              {isConnecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-white text-[#1877F2] flex items-center justify-center text-[11px] font-black">
                  f
                </div>
              )}
              <span>Connect via Facebook Login</span>
            </button>

            {/* Instant Dev Sandbox 1-Click Button */}
            <button
              onClick={handleDevSandboxConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-dashed border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all cursor-pointer active:scale-98 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Connect Sandbox Test Page (Instant 1-Click)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-hover)]/30 flex items-center justify-between">
          <p className="text-[10px] text-[var(--text-secondary)]">
            Tokens encrypted using AES-256-GCM.
          </p>
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
