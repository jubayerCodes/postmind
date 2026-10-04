'use client';

import * as React from 'react';
import Link from 'next/link';
import { Command, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email) {
      setLocalError('Please enter your email address.');
      return;
    }

    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send password reset email.');
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
          {isSent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Reset Link Dispatched
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                If an account exists for <span className="font-semibold text-[var(--text-primary)]">{email}</span>, you will receive an email shortly with instructions to reset your password.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--brand-primary)] text-white hover:brightness-110"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)] mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Reset your password
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Enter your email address and we will send you a recovery link.
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
                    htmlFor="email"
                    className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="merchant@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <span>Send Reset Instructions</span>
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
