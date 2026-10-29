'use client';

import * as React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  CheckCircle,
  Check,
  Sparkles,
  Clock,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Eye,
  MoreVertical,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, SocialPostState } from '@/lib/mock-data';
import { ImagePreviewModal } from '../products/image-preview-modal';

interface SocialPostCardProps {
  post: SocialPostState;
  product?: Product | null;
  products?: Product[];
  onOpenAttachmentModal?: () => void;
  onDetachProduct?: (productId: string) => void;
  onEditCaption?: (newCaption: string) => void;
  onLikeToggle?: () => void;
  isGenerating?: boolean;
  storeName?: string;
  pageAvatarUrl?: string | null;
  onRegeneratePost?: () => void;
  isRegeneratingPost?: boolean;
  onRegenerateImage?: () => Promise<void> | void;
  isRegeneratingImage?: boolean;
  onDeletePost?: () => void;
  onSyncMetrics?: () => Promise<void> | void;
  isSyncingMetrics?: boolean;
  metricsLastSyncedAt?: string | null;
}

export function SocialPostCard({
  post,
  product,
  products = [],
  onOpenAttachmentModal,
  onDetachProduct,
  onEditCaption,
  isGenerating = false,
  storeName = 'My Store',
  pageAvatarUrl,
  onRegeneratePost,
  isRegeneratingPost = false,
  onRegenerateImage,
  isRegeneratingImage = false,
  onDeletePost,
  onSyncMetrics,
  isSyncingMetrics = false,
  metricsLastSyncedAt,
}: SocialPostCardProps) {
  // Resolve list of attached products
  const attachedProducts: Product[] = React.useMemo(() => {
    if (products && products.length > 0) return products;
    if (product) return [product];
    return [];
  }, [products, product]);

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);
  const [likes, setLikes] = React.useState(Number(post.likesCount || 0));
  const [isLiked, setIsLiked] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableText, setEditableText] = React.useState(post.caption || '');
  const [isImagePreviewOpen, setIsImagePreviewOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Keep active photo index in bounds
  React.useEffect(() => {
    if (activePhotoIdx >= attachedProducts.length) {
      setActivePhotoIdx(Math.max(0, attachedProducts.length - 1));
    }
  }, [attachedProducts.length, activePhotoIdx]);

  const currentDisplayProduct = attachedProducts[activePhotoIdx] || attachedProducts[0] || null;

  const formattedSyncTime = React.useMemo(() => {
    if (!metricsLastSyncedAt) return null;
    try {
      const d = new Date(metricsLastSyncedAt);
      return isNaN(d.getTime())
        ? null
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [metricsLastSyncedAt]);

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  React.useEffect(() => {
    setEditableText(post.caption || '');
    setLikes(Number(post.likesCount || 0));
  }, [post.caption, post.likesCount]);

  const handleLike = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleSaveCaption = () => {
    setIsEditing(false);
    if (onEditCaption) onEditCaption(editableText);
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-all duration-200">
      {/* Social Card Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-[var(--border-subtle)] relative">
            <span>{(storeName || 'Store').slice(0, 2).toUpperCase()}</span>
            {pageAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pageAvatarUrl}
                alt={storeName || 'Store'}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-[var(--text-primary)]">
                {storeName}
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-[var(--brand-primary)] fill-[var(--brand-primary)]/20" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span>Meta Facebook Page</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[var(--brand-primary)] font-medium">
                <Sparkles className="w-3 h-3" /> AI Generated
              </span>
            </div>
          </div>
        </div>

        {/* Post Actions & Status Badge */}
        <div className="flex items-center gap-2">
          {post.status === 'SCHEDULED' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Clock className="w-3 h-3" /> Scheduled
            </span>
          ) : post.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" /> Published
            </span>
          ) : post.status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Check className="w-3 h-3 text-emerald-500" /> Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              Ready for Review
            </span>
          )}

          {/* Three-dot Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Post actions menu"
              title="Post generation & preview options"
              className={cn(
                'p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer',
                isMenuOpen && 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs',
              )}
            >
              {isGenerating || isRegeneratingPost || isRegeneratingImage ? (
                <RefreshCw className="w-4 h-4 text-[var(--brand-primary)] animate-spin" />
              ) : (
                <MoreVertical className="w-4 h-4" />
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl z-30 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-3 py-1 border-b border-[var(--border-subtle)]/60 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Post Options
                </div>

                {/* Attach Products Option */}
                {onOpenAttachmentModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAttachmentModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">
                        {attachedProducts.length > 0 ? 'Edit Attached Products' : 'Attach Products'}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {attachedProducts.length > 0
                          ? `${attachedProducts.length} items currently linked`
                          : 'Select products from store catalog'}
                      </div>
                    </div>
                  </button>
                )}

                {/* Regenerate Options (Only allowed for DRAFT / READY posts) */}
                {post.status !== 'PUBLISHED' && post.status !== 'APPROVED' ? (
                  <>
                    {onRegeneratePost && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onRegeneratePost();
                        }}
                        disabled={isRegeneratingPost}
                        className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw
                          className={cn(
                            'w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5',
                            isRegeneratingPost && 'animate-spin',
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">
                            {isRegeneratingPost ? 'Regenerating...' : 'Regenerate Caption & Copy'}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                            Re-synthesize engaging copy with AI
                          </div>
                        </div>
                      </button>
                    )}

                    {onRegenerateImage && currentDisplayProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onRegenerateImage();
                        }}
                        disabled={isRegeneratingImage}
                        className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles
                          className={cn(
                            'w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5',
                            isRegeneratingImage && 'animate-spin',
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">
                            {isRegeneratingImage ? 'Synthesizing Studio Photo...' : 'Regenerate Studio Photo'}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                            Generate fresh 4K commercial photo
                          </div>
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-3 py-2 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Post is locked (content is approved/published)</span>
                  </div>
                )}

                {currentDisplayProduct?.image && (
                  <>
                    <div className="my-1 border-t border-[var(--border-subtle)]/60" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsImagePreviewOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">Preview Image (HD)</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          Inspect 1024px visual with zoom controls
                        </div>
                      </div>
                    </button>
                  </>
                )}

                {/* Delete Post Option (Only for Draft / Not Published posts) */}
                {post.status !== 'PUBLISHED' && onDeletePost && (
                  <>
                    <div className="my-1 border-t border-[var(--border-subtle)]/60" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeletePost();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-500/10 flex items-start gap-2.5 transition-colors cursor-pointer group"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-rose-500">Delete Post</div>
                        <div className="text-[10px] text-rose-400/80 mt-0.5">
                          Discard this draft post permanently
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attached Products Bar (Chips + Attach CTA) */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1 shrink-0">
            <ShoppingBag className="w-3 h-3 text-[var(--brand-primary)]" />
            <span>Products:</span>
          </span>

          {attachedProducts.length === 0 ? (
            <span className="text-[11px] text-[var(--text-secondary)]/70 italic">
              None attached (Brand Post)
            </span>
          ) : (
            attachedProducts.map((p, idx) => (
              <span
                key={p.id}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors',
                  idx === activePhotoIdx
                    ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border-[var(--brand-primary)]/40 font-semibold'
                    : 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                )}
              >
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className="truncate max-w-[120px] hover:underline cursor-pointer"
                  title={`View photo for ${p.name}`}
                >
                  {p.name}
                </button>
                {post.status !== 'PUBLISHED' && onDetachProduct && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetachProduct(p.id);
                    }}
                    className="hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                    title={`Remove ${p.name} from this post`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {post.status !== 'PUBLISHED' && onOpenAttachmentModal && (
          <button
            type="button"
            onClick={onOpenAttachmentModal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer shrink-0 ml-auto"
          >
            <Plus className="w-3 h-3" />
            <span>{attachedProducts.length > 0 ? 'Edit Products' : 'Attach Products'}</span>
          </button>
        )}
      </div>

      {/* Media Image / Visual Showcase Container */}
      {currentDisplayProduct && currentDisplayProduct.image ? (
        <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-950 overflow-hidden group select-none">
          {/* Main Visual */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentDisplayProduct.image}
            alt={currentDisplayProduct.name}
            onClick={() => setIsImagePreviewOpen(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] cursor-pointer"
          />

          {/* Carousel Next / Prev Controls (if multiple products) */}
          {attachedProducts.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) =>
                    prev > 0 ? prev - 1 : attachedProducts.length - 1,
                  );
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-opacity cursor-pointer shadow-md opacity-0 group-hover:opacity-100"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) =>
                    prev < attachedProducts.length - 1 ? prev + 1 : 0,
                  );
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-opacity cursor-pointer shadow-md opacity-0 group-hover:opacity-100"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Hover Full Preview Button */}
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(true)}
            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 cursor-pointer shadow-md"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Preview HD</span>
          </button>

          {/* Photo Pagination Dot Indicators (if multiple) */}
          {attachedProducts.length > 1 && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
              <span>{activePhotoIdx + 1} / {attachedProducts.length}</span>
            </div>
          )}

          {/* Product Tag Overlay */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-sm">
            <ShoppingBag className="w-3 h-3 text-zinc-300" />
            <span className="truncate max-w-[150px]">{currentDisplayProduct.name}</span>
            <span className="font-bold text-white">
              {currentDisplayProduct.price}
            </span>
            {currentDisplayProduct.discount && (
              <span className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 border border-zinc-700">
                {currentDisplayProduct.discount}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Zero Products / Branded Placeholder */
        <div className="py-12 px-6 bg-gradient-to-br from-[var(--bg-hover)]/70 via-[var(--bg-card)] to-[var(--brand-primary-light)]/20 border-b border-[var(--border-subtle)] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mb-2.5 shadow-2xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            Brand Engagement Post
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm leading-relaxed">
            This post publishes as a brand announcement / engagement post. You can optionally attach products anytime from your catalog.
          </p>
          {post.status !== 'PUBLISHED' && onOpenAttachmentModal && (
            <button
              type="button"
              onClick={onOpenAttachmentModal}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Products from Catalog</span>
            </button>
          )}
        </div>
      )}

      {/* Card Body / Caption & Engagement */}
      <div className="p-4 space-y-3">
        {/* Interactive Social Actions Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              title={
                post.status === 'PUBLISHED'
                  ? 'Reactions from Meta Facebook Page'
                  : 'Reactions will sync live once published to Facebook'
              }
              className={cn(
                'flex items-center gap-1.5 transition-colors cursor-pointer',
                isLiked
                  ? 'text-rose-500'
                  : 'hover:text-[var(--text-primary)]'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
              <span className="font-mono text-xs">
                {Number(likes || 0).toLocaleString()}
              </span>
            </button>
            <button
              title={
                post.status === 'PUBLISHED'
                  ? 'Comments from Meta Facebook Page'
                  : 'Comments will sync live once published to Facebook'
              }
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">
                {Number(post.commentsCount || 0).toLocaleString()}
              </span>
            </button>
            <button
              title={
                post.status === 'PUBLISHED'
                  ? 'Shares from Meta Facebook Page'
                  : 'Shares will sync live once published to Facebook'
              }
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">
                {Number(post.sharesCount || 0).toLocaleString()}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono">
            {post.status === 'PUBLISHED' && onSyncMetrics && (
              <>
                <button
                  type="button"
                  onClick={() => onSyncMetrics()}
                  disabled={isSyncingMetrics}
                  title={
                    formattedSyncTime
                      ? `Synced ${formattedSyncTime} • Refresh from Meta Graph API`
                      : 'Sync live engagement from Meta Graph API'
                  }
                  className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={cn(
                      'w-3 h-3',
                      isSyncingMetrics && 'animate-spin text-[var(--brand-primary)]',
                    )}
                  />
                  <span>{isSyncingMetrics ? 'Syncing...' : 'Sync'}</span>
                </button>
                <span>•</span>
              </>
            )}
            <span>
              {post.status === 'PUBLISHED' ? 'Meta Graph API' : 'Meta Graph API (On Publish)'}
            </span>
          </div>
        </div>

        {/* Caption Section */}
        <div className="text-xs text-[var(--text-primary)] leading-relaxed">
          {isGenerating ? (
            <div className="space-y-2 py-2 animate-pulse">
              <div className="h-3 bg-[var(--bg-hover)] rounded w-3/4" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-full" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-5/6" />
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--brand-primary)] font-medium pt-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Crafting high-converting post with AI...</span>
              </div>
            </div>
          ) : isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full p-2.5 rounded-md border border-[var(--border-active)] bg-[var(--bg-card)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] resize-none h-28 text-[var(--text-primary)]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaption}
                  className="px-3 py-1 rounded text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 cursor-pointer"
                >
                  Save Text
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group/caption">
              <p className={cn('whitespace-pre-line', !isExpanded && 'line-clamp-3')}>
                <span className="font-semibold text-[var(--text-primary)] mr-1.5">
                  {storeName}
                </span>
                {post.caption || (
                  <span className="italic text-[var(--text-secondary)]">
                    No caption yet. Use the tone dock below or AI prompt to generate!
                  </span>
                )}
              </p>
              {post.caption && post.caption.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline mt-1 cursor-pointer"
                >
                  {isExpanded ? 'Show Less' : '...Show More'}
                </button>
              )}
              {post.status !== 'PUBLISHED' && post.status !== 'APPROVED' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/caption:opacity-100 transition-opacity ml-2 text-[11px] text-[var(--text-secondary)] hover:underline cursor-pointer"
                >
                  (Edit)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono text-[var(--brand-primary)] hover:underline cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA Button Preview */}
        {post.cta && (
          <div className="pt-1.5">
            <div className="w-full py-2 px-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-center text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-1.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
              <span>{post.cta}</span>
              <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
            </div>
          </div>
        )}
      </div>

      {/* Full HD Image Preview Dialog */}
      {currentDisplayProduct && (
        <ImagePreviewModal
          isOpen={isImagePreviewOpen}
          onClose={() => setIsImagePreviewOpen(false)}
          imageUrl={currentDisplayProduct.image || ''}
          productTitle={currentDisplayProduct.name}
          isRegenerating={isRegeneratingImage}
          onRegenerate={onRegenerateImage}
        />
      )}
    </div>
  );
}
