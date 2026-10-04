import { z } from 'zod';

export const SocialPostOutputSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  caption: z.string().min(10, 'Caption must be at least 10 characters'),
  cta: z.string().min(1, 'Call to action is required'),
  hashtags: z.array(z.string()).min(1, 'At least one hashtag is required'),
  postType: z.enum([
    'PRODUCT_SHOWCASE',
    'OFFER',
    'ENGAGEMENT',
    'STORY',
  ]),
  tone: z.enum(['NATURAL', 'WITTY', 'PROMO', 'STORYTELLING']),
  suggestedPublishTime: z.string().optional(),
});

export type SocialPostOutput = z.infer<typeof SocialPostOutputSchema>;
