'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Command, Sparkles, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    signInWithPassword,
    signInWithFacebook,
    loginAsDevGuest,
    error,
    clearError,
    user,
    isDevGuest,
  } = useAuthStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = React.useState(false);

  // Read error parameters from URL (e.g. returning from failed or cancelled OAuth)
  React.useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');
    if (errorParam || errorDesc) {
      setLocalError(errorDesc || errorParam || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  // Reset loading states on mount and on BFCache restore (e.g. browser back button)
  React.useEffect(() => {
    setIsFacebookLoading(false);
    setIsSubmitting(false);
    useAuthStore.setState({ isLoading: false });

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsFacebookLoading(false);
        setIsSubmitting(false);
        useAuthStore.setState({ isLoading: false });
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user || isDevGuest) {
      router.push('/');
    }
  }, [user, isDevGuest, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithPassword(email, password);
      router.push('/');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLocalError(null);
    clearError();
    setIsFacebookLoading(true);
    try {
      await signInWithFacebook();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to initialize Facebook login.');
      setIsFacebookLoading(false);
    }
  };

  const handleDevLogin = async () => {
    await loginAsDevGuest();
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-main)] text-[var(--text-primary)] antialiased font-sans select-none relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[500px] h-[300px] bg-[var(--brand-primary)]/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar */}
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Command className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
            PostMind
          </span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            AI SaaS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/5 dark:shadow-black/40">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Welcome back to PostMind
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              AI-driven social media autopilot for modern online merchants
            </p>
          </div>

          {(localError || error) && (
            <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Facebook Sign In */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={isSubmitting || isFacebookLoading}
            className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-[#1877F2] text-white hover:bg-[#166fe5] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFacebookLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting to Facebook...</span>
              </>
            ) : (
              <>
                <FacebookIcon className="w-3.5 h-3.5" />
                <span>Continue with Facebook</span>
              </>
            )}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative px-2.5 bg-[var(--bg-card)] text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
              Or continue with email
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[var(--text-primary)]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[var(--brand-primary)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isFacebookLoading}
              className="w-full py-2 px-4 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Dev Demo Mode Button */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleDevLogin}
              className="w-full py-2 px-3 rounded-md text-xs font-medium border border-dashed border-[var(--border-active)] bg-[var(--bg-hover)]/40 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Explore as Demo Guest (Instant Access)</span>
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-secondary)] mt-5">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-[var(--brand-primary)] hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)] z-10">
        &copy; {new Date().getFullYear()} PostMind AI. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
