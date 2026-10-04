'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  User,
  Store,
  ShieldCheck,
  ChevronDown,
  Settings,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeBrandToggle } from '@/components/theme-brand-toggle';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { user, isDevGuest, stores, signOut, updateProfile, isLoading } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
    router.push('/login');
  };

  const handleOpenProfile = () => {
    setNameInput(user?.name || '');
    setIsMenuOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSavingProfile(true);
    try {
      await updateProfile({ name: nameInput.trim() });
      setProfileSuccessMessage(true);
      setTimeout(() => {
        setProfileSuccessMessage(false);
        setIsProfileModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'UW';
  };

  const displayName = user?.name || (isDevGuest ? 'UrbanWear Merchant' : 'Guest Merchant');
  const displayEmail = user?.email || (isDevGuest ? 'merchant@urbanwear.dhaka' : 'Not logged in');

  return (
    <>
      <header className="relative z-30 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 flex items-center justify-between shrink-0 transition-colors select-none">
        {/* Left: Channel Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold">Meta Social Connected</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Brand Theme Selector */}
          <ThemeBrandToggle />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full" />
          </button>

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* User Profile / Menu */}
          <div className="relative pl-1 border-l border-[var(--border-subtle)]" ref={menuRef}>
            {user || isDevGuest ? (
              <div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                  aria-expanded={isMenuOpen}
                >
                  <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {getInitials()}
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 text-[var(--text-secondary)] transition-transform duration-200',
                      isMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* User Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg shadow-black/10 dark:shadow-black/50 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 border-b border-[var(--border-subtle)] mb-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">
                        {displayEmail}
                      </p>
                      {isDevGuest && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ShieldCheck className="w-2.5 h-2.5" /> Demo Guest
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <button
                        onClick={handleOpenProfile}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Edit Profile</span>
                      </button>

                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-secondary)]">
                        <Store className="w-3.5 h-3.5" />
                        <span>{stores.length} Workspace{stores.length === 1 ? '' : 's'}</span>
                      </div>

                      <div className="pt-1 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-white hover:brightness-110 shadow-2xs transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs">
                  {getInitials()}
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Merchant Profile
                </h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'merchant@urbanwear.dhaka'}
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-secondary)] opacity-70 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
              </div>

              {profileSuccessMessage && (
                <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || !nameInput.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--brand-primary)] text-white rounded-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
