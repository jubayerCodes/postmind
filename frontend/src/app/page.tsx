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
import { Sparkles, Calendar, TrendingUp, Zap, Layers } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState('feed');
  const [selectedProduct, setSelectedProduct] = React.useState<Product>(MOCK_PRODUCTS[0]);
  const [currentTone, setCurrentTone] = React.useState<'natural' | 'witty' | 'promo' | 'storytelling'>('natural');
  const [postStatus, setPostStatus] = React.useState<'READY' | 'SCHEDULED' | 'PUBLISHED'>('READY');
  const [isPublished, setIsPublished] = React.useState(false);

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
    setPostStatus('PUBLISHED');
    setIsPublished(true);
  };

  const handleCustomCaption = (newCaption: string) => {
    // Custom inline edit
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Workspace Body: Split into Feed Studio and Product Rail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Feed Studio */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 relative flex flex-col items-center">
            {/* Top AI Insight Banner */}
            <div className="w-full max-w-xl mb-4 p-3 rounded-2xl bg-gradient-to-r from-violet-600/10 via-cyan-500/10 to-transparent border border-violet-500/20 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xs font-bold text-slate-900 dark:text-white">
                    Today&apos;s AI Recommendation
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    High-engagement product selected based on weekend buyer traffic.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                Peak Time: 8:00 PM
              </span>
            </div>

            {/* Social Post Feed Card */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pb-20">
              <SocialPostCard
                post={currentPost}
                product={selectedProduct}
                onEditCaption={handleCustomCaption}
              />
            </div>

            {/* Ergonomic Floating Action Toolbar */}
            <FloatingQuickActions
              currentTone={currentTone}
              onSelectTone={handleSelectTone}
              onSchedule={handleSchedule}
              onPublish={handlePublish}
              isScheduled={postStatus === 'SCHEDULED'}
              isPublished={isPublished}
            />
          </main>

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
