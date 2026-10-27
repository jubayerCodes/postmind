import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { useContentStore } from './content-store';

export interface SocialAccountItem {
  id: string;
  storeId: string;
  platform: 'META_FACEBOOK' | 'INSTAGRAM';
  platformAccountId: string;
  accountName: string;
  avatarUrl?: string | null;
  status: 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED';
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SocialState {
  accounts: SocialAccountItem[];
  selectedAccountId: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  isPublishing: boolean;
  isSyncingMetrics: boolean;
  isModalOpen: boolean;
  error: string | null;
  lastPublishedPost: {
    contentId: string;
    platformPostId: string;
    permalinkUrl?: string;
  } | null;

  setModalOpen: (open: boolean) => void;
  setSelectedAccount: (id: string | null) => void;
  fetchAccounts: (storeId: string) => Promise<void>;
  connectDevAccount: (
    storeId: string,
    pageName?: string,
    avatarUrl?: string,
  ) => Promise<SocialAccountItem>;
  disconnectAccount: (storeId: string, accountId: string) => Promise<void>;
  publishPost: (
    storeId: string,
    contentId: string,
    socialAccountId?: string,
  ) => Promise<{
    success: boolean;
    content: any;
    publishResult: { platformPostId: string; permalinkUrl?: string; publishedAt: string };
  }>;
  syncPostMetrics: (
    storeId: string,
    contentId: string,
  ) => Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    metricsLastSyncedAt: string;
    content: any;
  }>;
  getConnectUrl: (storeId: string, redirectUri?: string) => Promise<string>;
  handleOAuthCallback: (
    storeId: string,
    code: string,
    redirectUri?: string,
  ) => Promise<SocialAccountItem[]>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  accounts: [],
  selectedAccountId: null,
  isLoading: false,
  isConnecting: false,
  isPublishing: false,
  isSyncingMetrics: false,
  isModalOpen: false,
  error: null,
  lastPublishedPost: null,

  setModalOpen: (open: boolean) => {
    set({ isModalOpen: open, error: null });
  },

  setSelectedAccount: (id: string | null) => {
    set({ selectedAccountId: id });
  },

  fetchAccounts: async (storeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient<{ accounts: SocialAccountItem[]; count: number }>(
        `/stores/${storeId}/social/accounts`,
        { storeId },
      );

      set((state) => {
        const accounts = res.accounts || [];
        // If current selection is invalid or not set, select first connected account
        let selected = state.selectedAccountId;
        if (!selected || !accounts.some((a) => a.id === selected)) {
          selected = accounts.length > 0 ? accounts[0].id : null;
        }

        return {
          accounts,
          selectedAccountId: selected,
          isLoading: false,
        };
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch connected accounts',
        isLoading: false,
      });
    }
  },

  connectDevAccount: async (storeId: string, pageName?: string, avatarUrl?: string) => {
    set({ isConnecting: true, error: null });
    try {
      const res = await apiClient<{
        account: SocialAccountItem;
        message: string;
      }>(`/stores/${storeId}/social/dev-connect`, {
        method: 'POST',
        storeId,
        body: JSON.stringify({ pageName, avatarUrl }),
      });

      const newAccount = res.account;
      set((state) => {
        const filtered = state.accounts.filter((a) => a.id !== newAccount.id);
        const updated = [newAccount, ...filtered];
        return {
          accounts: updated,
          selectedAccountId: newAccount.id,
          isConnecting: false,
        };
      });

      return newAccount;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to connect test account',
        isConnecting: false,
      });
      throw err;
    }
  },

  disconnectAccount: async (storeId: string, accountId: string) => {
    set({ isConnecting: true, error: null });
    try {
      await apiClient(`/stores/${storeId}/social/accounts/${accountId}`, {
        method: 'DELETE',
        storeId,
      });

      set((state) => {
        const remaining = state.accounts.filter((a) => a.id !== accountId);
        return {
          accounts: remaining,
          selectedAccountId:
            state.selectedAccountId === accountId
              ? remaining.length > 0
                ? remaining[0].id
                : null
              : state.selectedAccountId,
          isConnecting: false,
        };
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to disconnect account',
        isConnecting: false,
      });
      throw err;
    }
  },

  publishPost: async (
    storeId: string,
    contentId: string,
    socialAccountId?: string,
  ) => {
    const targetAccountId = socialAccountId || get().selectedAccountId || undefined;
    set({ isPublishing: true, error: null });

    try {
      const res = await apiClient<{
        success: boolean;
        content: any;
        publishResult: {
          platformPostId: string;
          permalinkUrl?: string;
          publishedAt: string;
        };
      }>(`/stores/${storeId}/social/publish/${contentId}`, {
        method: 'POST',
        storeId,
        body: JSON.stringify({ socialAccountId: targetAccountId }),
      });

      // Synchronize with ContentStore to mark post PUBLISHED across UI
      const contentState = useContentStore.getState();
      if (contentState.currentPost && contentState.currentPost.id === contentId) {
        useContentStore.setState({
          currentPost: {
            ...contentState.currentPost,
            status: 'PUBLISHED',
            publishedAt: res.publishResult.publishedAt,
            platformPostId: res.publishResult.platformPostId,
          },
        });
      }

      set({
        isPublishing: false,
        lastPublishedPost: {
          contentId,
          platformPostId: res.publishResult.platformPostId,
          permalinkUrl: res.publishResult.permalinkUrl,
        },
      });

      return res;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to publish post to Facebook',
        isPublishing: false,
      });
      throw err;
    }
  },

  syncPostMetrics: async (storeId: string, contentId: string) => {
    set({ isSyncingMetrics: true, error: null });
    try {
      const res = await apiClient<{
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        metricsLastSyncedAt: string;
        content: any;
      }>(`/stores/${storeId}/social/metrics/${contentId}/sync`, {
        method: 'POST',
        storeId,
      });

      set({ isSyncingMetrics: false });
      return res;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to sync post metrics from Facebook',
        isSyncingMetrics: false,
      });
      throw err;
    }
  },

  getConnectUrl: async (storeId: string, redirectUri?: string) => {
    const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const res = await apiClient<{ url: string; state: string }>(
      `/stores/${storeId}/social/connect-url${query}`,
      { storeId },
    );
    return res.url;
  },

  handleOAuthCallback: async (
    storeId: string,
    code: string,
    redirectUri?: string,
  ) => {
    set({ isConnecting: true, error: null });
    try {
      const res = await apiClient<{
        accounts: SocialAccountItem[];
        count: number;
      }>(`/stores/${storeId}/social/callback`, {
        method: 'POST',
        storeId,
        body: JSON.stringify({ code, redirectUri }),
      });

      set({
        accounts: res.accounts,
        selectedAccountId:
          res.accounts.length > 0 ? res.accounts[0].id : null,
        isConnecting: false,
      });
      return res.accounts;
    } catch (err: any) {
      set({
        error: err.message || 'Facebook authorization failed',
        isConnecting: false,
      });
      throw err;
    }
  },
}));
