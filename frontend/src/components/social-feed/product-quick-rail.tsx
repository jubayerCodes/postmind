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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-[#1F2C3F] bg-white dark:bg-[#0E141E] p-4 flex flex-col shrink-0 transition-colors z-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#1F2C3F]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-cyan-500" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">Store Products</h2>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Quick Search */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1F2C3F] bg-slate-50 dark:bg-[#131B26] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Product List */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
        {filteredProducts.map((product) => {
          const isSelected = selectedProductId === product.id;
          return (
            <div
              key={product.id}
              className={cn(
                'p-3 rounded-2xl border transition-all duration-200 bg-white dark:bg-[#131B26] group shadow-xs',
                isSelected
                  ? 'border-cyan-500 dark:border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'border-slate-200 dark:border-[#1F2C3F] hover:border-slate-300 dark:hover:border-[#2D3D56]'
              )}
            >
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300">
                      {product.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {product.price}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate mt-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {product.tagline}
                  </p>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button
                onClick={() => onSelectProduct(product)}
                className={cn(
                  'w-full mt-2.5 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'bg-slate-100 dark:bg-[#1A2433] text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-violet-600 hover:to-cyan-600 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isSelected ? 'Active in Studio' : 'Generate Post for this'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
