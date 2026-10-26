'use client';

import * as React from 'react';
import {
  Upload,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  RefreshCw,
  Maximize2,
  Eye,
} from 'lucide-react';
import { useProductsStore } from '@/stores/products-store';
import { cn } from '@/lib/utils';
import {
  ImagePreviewModal,
  ImageVariation,
} from './image-preview-modal';

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

interface ImagePickerTabsProps {
  value?: string | null;
  onChange: (url: string) => void;
  storeId: string;
  productContext?: {
    name?: string;
    category?: string;
    features?: string[];
  };
  compact?: boolean;
}

export function ImagePickerTabs({
  value,
  onChange,
  storeId,
  productContext,
  compact = false,
}: ImagePickerTabsProps) {
  const { uploadImageFile, generateAiImage } = useProductsStore();

  const [activeTab, setActiveTab] = React.useState<'upload' | 'ai' | 'url'>('upload');
  const [isUploading, setIsUploading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [engineUsed, setEngineUsed] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Variations & Full Preview State
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [variations, setVariations] = React.useState<ImageVariation[]>(() =>
    value
      ? [
          {
            id: 'initial',
            url: value,
            createdAt: Date.now(),
          },
        ]
      : [],
  );

  // AI Prompt State
  const [prompt, setPrompt] = React.useState('');
  const [urlInput, setUrlInput] = React.useState(value || '');

  React.useEffect(() => {
    setUrlInput(value || '');
    if (value && !variations.some((v) => v.url === value)) {
      setVariations((prev) => [
        {
          id: `var-${Date.now()}`,
          url: value,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    }
  }, [value]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadImageFile(file);
      setVariations((prev) => [
        { id: `upload-${Date.now()}`, url, createdAt: Date.now() },
        ...prev,
      ]);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAutoCraftPrompt = () => {
    const name = productContext?.name?.trim() || 'Premium item';
    const category = productContext?.category || 'Apparel';
    const feats = productContext?.features?.slice(0, 2).join(', ') || 'exclusive design';
    setPrompt(
      `Commercial studio product photography of ${name}, ${category} collection with ${feats}. Centered product shot isolated on solid clean neutral studio backdrop, high-definition textures, studio softbox rim lighting, sharp focus, 8k commercial catalogue photo.`,
    );
  };

  const handleGenerateAi = async () => {
    const activePrompt =
      prompt.trim() ||
      `Commercial studio product photography of ${productContext?.name || 'Exclusive Product'}, clean studio backdrop, 4k`;

    setError(null);
    setIsGenerating(true);
    try {
      const res = await generateAiImage(storeId, activePrompt, {
        productName: productContext?.name,
        category: productContext?.category,
        features: productContext?.features,
      });
      setEngineUsed(res.engine);

      const newVar: ImageVariation = {
        id: `var-${Date.now()}`,
        url: res.imageUrl,
        engine: res.engine,
        createdAt: Date.now(),
      };
      setVariations((prev) => [newVar, ...prev.filter((v) => v.url !== res.imageUrl)]);
      onChange(res.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-main)] rounded-lg border border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload from PC</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-xs font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Studio Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>URL & Presets</span>
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20">
          {error}
        </p>
      )}

      {/* Tab 1: Upload from PC */}
      {activeTab === 'upload' && (
        <div className="border border-dashed border-[var(--border-subtle)] rounded-lg p-3.5 bg-[var(--bg-main)]/50 hover:bg-[var(--bg-hover)] transition-colors text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
            id="pc-image-upload"
          />
          <label
            htmlFor="pc-image-upload"
            className="cursor-pointer flex flex-col items-center gap-1.5"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <Loader2 className="w-5 h-5 text-[var(--brand-primary)] animate-spin" />
                <span className="text-xs text-[var(--text-primary)] font-medium">
                  Uploading to Supabase Storage...
                </span>
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Click to browse or drop an image from your computer
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    Supports PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Tab 2: Nano Banana AI Prompt Generation */}
      {activeTab === 'ai' && (
        <div className="space-y-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)]/40">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Nano Banana Visual Prompt</span>
            </label>
            <button
              type="button"
              onClick={handleAutoCraftPrompt}
              className="text-[10px] text-[var(--brand-primary)] hover:underline font-medium cursor-pointer"
            >
              Auto-fill from details
            </button>
          </div>

          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Commercial studio shot of minimal watch on slate stone with softbox rim lighting..."
            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[var(--text-secondary)]">
              Powered by Google Nano Banana / Flux
            </span>
            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Visual</span>
                </>
              )}
            </button>
          </div>

          {engineUsed && (
            <div className="flex items-center justify-between p-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] animate-in fade-in-0 duration-150">
              <div className="flex items-center gap-1.5">
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    engineUsed === 'cloudflare-workers-ai'
                      ? 'text-amber-500'
                      : engineUsed === 'nano-banana'
                      ? 'text-emerald-500'
                      : 'text-blue-500'
                  }`}
                />
                <span className="font-semibold text-[var(--text-primary)]">
                  {engineUsed === 'cloudflare-workers-ai'
                    ? '✨ Engine: Cloudflare Workers AI (1024px HD)'
                    : engineUsed === 'nano-banana'
                    ? '✨ Engine: Google Nano Banana'
                    : '⚡ Engine: Flux (Active Fallback)'}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                {engineUsed === 'cloudflare-workers-ai'
                  ? 'Free 100/day tier'
                  : engineUsed === 'nano-banana'
                  ? 'Billed Project'
                  : 'Zero-config free tier'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: URL & Presets */}
      {activeTab === 'url' && (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleUrlSubmit}
              className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] font-mono"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-3 py-1.5 text-xs rounded-md font-medium border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] cursor-pointer"
            >
              Apply
            </button>
          </div>

          <div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)] block mb-1">
              Or pick a demo preset:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setUrlInput(preset.url);
                    onChange(preset.url);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                    value === preset.url
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border-[var(--brand-primary)] font-semibold'
                      : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  {value === preset.url && <Check className="w-2.5 h-2.5" />}
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Image Preview Strip with HD Preview & Regeneration Controls */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          {/* Clickable Image Thumbnail with Hover Zoom Icon */}
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="relative w-14 h-14 rounded-md overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-main)] shrink-0 cursor-pointer group/img"
            title="Click for full HD preview"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Product visual"
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3" /> Image Active
              </span>
              {variations.length > 1 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {variations.length} variations
                </span>
              )}
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] truncate font-mono mt-0.5">
              {value}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Preview HD</span>
              </button>

              <span className="text-[var(--border-subtle)] text-[10px]">&bull;</span>

              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    'w-3 h-3 text-[var(--brand-primary)]',
                    isGenerating && 'animate-spin',
                  )}
                />
                <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full HD Image Preview & Regeneration Modal */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={value || ''}
        productTitle={productContext?.name || 'Product Visual'}
        engine={engineUsed}
        variations={variations}
        isRegenerating={isGenerating}
        onRegenerate={handleGenerateAi}
        onSelectImage={(newUrl) => onChange(newUrl)}
      />
    </div>
  );
}
