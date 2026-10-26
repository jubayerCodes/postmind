'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useStoreWorkspaceStore } from '@/stores/store-workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { useProductsStore } from '@/stores/products-store';
import { useContentStore } from '@/stores/content-store';
import { useSocialStore } from '@/stores/social-store';

export interface Store {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  ownerId: string;
  createdAt: string;
  _count?: {
    products: number;
    contents: number;
  };
}

export const DEFAULT_DEMO_STORE: Store = {
  id: 'cmutjsm1p0001z4ms683sn3qf',
  name: 'UrbanWear Dhaka',
  slug: 'urbanwear-dhaka',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  ownerId: 'dev-merchant-urbanwear',
  createdAt: '2026-10-04T08:17:26.940Z',
  _count: {
    products: 4,
    contents: 12,
  },
};

export function useStores() {
  const queryClient = useQueryClient();
  const { user, isDevGuest } = useAuthStore();
  const activeStoreId = useStoreWorkspaceStore((state) => state.activeStoreId);
  const setActiveStoreId = useStoreWorkspaceStore((state) => state.setActiveStoreId);
  const isSwitchingWorkspace = useStoreWorkspaceStore((state) => state.isSwitchingWorkspace);
  const switchingTargetId = useStoreWorkspaceStore((state) => state.switchingTargetId);
  const setIsSwitchingWorkspace = useStoreWorkspaceStore((state) => state.setIsSwitchingWorkspace);

  const switchWorkspace = React.useCallback(
    async (targetStoreId: string) => {
      if (!targetStoreId || targetStoreId === activeStoreId || isSwitchingWorkspace) {
        return;
      }

      setIsSwitchingWorkspace(true, targetStoreId);

      // Cleanly reset transient state in products and content stores so old data doesn't bleed into new workspace
      useProductsStore.getState().resetForWorkspaceSwitch();
      useContentStore.getState().resetForWorkspaceSwitch();

      const startTime = Date.now();
      try {
        await Promise.allSettled([
          useProductsStore.getState().fetchProducts(targetStoreId),
          useSocialStore.getState().fetchAccounts(targetStoreId),
        ]);
      } catch (err) {
        console.warn('Workspace switch data preloading failed:', err);
      } finally {
        // Guarantee 250ms minimum transition duration for smooth visual pacing
        const elapsed = Date.now() - startTime;
        const minDuration = 250;
        if (elapsed < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
        }

        setActiveStoreId(targetStoreId);
        setIsSwitchingWorkspace(false, null);
      }
    },
    [activeStoreId, isSwitchingWorkspace, setActiveStoreId, setIsSwitchingWorkspace],
  );

  const userId = user?.id || (isDevGuest ? 'dev-merchant-urbanwear' : 'anonymous');

  const storesQuery = useQuery<Store[]>({
    queryKey: ['stores', userId],
    queryFn: async () => {
      try {
        const data = await apiClient<Store[]>('/stores');
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
        return isDevGuest ? [DEFAULT_DEMO_STORE] : [];
      } catch (err) {
        console.warn('Could not fetch stores from backend:', err);
        return isDevGuest ? [DEFAULT_DEMO_STORE] : [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createStoreMutation = useMutation({
    mutationFn: (newStore: { name: string; currency?: string; timezone?: string }) =>
      apiClient<Store>('/stores', {
        method: 'POST',
        body: JSON.stringify(newStore),
      }),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      await switchWorkspace(created.id);
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({
      storeId,
      name,
      currency,
      timezone,
    }: {
      storeId: string;
      name?: string;
      currency?: string;
      timezone?: string;
    }) =>
      apiClient<Store>(`/stores/${storeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, currency, timezone }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.setQueryData<Store[]>(['stores', userId], (old) => {
        if (!old) return [updated];
        return old.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      });
    },
  });

  const rawStores =
    storesQuery.data && storesQuery.data.length > 0
      ? storesQuery.data
      : isDevGuest
        ? [DEFAULT_DEMO_STORE]
        : [];

  // Strictly deduplicate stores by ID and slug to eliminate any duplicate entries
  const stores = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    return rawStores.filter((s) => {
      if (seenIds.has(s.id) || seenSlugs.has(s.slug)) {
        return false;
      }
      seenIds.add(s.id);
      seenSlugs.add(s.slug);
      return true;
    });
  }, [rawStores]);

  // Auto-select first store if none selected or if activeStoreId is not in list
  React.useEffect(() => {
    if (stores.length > 0) {
      if (!isSwitchingWorkspace && (!activeStoreId || !stores.some((s) => s.id === activeStoreId))) {
        setActiveStoreId(stores[0].id);
      }
    } else if (!isDevGuest && activeStoreId) {
      setActiveStoreId(null);
    }
  }, [stores, activeStoreId, setActiveStoreId, isDevGuest, isSwitchingWorkspace]);

  const activeStore =
    stores.find((s) => s.id === activeStoreId) || stores[0] || (isDevGuest ? DEFAULT_DEMO_STORE : null);

  return {
    stores,
    activeStore,
    activeStoreId: activeStore?.id || null,
    setActiveStoreId,
    isSwitchingWorkspace,
    switchingTargetId,
    switchWorkspace,
    isLoading: storesQuery.isLoading,
    isError: storesQuery.isError,
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
    updateStore: updateStoreMutation.mutateAsync,
    isUpdating: updateStoreMutation.isPending,
  };
}
