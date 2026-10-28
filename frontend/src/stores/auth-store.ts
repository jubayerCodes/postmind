import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { useStoreWorkspaceStore } from '@/stores/store-workspace-store';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStore {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  ownerId: string;
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  stores: UserStore[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isDevGuest: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    storeName?: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
  loginAsDevGuest: () => Promise<void>;
  clearError: () => void;
  syncProfileAndStores: () => Promise<void>;
}

function formatAuthError(err: any, fallback: string): string {
  const msg = err?.message || '';
  if (msg.includes('Failed to fetch') || err?.name === 'TypeError') {
    return 'Unable to reach Supabase authentication server. Please verify your Supabase project is active (not paused) and the project URL is configured correctly.';
  }
  return msg || fallback;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  stores: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  isDevGuest: false,

  clearError: () => set({ error: null }),

  syncProfileAndStores: async () => {
    try {
      const data = await apiClient<{ user: UserProfile; stores: UserStore[] }>(
        '/auth/me',
      );
      set({ user: data.user, stores: data.stores || [] });
    } catch (err) {
      console.warn('Failed to sync user profile and stores:', err);
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error.message);
      }

      const session = data?.session || null;

      if (session) {
        set({ session, isDevGuest: false });
        await get().syncProfileAndStores();
      }

      // Listen for background auth state changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        const prevUserId = get().user?.id;
        const newUserId = newSession?.user?.id;

        if (newUserId && prevUserId && newUserId !== prevUserId) {
          useStoreWorkspaceStore.getState().setActiveStoreId(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('postmind_active_store_id');
          }
        }

        set({ session: newSession });
        if (newSession) {
          await get().syncProfileAndStores();
        } else if (!get().isDevGuest) {
          useStoreWorkspaceStore.getState().setActiveStoreId(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('postmind_active_store_id');
          }
          set({ user: null, stores: [] });
        }
      });
    } catch (err) {
      console.warn('Auth initialization exception:', err);
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('postmind_dev_guest');
      }
      set({ session: data.session, isDevGuest: false });
      await get().syncProfileAndStores();
      set({ isLoading: false });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'Failed to sign in');
      set({ error: formatted, isLoading: false });
      throw new Error(formatted);
    }
  },

  signInWithFacebook: async () => {
    set({ error: null });
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
        },
      });

      if (error) {
        const formatted = formatAuthError(error, error.message);
        set({ error: formatted, isLoading: false });
        throw new Error(formatted);
      }
    } catch (err: any) {
      const formatted = formatAuthError(
        err,
        'Failed to initialize Facebook login',
      );
      set({ error: formatted, isLoading: false });
      throw new Error(formatted);
    }
  },

  signUp: async (
    email: string,
    password: string,
    fullName: string,
    storeName?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            store_name: storeName?.trim() || undefined,
          },
        },
      });

      if (error) {
        const formatted = formatAuthError(error, error.message);
        set({ error: formatted, isLoading: false });
        throw new Error(formatted);
      }

      const hasSession = !!data.session;
      if (hasSession) {
        set({ session: data.session, isDevGuest: false });

        // If user entered a store name during signup, automatically provision it before sync
        if (storeName?.trim()) {
          try {
            await apiClient('/stores', {
              method: 'POST',
              body: JSON.stringify({
                name: storeName.trim(),
                currency: 'BDT',
                timezone: 'Asia/Dhaka',
              }),
            });
          } catch (createStoreErr) {
            console.warn('Failed to auto-provision initial store:', createStoreErr);
          }
        }

        // Sync profile with backend
        await get().syncProfileAndStores();
      }

      set({ isLoading: false });
      return { needsEmailConfirmation: !hasSession };
    } catch (err: any) {
      const formatted = formatAuthError(err, 'Failed to create your account');
      set({ error: formatted, isLoading: false });
      throw new Error(formatted);
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out from Supabase:', err);
    } finally {
      // Clear client workspace state
      useStoreWorkspaceStore.getState().setActiveStoreId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('postmind_active_store_id');
        sessionStorage.removeItem('postmind_dev_guest');
      }
      set({
        user: null,
        session: null,
        stores: [],
        isDevGuest: false,
        error: null,
        isLoading: false,
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        const formatted = formatAuthError(error, error.message);
        set({ error: formatted, isLoading: false });
        throw new Error(formatted);
      }

      set({ isLoading: false });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'Failed to send reset email');
      set({ error: formatted, isLoading: false });
      throw new Error(formatted);
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        const formatted = formatAuthError(error, error.message);
        set({ error: formatted, isLoading: false });
        throw new Error(formatted);
      }

      set({ isLoading: false });
    } catch (err: any) {
      const formatted = formatAuthError(err, 'Failed to update password');
      set({ error: formatted, isLoading: false });
      throw new Error(formatted);
    }
  },

  updateProfile: async (data: { name?: string; avatarUrl?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiClient<UserProfile>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      set((state) => ({
        user: state.user ? { ...state.user, ...updated } : updated,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile', isLoading: false });
      throw err;
    }
  },

  loginAsDevGuest: async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('postmind_dev_guest', 'true');
    }
    set({
      isDevGuest: true,
      user: {
        id: 'dev-merchant-urbanwear',
        email: 'merchant@urbanwear.dhaka',
        name: 'UrbanWear Merchant',
        avatarUrl: null,
      },
      error: null,
      isLoading: false,
    });
    // Fetch user stores via dev header
    try {
      const stores = await apiClient<UserStore[]>('/stores');
      set({ stores: stores || [] });
    } catch (err) {
      console.warn('Failed to fetch stores in dev mode:', err);
    }
  },
}));
