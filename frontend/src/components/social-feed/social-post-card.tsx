'use client';

import * as React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  CheckCircle,
  Sparkles,
  Clock,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Eye,
  MoreVertical,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, SocialPostState } from '@/lib/mock-data';
import { ImagePreviewModal } from '../products/image-preview-modal';

interface SocialPostCardProps {
  post: SocialPostState;
  product: Product;
  onEditCaption?: (newCaption: string) => void;
  onLikeToggle?: () => void;
  isGenerating?: boolean;
  storeName?: string;
  onRegeneratePost?: () => void;
  isRegeneratingPost?: boolean;
  onRegenerateImage?: () => Promise<void> | void;
  isRegeneratingImage?: boolean;
}

export function SocialPostCard({
  post,
  product,
  onEditCaption,
  isGenerating = false,
  storeName = 'My Store',
  onRegeneratePost,
  isRegeneratingPost = false,
  onRegenerateImage,
  isRegeneratingImage = false,
}: SocialPostCardProps) {
  const [likes, setLikes] = React.useState(post.likesCount);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableText, setEditableText] = React.useState(post.caption);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

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
    setEditableText(post.caption);
    setLikes(post.likesCount);
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
    <div className="w-full max-w-lg mx-auto rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-all duration-200">
      {/* Social Card Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {storeName.slice(0, 2).toUpperCase()}
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
              <Clock className="w-3 h-3" /> Scheduled 8:00 PM
            </span>
          ) : post.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" /> Published
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

                {/* Regenerate Post Copy */}
                {onRegeneratePost && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRegeneratePost();
                    }}
                    disabled={isGenerating || isRegeneratingPost}
                    className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn(
                        'w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5',
                        (isGenerating || isRegeneratingPost) && 'animate-spin',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">
                        {isGenerating || isRegeneratingPost
                          ? 'Regenerating Post...'
                          : 'Regenerate Post'}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        New caption & copy in {post.postType.toLowerCase().replace('_', ' ')} format
                      </div>
                    </div>
                  </button>
                )}

                {/* Regenerate Product Image */}
                {onRegenerateImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRegenerateImage();
                    }}
                    disabled={isRegeneratingImage}
                    className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-start gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ImageIcon
                      className={cn(
                        'w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5',
                        isRegeneratingImage && 'animate-spin',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">
                        {isRegeneratingImage
                          ? 'Generating HD Image...'
                          : 'Regenerate Image'}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Create new 1024×1024 studio visual
                      </div>
                    </div>
                  </button>
                )}

                <div className="my-1 border-t border-[var(--border-subtle)]/60" />

                {/* Preview HD Image */}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Image Container with HD Preview Button */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-950 overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          onClick={() => setIsImagePreviewOpen(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] cursor-pointer"
        />

        {/* Hover Full Preview Button */}
        <button
          type="button"
          onClick={() => setIsImagePreviewOpen(true)}
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 cursor-pointer shadow-md"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Preview HD</span>
        </button>

        {/* Product Tag Overlay */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-sm">
          <ShoppingBag className="w-3 h-3 text-zinc-300" />
          <span>{product.name}</span>
          <span className="font-bold text-white">{product.price}</span>
          {product.discount && (
            <span className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 border border-zinc-700">
              {product.discount}
            </span>
          )}
        </div>
      </div>

      {/* Card Body / Caption & Engagement */}
      <div className="p-4 space-y-3">
        {/* Interactive Social Actions Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 transition-colors cursor-pointer',
                isLiked
                  ? 'text-rose-500'
                  : 'hover:text-[var(--text-primary)]'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
              <span className="font-mono text-xs">{likes.toLocaleString()}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{post.commentsCount}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer">
              <Share2 className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{post.sharesCount}</span>
            </button>
          </div>

          <div className="text-[10px] text-[var(--text-secondary)] font-mono">
            Meta Graph API
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
                {post.caption}
              </p>
              {post.caption.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline mt-1 cursor-pointer"
                >
                  {isExpanded ? 'Show Less' : '...Show More'}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover/caption:opacity-100 transition-opacity ml-2 text-[11px] text-[var(--text-secondary)] hover:underline cursor-pointer"
              >
                (Edit)
              </button>
            </div>
          )}
        </div>

        {/* Hashtags */}
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

        {/* CTA Button Preview */}
        <div className="pt-1.5">
          <div className="w-full py-2 px-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-center text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-1.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
            <span>{post.cta}</span>
            <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
          </div>
        </div>
      </div>

      {/* Full HD Image Preview Dialog */}
      <ImagePreviewModal
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        imageUrl={product.image || ''}
        productTitle={product.name}
        isRegenerating={isRegeneratingImage}
        onRegenerate={onRegenerateImage}
      />
    </div>
  );
}
