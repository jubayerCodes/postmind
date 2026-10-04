'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncProfileAndStores = useAuthStore((state) => state.syncProfileAndStores);

  React.useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. Check for error parameters in query string
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');

        // 2. Check for error parameters in URL hash (Supabase implicit grant or error fragments)
        let hashError: string | null = null;
        let hashDesc: string | null = null;
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.replace(/^#/, ''),
          );
          hashError = hashParams.get('error');
          hashDesc = hashParams.get('error_description');
        }

        const failureReason = errorDesc || hashDesc || errorParam || hashError;
        if (failureReason) {
          console.warn('OAuth callback received error from provider:', failureReason);
          useAuthStore.setState({ isLoading: false, error: failureReason });
          router.replace(`/login?error=${encodeURIComponent(failureReason)}`);
          return;
        }

        // 3. Password recovery redirect
        if (
          typeof window !== 'undefined' &&
          window.location.hash.includes('type=recovery')
        ) {
          router.replace('/reset-password');
          return;
        }

        // 4. Check for code and exchange it
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/';

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        // 5. Ensure an active session actually exists before routing to dashboard
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          throw new Error('Authentication was cancelled or failed to establish a session.');
        }

        // Sync profile with backend
        await syncProfileAndStores();
        useAuthStore.setState({ isLoading: false });
        router.replace(next);
      } catch (err: any) {
        console.error('Error during auth callback exchange:', err);
        const errorMsg =
          err?.message || 'Authentication failed. Please try again.';
        useAuthStore.setState({ isLoading: false, error: errorMsg });
        router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams, syncProfileAndStores]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)] select-none">
      <div className="flex flex-col items-center gap-3 p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/5 dark:shadow-black/40">
        <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
          <span>Verifying authentication...</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Connecting to your PostMind workspace
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <AuthCallbackContent />
    </React.Suspense>
  );
}
