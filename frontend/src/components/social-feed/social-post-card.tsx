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
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-white dark:bg-[#131B26] border border-slate-200 dark:border-[#1F2C3F] shadow-xl dark:shadow-2xl dark:shadow-black/70 overflow-hidden transition-all duration-300">
      {/* Social Card Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-[#1F2C3F]/80 bg-slate-50/50 dark:bg-[#0E141E]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5 shadow-sm">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
              UW
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                UrbanWear Dhaka
              </span>
              <CheckCircle className="w-4 h-4 text-cyan-500 fill-cyan-500/20" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Meta Facebook Page</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
                <Sparkles className="w-3 h-3" /> AI Generated
              </span>
            </div>
          </div>
        </div>

        {/* Post Status Badge */}
        <div className="flex items-center gap-1.5">
          {post.status === 'SCHEDULED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
              <Clock className="w-3 h-3" /> Scheduled 8:00 PM
            </span>
          ) : post.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" /> Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Product Tag Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-lg">
          <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
          <span>{product.name}</span>
          <span className="font-bold text-cyan-300">{product.price}</span>
          {product.discount && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[10px] font-bold">
              {product.discount}
            </span>
          )}
        </div>
      </div>

      {/* Card Body / Caption & Engagement */}
      <div className="p-4.5 space-y-3.5">
        {/* Interactive Social Actions Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1F2C3F]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-125',
                isLiked
                  ? 'text-rose-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
              )}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
              <span>{likes.toLocaleString()}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-500 transition-colors cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentsCount}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-violet-500 transition-colors cursor-pointer">
              <Share2 className="w-4 h-4" />
              <span>{post.sharesCount}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Meta Graph API Ready
          </div>
        </div>

        {/* Caption Section */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full p-3 rounded-xl border border-cyan-500/50 bg-slate-50 dark:bg-[#0E141E] text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none h-28 text-slate-800 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaption}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
                >
                  Save Text
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group/caption">
              <p className={cn('whitespace-pre-line', !isExpanded && 'line-clamp-3')}>
                <span className="font-semibold text-slate-900 dark:text-white mr-1.5">
                  UrbanWear Dhaka
                </span>
                {post.caption}
              </p>
              {post.caption.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline mt-1 cursor-pointer"
                >
                  {isExpanded ? 'Show Less' : '...Show More'}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover/caption:opacity-100 transition-opacity ml-2 text-[11px] text-slate-400 hover:text-cyan-400 underline cursor-pointer"
              >
                (Edit)
              </button>
            </div>
          )}
        </div>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-violet-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button Preview */}
        <div className="pt-2">
          <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600/10 via-cyan-500/10 to-violet-600/10 border border-violet-500/30 text-center text-xs font-semibold text-violet-700 dark:text-cyan-300 flex items-center justify-center gap-2">
            <span>{post.cta}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
