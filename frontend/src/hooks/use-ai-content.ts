'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface GeneratedPostResponse {
  content: {
    id: string;
    storeId: string;
    productId: string | null;
    headline: string;
    caption: string;
    hashtags: string[];
    cta: string | null;
    postType: string;
    tone: string;
    status: string;
    createdAt: string;
  };
  aiOutput: {
    headline: string;
    caption: string;
    cta: string;
    hashtags: string[];
    postType: 'PRODUCT_SHOWCASE' | 'OFFER' | 'ENGAGEMENT' | 'STORY';
    tone: 'NATURAL' | 'WITTY' | 'PROMO' | 'STORYTELLING';
    suggestedPublishTime?: string;
  };
}

export interface GeneratePostInput {
  storeId: string;
  productId?: string;
  tone?: 'NATURAL' | 'WITTY' | 'PROMO' | 'STORYTELLING';
  customPrompt?: string;
  offerDetails?: string;
}

export function useAiContent() {
  const generatePostMutation = useMutation({
    mutationFn: ({ storeId, ...body }: GeneratePostInput) =>
      apiClient<GeneratedPostResponse>(`/stores/${storeId}/ai/generate-post`, {
        method: 'POST',
        storeId,
        body: JSON.stringify(body),
      }),
  });

  return {
    generatePost: generatePostMutation.mutateAsync,
    isGenerating: generatePostMutation.isPending,
    error: generatePostMutation.error,
  };
}
