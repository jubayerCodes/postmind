'use client';

import * as React from 'react';
import { ShoppingBag, Sparkles, Plus, Search, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, useProductsStore } from '@/stores/products-store';
import { useStores } from '@/hooks/use-stores';

interface ProductQuickRailProps {
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (product: Product) => void;
  onNavigateToBulk?: () => void;
}

export function ProductQuickRail({
  products,
  selectedProductId,
  onSelectProduct,
  onNavigateToBulk,
}: ProductQuickRailProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const openCreateModal = useProductsStore((state) => state.openCreateModal);
  const seedDemoProducts = useProductsStore((state) => state.seedDemoProducts);
  const isMutating = useProductsStore((state) => state.isMutating);
  const { activeStore } = useStores();

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSeed = async () => {
    if (!activeStore?.id) return;
    await seedDemoProducts(activeStore.id);
  };

  return (
    <aside className="w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 flex flex-col shrink-0 transition-colors z-10 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <h2 className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
            Store Products
          </h2>
          <span className="text-[10px] font-mono px-1 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
            {products.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              useProductsStore.getState().setActiveTab('bulk-import');
              if (onNavigateToBulk) onNavigateToBulk();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-2 py-0.5 rounded hover:brightness-105 transition-colors cursor-pointer"
            title="Bulk import products from CSV, PDF, or photos"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Bulk</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-primary)] hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative mb-2.5">
        <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="Filter products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2 overflow-y-auto pr-0.5 flex-1">
        {products.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center p-4 text-center border border-dashed border-[var(--border-subtle)] rounded-lg bg-[var(--bg-hover)]/30">
            <ShoppingBag className="w-6 h-6 text-[var(--text-secondary)] opacity-50 mb-2" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              No products in store
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 mb-3 leading-relaxed">
              Add a product or seed the demo catalog to test AI generation.
            </p>
            <div className="flex flex-col gap-1.5 w-full">
              <button
                type="button"
                onClick={() => {
                  useProductsStore.getState().setActiveTab('bulk-import');
                  if (onNavigateToBulk) onNavigateToBulk();
                }}
                className="w-full py-1.5 px-2 rounded-md text-[11px] font-semibold border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:brightness-105 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Bulk Import from Document</span>
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="w-full py-1.5 px-2 rounded-md text-[11px] font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Product</span>
              </button>
              <button
                type="button"
                onClick={handleSeed}
                disabled={isMutating}
                className="w-full py-1 px-2 rounded-md text-[10px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>Seed Demo Items</span>
              </button>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
            No matching products found.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isSelected = selectedProductId === product.id;
            const formattedPrice = `${activeStore?.currency || product.currency || 'BDT'} ${Number(product.price).toLocaleString()}`;
            return (
              <div
                key={product.id}
                className={cn(
                  'p-2.5 rounded-lg border transition-all duration-200 bg-[var(--bg-card)] group',
                  isSelected
                    ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-xs'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-active)]'
                )}
              >
                <div className="flex gap-2.5">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 rounded-md object-cover shrink-0 border border-[var(--border-subtle)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-[var(--bg-hover)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <ShoppingBag className="w-5 h-5 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                        {product.category}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {formattedPrice}
                      </span>
                    </div>
                    <h3 className="font-semibold text-xs text-[var(--text-primary)] truncate mt-0.5">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                      {product.tagline || (product.features && product.features[0]) || 'In catalog'}
                    </p>
                  </div>
                </div>

                {/* Action Trigger Button */}
                <button
                  onClick={() => onSelectProduct(product)}
                  className={cn(
                    'w-full mt-2 py-1 px-2.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border',
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white border-transparent font-semibold shadow-2xs'
                      : 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)]'
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isSelected ? 'Active in Studio' : 'Generate Post for this'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
