'use client';

import * as React from 'react';
import { useContentStore, ContentItem, ContentStatus } from '@/stores/content-store';
import { useStores } from '@/hooks/use-stores';
import {
  FileText,
  Plus,
  Search,
  Check,
  Clock,
  Send,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PostDraftsRailProps {
  onSelectPost: (post: ContentItem) => void;
  onNewPost: () => void;
  onDeletePost?: (postId: string) => void;
  onBulkDelete?: (postIds: string[]) => void;
}

export function PostDraftsRail({
  onSelectPost,
  onNewPost,
  onDeletePost,
  onBulkDelete,
}: PostDraftsRailProps) {
  const { savedPosts, currentPost, isLoadingList, hasLoadedSavedPosts } = useContentStore();
  const { activeStore } = useStores();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [isSelectMode, setIsSelectMode] = React.useState(false);
  const [selectedPostIds, setSelectedPostIds] = React.useState<Set<string>>(new Set());

  // Clean up selection when posts list changes
  React.useEffect(() => {
    setSelectedPostIds((prev) => {
      if (prev.size === 0) return prev;
      const existingIds = new Set(savedPosts.map((p) => p.id));
      const next = new Set(Array.from(prev).filter((id) => existingIds.has(id)));
      if (next.size === 0) {
        setIsSelectMode(false);
      }
      return next;
    });
  }, [savedPosts]);

  const filteredPosts = React.useMemo(() => {
    return savedPosts.filter((post) => {
      // Status filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'DRAFT') {
          if (post.status !== 'DRAFT' && post.status !== 'READY') return false;
        } else if (post.status !== filterStatus) {
          return false;
        }
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inHeadline = post.headline?.toLowerCase().includes(q);
      const inCaption = post.caption?.toLowerCase().includes(q);
      const inProducts = (post.attachedProducts || []).some((ap) =>
        ap.product?.name.toLowerCase().includes(q),
      ) || post.product?.name.toLowerCase().includes(q);

      return inHeadline || inCaption || inProducts;
    });
  }, [savedPosts, filterStatus, searchQuery]);

  // Non-published posts eligible for deletion in current filtered view
  const deletableFilteredPosts = React.useMemo(() => {
    return filteredPosts.filter((p) => p.status !== 'PUBLISHED');
  }, [filteredPosts]);

  const allDeletableSelected =
    deletableFilteredPosts.length > 0 &&
    deletableFilteredPosts.every((p) => selectedPostIds.has(p.id));

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(deletableFilteredPosts.map((p) => p.id)));
    }
  };

  const toggleSelectPost = (id: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <aside className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 flex flex-col shrink-0 transition-colors z-10 select-none h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--brand-primary)]" />
          <h2 className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
            Studio Posts
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium">
            {savedPosts.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isSelectMode ? (
            <>
              {deletableFilteredPosts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsSelectMode(true)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Select drafts to bulk delete"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>
              )}

              <button
                type="button"
                onClick={onNewPost}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[var(--brand-primary)] px-2.5 py-1 rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Compose a fresh post"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Post</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(false);
                setSelectedPostIds(new Set());
              }}
              className="text-[11px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-hover)]/70 rounded-lg mb-2.5 shrink-0 text-[11px]">
        {(['ALL', 'DRAFT', 'APPROVED', 'PUBLISHED'] as const).map((tab) => {
          const isActive = filterStatus === tab;
          const label =
            tab === 'ALL'
              ? 'All'
              : tab === 'DRAFT'
              ? 'Drafts'
              : tab === 'APPROVED'
              ? 'Approved'
              : 'Live';

          return (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={cn(
                'flex-1 py-1 rounded-md text-center font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative mb-2.5 shrink-0">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
        <input
          type="text"
          placeholder="Filter posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {/* Bulk Delete Selection Bar (Active in Select Mode) */}
      {isSelectMode && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 mb-2.5 shrink-0 animate-in fade-in duration-150">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-[var(--text-primary)] select-none">
            <input
              type="checkbox"
              checked={allDeletableSelected}
              onChange={toggleSelectAll}
              className="w-3.5 h-3.5 rounded border-[var(--border-subtle)] text-rose-500 accent-rose-500 cursor-pointer"
            />
            <span>
              {selectedPostIds.size > 0
                ? `${selectedPostIds.size} selected`
                : 'Select all drafts'}
            </span>
          </label>

          <button
            type="button"
            onClick={() => {
              if (selectedPostIds.size > 0 && onBulkDelete) {
                onBulkDelete(Array.from(selectedPostIds));
              }
            }}
            disabled={selectedPostIds.size === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete selected posts"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete {selectedPostIds.size > 0 ? `(${selectedPostIds.size})` : ''}</span>
          </button>
        </div>
      )}

      {/* Posts Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {isLoadingList || !hasLoadedSavedPosts ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/50 space-y-2 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 bg-[var(--bg-hover)] rounded-full" />
                  <div className="h-3 w-12 bg-[var(--bg-hover)] rounded" />
                </div>
                <div className="h-3.5 w-3/4 bg-[var(--bg-hover)] rounded" />
                <div className="space-y-1 pt-0.5">
                  <div className="h-2.5 w-full bg-[var(--bg-hover)] rounded" />
                  <div className="h-2.5 w-4/5 bg-[var(--bg-hover)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10 px-3">
            <Sparkles className="w-6 h-6 text-[var(--text-secondary)]/40 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              No posts found
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              Click &ldquo;New Post&rdquo; to draft a new social post.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isSelected = currentPost?.id === post.id;
            const isChecked = selectedPostIds.has(post.id);
            const isPublished = post.status === 'PUBLISHED';
            const attachedCount =
              post.attachedProducts?.length || (post.product ? 1 : 0);
            const firstProduct =
              post.attachedProducts?.[0]?.product || post.product;

            return (
              <div
                key={post.id}
                onClick={() => {
                  if (isSelectMode) {
                    if (!isPublished) {
                      toggleSelectPost(post.id);
                    }
                  } else {
                    onSelectPost(post);
                  }
                }}
                className={cn(
                  'p-2.5 rounded-xl border transition-all cursor-pointer relative group text-left',
                  isSelectMode
                    ? isPublished
                      ? 'opacity-40 cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-card)]'
                      : isChecked
                      ? 'border-rose-500 bg-rose-500/10 shadow-2xs'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-rose-500/40 hover:bg-rose-500/5'
                    : isSelected
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/30 shadow-2xs'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]/40'
                )}
              >
                {/* Top Row: Selection Checkbox (if select mode) + Status badge & timestamp */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    {isSelectMode && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPublished}
                        onChange={() => {
                          if (!isPublished) toggleSelectPost(post.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-[var(--border-subtle)] text-rose-500 accent-rose-500 cursor-pointer disabled:cursor-not-allowed"
                        title={
                          isPublished
                            ? 'Live Facebook posts cannot be deleted'
                            : 'Select this post'
                        }
                      />
                    )}

                    {isPublished ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live on Facebook
                      </span>
                    ) : post.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <Check className="w-2.5 h-2.5" /> Approved
                      </span>
                    ) : post.status === 'SCHEDULED' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5" /> Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[var(--text-secondary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    {!isSelectMode && !isPublished && onDeletePost && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePost(post.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete this draft"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Headline & Caption snippet */}
                <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--brand-primary)] transition-colors">
                  {post.headline || 'Untitled Post'}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
                  {post.caption || 'No caption written yet...'}
                </p>

                {/* Attached Products Row */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]/40 text-[10px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <ShoppingBag className="w-3 h-3 text-[var(--brand-primary)] shrink-0" />
                    {attachedCount > 0 ? (
                      <span className="truncate font-medium text-[var(--text-primary)]">
                        {attachedCount === 1
                          ? firstProduct?.name || '1 Product'
                          : `${attachedCount} Products Attached`}
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)]/70 italic">
                        No product attached
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-[var(--bg-hover)]">
                    {post.tone}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation Link to Products */}
      <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] shrink-0">
        <Link
          href="/products"
          className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors py-1 px-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
        >
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Manage Product Catalog</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </Link>
      </div>
    </aside>
  );
}
