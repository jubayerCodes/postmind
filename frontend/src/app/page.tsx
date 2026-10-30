'use client';

import * as React from 'react';
import { AppShell } from '@/components/navigation/app-shell';
import { SocialPostCard } from '@/components/social-feed/social-post-card';
import { FloatingQuickActions } from '@/components/social-feed/floating-quick-actions';
import { PostDraftsRail } from '@/components/social-feed/post-drafts-rail';
import { PostCardSkeleton } from '@/components/social-feed/post-card-skeleton';
import { ProductAttachmentModal } from '@/components/social-feed/product-attachment-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  MOCK_PRODUCTS,
  SocialPostState,
  Product as MockProduct,
} from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  Check,
  Send,
  Clock,
  Loader2,
  ChevronDown,
  ExternalLink,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useBrandTheme } from '@/components/theme-brand-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useStores } from '@/hooks/use-stores';
import { useProductsStore, Product as StoreProduct } from '@/stores/products-store';
import { useContentStore, ContentItem, isLocalDraftId } from '@/stores/content-store';
import { useSocialStore } from '@/stores/social-store';
import { useCalendarStore } from '@/stores/calendar-store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isDevGuest, isInitialized } = useAuthStore();
  const { activeStore, isSwitchingWorkspace } = useStores();

  const {
    products,
    fetchProducts,
    generateAiImage,
    updateProduct,
  } = useProductsStore();

  const {
    currentPost,
    savedPosts,
    fetchSavedPosts,
    isLoadingList,
    hasLoadedSavedPosts,
    isGenerating,
    isRegenerating,
    isSaving,
    currentTone,
    currentLanguage,
    suggestedTime,
    createNewPost,
    generatePost,
    regeneratePost,
    approvePost,
    schedulePost,
    deletePost,
    bulkDeletePosts,
    updateCurrentCaption,
    setCurrentPost,
    updateMetrics,
    detachProductFromCurrentPost,
  } = useContentStore();

  const {
    accounts,
    selectedAccountId,
    isPublishing,
    isSyncingMetrics,
    setModalOpen,
    fetchAccounts,
    publishPost,
    syncPostMetrics,
  } = useSocialStore();

  const { openScheduleModal } = useCalendarStore();
  const { config } = useBrandTheme();

  const [isRegeneratingImage, setIsRegeneratingImage] = React.useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    isOpen: boolean;
    postId: string;
    headline: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    postId: '',
    headline: '',
    isLoading: false,
  });
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = React.useState<{
    isOpen: boolean;
    postIds: string[];
    count: number;
    isLoading: boolean;
  }>({
    isOpen: false,
    postIds: [],
    count: 0,
    isLoading: false,
  });

  React.useEffect(() => {
    if (isInitialized && !user && !isDevGuest) {
      router.push('/login');
    }
  }, [isInitialized, user, isDevGuest, router]);

  // Fetch saved posts and product catalog whenever active store changes
  React.useEffect(() => {
    if (activeStore?.id) {
      fetchSavedPosts(activeStore.id);
      fetchProducts(activeStore.id);
    }
  }, [activeStore?.id, fetchSavedPosts, fetchProducts]);

  // Initial Post Selection or Draft Creation once saved posts have finished loading
  React.useEffect(() => {
    if (!activeStore?.id || isSwitchingWorkspace || !hasLoadedSavedPosts) return;

    // Check if current post is missing, belongs to another store, or is a temporary unpersisted draft
    const isUnsavedDraft = currentPost && isLocalDraftId(currentPost.id);
    if (!currentPost || currentPost.storeId !== activeStore.id || isUnsavedDraft) {
      if (savedPosts.length > 0) {
        // Prioritize PUBLISHED -> APPROVED -> SCHEDULED -> first saved
        const published = savedPosts.find((p) => p.status === 'PUBLISHED');
        const approved = savedPosts.find((p) => p.status === 'APPROVED');
        const scheduled = savedPosts.find((p) => p.status === 'SCHEDULED');
        const best = published || approved || scheduled || savedPosts[0];
        setCurrentPost(best);
      } else if (!currentPost || currentPost.storeId !== activeStore.id) {
        // No posts exist yet in this store -> initialize a fresh draft
        createNewPost(activeStore.id);
      }
    }
  }, [
    activeStore?.id,
    isSwitchingWorkspace,
    hasLoadedSavedPosts,
    savedPosts,
    currentPost,
    setCurrentPost,
    createNewPost,
  ]);

  // Auto-sync metrics from Meta Graph API when viewing a published post
  const lastSyncedContentIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (
      !activeStore?.id ||
      !currentPost?.id ||
      currentPost.status !== 'PUBLISHED' ||
      isLocalDraftId(currentPost.id) ||
      currentPost.id === lastSyncedContentIdRef.current
    ) {
      return;
    }

    lastSyncedContentIdRef.current = currentPost.id;
    syncPostMetrics(activeStore.id, currentPost.id)
      .then((res) => {
        if (res && currentPost?.id) {
          updateMetrics(currentPost.id, {
            likesCount: res.likesCount,
            commentsCount: res.commentsCount,
            sharesCount: res.sharesCount,
            metricsLastSyncedAt: res.metricsLastSyncedAt,
          });
        }
      })
      .catch((err) => {
        console.warn('Auto-sync post metrics error:', err);
      });
  }, [activeStore?.id, currentPost?.id, currentPost?.status, syncPostMetrics, updateMetrics]);

  // Resolve attached products from currentPost (hook must run unconditionally before any return)
  const attachedStoreProducts: MockProduct[] = React.useMemo(() => {
    if (!currentPost) return [];
    if (currentPost.attachedProducts && currentPost.attachedProducts.length > 0) {
      return currentPost.attachedProducts.map((ap) => {
        const p = ap.product;
        const priceNum = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
        return {
          id: p.id,
          name: p.name,
          price: `${p.currency || activeStore?.currency || 'BDT'} ${priceNum.toLocaleString()}`,
          priceRaw: priceNum,
          category: p.category || 'General',
          stock: 10,
          image: p.image || '',
          tagline: p.tagline || p.name,
          features: p.features || [],
          discount: p.discount || undefined,
        };
      });
    }

    if (currentPost.product) {
      const p = currentPost.product;
      const priceNum = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
      return [
        {
          id: p.id,
          name: p.name,
          price: `${p.currency || activeStore?.currency || 'BDT'} ${priceNum.toLocaleString()}`,
          priceRaw: priceNum,
          category: p.category || 'General',
          stock: 10,
          image: p.image || '',
          tagline: p.tagline || p.name,
          features: p.features || [],
          discount: p.discount || undefined,
        },
      ];
    }

    return [];
  }, [currentPost, activeStore?.currency]);

  if (!isInitialized || (!user && !isDevGuest)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  const primaryAttachedProduct = attachedStoreProducts[0] || null;

  // Normalized SocialPostState for SocialPostCard
  const cardPost: SocialPostState = {
    id: currentPost?.id || `post-draft-${Date.now()}`,
    productId: currentPost?.productId || primaryAttachedProduct?.id || null,
    products: attachedStoreProducts,
    headline: currentPost?.headline || 'Fresh Brand Post',
    caption:
      currentPost?.caption ||
      (attachedStoreProducts.length > 1
        ? `🔥 Discover our curated collection at ${activeStore?.name || 'our store'}! High quality items with fast delivery nationwide.`
        : primaryAttachedProduct
        ? `🔥 Discover the all-new ${primaryAttachedProduct.name}! ${primaryAttachedProduct.tagline || 'Elevate your everyday style.'} ${primaryAttachedProduct.discount ? `Available now with ${primaryAttachedProduct.discount}!` : ''}`
        : `✨ Welcome to ${activeStore?.name || 'our store'}! Premium quality and fast nationwide delivery on every order.`),
    hashtags:
      currentPost?.hashtags && currentPost.hashtags.length > 0
        ? currentPost.hashtags
        : [
            `#${(activeStore?.name || 'Store').replace(/\s+/g, '')}`,
            '#NewArrivals',
            '#OnlineShopping',
            '#ShopNow',
          ],
    cta:
      currentPost?.cta ||
      (primaryAttachedProduct?.discount
        ? `Claim ${primaryAttachedProduct.discount} — Shop Now`
        : 'Shop now — Link in bio'),
    postType: (currentPost?.postType as any) || 'ENGAGEMENT',
    status: (currentPost?.status as any) || 'READY',
    platform: 'META_FACEBOOK',
    likesCount: currentPost?.likesCount ?? 0,
    commentsCount: currentPost?.commentsCount ?? 0,
    sharesCount: currentPost?.sharesCount ?? 0,
    image: primaryAttachedProduct?.image || '',
    tone: currentTone,
  };

  const handleNewPost = () => {
    if (!activeStore?.id) return;
    createNewPost(activeStore.id);
  };

  const handleSelectPost = (post: ContentItem) => {
    setCurrentPost(post);
  };

  const handleSchedule = () => {
    openScheduleModal(currentPost);
  };

  const handlePublish = async () => {
    if (!activeStore?.id) return;
    try {
      await approvePost(activeStore.id);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.15, x: 0.72 },
        colors: [config.primaryColor, '#1877F2', '#00A884', '#FA582C'],
      });
    } catch (err) {
      console.warn('Approve post failed:', err);
    }
  };

  const activeConnectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts[0] ||
    null;

  const pageAvatarUrl =
    activeConnectedAccount?.avatarUrl ||
    (activeConnectedAccount?.platformAccountId &&
    !activeConnectedAccount.platformAccountId.startsWith('dev_')
      ? `https://graph.facebook.com/${activeConnectedAccount.platformAccountId}/picture?type=large`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          activeConnectedAccount?.accountName || activeStore?.name || 'Store',
        )}&background=1877F2&color=fff&size=160&bold=true`);

  const handleManualSyncMetrics = async () => {
    if (!activeStore?.id || !currentPost?.id || currentPost.status !== 'PUBLISHED') return;
    try {
      const res = await syncPostMetrics(activeStore.id, currentPost.id);
      if (res) {
        updateMetrics(currentPost.id, {
          likesCount: res.likesCount,
          commentsCount: res.commentsCount,
          sharesCount: res.sharesCount,
          metricsLastSyncedAt: res.metricsLastSyncedAt,
        });
      }
    } catch (err) {
      console.warn('Manual post metrics sync error:', err);
    }
  };

  const handlePublishToFacebook = async () => {
    if (!activeStore?.id) return;
    if (accounts.length === 0) {
      setModalOpen(true);
      return;
    }
    if (!currentPost?.id) return;

    try {
      // If it's still a draft not saved to backend, save it first
      let targetPostId = currentPost.id;
      if (isLocalDraftId(currentPost.id)) {
        const saved = await approvePost(activeStore.id);
        if (!saved) return;
        targetPostId = saved.id;
      }

      const res = await publishPost(activeStore.id, targetPostId);
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.15, x: 0.82 },
        colors: ['#1877F2', '#42B72A', '#FA582C', config.primaryColor],
      });
      // Refresh saved posts list to reflect published state across workspace
      await fetchSavedPosts(activeStore.id);
      // Immediately trigger fresh sync of metrics from Meta
      if (res?.publishResult?.platformPostId) {
        handleManualSyncMetrics();
      }
    } catch (err) {
      console.warn('Publish to Facebook failed:', err);
    }
  };

  const handleCustomCaption = (newCaption: string) => {
    if (currentPost?.status === 'PUBLISHED') return;
    updateCurrentCaption(newCaption);
  };

  const handleRegeneratePost = async () => {
    if (!activeStore?.id) return;
    if (currentPost?.status === 'PUBLISHED' || currentPost?.status === 'APPROVED') return;
    try {
      const productIds = attachedStoreProducts.map((p) => p.id);
      if (currentPost?.id && !isLocalDraftId(currentPost.id)) {
        await regeneratePost(activeStore.id, currentPost.id, {
          tone: currentTone,
          language: currentLanguage,
          sourceHeadline: currentPost.headline,
          sourceCaption: currentPost.caption,
        });
      } else {
        await generatePost(activeStore.id, {
          productIds: productIds.length > 0 ? productIds : undefined,
          tone: currentTone,
          language: currentLanguage,
          sourceHeadline: currentPost?.headline,
          sourceCaption: currentPost?.caption,
        });
      }
    } catch (err) {
      console.warn('Post copy regeneration failed:', err);
    }
  };

  const promptDeletePost = (postId?: string) => {
    const targetId = postId || currentPost?.id;
    if (!targetId) return;

    const targetPost = savedPosts.find((p) => p.id === targetId) || currentPost;
    if (targetPost?.status === 'PUBLISHED') return;

    setDeleteConfirmation({
      isOpen: true,
      postId: targetId,
      headline: targetPost?.headline || 'Untitled Post',
      isLoading: false,
    });
  };

  const executeDeletePost = async () => {
    if (!activeStore?.id || !deleteConfirmation.postId) return;
    setDeleteConfirmation((prev) => ({ ...prev, isLoading: true }));
    try {
      await deletePost(activeStore.id, deleteConfirmation.postId);
      setDeleteConfirmation({
        isOpen: false,
        postId: '',
        headline: '',
        isLoading: false,
      });
    } catch (err) {
      console.warn('Failed to delete post:', err);
      setDeleteConfirmation((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const promptBulkDelete = (postIds: string[]) => {
    if (!postIds || postIds.length === 0) return;
    setBulkDeleteConfirmation({
      isOpen: true,
      postIds,
      count: postIds.length,
      isLoading: false,
    });
  };

  const executeBulkDelete = async () => {
    if (!activeStore?.id || bulkDeleteConfirmation.postIds.length === 0) return;
    setBulkDeleteConfirmation((prev) => ({ ...prev, isLoading: true }));
    try {
      await bulkDeletePosts(activeStore.id, bulkDeleteConfirmation.postIds);
      setBulkDeleteConfirmation({
        isOpen: false,
        postIds: [],
        count: 0,
        isLoading: false,
      });
    } catch (err) {
      console.warn('Failed to bulk delete posts:', err);
      setBulkDeleteConfirmation((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleRegenerateImage = async () => {
    if (!activeStore?.id || !primaryAttachedProduct) return;
    if (currentPost?.status === 'PUBLISHED' || currentPost?.status === 'APPROVED') return;
    setIsRegeneratingImage(true);
    try {
      const activePrompt =
        primaryAttachedProduct.tagline?.trim() ||
        `Commercial studio product photography of ${primaryAttachedProduct.name}, clean studio backdrop, 4k`;
      const res = await generateAiImage(activeStore.id, activePrompt, {
        productName: primaryAttachedProduct.name,
        category: primaryAttachedProduct.category,
        features: primaryAttachedProduct.features,
      });

      if (res.imageUrl) {
        // Persist update in database and catalog
        await updateProduct(activeStore.id, primaryAttachedProduct.id, {
          image: res.imageUrl,
        });

        // Also update currentPost product reference if present
        if (currentPost) {
          const updatedAttached = (currentPost.attachedProducts || []).map((ap) =>
            ap.product.id === primaryAttachedProduct.id
              ? { ...ap, product: { ...ap.product, image: res.imageUrl } }
              : ap,
          );

          setCurrentPost({
            ...currentPost,
            product:
              currentPost.product?.id === primaryAttachedProduct.id
                ? { ...currentPost.product, image: res.imageUrl }
                : currentPost.product,
            attachedProducts: updatedAttached,
          });
        }
      }
    } catch (err) {
      console.warn('Product image regeneration failed:', err);
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  return (
    <AppShell activeTab="feed">
      <div className="flex-1 flex overflow-hidden">
        {/* Center Feed Studio */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Studio Top Header Bar: AI Recommendation + Connected Facebook Page on Left, Actions on Right */}
          <div className="w-full px-6 py-2.5 shrink-0 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/40 backdrop-blur-sm">
            {/* Left: AI Insight Banner & Connected Facebook Page Pill */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs shadow-2xs min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                <span className="text-[var(--text-secondary)] shrink-0">Recommendation:</span>
                <span className="font-medium text-[var(--text-primary)] truncate">
                  Peak engagement window
                </span>
                <span className="text-[var(--text-secondary)]/40 shrink-0">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
                  <Clock className="w-3 h-3" /> {suggestedTime || '8:00 PM'}
                </span>
              </div>

              {/* Connected Facebook Page Pill */}
              <button
                onClick={() => setModalOpen(true)}
                className={cn(
                  'flex items-center gap-2 py-1 px-2.5 rounded-md border text-xs shadow-2xs transition-all cursor-pointer shrink-0',
                  activeConnectedAccount
                    ? 'border-[#1877F2]/30 bg-[#1877F2]/5 text-[var(--text-primary)] hover:border-[#1877F2]'
                    : 'border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#1877F2]'
                )}
              >
                <div className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  f
                </div>
                {activeConnectedAccount ? (
                  <span className="font-medium truncate max-w-[160px] sm:max-w-[200px]">
                    {activeConnectedAccount.accountName}
                  </span>
                ) : (
                  <span>Connect Facebook</span>
                )}
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Actions: New Post, Schedule, Approve, Publish */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* New Post Button */}
              <button
                onClick={handleNewPost}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer shadow-2xs"
                title="Create a fresh social post"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span className="hidden sm:inline">New Post</span>
              </button>

              {/* Schedule Button */}
              <button
                onClick={handleSchedule}
                disabled={isSaving || isGenerating || isPublishing}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border shadow-2xs disabled:opacity-60',
                  cardPost.status === 'SCHEDULED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                )}
              >
                {cardPost.status === 'SCHEDULED' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Scheduled ({suggestedTime || '8:00 PM'})</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span>Schedule</span>
                  </>
                )}
              </button>

              {/* Save / Approve Button */}
              <button
                onClick={handlePublish}
                disabled={isSaving || isGenerating || isPublishing}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60',
                  cardPost.status === 'APPROVED' || cardPost.status === 'PUBLISHED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--brand-primary)] text-white hover:brightness-110'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : cardPost.status === 'APPROVED' || cardPost.status === 'PUBLISHED' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approved</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve Post</span>
                  </>
                )}
              </button>

              {/* Publish to Facebook Button */}
              {cardPost.status === 'PUBLISHED' ? (
                <a
                  href={
                    currentPost?.platformPostId
                      ? `https://facebook.com/${currentPost.platformPostId}`
                      : '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Published to Facebook</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              ) : (
                <button
                  onClick={handlePublishToFacebook}
                  disabled={isPublishing || isGenerating || isSaving}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60',
                    cardPost.status === 'APPROVED'
                      ? 'bg-[#1877F2] text-white hover:bg-[#166fe5]'
                      : 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30'
                  )}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-bold">
                        f
                      </div>
                      <span>Publish to Facebook</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Center Feed */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center">
            {/* Social Post Feed Card */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pb-32">
              {!hasLoadedSavedPosts || (isLoadingList && !currentPost) || isSwitchingWorkspace ? (
                <PostCardSkeleton />
              ) : (
                <SocialPostCard
                  post={cardPost}
                  product={primaryAttachedProduct}
                  products={attachedStoreProducts}
                  onOpenAttachmentModal={() => setIsAttachmentModalOpen(true)}
                  onDetachProduct={(productId) => {
                    if (activeStore?.id) {
                      detachProductFromCurrentPost(activeStore.id, productId);
                    }
                  }}
                  onEditCaption={handleCustomCaption}
                  isGenerating={isGenerating}
                  onRegeneratePost={handleRegeneratePost}
                  isRegeneratingPost={isRegenerating}
                  onRegenerateImage={handleRegenerateImage}
                  isRegeneratingImage={isRegeneratingImage}
                  onDeletePost={() => promptDeletePost()}
                  storeName={
                    activeConnectedAccount?.accountName ||
                    activeStore?.name ||
                    'Store'
                  }
                  pageAvatarUrl={pageAvatarUrl}
                  onSyncMetrics={handleManualSyncMetrics}
                  isSyncingMetrics={isSyncingMetrics}
                  metricsLastSyncedAt={currentPost?.metricsLastSyncedAt || null}
                />
              )}
            </div>
          </main>

          {/* Floating Quick Actions (Tone buttons & AI custom instruction bar) */}
          <FloatingQuickActions />
        </div>

        {/* Right Rail: Studio Posts & Drafts */}
        <PostDraftsRail
          onSelectPost={handleSelectPost}
          onNewPost={handleNewPost}
          onDeletePost={(id) => promptDeletePost(id)}
          onBulkDelete={promptBulkDelete}
        />
      </div>

      {/* Product Attachment Modal */}
      <ProductAttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
      />

      {/* Warning / Confirmation Dialog for Deleting Single Post */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({
            isOpen: false,
            postId: '',
            headline: '',
            isLoading: false,
          })
        }
        onConfirm={executeDeletePost}
        title="Delete Draft Post"
        description="Are you sure you want to permanently delete this draft post? This action cannot be undone."
        itemTitle={deleteConfirmation.headline}
        confirmText="Delete Post"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteConfirmation.isLoading}
      />

      {/* Warning / Confirmation Dialog for Bulk Deleting Drafts */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmation.isOpen}
        onClose={() =>
          setBulkDeleteConfirmation({
            isOpen: false,
            postIds: [],
            count: 0,
            isLoading: false,
          })
        }
        onConfirm={executeBulkDelete}
        title={`Delete ${bulkDeleteConfirmation.count} Draft ${bulkDeleteConfirmation.count === 1 ? 'Post' : 'Posts'}?`}
        description={`Are you sure you want to permanently delete these ${bulkDeleteConfirmation.count} draft posts? This action cannot be undone.`}
        confirmText={`Delete ${bulkDeleteConfirmation.count} ${bulkDeleteConfirmation.count === 1 ? 'Post' : 'Posts'}`}
        cancelText="Cancel"
        variant="danger"
        isLoading={bulkDeleteConfirmation.isLoading}
      />
    </AppShell>
  );
}
