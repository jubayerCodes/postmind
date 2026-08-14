'use client';

import * as React from 'react';
import {
  Sparkles,
  Tag,
  RefreshCw,
  Calendar,
  Send,
  BookOpen,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface FloatingQuickActionsProps {
  currentTone: string;
  onSelectTone: (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => void;
  onSchedule: () => void;
  onPublish: () => void;
  isScheduled: boolean;
  isPublished: boolean;
}

export function FloatingQuickActions({
  currentTone,
  onSelectTone,
  onSchedule,
  onPublish,
  isScheduled,
  isPublished,
}: FloatingQuickActionsProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleToneChange = (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => {
    setIsGenerating(true);
    setTimeout(() => {
      onSelectTone(tone);
      setIsGenerating(false);
    }, 300);
  };

  const handlePublishWithConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.85 },
      colors: ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B'],
    });
    onPublish();
  };

  return (
    <div className="sticky bottom-6 z-30 max-w-2xl mx-auto w-full px-4">
      <div className="p-2.5 rounded-2xl bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 flex flex-wrap items-center justify-between gap-2.5 transition-all">
        {/* Left AI Tone Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => handleToneChange('witty')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'witty'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Make Witty</span>
          </button>

          <button
            onClick={() => handleToneChange('promo')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'promo'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <Tag className="w-3.5 h-3.5 text-rose-400" />
            <span>Add 20% Promo</span>
          </button>

          <button
            onClick={() => handleToneChange('storytelling')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'storytelling'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Storytelling</span>
          </button>

          <button
            onClick={() => handleToneChange('natural')}
            className={cn(
              'flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white',
              currentTone === 'natural' && 'font-bold text-cyan-600 dark:text-cyan-400 bg-slate-100 dark:bg-slate-800'
            )}
            title="Reset to default recommendation"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isGenerating && 'animate-spin')} />
          </button>
        </div>

        {/* Right Primary Schedule & Publish Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSchedule}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm',
              isScheduled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 font-bold'
                : 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white font-bold hover:brightness-110 shadow-md shadow-cyan-600/20'
            )}
          >
            {isScheduled ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Scheduled (8:00 PM)</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-white" />
                <span>1-Click Schedule</span>
              </>
            )}
          </button>

          <button
            onClick={handlePublishWithConfetti}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm',
              isPublished
                ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-700/60'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md'
            )}
          >
            <Send className="w-4 h-4" />
            <span>{isPublished ? 'Published!' : 'Publish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
