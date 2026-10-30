import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { Product } from '@/stores/products-store';

export type ContentStatus =
  | 'DRAFT'
  | 'READY'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED';

export type ContentTone = 'NATURAL' | 'WITTY' | 'PROMO' | 'STORYTELLING';

export type PostType = 'PRODUCT_SHOWCASE' | 'OFFER' | 'ENGAGEMENT' | 'STORY';

export interface AttachedProductRelation {
  id?: string;
  order: number;
  product: {
    id: string;
    name: string;
    image?: string | null;
    price: string | number;
    currency?: string;
    category: string;
    tagline?: string | null;
    features?: string[];
    discount?: string | null;
  };
}

export interface ContentItem {
  id: string;
  storeId: string;
  productId?: string | null;
  headline: string;
  caption: string;
  hashtags: string[];
  cta?: string | null;
  postType: PostType;
  tone: ContentTone;
  status: ContentStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  platformPostId?: string | null;
  publishError?: string | null;
  language?: string | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  metricsLastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    image?: string | null;
    price: string | number;
    currency?: string;
    category: string;
    tagline?: string | null;
    features?: string[];
    discount?: string | null;
  } | null;
  attachedProducts?: AttachedProductRelation[];
}

export interface SocialPostOutput {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  postType: PostType;
  tone: ContentTone;
  suggestedPublishTime?: string;
}

/**
 * Checks whether a content ID is an unpersisted client-side draft.
 * Prevents 404s when attempting to regenerate or patch unsaved local drafts.
 */
export function isLocalDraftId(id: string | null | undefined): boolean {
  if (!id) return true;
  return id.startsWith('draft-') || id.startsWith('post-') || id.startsWith('demo-');
}

interface ContentState {
  currentPost: ContentItem | null;
  savedPosts: ContentItem[];
  totalSaved: number;
  isGenerating: boolean;
  isRegenerating: boolean;
  isSaving: boolean;
  isLoadingList: boolean;
  hasLoadedSavedPosts: boolean;
  error: string | null;
  currentTone: 'natural' | 'witty' | 'promo' | 'storytelling';
  currentLanguage: 'en' | 'bn';
  customPrompt: string;
  suggestedTime: string;

