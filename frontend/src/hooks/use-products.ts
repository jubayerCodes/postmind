'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export interface Product {
  id: string;
  storeId?: string;
  name: string;
  price: number | string;
  currency?: string;
  category: string;
  stock: number;
  image?: string | null;
  tagline?: string | null;
  features?: string[];
  discount?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  currency?: string;
  category?: string;
  stock?: number;
  image?: string;
  tagline?: string;
  features?: string[];
  discount?: string;
}

export function useProducts(storeId: string | null, search?: string) {
  const queryClient = useQueryClient();

  const productsQuery = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['products', storeId, search],
    enabled: !!storeId,
    queryFn: async () => {
      if (!storeId) return { products: [], total: 0 };
      try {
        const res = await apiClient<{ products: Product[]; total: number }>(
          `/stores/${storeId}/products`,
          {
            storeId,
            params: search ? { search } : undefined,
          },
        );
        return res;
      } catch (err) {
        console.warn('Failed to fetch products from backend, falling back:', err);
        return { products: [], total: 0 };
      }
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (newProduct: CreateProductInput) => {
      if (!storeId) throw new Error('No active store selected');
      return apiClient<Product>(`/stores/${storeId}/products`, {
        method: 'POST',
        storeId,
        body: JSON.stringify(newProduct),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });

  // Seed default demo products if the newly connected store is completely empty
  const hasSeededRef = React.useRef(false);
  React.useEffect(() => {
    if (
      storeId &&
      !productsQuery.isLoading &&
      productsQuery.isSuccess &&
      productsQuery.data?.total === 0 &&
      !hasSeededRef.current
    ) {
      hasSeededRef.current = true;
      // Seed asynchronously in sequence
      const seedDemoCatalog = async () => {
        for (const mock of MOCK_PRODUCTS) {
          try {
            await apiClient(`/stores/${storeId}/products`, {
              method: 'POST',
              storeId,
              body: JSON.stringify({
                name: mock.name,
                price: mock.priceRaw,
                currency: 'BDT',
                category: mock.category,
                stock: mock.stock,
                image: mock.image,
                tagline: mock.tagline,
                features: mock.features,
                discount: mock.discount,
              }),
            });
          } catch (err) {
            console.error('Failed to seed mock product:', err);
          }
        }
        queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      };
      seedDemoCatalog();
    }
  }, [storeId, productsQuery.isLoading, productsQuery.isSuccess, productsQuery.data?.total, queryClient]);

  const products = productsQuery.data?.products || [];

  return {
    products,
    total: productsQuery.data?.total || 0,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    refetch: productsQuery.refetch,
  };
}
