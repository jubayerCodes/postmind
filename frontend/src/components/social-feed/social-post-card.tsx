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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, SocialPostState } from '@/lib/mock-data';

interface SocialPostCardProps {
  post: SocialPostState;
  product: Product;
  onEditCaption?: (newCaption: string) => void;
  onLikeToggle?: () => void;
}

export function SocialPostCard({
  post,
  product,
  onEditCaption,
}: SocialPostCardProps) {
  const [likes, setLikes] = React.useState(post.likesCount);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editableText, setEditableText] = React.useState(post.caption);

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
            UW
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-[var(--text-primary)]">
                UrbanWear Dhaka
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

        {/* Post Status Badge */}
        <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      {/* Media Image Container */}
      <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-950 overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

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
          {isEditing ? (
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
                  UrbanWear Dhaka
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
    </div>
  );
}
