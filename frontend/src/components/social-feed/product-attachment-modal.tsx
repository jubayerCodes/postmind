'use client';

import * as React from 'react';
import { useProductsStore, Product } from '@/stores/products-store';
import { useContentStore } from '@/stores/content-store';
import { useStores } from '@/hooks/use-stores';
import {
  X,
  Search,
  Check,
  ShoppingBag,
  ExternalLink,
  Plus,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProductAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductAttachmentModal({
  isOpen,
  onClose,
}: ProductAttachmentModalProps) {
  const { activeStore } = useStores();
  const { products, fetchProducts } = useProductsStore();
  const {
    currentPost,
    setAttachedProductsForCurrentPost,
  } = useContentStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize selected IDs from current post when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (activeStore?.id && products.length === 0) {
        fetchProducts(activeStore.id);
      }
      const attached = (currentPost?.attachedProducts || []).map(
        (ap) => ap.product.id,
      );
      if (attached.length === 0 && currentPost?.productId) {
        setSelectedIds(new Set([currentPost.productId]));
      } else {
        setSelectedIds(new Set(attached));
      }
    }
  }, [isOpen, currentPost, activeStore?.id, products.length, fetchProducts]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!activeStore?.id) return;
    setIsSaving(true);
    try {
      const selectedProducts = products.filter((p) => selectedIds.has(p.id));
      await setAttachedProductsForCurrentPost(activeStore.id, selectedProducts);
      onClose();
    } catch (err) {
      console.warn('Failed to update attached products:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Attach Products to Post
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select one or more products from your catalog to feature in this post
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar & quick count */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 shrink-0 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
            />
          </div>
          <div className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shrink-0">
            {selectedIds.size} Selected
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-[var(--border-subtle)]/40">
          {products.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Layers className="w-8 h-8 text-[var(--text-secondary)]/50 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No Products in Catalog
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                Add products from the Products menu before attaching them to posts.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
              >
                Go to Products Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
              No products found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isSelected = selectedIds.has(p.id);
              const priceDisplay =
                typeof p.price === 'number'
                  ? `${p.currency || 'BDT'} ${p.price.toLocaleString()}`
                  : `${p.currency || 'BDT'} ${p.price}`;

              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                    isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/40'
                      : 'border-transparent hover:bg-[var(--bg-hover)]'
                  )}
                >
                  {/* Selection Checkbox */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0',
                      isSelected
                        ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-2xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center relative">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[var(--text-secondary)]/50" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {p.name}
                      </h4>
                      {p.discount && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          {p.discount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">
                        {priceDisplay}
                      </span>
                      <span>•</span>
                      <span className="truncate">{p.category}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0 flex items-center justify-between gap-3">
          <Link
            href="/products"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Manage full catalog <ExternalLink className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isSaving
                ? 'Attaching...'
                : `Attach (${selectedIds.size}) to Post`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
