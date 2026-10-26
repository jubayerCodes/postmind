'use client';

import * as React from 'react';
import { X, Loader2, Sparkles, AlertCircle, UploadCloud, Check } from 'lucide-react';
import { useProductsStore, Product } from '@/stores/products-store';
import { useStores } from '@/hooks/use-stores';
import { ImagePickerTabs } from './image-picker-tabs';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PRESET_CATEGORIES = [
  'Apparel',
  'Footwear',
  'Accessories',
  'Electronics',
  'Gaming',
  'Gadgets',
  'Cosmetics & Beauty',
  'Home & Decor',
  'Food & Grocery',
  'General',
];

const PRESET_IMAGES = [
  {
    label: 'Panjabi / Ethnic',
    url: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Sneakers / Shoes',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Denim Jacket',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Luxury Watch',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Leather Bag',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Wireless Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
];

interface ProductModalProps {
  onSwitchToBulk?: () => void;
}

export function ProductModal({ onSwitchToBulk }: ProductModalProps) {
  const { isModalOpen, modalMode, editingProduct, closeModal, createProduct, updateProduct, isMutating } =
    useProductsStore();
  const { activeStore } = useStores();

  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [category, setCategory] = React.useState('Apparel');
  const [stock, setStock] = React.useState('10');
  const [tagline, setTagline] = React.useState('');
  const [discount, setDiscount] = React.useState('');
  const [image, setImage] = React.useState('');
  const [featuresInput, setFeaturesInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Document & Flyer Autofill state
  const [isAutofilling, setIsAutofilling] = React.useState(false);
  const [isDraggingDoc, setIsDraggingDoc] = React.useState(false);
  const [autofillSuccess, setAutofillSuccess] = React.useState<string | null>(null);
  const docInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync state whenever editingProduct changes or modal opens
  React.useEffect(() => {
    if (editingProduct && modalMode === 'edit') {
      setName(editingProduct.name || '');
      setPrice(String(editingProduct.price || ''));
      setCategory(editingProduct.category || 'General');
      setStock(String(editingProduct.stock ?? 0));
      setTagline(editingProduct.tagline || '');
      setDiscount(editingProduct.discount || '');
      setImage(editingProduct.image || '');
      setFeaturesInput(editingProduct.features ? editingProduct.features.join(', ') : '');
    } else {
      setName('');
      setPrice('');
      setCategory('Apparel');
      setStock('25');
      setTagline('');
      setDiscount('');
      setImage(PRESET_IMAGES[0].url);
      setFeaturesInput('100% Premium Quality, Handcrafted Details, Fast Shipping');
    }
    setError(null);
  }, [editingProduct, modalMode, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeStore?.id) {
      setError('No active store selected');
      return;
    }

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please provide a valid price (>= 0)');
      return;
    }

    const parsedStock = parseInt(stock, 10);
    const features = featuresInput
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (modalMode === 'edit' && editingProduct) {
        await updateProduct(activeStore.id, editingProduct.id, {
          name: name.trim(),
          price: parsedPrice,
          category,
          stock: isNaN(parsedStock) ? 0 : parsedStock,
          tagline: tagline.trim() || undefined,
          discount: discount.trim() || undefined,
          image: image.trim() || undefined,
          features,
        });
      } else {
        await createProduct(activeStore.id, {
          name: name.trim(),
          price: parsedPrice,
          currency: activeStore.currency || 'BDT',
          category,
          stock: isNaN(parsedStock) ? 0 : parsedStock,
          tagline: tagline.trim() || undefined,
          discount: discount.trim() || undefined,
          image: image.trim() || undefined,
          features,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    }
  };

  const processAutofillFile = async (file: File) => {
    if (!file || !activeStore?.id) return;

    setIsAutofilling(true);
    setAutofillSuccess(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient<{
        products: any[];
        sourceSummary?: string;
      }>(`/stores/${activeStore.id}/ai/parse-document`, {
        method: 'POST',
        body: formData,
      });

      const items = res.products || [];
      if (items.length > 1) {
        // Document contains multiple products! Migrate to Bulk Workspace
        const drafts = items.map((p, idx) => ({
          id: `draft-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          name: p.name || 'Untitled Product',
          price: Number(p.price) || 0,
          currency: p.currency || activeStore.currency || 'BDT',
          category: p.category || 'General',
          stock: Number(p.stock) || 10,
          image: p.image || null,
          tagline: p.tagline || '',
          features: Array.isArray(p.features) ? p.features : [],
          discount: p.discount || null,
          suggestedImagePrompt: p.suggestedImagePrompt,
          selected: true,
        }));

        useProductsStore.setState({
          bulkDrafts: drafts,
          parsedSummary:
            res.sourceSummary || `Extracted ${drafts.length} products`,
          activeTab: 'bulk-import',
        });
        closeModal();
        if (onSwitchToBulk) onSwitchToBulk();
      } else if (items.length === 1) {
        // Exactly 1 product: autofill this single product modal!
        const p = items[0];
        setName(p.name || '');
        setPrice(p.price ? String(p.price) : '');
        if (p.category) setCategory(p.category);
        if (p.stock !== undefined && p.stock !== null) setStock(String(p.stock));
        if (p.tagline) setTagline(p.tagline);
        if (p.discount) setDiscount(p.discount);
        if (p.image) setImage(p.image);
        if (p.features && p.features.length) {
          setFeaturesInput(p.features.join(', '));
        }
        setAutofillSuccess(
          `AI parsed "${p.name}" (${p.price ? `${p.price} ${p.currency || 'BDT'}` : 'Price to be announced'}) successfully!`,
        );
      } else {
        setError('No product data detected in this document');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract product details from document');
    } finally {
      setIsAutofilling(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleAutofillDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAutofillFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {modalMode === 'create'
                  ? 'Add product details or autofill via document/flyer photo'
                  : 'Update catalog attributes and promotional details'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {modalMode === 'create' && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  useProductsStore.getState().setActiveTab('bulk-import');
                  if (onSwitchToBulk) onSwitchToBulk();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:brightness-105 border border-[var(--brand-primary)]/30 transition-all cursor-pointer mr-1"
                title="Switch to full-page bulk document import"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Bulk Import</span>
              </button>
            )}

            <button
              onClick={closeModal}
              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* AI Autofill Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingDoc(true);
            }}
            onDragLeave={() => setIsDraggingDoc(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingDoc(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processAutofillFile(file);
            }}
            onClick={() => {
              if (!isAutofilling) docInputRef.current?.click();
            }}
            className={cn(
              'relative rounded-xl border-2 border-dashed p-4 sm:p-5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group select-none',
              isDraggingDoc
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/25 ring-4 ring-[var(--brand-primary)]/20 scale-[1.01]'
                : 'border-[var(--brand-primary)]/40 bg-[var(--brand-primary-light)]/10 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/15',
            )}
          >
            <input
              ref={docInputRef}
              type="file"
              accept=".csv,.tsv,.pdf,image/png,image/jpeg,image/webp,text/plain"
              onChange={handleAutofillDocument}
              disabled={isAutofilling}
              className="hidden"
            />

            {isAutofilling ? (
              <div className="py-2 flex flex-col items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    AI Agent is Reading Product Details...
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Extracting title, price, specifications &amp; setting product image
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Drop product details image, flyer, or document here
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--brand-primary)] text-white font-semibold">
                      AI AUTOFILL
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    Drop a screenshot, price board photo, catalog page, PDF, or CSV &bull; or click to browse
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-mono opacity-80 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    PNG / JPG / WEBP
                  </span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                    PDF / CSV
                  </span>
                  <span>•</span>
                  <span>Up to 15MB</span>
                </div>
              </div>
            )}
          </div>

          {autofillSuccess && (
            <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>{autofillSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutofillSuccess(null)}
                className="text-[10px] hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Slim-Fit Stretch Denim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                {!PRESET_CATEGORIES.includes(category) && category && (
                  <option value={category}>{category}</option>
                )}
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price and Stock and Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Price ({activeStore?.currency || 'BDT'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 2950"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Offer / Discount
              </label>
              <input
                type="text"
                placeholder="e.g. 20% OFF or BOGO"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>
          </div>

          {/* Row 3: Tagline */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Tagline / Selling Angle
            </label>
            <input
              type="text"
              placeholder="e.g. Handcrafted Japanese selvedge denim tailored for modern gentlemen"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              The AI incorporates this hook to make high-converting captions.
            </p>
          </div>

          {/* Row 4: Key Features */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Key Features (comma-separated)
            </label>
            <input
              type="text"
              placeholder="100% Pure Cotton, Pre-shrunk weave, Double-stitch durability"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </div>

          {/* Row 5: Product Visual (PC Upload | Nano Banana AI | URL) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Product Visual
            </label>
            {activeStore?.id && (
              <ImagePickerTabs
                value={image}
                onChange={setImage}
                storeId={activeStore.id}
                productContext={{
                  name,
                  category,
                  features: featuresInput
                    .split(',')
                    .map((f) => f.trim())
                    .filter(Boolean),
                }}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isMutating}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isMutating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{modalMode === 'create' ? 'Create Product' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
