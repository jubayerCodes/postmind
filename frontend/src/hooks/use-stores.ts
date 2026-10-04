'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useStoreWorkspaceStore } from '@/stores/store-workspace-store';

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
  const activeStoreId = useStoreWorkspaceStore((state) => state.activeStoreId);
  const setActiveStoreId = useStoreWorkspaceStore((state) => state.setActiveStoreId);

  const storesQuery = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const data = await apiClient<Store[]>('/stores');
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
        return [DEFAULT_DEMO_STORE];
      } catch (err) {
        console.warn('Could not fetch stores from backend, using default workspace:', err);
        return [DEFAULT_DEMO_STORE];
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
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setActiveStoreId(created.id);
    },
  });

  const rawStores =
    storesQuery.data && storesQuery.data.length > 0
      ? storesQuery.data
      : [DEFAULT_DEMO_STORE];

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
      if (!activeStoreId || !stores.some((s) => s.id === activeStoreId)) {
        setActiveStoreId(stores[0].id);
      }
    }
  }, [stores, activeStoreId, setActiveStoreId]);

  const activeStore =
    stores.find((s) => s.id === activeStoreId) || stores[0] || DEFAULT_DEMO_STORE;

  return {
    stores,
    activeStore,
    activeStoreId: activeStore.id,
    setActiveStoreId,
    isLoading: storesQuery.isLoading,
    isError: storesQuery.isError,
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
  };
}
