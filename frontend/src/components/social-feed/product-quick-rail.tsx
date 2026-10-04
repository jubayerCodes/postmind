'use client';

import * as React from 'react';
import { ShoppingBag, Sparkles, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/mock-data';

interface ProductQuickRailProps {
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (product: Product) => void;
}

export function ProductQuickRail({
  products,
  selectedProductId,
  onSelectProduct,
}: ProductQuickRailProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 flex flex-col shrink-0 transition-colors z-10 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <h2 className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
            Store Products
          </h2>
        </div>
        <button className="flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline cursor-pointer">
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
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
        {filteredProducts.map((product) => {
          const isSelected = selectedProductId === product.id;
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-md object-cover shrink-0 border border-[var(--border-subtle)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      {product.category}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {product.price}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] truncate mt-0.5">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {product.tagline}
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
        })}
      </div>
    </aside>
  );
}
