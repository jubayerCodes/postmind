'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Command, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, isLoading, error, clearError } = useAuthStore();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!password || !confirmPassword) {
      setLocalError('Please complete both password fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await updatePassword(password);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update your password.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-main)] text-[var(--text-primary)] antialiased font-sans select-none">
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Command className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
            PostMind
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/5 dark:shadow-black/40">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Password Successfully Updated
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Your password has been changed. Redirecting to your dashboard...
              </p>
              <div className="mt-5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--brand-primary)] text-white hover:brightness-110"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Set New Password
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Enter your new password below.
                </p>
              </div>

              {(localError || error) && (
                <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError || error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
        &copy; {new Date().getFullYear()} PostMind AI. All rights reserved.
      </footer>
    </div>
  );
}