  // Actions
  createNewPost: (storeId: string) => void;
  attachProductToCurrentPost: (storeId: string, product: Product) => Promise<void>;
  detachProductFromCurrentPost: (storeId: string, productId: string) => Promise<void>;
  setAttachedProductsForCurrentPost: (storeId: string, products: Product[]) => Promise<void>;
  generatePost: (
    storeId: string,
    options: {
      productId?: string;
      productIds?: string[];
      tone?: 'natural' | 'witty' | 'promo' | 'storytelling';
      language?: 'en' | 'bn';
      customPrompt?: string;
      offerDetails?: string;
      sourceHeadline?: string;
      sourceCaption?: string;
    },
  ) => Promise<ContentItem>;
  regeneratePost: (
    storeId: string,
    contentId?: string,
    options?: {
      tone?: 'natural' | 'witty' | 'promo' | 'storytelling';
      language?: 'en' | 'bn';
      customPrompt?: string;
      offerDetails?: string;
      sourceHeadline?: string;
      sourceCaption?: string;
    },
  ) => Promise<ContentItem>;
  setTone: (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => void;
  setLanguage: (lang: 'en' | 'bn') => void;
  updateMetrics: (
    contentId: string,
    metrics: {
      likesCount: number;
      commentsCount: number;
      sharesCount: number;
      metricsLastSyncedAt: string;
    },
  ) => void;
  setCustomPrompt: (prompt: string) => void;
  updateCurrentCaption: (caption: string) => void;
  updateCurrentHeadline: (headline: string) => void;
  savePost: (storeId: string) => Promise<ContentItem | null>;
  approvePost: (storeId: string) => Promise<ContentItem | null>;
  schedulePost: (storeId: string, scheduledAt?: string) => Promise<ContentItem | null>;
  deletePost: (storeId: string, contentId: string) => Promise<boolean>;
  bulkDeletePosts: (storeId: string, contentIds: string[]) => Promise<number>;
  fetchSavedPosts: (storeId: string, status?: ContentStatus) => Promise<void>;
  clearError: () => void;
  setCurrentPost: (post: ContentItem | null) => void;
  resetForWorkspaceSwitch: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  currentPost: null,
  savedPosts: [],
  totalSaved: 0,
  isGenerating: false,
  isRegenerating: false,
  isSaving: false,
  isLoadingList: true,
  hasLoadedSavedPosts: false,
  error: null,
  currentTone: 'natural',
  currentLanguage: 'en',
  customPrompt: '',
  suggestedTime: '8:00 PM',

  clearError: () => set({ error: null }),

  resetForWorkspaceSwitch: () =>
    set({
      currentPost: null,
      savedPosts: [],
      totalSaved: 0,
      error: null,
      isGenerating: false,
      isRegenerating: false,
      isSaving: false,
      isLoadingList: true,
      hasLoadedSavedPosts: false,
    }),

  createNewPost: (storeId: string) => {
    const tone = get().currentTone;
    const newDraft: ContentItem = {
      id: `draft-${Date.now()}`,
      storeId,
      productId: null,
      headline: 'Fresh Brand Post',
      caption: '',
      hashtags: [],
      cta: null,
      postType: 'ENGAGEMENT',
      tone: (tone.toUpperCase() as ContentTone) || 'NATURAL',
      status: 'DRAFT',
      language: get().currentLanguage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: null,
      attachedProducts: [],
    };
    set({ currentPost: newDraft });
  },

  attachProductToCurrentPost: async (storeId, product) => {
    const post = get().currentPost;
    if (!post) return;

    const existingAttached = post.attachedProducts || [];
    if (existingAttached.some((ap) => ap.product.id === product.id)) return;

    const newRelation: AttachedProductRelation = {
      order: existingAttached.length,
      product: {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        currency: product.currency,
        category: product.category,
        tagline: product.tagline,
        features: product.features,
        discount: product.discount,
      },
    };

    const updatedAttached = [...existingAttached, newRelation];
    const updatedPost: ContentItem = {
      ...post,
      productId: updatedAttached[0]?.product.id || null,
      product: updatedAttached[0]?.product || null,
      attachedProducts: updatedAttached,
    };

    set({ currentPost: updatedPost });

    // If post already exists in backend, persist the attachment
    if (!isLocalDraftId(post.id) && storeId) {
      try {
        const productIds = updatedAttached.map((ap) => ap.product.id);
        const saved = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ productIds }),
          },
        );
        set((state) => ({
          currentPost: saved,
          savedPosts: state.savedPosts.map((p) => (p.id === saved.id ? saved : p)),
        }));
      } catch (err) {
        console.warn('Failed to sync product attachment to backend:', err);
      }
    }
  },

  detachProductFromCurrentPost: async (storeId, productId) => {
    const post = get().currentPost;
    if (!post) return;

    const updatedAttached = (post.attachedProducts || []).filter(
      (ap) => ap.product.id !== productId,
    );
    const updatedPost: ContentItem = {
      ...post,
      productId: updatedAttached[0]?.product.id || null,
      product: updatedAttached[0]?.product || null,
      attachedProducts: updatedAttached,
    };

    set({ currentPost: updatedPost });

    // If post already exists in backend, persist the detachment
    if (!isLocalDraftId(post.id) && storeId) {
      try {
        const productIds = updatedAttached.map((ap) => ap.product.id);
        const saved = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ productIds }),
          },
        );
        set((state) => ({
          currentPost: saved,
          savedPosts: state.savedPosts.map((p) => (p.id === saved.id ? saved : p)),
        }));
      } catch (err) {
        console.warn('Failed to sync product detachment to backend:', err);
      }
    }
  },

  setAttachedProductsForCurrentPost: async (storeId, products) => {
    const post = get().currentPost;
    if (!post) return;

    const updatedAttached: AttachedProductRelation[] = products.map((p, idx) => ({
      order: idx,
      product: {
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        currency: p.currency,
        category: p.category,
        tagline: p.tagline,
        features: p.features,
        discount: p.discount,
      },
    }));

    const updatedPost: ContentItem = {
      ...post,
      productId: updatedAttached[0]?.product.id || null,
      product: updatedAttached[0]?.product || null,
      attachedProducts: updatedAttached,
    };

    set({ currentPost: updatedPost });

    if (!isLocalDraftId(post.id) && storeId) {
      try {
        const productIds = products.map((p) => p.id);
        const saved = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ productIds }),
          },
        );
        set((state) => ({
          currentPost: saved,
          savedPosts: state.savedPosts.map((p) => (p.id === saved.id ? saved : p)),
        }));
      } catch (err) {
        console.warn('Failed to sync attached products to backend:', err);
      }
    }
  },

  setTone: (tone) => set({ currentTone: tone }),

  setLanguage: (lang) => set({ currentLanguage: lang }),

  updateMetrics: (contentId, metrics) =>
    set((state) => ({
      currentPost:
        state.currentPost?.id === contentId
          ? { ...state.currentPost, ...metrics }
          : state.currentPost,
      savedPosts: state.savedPosts.map((p) =>
        p.id === contentId ? { ...p, ...metrics } : p,
      ),
    })),

  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),

  setCurrentPost: (post) => set({ currentPost: post }),

  updateCurrentCaption: (caption) =>
    set((state) => ({
      currentPost: state.currentPost
        ? { ...state.currentPost, caption }
        : null,
    })),

  updateCurrentHeadline: (headline) =>
    set((state) => ({
      currentPost: state.currentPost
        ? { ...state.currentPost, headline }
        : null,
    })),

  generatePost: async (storeId, options) => {
    if (!storeId) throw new Error('Store ID is required to generate AI posts');
    set({ isGenerating: true, error: null });

    const selectedTone = options.tone || get().currentTone;
    const selectedLanguage = options.language || get().currentLanguage;
    const toneUpper = selectedTone.toUpperCase();

    const productIds = options.productIds ?? (options.productId ? [options.productId] : undefined);

    try {
      const response = await apiClient<{
        content: ContentItem;
        aiOutput: SocialPostOutput;
      }>(`/stores/${storeId}/ai/generate-post`, {
        method: 'POST',
        body: JSON.stringify({
          productId: options.productId || undefined,
          productIds: productIds && productIds.length > 0 ? productIds : undefined,
          tone: toneUpper,
          language: selectedLanguage,
          customPrompt: options.customPrompt ?? get().customPrompt ?? undefined,
          offerDetails: options.offerDetails || undefined,
          sourceHeadline: options.sourceHeadline || undefined,
          sourceCaption: options.sourceCaption || undefined,
        }),
      });

      set({
        currentPost: response.content,
        suggestedTime: response.aiOutput.suggestedPublishTime || '8:00 PM',
        currentTone: selectedTone,
        currentLanguage: selectedLanguage,
        isGenerating: false,
      });

      // Also prepend to savedPosts list for live reactivity
      set((state) => ({
        savedPosts: [response.content, ...state.savedPosts.filter((p) => p.id !== response.content.id)],
        totalSaved: state.totalSaved + 1,
      }));

      return response.content;
    } catch (err: any) {
      console.warn('AI Post generation failed:', err);
      const msg = err.message || 'Failed to generate post with AI';
      set({ error: msg, isGenerating: false });
      throw err;
    }
  },

  regeneratePost: async (storeId, contentId, options = {}) => {
    if (!storeId) throw new Error('Store ID is required to regenerate AI post');
    const targetId = contentId || get().currentPost?.id;
    if (!targetId) throw new Error('No post available to regenerate');

    const selectedTone = options.tone || get().currentTone;
    const selectedLanguage = options.language || get().currentLanguage;
    const toneUpper = selectedTone.toUpperCase();

    // If target is an unpersisted local draft, route cleanly to generatePost
    if (isLocalDraftId(targetId)) {
      const current = get().currentPost;
      const attachedProductIds = (current?.attachedProducts || []).map((ap) => ap.product.id);
      const productIds = attachedProductIds.length > 0
        ? attachedProductIds
        : (current?.productId ? [current.productId] : undefined);

      return get().generatePost(storeId, {
        productId: productIds?.[0],
        productIds: productIds && productIds.length > 0 ? productIds : undefined,
        tone: selectedTone,
        language: selectedLanguage,
        customPrompt: options.customPrompt ?? get().customPrompt ?? undefined,
        offerDetails: options.offerDetails || undefined,
        sourceHeadline: options.sourceHeadline || (current?.headline !== 'Fresh Brand Post' ? current?.headline : undefined),
        sourceCaption: options.sourceCaption || (current?.caption ? current.caption : undefined),
      });
    }

    set({ isRegenerating: true, error: null });

    try {
      const response = await apiClient<{
        content: ContentItem;
        aiOutput: SocialPostOutput;
      }>(`/stores/${storeId}/ai/regenerate-post/${targetId}`, {
        method: 'POST',
        body: JSON.stringify({
          tone: toneUpper,
          language: selectedLanguage,
          customPrompt: options.customPrompt ?? get().customPrompt ?? undefined,
          offerDetails: options.offerDetails || undefined,
          sourceHeadline: options.sourceHeadline || undefined,
          sourceCaption: options.sourceCaption || undefined,
        }),
      });

      set({
        currentPost: response.content,
        suggestedTime: response.aiOutput.suggestedPublishTime || get().suggestedTime,
        currentTone: selectedTone,
        currentLanguage: selectedLanguage,
        isRegenerating: false,
      });

      // Update in savedPosts list to preserve reactivity
      set((state) => ({
        savedPosts: state.savedPosts.map((p) =>
          p.id === response.content.id ? response.content : p,
        ),
      }));

      return response.content;
    } catch (err: any) {
      console.warn('AI Post regeneration failed:', err);
      const msg = err.message || 'Failed to regenerate post with AI';
      set({ error: msg, isRegenerating: false });
      throw err;
    }
  },

  savePost: async (storeId) => {
    const post = get().currentPost;
    if (!post || !storeId) return null;
    set({ isSaving: true, error: null });

    const attachedIds = (post.attachedProducts || []).map((ap) => ap.product.id);

    try {
      let updated: ContentItem;
      if (isLocalDraftId(post.id)) {
        // Create new post in backend
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents`,
          {
            method: 'POST',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              hashtags: post.hashtags,
              cta: post.cta,
              postType: post.postType,
              tone: post.tone,
              status: 'READY',
              productIds: attachedIds,
            }),
          },
        );
      } else {
        // Update existing post
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              hashtags: post.hashtags,
              cta: post.cta,
              status: 'READY',
              productIds: attachedIds,
            }),
          },
        );
      }

      set((state) => ({
        currentPost: updated,
        savedPosts: [updated, ...state.savedPosts.filter((p) => p.id !== updated.id)],
        isSaving: false,
      }));

      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save post', isSaving: false });
      throw err;
    }
  },

  approvePost: async (storeId) => {
    const post = get().currentPost;
    if (!post || !storeId) return null;
    set({ isSaving: true, error: null });

    const attachedIds = (post.attachedProducts || []).map((ap) => ap.product.id);

    try {
      let updated: ContentItem;
      if (isLocalDraftId(post.id)) {
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents`,
          {
            method: 'POST',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              hashtags: post.hashtags,
              cta: post.cta,
              postType: post.postType,
              tone: post.tone,
              status: 'APPROVED',
              productIds: attachedIds,
            }),
          },
        );
      } else {
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              hashtags: post.hashtags,
              cta: post.cta,
              status: 'APPROVED',
              productIds: attachedIds,
            }),
          },
        );
      }

      set((state) => ({
        currentPost: updated,
        savedPosts: [updated, ...state.savedPosts.filter((p) => p.id !== updated.id)],
        isSaving: false,
      }));

      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to approve post', isSaving: false });
      throw err;
    }
  },

  schedulePost: async (storeId, scheduledAt) => {
    const post = get().currentPost;
    if (!post || !storeId) return null;
    set({ isSaving: true, error: null });

    const defaultSchedule = scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const attachedIds = (post.attachedProducts || []).map((ap) => ap.product.id);

    try {
      let updated: ContentItem;
      if (isLocalDraftId(post.id)) {
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents`,
          {
            method: 'POST',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              status: 'SCHEDULED',
              scheduledAt: defaultSchedule,
              productIds: attachedIds,
            }),
          },
        );
      } else {
        updated = await apiClient<ContentItem>(
          `/stores/${storeId}/contents/${post.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              headline: post.headline,
              caption: post.caption,
              status: 'SCHEDULED',
              scheduledAt: defaultSchedule,
              productIds: attachedIds,
            }),
          },
        );
      }

      set((state) => ({
        currentPost: updated,
        savedPosts: [updated, ...state.savedPosts.filter((p) => p.id !== updated.id)],
        isSaving: false,
      }));

      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to schedule post', isSaving: false });
      throw err;
    }
  },

  deletePost: async (storeId, contentId) => {
    if (!storeId || !contentId) return false;

    // Check if it is an unsaved client draft
    const isLocalDraft = isLocalDraftId(contentId);

    if (!isLocalDraft) {
      await apiClient(`/stores/${storeId}/contents/${contentId}`, {
        method: 'DELETE',
      });
    }

    const state = get();
    const remainingPosts = state.savedPosts.filter((p) => p.id !== contentId);
    const wasCurrent = state.currentPost?.id === contentId;

    set({
      savedPosts: remainingPosts,
      totalSaved: Math.max(0, state.totalSaved - (isLocalDraft ? 0 : 1)),
      currentPost: wasCurrent
        ? (remainingPosts[0] || null)
        : state.currentPost,
    });

    if (wasCurrent && remainingPosts.length === 0) {
      get().createNewPost(storeId);
    }

    return true;
  },

  bulkDeletePosts: async (storeId, contentIds) => {
    if (!storeId || !contentIds || contentIds.length === 0) return 0;

    const idsToDelete = new Set(contentIds);
    const persistedIds = contentIds.filter((id) => !isLocalDraftId(id));

    if (persistedIds.length > 0) {
      await apiClient<{ count: number }>(`/stores/${storeId}/contents/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids: persistedIds }),
      });
    }

    const state = get();
    const remainingPosts = state.savedPosts.filter((p) => !idsToDelete.has(p.id));
    const wasCurrentDeleted = state.currentPost && idsToDelete.has(state.currentPost.id);

    set({
      savedPosts: remainingPosts,
      totalSaved: Math.max(0, state.totalSaved - persistedIds.length),
      currentPost: wasCurrentDeleted ? (remainingPosts[0] || null) : state.currentPost,
    });

    if (wasCurrentDeleted && remainingPosts.length === 0) {
      get().createNewPost(storeId);
    }

    return contentIds.length;
  },

  fetchSavedPosts: async (storeId, status) => {
    if (!storeId) return;
    set({ isLoadingList: true, error: null });

    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;

      const response = await apiClient<{
        contents: ContentItem[];
        total: number;
      }>(`/stores/${storeId}/contents`, { params });

      set({
        savedPosts: response.contents || [],
        totalSaved: response.total || 0,
        isLoadingList: false,
        hasLoadedSavedPosts: true,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to load saved posts',
        isLoadingList: false,
        hasLoadedSavedPosts: true,
      });
    }
  },
}));
