'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocialStore } from '@/stores/social-store';
import { useStores } from '@/hooks/use-stores';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function FacebookCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback, connectDevAccount } = useSocialStore();
  const { activeStore } = useStores();

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function processCallback() {
      const code = searchParams.get('code');
      const devMode = searchParams.get('dev_mode');
      const storeIdParam = searchParams.get('store_id');
      const storeId = storeIdParam || activeStore?.id;

      if (!storeId) {
        setStatus('error');
        setErrorMessage('Store context missing. Please try connecting again from the dashboard.');
        return;
      }

      try {
        if (devMode === 'true' || !code) {
          // Dev sandbox fallback
          await connectDevAccount(storeId);
        } else {
          // Real Meta OAuth code exchange
          await handleOAuthCallback(storeId, code);
        }

        setStatus('success');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authorize Facebook Page');
      }
    }

    processCallback();
  }, [searchParams, activeStore?.id, handleOAuthCallback, connectDevAccount, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="w-full max-w-md p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 text-[#1877F2] mx-auto flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Connecting Facebook Page...
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Securely exchanging tokens and registering your page with PostMind.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Connected Successfully!
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Redirecting you back to Feed Studio...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Connection Failed
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {errorMessage || 'An error occurred during Facebook authorization.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--brand-primary)] text-white hover:brightness-110 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <FacebookCallbackContent />
    </React.Suspense>
  );
}
