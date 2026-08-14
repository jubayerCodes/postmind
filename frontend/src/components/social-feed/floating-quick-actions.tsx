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
      <div className="p-2 rounded-2xl bg-white/90 dark:bg-[#161B22]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-violet-500/10 dark:shadow-black/80 flex flex-wrap items-center justify-between gap-2 transition-all">
        {/* Left AI Tone Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => handleToneChange('witty')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'witty'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Make Witty</span>
          </button>

          <button
            onClick={() => handleToneChange('promo')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'promo'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            )}
          >
            <Tag className="w-3.5 h-3.5 text-rose-300" />
            <span>Add 20% Promo</span>
          </button>

          <button
            onClick={() => handleToneChange('storytelling')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0',
              currentTone === 'storytelling'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-200" />
            <span>Storytelling</span>
          </button>

          <button
            onClick={() => handleToneChange('natural')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white',
              currentTone === 'natural' && 'font-bold text-cyan-500'
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
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm',
              isScheduled
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 shadow-cyan-500/20'
            )}
          >
            {isScheduled ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scheduled (8 PM)</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>1-Click Schedule</span>
              </>
            )}
          </button>

          <button
            onClick={handlePublishWithConfetti}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublished ? 'Published!' : 'Publish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
