'use client';

import * as React from 'react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useStores } from '@/hooks/use-stores';
import { ContentItem } from '@/stores/content-store';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Plus,
  Loader2,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function CalendarView() {
  const {
    posts,
    isLoading,
    currentDate,
    activeView,
    fetchCalendarPosts,
    openScheduleModal,
    setActiveView,
    navigateDate,
  } = useCalendarStore();

  const { activeStore, isSwitchingWorkspace } = useStores();

  React.useEffect(() => {
    if (activeStore?.id && !isSwitchingWorkspace) {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      fetchCalendarPosts(activeStore.id, monthStr);
    }
  }, [activeStore?.id, currentDate, fetchCalendarPosts, isSwitchingWorkspace]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month name formatting
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentMonthTitle = `${monthNames[month]} ${year}`;

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Map posts by day of the month
  const postsByDay = React.useMemo(() => {
    const map = new Map<number, ContentItem[]>();
    for (const post of posts) {
      const dateToUse = post.scheduledAt || post.publishedAt || post.createdAt;
      if (dateToUse) {
        const d = new Date(dateToUse);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          const list = map.get(day) || [];
          list.push(post);
          map.set(day, list);
        }
      }
    }
    return map;
  }, [posts, year, month]);

  const formatPostTime = (isoDate?: string | null) => {
    if (!isoDate) return '8:00 PM';
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--bg-main)]">
      {/* Top Header Bar */}
      <div className="w-full px-6 py-3 shrink-0 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-sm">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-semibold text-[var(--text-primary)] min-w-[160px] text-center">
              {currentMonthTitle}
            </h1>
            <button
              onClick={() => navigateDate('next')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigateDate('today')}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Controls & Schedule Action */}
        <div className="flex items-center gap-2.5">
          {/* View Switcher: Month / Week / Day */}
          <div className="flex items-center p-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium capitalize transition-all cursor-pointer',
                  activeView === view
                    ? 'bg-[var(--brand-primary)] text-white shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Quick Schedule Button */}
          <button
            onClick={() => openScheduleModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--brand-primary)] hover:brightness-110 text-white transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
            <span className="text-xs">Loading calendar events...</span>
          </div>
        ) : activeView === 'month' ? (
          /* Month Grid View */
          <div className="h-full flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs overflow-hidden">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-[11px] font-semibold text-[var(--text-secondary)] text-center py-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-[var(--border-subtle)]">
              {/* Padding empty days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[var(--bg-hover)]/15 p-2" />
              ))}

              {/* Real month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = isCurrentMonth && dayNum === todayDate;
                const dayPosts = postsByDay.get(dayNum) || [];

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={cn(
                      'p-2 min-h-[105px] flex flex-col justify-between transition-colors group relative hover:bg-[var(--bg-hover)]/30',
                      isToday && 'bg-[var(--brand-primary)]/5'
                    )}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                          isToday
                            ? 'bg-[var(--brand-primary)] text-white shadow-2xs font-bold'
                            : 'text-[var(--text-primary)]'
                        )}
                      >
                        {dayNum}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[10px] font-mono font-medium text-[var(--text-secondary)]">
                          {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Day Post Cards */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[120px] scrollbar-thin">
                      {dayPosts.map((post) => {
                        const isScheduled = post.status === 'SCHEDULED';
                        const isPublished = post.status === 'PUBLISHED';
                        const timeStr = formatPostTime(post.scheduledAt || post.publishedAt);

                        return (
                          <div
                            key={post.id}
                            onClick={() => openScheduleModal(post)}
                            className={cn(
                              'p-1.5 rounded-md border text-[11px] transition-all cursor-pointer group/card flex flex-col gap-1',
                              isScheduled
                                ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500 text-emerald-950 dark:text-emerald-200'
                                : isPublished
                                ? 'border-[#1877F2]/30 bg-[#1877F2]/10 hover:border-[#1877F2] text-[#1877F2] dark:text-[#6aa4f8]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold">
                                {isScheduled ? (
                                  <Clock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#1877F2]" />
                                )}
                                {timeStr}
                              </span>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                                f
                              </div>
                            </div>
                            <p className="text-[10px] font-medium text-[var(--text-primary)] truncate">
                              {post.headline}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week / Day Timeline List */
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Upcoming Scheduled Queue</span>
              </h2>

              {posts.filter((p) => p.status === 'SCHEDULED').length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] mx-auto flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    No posts currently queued in schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {posts
                    .filter((p) => p.status === 'SCHEDULED')
                    .map((post) => (
                      <div
                        key={post.id}
                        onClick={() => openScheduleModal(post)}
                        className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {post.headline}
                            </h3>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              Target Date:{' '}
                              {post.scheduledAt
                                ? new Date(post.scheduledAt).toLocaleString()
                                : '8:00 PM'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                            Auto-Dispatch
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
