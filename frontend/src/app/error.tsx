'use client';

import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('PostMind application error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-main,#09090b)] text-[var(--text-primary,#fafafa)] p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold mb-2">Something went wrong</h2>
      <p className="text-xs text-[var(--text-secondary,#a1a1aa)] max-w-md mb-6 leading-relaxed">
        {error?.message || 'An unexpected error occurred while loading this view. You can reload to retry.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-primary,#6366f1)] text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--border-subtle,#27272a)] hover:bg-[var(--bg-hover,#18181b)] text-[var(--text-secondary,#a1a1aa)] hover:text-white transition-all flex items-center gap-2 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
