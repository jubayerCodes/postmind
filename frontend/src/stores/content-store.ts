import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export type ContentStatus =
  | 'DRAFT'
  | 'READY'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED';

export type ContentTone = 'NATURAL' | 'WITTY' | 'PROMO' | 'STORYTELLING';

export type PostType = 'PRODUCT_SHOWCASE' | 'OFFER' | 'ENGAGEMENT' | 'STORY';

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
    category: string;
  } | null;
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

interface ContentState {
  currentPost: ContentItem | null;
  savedPosts: ContentItem[];
  totalSaved: number;
  isGenerating: boolean;
  isRegenerating: boolean;
  isSaving: boolean;
  isLoadingList: boolean;
  error: string | null;
  currentTone: 'natural' | 'witty' | 'promo' | 'storytelling';
  currentLanguage: 'en' | 'bn';
  customPrompt: string;
  suggestedTime: string;

  // Actions
  generatePost: (
    storeId: string,
    options: {
      productId?: string;
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
  isLoadingList: false,
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
    }),

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

    try {
      const response = await apiClient<{
        content: ContentItem;
        aiOutput: SocialPostOutput;
      }>(`/stores/${storeId}/ai/generate-post`, {
        method: 'POST',
        body: JSON.stringify({
          productId: options.productId || undefined,
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

    set({ isRegenerating: true, error: null });

    const selectedTone = options.tone || get().currentTone;
    const selectedLanguage = options.language || get().currentLanguage;
    const toneUpper = selectedTone.toUpperCase();

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

    try {
      const updated = await apiClient<ContentItem>(
        `/stores/${storeId}/contents/${post.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            headline: post.headline,
            caption: post.caption,
            hashtags: post.hashtags,
            cta: post.cta,
            status: 'READY',
          }),
        },
      );

      set((state) => ({
        currentPost: updated,
        savedPosts: state.savedPosts.map((p) => (p.id === updated.id ? updated : p)),
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

    try {
      const updated = await apiClient<ContentItem>(
        `/stores/${storeId}/contents/${post.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            headline: post.headline,
            caption: post.caption,
            hashtags: post.hashtags,
            cta: post.cta,
            status: 'APPROVED',
          }),
        },
      );

      set((state) => ({
        currentPost: updated,
        savedPosts: state.savedPosts.map((p) => (p.id === updated.id ? updated : p)),
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

    try {
      const defaultSchedule = scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const updated = await apiClient<ContentItem>(
        `/stores/${storeId}/contents/${post.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            headline: post.headline,
            caption: post.caption,
            status: 'SCHEDULED',
            scheduledAt: defaultSchedule,
          }),
        },
      );

      set((state) => ({
        currentPost: updated,
        savedPosts: state.savedPosts.map((p) => (p.id === updated.id ? updated : p)),
        isSaving: false,
      }));

      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to schedule post', isSaving: false });
      throw err;
    }
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
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to load saved posts',
        isLoadingList: false,
      });
    }
  },
}));
