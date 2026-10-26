import { z } from 'zod';

export const ExtractedProductItemSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.preprocess((val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
    if (typeof val === 'string') {
      const match = val.match(/[0-9]+(?:\.[0-9]+)?/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  }, z.number().nonnegative().default(0)),
  currency: z.string().default('BDT'),
  category: z.string().default('General'),
  stock: z.preprocess((val) => {
    if (typeof val === 'number') return isNaN(val) ? 10 : Math.floor(val);
    if (typeof val === 'string') {
      if (val.toLowerCase().includes('out of stock')) return 0;
      const match = val.match(/[0-9]+/);
      return match ? parseInt(match[0], 10) : 10;
    }
    return 10;
  }, z.number().int().default(10)),
  tagline: z.string().nullable().optional(),
  features: z.preprocess((val) => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') return [val];
    return [];
  }, z.array(z.string()).default([])),
  discount: z.string().nullable().optional(),
  suggestedImagePrompt: z.string().optional(),
  image: z.string().url().nullable().optional(),
});

export const ExtractedProductListSchema = z.object({
  products: z.array(ExtractedProductItemSchema),
  confidenceScore: z.number().min(0).max(1).optional(),
  sourceSummary: z.string().optional(),
});

export type ExtractedProductItem = z.infer<typeof ExtractedProductItemSchema>;
export type ExtractedProductList = z.infer<typeof ExtractedProductListSchema>;
