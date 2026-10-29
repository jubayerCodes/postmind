'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, X, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  itemTitle?: string | null;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemTitle,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Variant Icon Circle */}
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
                variant === 'danger'
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  : variant === 'warning'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              )}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : variant === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {description}
              </p>

              {/* Optional highlighted item name preview */}
              {itemTitle && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] truncate">
                  &ldquo;{itemTitle}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-hover)]/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-95',
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-[var(--brand-primary)] hover:brightness-110'
            )}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
