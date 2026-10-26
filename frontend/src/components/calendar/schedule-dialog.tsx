'use client';

import * as React from 'react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useSocialStore } from '@/stores/social-store';
import { useStores } from '@/hooks/use-stores';
import {
  Calendar,
  Clock,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export function ScheduleDialog() {
  const {
    isScheduleModalOpen,
    targetPost,
    isScheduling,
    error,
    closeScheduleModal,
    schedulePost,
    cancelSchedule,
  } = useCalendarStore();

  const { accounts, selectedAccountId } = useSocialStore();
  const { activeStore } = useStores();

  const activePage =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts[0] ||
    null;

  // Format a date object for datetime-local (YYYY-MM-DDTHH:mm)
  const formatForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getInitialTime = () => {
    if (targetPost?.scheduledAt) {
      return formatForInput(new Date(targetPost.scheduledAt));
    }
    const d = new Date();
    // Default to today at 8:00 PM, or tomorrow 8:00 PM if past 8:00 PM
    if (d.getHours() >= 20) {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(20, 0, 0, 0);
    return formatForInput(d);
  };

  const [selectedDateTime, setSelectedDateTime] = React.useState(getInitialTime);
  const [activePreset, setActivePreset] = React.useState<string | null>('today-peak');

  React.useEffect(() => {
    if (isScheduleModalOpen) {
      setSelectedDateTime(getInitialTime());
      setActivePreset('today-peak');
    }
  }, [isScheduleModalOpen, targetPost]);

  if (!isScheduleModalOpen || !targetPost) return null;

  const presets = [
    {
      id: 'today-peak',
      label: 'Today Peak (8:00 PM)',
      subtext: 'High engagement window',
      getDate: () => {
        const d = new Date();
        d.setHours(20, 0, 0, 0);
        return d;
      },
    },
    {
      id: 'tomorrow-morning',
      label: 'Tomorrow Morning (10:00 AM)',
      subtext: 'Early commute browse',
      getDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d;
      },
    },
    {
      id: 'tomorrow-peak',
      label: 'Tomorrow Evening (8:00 PM)',
      subtext: 'Evening prime shopping',
      getDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(20, 0, 0, 0);
        return d;
      },
    },
    {
      id: 'weekend',
      label: 'This Saturday (11:00 AM)',
      subtext: 'Weekend leisure browsing',
      getDate: () => {
        const d = new Date();
        const day = d.getDay();
        const diff = (6 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        d.setHours(11, 0, 0, 0);
        return d;
      },
    },
  ];

  const handleSelectPreset = (preset: (typeof presets)[0]) => {
    setActivePreset(preset.id);
    setSelectedDateTime(formatForInput(preset.getDate()));
  };

  const handleConfirmSchedule = async () => {
    if (!activeStore?.id) return;
    try {
      const isoDate = new Date(selectedDateTime).toISOString();
      await schedulePost(activeStore.id, targetPost.id, isoDate);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.2, x: 0.5 },
      });
    } catch (err) {
      console.warn('Schedule failed:', err);
    }
  };

  const handleCancelSchedule = async () => {
    if (!activeStore?.id) return;
    if (confirm('Cancel this scheduled post? It will revert to Ready status.')) {
      try {
        await cancelSchedule(activeStore.id, targetPost.id);
      } catch (err) {
        console.warn('Cancel schedule failed:', err);
      }
    }
  };

  const isAlreadyScheduled = targetPost.status === 'SCHEDULED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {isAlreadyScheduled ? 'Edit Schedule Slot' : 'Schedule Social Post'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Automatic auto-dispatch to connected Facebook Page
              </p>
            </div>
          </div>
          <button
            onClick={closeScheduleModal}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Post Preview Card Snippet */}
          <div className="p-3 rounded-lg bg-[var(--bg-hover)]/60 border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-medium text-[var(--brand-primary)] uppercase tracking-wide">
                Target Post
              </span>
              {activePage && (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[8px]">
                    f
                  </div>
                  <span className="font-medium truncate max-w-[140px]">
                    {activePage.accountName}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {targetPost.headline}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
              {targetPost.caption}
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[var(--brand-primary)]" />
              <span>AI Recommended Posting Windows</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 shadow-xs'
                        : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    )}
                  >
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      {preset.subtext}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
              <span>Custom Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => {
                setSelectedDateTime(e.target.value);
                setActivePreset(null);
              }}
              className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-hover)]/30 flex items-center justify-between">
          {isAlreadyScheduled ? (
            <button
              onClick={handleCancelSchedule}
              disabled={isScheduling}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel Schedule</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={closeScheduleModal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleConfirmSchedule}
              disabled={isScheduling}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] hover:brightness-110 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAlreadyScheduled ? 'Update Schedule' : 'Schedule Post'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
