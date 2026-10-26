'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProductsStore, BulkDraftProduct } from '@/stores/products-store';
import { useStores } from '@/hooks/use-stores';
import { ImagePickerTabs } from './image-picker-tabs';

const CATEGORIES = [
  'Apparel',
  'Footwear',
  'Accessories',
  'Electronics',
  'Cosmetics & Beauty',
  'Home & Decor',
  'Food & Grocery',
  'General',
];

export function BulkImportWorkspace() {
  const {
    bulkDrafts,
    isParsingDocument,
    isImportingBulk,
    parsedSummary,
    error,
    clearError,
    parseDocumentFile,
    updateBulkDraft,
    removeBulkDraft,
    addEmptyBulkDraft,
    toggleSelectDraft,
    toggleSelectAllDrafts,
    generateDraftImage,
    generateAllMissingImages,
    approveAndImportBulk,
    clearBulkDrafts,
    setActiveTab,
  } = useProductsStore();

  const { activeStore } = useStores();

  const [activeImagePickerDraftId, setActiveImagePickerDraftId] =
    React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectedCount = bulkDrafts.filter((d) => d.selected).length;
  const invalidCount = bulkDrafts.filter(
    (d) => d.selected && (!d.name.trim() || isNaN(d.price) || d.price < 0),
  ).length;

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!activeStore?.id) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeStore?.id) {
      await handleProcessFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessFile = async (file: File) => {
    if (!activeStore?.id) return;
    clearError();
    try {
      await parseDocumentFile(activeStore.id, file);
    } catch (err) {
      console.error('Document parsing error:', err);
    }
  };

  const handleImport = async () => {
    if (!activeStore?.id) return;
    try {
      const res = await approveAndImportBulk(activeStore.id);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'Name,Price,Category,Stock,Tagline,Discount,Features,Image\n' +
      'Premium Linen Shirt,3450,Apparel,25,100% Breathable organic linen tailored for comfort,15% OFF,"Organic Linen, Hand-finished Collar, Pre-shrunk",https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800\n' +
      'Minimalist Leather Cardholder,1200,Accessories,40,Full-grain vegetable tanned leather,,,"Vegetable Tanned, Holds 6 Cards",\n' +
      'Sport Air Max Sneakers,5800,Footwear,15,Ultra-cushioned running sneaker,10% OFF,"Air Cushioning, Breathable Mesh",\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'postmind_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-main)] select-none">
      {/* 1. Header Toolbar */}
      <div className="px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/60 backdrop-blur-sm shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[var(--text-primary)]">
              Bulk Document Import Workspace
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold">
              AI Multi-Format Parser
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Upload any shopper document (CSV, PDF, or Catalog Photo). AI extracts
            the products for your interactive review and approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>Back to Catalog Grid</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. Upload Dropzone Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-xl p-8 transition-all text-center flex flex-col items-center justify-center gap-3 relative ${
            dragOver
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/20'
              : 'border-[var(--border-subtle)] bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)]/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.pdf,image/png,image/jpeg,image/webp,text/plain"
            onChange={handleFileSelect}
            className="hidden"
            id="bulk-doc-input"
          />

          {isParsingDocument ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  AI Agent is Analyzing Document...
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Extracting product titles, prices, categories, and crafting
                  studio image prompts.
                </p>
              </div>
            </div>
          ) : (
            <label
              htmlFor="bulk-doc-input"
              className="cursor-pointer flex flex-col items-center gap-3 w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Drop your Shopper Document here or click to browse
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                  Upload a <b>CSV spreadsheet</b>, <b>PDF catalog</b>, or a{' '}
                  <b>photo / scanned image</b> of a price list, menu, or receipt.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)]">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CSV / TSV Sheets</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)]">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>PDF Catalogs</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)]">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span>Flyer / Menu Photos</span>
                </span>
              </div>
            </label>
          )}
        </div>

        {/* 3. Review & Approval Section */}
        {bulkDrafts.length > 0 && (
          <div className="space-y-3.5">
            {/* Action Bar Above Table */}
            <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedCount === bulkDrafts.length && bulkDrafts.length > 0
                    }
                    onChange={(e) => toggleSelectAllDrafts(e.target.checked)}
                    className="rounded border-[var(--border-subtle)] text-[var(--brand-primary)] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Select All ({selectedCount}/{bulkDrafts.length})
                  </span>
                </label>

                {parsedSummary && (
                  <span className="text-xs text-[var(--text-secondary)] hidden md:inline">
                    • {parsedSummary}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    activeStore?.id && generateAllMissingImages(activeStore.id)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Generate Missing AI Images</span>
                </button>

                <button
                  type="button"
                  onClick={() => addEmptyBulkDraft(activeStore?.currency || 'BDT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                <button
                  type="button"
                  onClick={clearBulkDrafts}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Editable Data Table */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/50 text-[var(--text-secondary)] font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-28">Image</th>
                      <th className="py-2.5 px-3 min-w-[180px]">
                        Product Name <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-32">Category</th>
                      <th className="py-2.5 px-3 w-28">
                        Price ({activeStore?.currency || 'BDT'}){' '}
                        <span className="text-rose-500">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-24">Stock</th>
                      <th className="py-2.5 px-3 w-28">Offer/Discount</th>
                      <th className="py-2.5 px-3 min-w-[200px]">
                        Tagline / Angle
                      </th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {bulkDrafts.map((draft, idx) => (
                      <tr
                        key={draft.id}
                        className={`hover:bg-[var(--bg-hover)]/50 transition-colors ${
                          !draft.selected ? 'opacity-50 bg-[var(--bg-main)]/30' : ''
                        }`}
                      >
                        {/* 1. Checkbox */}
                        <td className="py-3 px-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={draft.selected}
                            onChange={() => toggleSelectDraft(draft.id)}
                            className="rounded border-[var(--border-subtle)] text-[var(--brand-primary)] focus:ring-0 cursor-pointer mt-1"
                          />
                        </td>

                        {/* 2. Image Cell with Triple Mode Trigger */}
                        <td className="py-2 px-3 align-top">
                          <div className="flex flex-col gap-1 items-start">
                            {draft.image ? (
                              <div className="relative group w-14 h-14 rounded-md overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-main)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={draft.image}
                                  alt={draft.name}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveImagePickerDraftId(draft.id)
                                  }
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold cursor-pointer"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveImagePickerDraftId(draft.id)
                                }
                                className="w-14 h-14 rounded-md border border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[9px]">Add Image</span>
                              </button>
                            )}

                            {/* Nano Banana quick gen button if no image */}
                            {!draft.image && (
                              <button
                                type="button"
                                onClick={() =>
                                  activeStore?.id &&
                                  generateDraftImage(activeStore.id, draft.id)
                                }
                                disabled={draft.isGeneratingImage}
                                className="text-[10px] font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {draft.isGeneratingImage ? (
                                  <>
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    <span>Creating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>AI Gen</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 3. Product Name */}
                        <td className="py-2 px-3 align-top">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, { name: e.target.value })
                            }
                            placeholder="Product Name"
                            className={`w-full px-2 py-1 text-xs rounded border bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] ${
                              !draft.name.trim() && draft.selected
                                ? 'border-rose-500'
                                : 'border-[var(--border-subtle)]'
                            }`}
                          />
                          <div className="mt-1">
                            <input
                              type="text"
                              value={draft.features.join(', ')}
                              onChange={(e) =>
                                updateBulkDraft(draft.id, {
                                  features: e.target.value
                                    .split(',')
                                    .map((f) => f.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Features (comma-separated)"
                              className="w-full px-1.5 py-0.5 text-[10px] rounded border border-[var(--border-subtle)] bg-[var(--bg-main)]/60 text-[var(--text-secondary)] placeholder-[var(--text-secondary)]/50 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* 4. Category */}
                        <td className="py-2 px-3 align-top">
                          <select
                            value={draft.category}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, { category: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 5. Price */}
                        <td className="py-2 px-3 align-top">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={draft.price}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, {
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`w-full px-2 py-1 text-xs rounded border bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] ${
                              (isNaN(draft.price) || draft.price <= 0) &&
                              draft.selected
                                ? 'border-rose-500'
                                : 'border-[var(--border-subtle)]'
                            }`}
                          />
                        </td>

                        {/* 6. Stock */}
                        <td className="py-2 px-3 align-top">
                          <input
                            type="number"
                            min="0"
                            value={draft.stock}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, {
                                stock: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] focus:outline-none"
                          />
                        </td>

                        {/* 7. Discount */}
                        <td className="py-2 px-3 align-top">
                          <input
                            type="text"
                            value={draft.discount || ''}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, {
                                discount: e.target.value || null,
                              })
                            }
                            placeholder="e.g. 15% OFF"
                            className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none"
                          />
                        </td>

                        {/* 8. Tagline */}
                        <td className="py-2 px-3 align-top">
                          <input
                            type="text"
                            value={draft.tagline || ''}
                            onChange={(e) =>
                              updateBulkDraft(draft.id, {
                                tagline: e.target.value || null,
                              })
                            }
                            placeholder="Selling hook or tagline"
                            className="w-full px-2 py-1 text-xs rounded border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none"
                          />
                        </td>

                        {/* 9. Remove Action */}
                        <td className="py-2 px-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => removeBulkDraft(draft.id)}
                            className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Bottom Approval & Commit Bar */}
            <div className="sticky bottom-4 z-20 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    Ready to populate catalog
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {selectedCount} {selectedCount === 1 ? 'product' : 'products'}{' '}
                    selected for approval.{' '}
                    {invalidCount > 0 && (
                      <span className="text-rose-500 font-semibold">
                        ({invalidCount} missing required title or price)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImportingBulk || selectedCount === 0 || invalidCount > 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isImportingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing to Catalog...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Approve & Import ({selectedCount}) Products
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Modal for Row Image Picker */}
      {activeImagePickerDraftId && activeStore?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>
                  Set Product Visual for &quot;
                  {
                    bulkDrafts.find((d) => d.id === activeImagePickerDraftId)
                      ?.name || 'Product'
                  }
                  &quot;
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveImagePickerDraftId(null)}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const draft = bulkDrafts.find(
                (d) => d.id === activeImagePickerDraftId,
              );
              if (!draft) return null;
              return (
                <ImagePickerTabs
                  value={draft.image}
                  onChange={(newUrl) => {
                    updateBulkDraft(draft.id, { image: newUrl });
                    setActiveImagePickerDraftId(null);
                  }}
                  storeId={activeStore.id}
                  productContext={{
                    name: draft.name,
                    category: draft.category,
                    features: draft.features,
                  }}
                />
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setActiveImagePickerDraftId(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
