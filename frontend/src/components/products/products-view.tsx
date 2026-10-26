'use client';

import * as React from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  Tag,
  Package,
  Layers,
  Percent,
  Loader2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';
import { useProductsStore, Product } from '@/stores/products-store';
import { useStores } from '@/hooks/use-stores';
import { BulkImportWorkspace } from './bulk-import-workspace';

interface ProductsViewProps {
  onSelectForStudio: (product: Product) => void;
}

export function ProductsView({ onSelectForStudio }: ProductsViewProps) {
  const {
    activeTab,
    setActiveTab,
    bulkDrafts,
    products,
    total,
    isLoading,
    isMutating,
    error,
    openCreateModal,
    openEditModal,
    deleteProduct,
    seedDemoProducts,
    fetchProducts,
  } = useProductsStore();

  const { activeStore, isSwitchingWorkspace } = useStores();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  if (activeTab === 'bulk-import') {
    return <BulkImportWorkspace />;
  }

  React.useEffect(() => {
    if (activeStore?.id && !isSwitchingWorkspace) {
      fetchProducts(activeStore.id, {
        search: searchQuery,
        category: selectedCategory,
      });
    }
  }, [activeStore?.id, searchQuery, selectedCategory, fetchProducts, isSwitchingWorkspace]);

  // Extract unique categories from loaded products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Derived metrics
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const discountedCount = products.filter((p) => Boolean(p.discount)).length;

  const handleDelete = async (id: string) => {
    if (!activeStore?.id) return;
    try {
      await deleteProduct(activeStore.id, id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  const handleSeed = async () => {
    if (!activeStore?.id) return;
    await seedDemoProducts(activeStore.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-main)] select-none">
      {/* 1. Header Toolbar */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-sm shrink-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--brand-primary)]" />
              <h1 className="text-base font-bold text-[var(--text-primary)]">
                Product Catalog
              </h1>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                {total} {total === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage your products, pricing, and tags used by the AI content engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            {products.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Seed Demo Products</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('bulk-import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Bulk Import</span>
              {bulkDrafts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--brand-primary)] text-white font-mono">
                  {bulkDrafts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* 2. Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                Catalog Size
              </span>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {total}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                Categories
              </span>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {Math.max(1, categories.length - 1)}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                Total Stock
              </span>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {totalStock} units
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                Active Offers
              </span>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {discountedCount}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Search and Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search products by title, tagline, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap font-medium ${
                  selectedCategory === cat
                    ? 'bg-[var(--brand-primary)] text-white shadow-2xs font-semibold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Main Products Grid Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
            <span className="text-xs">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 text-center bg-[var(--bg-card)]/30">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              No products found
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1 leading-relaxed">
              Add your first product or seed the sample catalog to start generating high-converting AI social posts.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Product</span>
              </button>
              <button
                onClick={handleSeed}
                disabled={isMutating}
                className="px-3.5 py-2 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Seed Demo Catalog</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden flex flex-col justify-between shadow-2xs hover:border-[var(--border-active)] hover:shadow-sm transition-all group"
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-4/3 bg-[var(--bg-hover)] overflow-hidden">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                        <ShoppingBag className="w-10 h-10 opacity-30" />
                      </div>
                    )}

                    {/* Top overlay badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                        {product.category}
                      </span>
                    </div>

                    {product.discount && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          {product.discount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {activeStore?.currency || product.currency || 'BDT'} {Number(product.price).toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          product.stock > 10
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : product.stock > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-xs text-[var(--text-primary)] line-clamp-1">
                      {product.name}
                    </h3>

                    {product.tagline && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {product.tagline}
                      </p>
                    )}

                    {product.features && product.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {product.features.slice(0, 2).map((feat, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] truncate max-w-[140px]"
                          >
                            {feat}
                          </span>
                        ))}
                        {product.features.length > 2 && (
                          <span className="text-[9px] px-1 py-0.5 rounded text-[var(--text-secondary)]">
                            +{product.features.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/40 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onSelectForStudio(product)}
                    className="flex-1 py-1.5 px-2.5 rounded-md text-[11px] font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Create AI Post</span>
                  </button>

                  <button
                    onClick={() => openEditModal(product)}
                    title="Edit Product"
                    className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === product.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={isMutating}
                        className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-1 rounded text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(product.id)}
                      title="Delete Product"
                      className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
