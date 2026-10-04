'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  BarChart3,
  Settings,
  Layers,
  Store,
  ChevronDown,
  Bell,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Tag,
  BookOpen,
  Loader2,
  Check,
  Send,
  Search,
  Plus,
  ArrowLeft,
  Clock,
  Command,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeBrandToggle } from '@/components/theme-brand-toggle';
import { useBrandTheme } from '@/components/theme-brand-provider';
import { cn } from '@/lib/utils';
import {
  MOCK_PRODUCTS,
  MOCK_POST_VARIATIONS,
  Product,
  SocialPostState,
} from '@/lib/mock-data';

export default function DemoPage() {
  const [activeNav, setActiveNav] = React.useState('feed');
  const [selectedProduct, setSelectedProduct] = React.useState<Product>(MOCK_PRODUCTS[0]);
  const [currentTone, setCurrentTone] = React.useState<'natural' | 'witty' | 'promo' | 'storytelling'>('natural');
  const [loadingTone, setLoadingTone] = React.useState<'witty' | 'promo' | 'storytelling' | null>(null);
  const [postStatus, setPostStatus] = React.useState<'READY' | 'SCHEDULED' | 'PUBLISHED'>('READY');
  const [isPublished, setIsPublished] = React.useState(false);
  const [likes, setLikes] = React.useState(2480);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { config } = useBrandTheme();

  const postVariation =
    MOCK_POST_VARIATIONS[selectedProduct.id]?.[currentTone] ||
    MOCK_POST_VARIATIONS['prod-1'].natural;

  const currentPost: SocialPostState = {
    id: `post-${selectedProduct.id}-${currentTone}`,
    productId: selectedProduct.id,
    headline: selectedProduct.name,
    caption: postVariation.caption,
    hashtags: postVariation.hashtags,
    cta: postVariation.cta,
    postType: currentTone === 'promo' ? 'OFFER' : 'PRODUCT_SHOWCASE',
    status: postStatus,
    platform: 'META_FACEBOOK',
    likesCount: likes,
    commentsCount: 142,
    sharesCount: 56,
    image: selectedProduct.image,
    tone: currentTone,
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentTone('natural');
    setPostStatus('READY');
    setIsPublished(false);
  };

  const handleToneChange = (tone: 'witty' | 'promo' | 'storytelling') => {
    if (loadingTone) return;
    setLoadingTone(tone);
    const nextTone = currentTone === tone ? 'natural' : tone;
    setTimeout(() => {
      setCurrentTone(nextTone);
      setLoadingTone(null);
    }, 600);
  };

  const handleSchedule = () => {
    setPostStatus('SCHEDULED');
  };

  const handlePublish = () => {
    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.15, x: 0.72 },
      colors: [config.primaryColor, '#1877F2', '#00A884', '#FA582C'],
    });
    setPostStatus('PUBLISHED');
    setIsPublished(true);
  };

  const filteredProducts = MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'feed', label: 'Feed Studio', icon: Sparkles, badge: 'Live' },
    { id: 'stories', label: 'Stories & Reels', icon: Layers },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: '3' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const toneActions = [
    { id: 'witty' as const, label: 'Make Witty', loadingLabel: 'Refining...', icon: Sparkles },
    { id: 'promo' as const, label: 'Add 20% Promo', loadingLabel: 'Applying...', icon: Tag },
    { id: 'storytelling' as const, label: 'Storytelling', loadingLabel: 'Drafting...', icon: BookOpen },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] antialiased font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR (Minimalist & Compact, Reduced Radii) */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col justify-between p-3 shrink-0 select-none z-20 transition-colors">
        <div className="space-y-3.5">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                <Command className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
                  PostMind
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          {/* Store Selector */}
          <div className="px-1">
            <button className="w-full flex items-center justify-between p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors text-left group cursor-pointer shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
                  <Store className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    UrbanWear Dhaka
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                    <span>Store ID: uw-80</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-transform shrink-0" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-0.5 px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left',
                    isActive
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-semibold dark:bg-[var(--brand-primary)]/15 dark:text-[var(--brand-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5',
                        isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded font-mono font-normal',
                        isActive
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Store Plan Quota */}
        <div className="p-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[var(--text-secondary)]">Monthly Quota</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">14 / 50</span>
          </div>
          <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--brand-primary)] rounded-full w-[28%]" />
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="relative z-30 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 flex items-center justify-between shrink-0 transition-colors">
          {/* Left: Meta Connection Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span className="font-semibold">Meta Social Connected</span>
              <span className="text-[var(--text-secondary)]/40">|</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono">Page ID: 104829381</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Link to switch back to original */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-md hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Full App</span>
            </Link>

            {/* Brand Theme Selector (Facebook / Instagram / WhatsApp) */}
            <ThemeBrandToggle />

            <div className="h-4 w-px bg-[var(--border-subtle)]" />

            <button
              className="p-1.5 rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            <ThemeToggle />

            <div className="w-7 h-7 rounded-md bg-[var(--brand-primary)] text-white font-semibold text-xs flex items-center justify-center shrink-0">
              UW
            </div>
          </div>
        </header>

        {/* Body Split: Feed Studio + Product Rail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Feed Studio */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            {/* Top Feed Studio Subheader: Insight strip on Left, Place 1 Actions on Right */}
            <div className="w-full px-6 py-2.5 shrink-0 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/40 backdrop-blur-sm">
              {/* Left: AI Insight Strip */}
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs shadow-2xs min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                <span className="text-[var(--text-secondary)] shrink-0">Recommendation:</span>
                <span className="font-medium text-[var(--text-primary)] truncate">
                  Weekend buyer traffic peak
                </span>
                <span className="text-[var(--text-secondary)]/40 shrink-0">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
                  <Clock className="w-3 h-3" /> 8:00 PM
                </span>
              </div>

              {/* Place 1: Schedule & Save Precision Buttons */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {/* Schedule Button */}
                <button
                  onClick={handleSchedule}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border shadow-2xs',
                    postStatus === 'SCHEDULED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                  )}
                >
                  {postStatus === 'SCHEDULED' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Scheduled (8:00 PM)</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      <span>Schedule</span>
                    </>
                  )}
                </button>

                {/* Save / Publish Button */}
                <button
                  onClick={handlePublish}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95',
                    isPublished
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      : 'bg-[var(--brand-primary)] text-white hover:brightness-110'
                  )}
                >
                  {isPublished ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Center Canvas */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center">
              {/* Realistic Meta Post Card */}
              <div className="w-full max-w-lg mx-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden mb-28">
                {/* Social Card Header */}
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-hover)]/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)] text-white flex items-center justify-center text-xs font-bold">
                      UW
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">
                          UrbanWear Dhaka
                        </span>
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--brand-primary)] fill-[var(--brand-primary)]/20" />
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        Facebook • AI Generated
                      </div>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] bg-[var(--bg-card)]">
                    {postStatus === 'SCHEDULED'
                      ? 'Scheduled'
                      : postStatus === 'PUBLISHED'
                      ? 'Published'
                      : 'Draft'}
                  </span>
                </div>

                {/* Media Image */}
                <div className="relative aspect-square sm:aspect-4/3 w-full bg-slate-950 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  {/* Minimalist Product Tag Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-sm">
                    <ShoppingBag className="w-3 h-3 text-zinc-300" />
                    <span>{selectedProduct.name}</span>
                    <span className="font-bold text-white">{selectedProduct.price}</span>
                    {selectedProduct.discount && (
                      <span className="px-1 py-0.2 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 border border-zinc-700">
                        {selectedProduct.discount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Engagement Bar & Caption */}
                <div className="p-4 space-y-3">
                  {/* Social Actions */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setIsLiked(!isLiked);
                          setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
                        }}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors cursor-pointer',
                          isLiked ? 'text-rose-500' : 'hover:text-[var(--text-primary)]'
                        )}
                      >
                        <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
                        <span className="font-mono text-xs">{likes.toLocaleString()}</span>
                      </button>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{currentPost.commentsCount}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{currentPost.sharesCount}</span>
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-[var(--text-secondary)]">Meta Graph API</span>
                  </div>

                  {/* Caption */}
                  <div className="text-xs text-[var(--text-primary)] leading-relaxed">
                    <p className={cn('whitespace-pre-line', !isExpanded && 'line-clamp-3')}>
                      <span className="font-semibold text-[var(--text-primary)] mr-1.5">
                        UrbanWear Dhaka
                      </span>
                      {currentPost.caption}
                    </p>
                    {currentPost.caption.length > 120 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline mt-1 cursor-pointer"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {currentPost.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono text-[var(--brand-primary)] hover:underline cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Preview */}
                  <div className="pt-1.5">
                    <div className="w-full py-2 px-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 text-center text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-1.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                      <span>{currentPost.cta}</span>
                      <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* ------------------------------------------------------------- */}
            {/* 3. FLOATING TONE MODIFICATION TOOLBAR WITH PROGRESSIVE BLUR */}
            {/* ------------------------------------------------------------- */}
            {/* Progressive Blur Layer */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 select-none overflow-hidden z-20"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[6px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 50%)',
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[14px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 40%, black 75%)',
                }}
              />
              <div
                className="absolute inset-0 backdrop-blur-[24px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 65%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 65%, black 100%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-main)]/30 to-[var(--bg-main)]/95" />
            </div>

            {/* Floating Toolbar (Equal Width, Reduced Radius, Refined Brand Theme) */}
            <div className="absolute bottom-5 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
              <nav
                className="pointer-events-auto max-w-md w-full p-1.5 rounded-lg bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] shadow-lg shadow-black/5 dark:shadow-black/60 transition-all"
                aria-label="Tone modifiers"
              >
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {toneActions.map((btn) => {
                    const Icon = btn.icon;
                    const isLoading = loadingTone === btn.id;
                    const isOtherLoading = loadingTone !== null && !isLoading;
                    const isActive = currentTone === btn.id;

                    return (
                      <button
                        key={btn.id}
                        onClick={() => handleToneChange(btn.id)}
                        disabled={loadingTone !== null}
                        className={cn(
                          'w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer truncate',
                          isActive
                            ? 'bg-[var(--brand-primary)] text-white font-semibold shadow-2xs'
                            : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                          isOtherLoading && 'opacity-30 cursor-not-allowed pointer-events-none',
                          isLoading &&
                            'opacity-90 cursor-wait bg-[var(--brand-primary)] text-white'
                        )}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                            <span className="truncate">{btn.loadingLabel}</span>
                          </>
                        ) : (
                          <>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{btn.label}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 4. STORE PRODUCTS QUICK RAIL (Clean, Compact, Minimalist) */}
          {/* ------------------------------------------------------------- */}
          <aside className="w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 flex flex-col shrink-0 z-10 select-none transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border-subtle)] px-0.5">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <h2 className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
                  Store Products
                </h2>
              </div>
              <button className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline cursor-pointer">
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2.5">
              <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
            </div>

            {/* Product List */}
            <div className="space-y-2 overflow-y-auto pr-0.5 flex-1">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct.id === product.id;
                return (
                  <div
                    key={product.id}
                    className={cn(
                      'p-2.5 rounded-lg border transition-colors bg-[var(--bg-card)] group',
                      isSelected
                        ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-2xs'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-active)]'
                    )}
                  >
                    <div className="flex gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-13 h-13 rounded-md object-cover shrink-0 border border-[var(--border-subtle)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                            {product.category}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {product.price}
                          </span>
                        </div>
                        <h3 className="font-semibold text-xs text-[var(--text-primary)] truncate mt-0.5">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                          {product.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Action Trigger */}
                    <button
                      onClick={() => handleSelectProduct(product)}
                      className={cn(
                        'w-full mt-2 py-1 px-2.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border',
                        isSelected
                          ? 'bg-[var(--brand-primary)] text-white border-transparent font-semibold shadow-2xs'
                          : 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)]'
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isSelected ? 'Active in Studio' : 'Select Product'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
