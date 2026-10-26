'use client';

import * as React from 'react';
import {
  X,
  Sparkles,
  Download,
  Check,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageVariation {
  id: string;
  url: string;
  engine?: string;
  createdAt: number;
}

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productTitle?: string;
  engine?: string | null;
  onSelectImage?: (url: string) => void;
  onRegenerate?: () => Promise<void> | void;
  isRegenerating?: boolean;
  variations?: ImageVariation[];
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  productTitle = 'Generated Product Visual',
  engine,
  onSelectImage,
  onRegenerate,
  isRegenerating = false,
  variations = [],
}: ImagePreviewModalProps) {
  const [selectedUrl, setSelectedUrl] = React.useState(imageUrl);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);

  React.useEffect(() => {
    setSelectedUrl(imageUrl);
    setZoomLevel(1);
  }, [imageUrl, isOpen]);

  // Handle ESC key to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedUrl) return null;

  const handleApply = () => {
    if (onSelectImage) onSelectImage(selectedUrl);
    onClose();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = selectedUrl;
    a.download = `${productTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-hd.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-150 select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {productTitle}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  1024 × 1024 HD
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Full-resolution high-definition preview &bull; Inspect lighting and textures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {engine && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {engine === 'cloudflare-workers-ai'
                  ? 'Cloudflare Workers AI'
                  : engine === 'nano-banana'
                  ? 'Google Nano Banana'
                  : 'Flux'}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Canvas / Preview Area */}
        <div className="relative flex-1 bg-black/40 overflow-hidden flex items-center justify-center min-h-[360px] sm:min-h-[460px] p-4">
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedUrl}
              alt={productTitle}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10 ring-1 ring-white/5"
            />
          </div>

          {/* Zoom Overlay Pill */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 p-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
              disabled={zoomLevel <= 0.75}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              disabled={zoomLevel >= 2.5}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Variations Strip (if multiple variations exist) */}
        {variations.length > 1 && (
          <div className="px-5 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] shrink-0 mr-1">
              Variations:
            </span>
            {variations.map((v, idx) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSelectedUrl(v.url);
                  setZoomLevel(1);
                }}
                className={cn(
                  'relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                  selectedUrl === v.url
                    ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 scale-105'
                    : 'border-[var(--border-subtle)] opacity-70 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.url}
                  alt={`Variation ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono text-white px-1 rounded-tl">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>Download File</span>
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    'w-3.5 h-3.5 text-[var(--brand-primary)]',
                    isRegenerating && 'animate-spin',
                  )}
                />
                <span>
                  {isRegenerating ? 'Regenerating Variation...' : 'Regenerate Image'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use This Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
