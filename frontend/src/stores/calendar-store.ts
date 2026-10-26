import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { ContentItem, useContentStore } from './content-store';

interface CalendarState {
  posts: ContentItem[];
  isLoading: boolean;
  currentDate: Date;
  activeView: 'month' | 'week' | 'day';
  isScheduleModalOpen: boolean;
  targetPost: ContentItem | null;
  isScheduling: boolean;
  error: string | null;

  fetchCalendarPosts: (storeId: string, monthStr?: string) => Promise<void>;
  schedulePost: (
    storeId: string,
    contentId: string,
    scheduledAt: string,
  ) => Promise<ContentItem>;
  cancelSchedule: (storeId: string, contentId: string) => Promise<ContentItem>;
  openScheduleModal: (post?: ContentItem | null) => void;
  closeScheduleModal: () => void;
  setActiveView: (view: 'month' | 'week' | 'day') => void;
  navigateDate: (direction: 'prev' | 'next' | 'today') => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  posts: [],
  isLoading: false,
  currentDate: new Date(),
  activeView: 'month',
  isScheduleModalOpen: false,
  targetPost: null,
  isScheduling: false,
  error: null,

  fetchCalendarPosts: async (storeId: string, monthStr?: string) => {
    set({ isLoading: true, error: null });
    try {
      const date = get().currentDate;
      const formattedMonth =
        monthStr ||
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const res = await apiClient<{ posts: ContentItem[]; total: number }>(
        `/stores/${storeId}/scheduling/calendar?month=${formattedMonth}`,
        { storeId },
      );

      set({ posts: res.posts || [], isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch calendar posts',
        isLoading: false,
      });
    }
  },

  schedulePost: async (
    storeId: string,
    contentId: string,
    scheduledAt: string,
  ) => {
    set({ isScheduling: true, error: null });
    try {
      const res = await apiClient<{ post: ContentItem; message: string }>(
        `/stores/${storeId}/scheduling/posts/${contentId}`,
        {
          method: 'POST',
          storeId,
          body: JSON.stringify({ scheduledAt }),
        },
      );

      const updated = res.post;

      // Update calendar posts list
      set((state) => {
        const filtered = state.posts.filter((p) => p.id !== contentId);
        return {
          posts: [...filtered, updated],
          isScheduling: false,
          isScheduleModalOpen: false,
        };
      });

      // Synchronize ContentStore currentPost
      const contentState = useContentStore.getState();
      if (contentState.currentPost && contentState.currentPost.id === contentId) {
        useContentStore.setState({
          currentPost: {
            ...contentState.currentPost,
            status: 'SCHEDULED',
            scheduledAt: updated.scheduledAt,
          },
        });
      }

      return updated;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to schedule post',
        isScheduling: false,
      });
      throw err;
    }
  },

  cancelSchedule: async (storeId: string, contentId: string) => {
    set({ isScheduling: true, error: null });
    try {
      const res = await apiClient<{ post: ContentItem; message: string }>(
        `/stores/${storeId}/scheduling/posts/${contentId}`,
        {
          method: 'DELETE',
          storeId,
        },
      );

      const updated = res.post;

      set((state) => {
        const filtered = state.posts.filter((p) => p.id !== contentId);
        return {
          posts: [...filtered, updated],
          isScheduling: false,
          isScheduleModalOpen: false,
        };
      });

      // Synchronize ContentStore currentPost
      const contentState = useContentStore.getState();
      if (contentState.currentPost && contentState.currentPost.id === contentId) {
        useContentStore.setState({
          currentPost: {
            ...contentState.currentPost,
            status: 'READY',
            scheduledAt: null,
          },
        });
      }

      return updated;
    } catch (err: any) {
      set({
        error: err.message || 'Failed to cancel schedule',
        isScheduling: false,
      });
      throw err;
    }
  },

  openScheduleModal: (post?: ContentItem | null) => {
    const postToSchedule = post || useContentStore.getState().currentPost;
    set({
      isScheduleModalOpen: true,
      targetPost: postToSchedule,
      error: null,
    });
  },

  closeScheduleModal: () => {
    set({ isScheduleModalOpen: false, targetPost: null, error: null });
  },

  setActiveView: (view: 'month' | 'week' | 'day') => {
    set({ activeView: view });
  },

  navigateDate: (direction: 'prev' | 'next' | 'today') => {
    set((state) => {
      if (direction === 'today') {
        return { currentDate: new Date() };
      }

      const newDate = new Date(state.currentDate);
      if (state.activeView === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (state.activeView === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      }

      return { currentDate: newDate };
    });
  },
}));
