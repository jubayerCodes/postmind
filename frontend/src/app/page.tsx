'use client';

import * as React from 'react';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { SocialPostCard } from '@/components/social-feed/social-post-card';
import { FloatingQuickActions } from '@/components/social-feed/floating-quick-actions';
import { ProductQuickRail } from '@/components/social-feed/product-quick-rail';
import {
  MOCK_PRODUCTS,
  MOCK_POST_VARIATIONS,
  Product,
  SocialPostState,
} from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Check, Send, Clock, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useBrandTheme } from '@/components/theme-brand-provider';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isDevGuest, isInitialized } = useAuthStore();

  React.useEffect(() => {
    if (isInitialized && !user && !isDevGuest) {
      router.push('/login');
    }
  }, [isInitialized, user, isDevGuest, router]);

  const [activeTab, setActiveTab] = React.useState('feed');
  const [selectedProduct, setSelectedProduct] = React.useState<Product>(MOCK_PRODUCTS[0]);
  const [currentTone, setCurrentTone] = React.useState<'natural' | 'witty' | 'promo' | 'storytelling'>('natural');
  const [postStatus, setPostStatus] = React.useState<'READY' | 'SCHEDULED' | 'PUBLISHED'>('READY');
  const [isPublished, setIsPublished] = React.useState(false);
  const { config } = useBrandTheme();

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  // Generate dynamic post state based on selected product and tone
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
    likesCount: 2480,
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

  const handleSelectTone = (tone: 'natural' | 'witty' | 'promo' | 'storytelling') => {
    setCurrentTone(tone);
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

  const handleCustomCaption = (newCaption: string) => {
    // Custom inline edit
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] antialiased font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Workspace Body: Split into Feed Studio and Product Rail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Feed Studio */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            {/* Studio Top Header Bar: AI Recommendation on Left, Schedule & Save at Place 1 on Right */}
            <div className="w-full px-6 py-2.5 shrink-0 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/40 backdrop-blur-sm">
              {/* Left/Center: Top AI Insight Banner */}
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

              {/* Place 1: Schedule and Save Buttons (Top Right) */}
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

            {/* Scrollable Center Feed */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center">
              {/* Social Post Feed Card */}
              <div className="w-full flex-1 flex flex-col items-center justify-center pb-32">
                <SocialPostCard
                  post={currentPost}
                  product={selectedProduct}
                  onEditCaption={handleCustomCaption}
                />
              </div>
            </main>

            {/* Floating Quick Actions (Modification buttons at bottom of viewport) */}
            <FloatingQuickActions
              currentTone={currentTone}
              onSelectTone={handleSelectTone}
            />
          </div>

          {/* Right Product Quick-Rail */}
          <ProductQuickRail
            products={MOCK_PRODUCTS}
            selectedProductId={selectedProduct.id}
            onSelectProduct={handleSelectProduct}
          />
        </div>
      </div>
    </div>
  );
}
