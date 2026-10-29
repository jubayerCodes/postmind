import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeneratePostDto, ContentToneEnum } from './dto/generate-post.dto';
import { RegeneratePostDto } from './dto/regenerate-post.dto';
import {
  SocialPostOutput,
  SocialPostOutputSchema,
} from './schemas/social-post-output.schema';
import { Content, ContentStatus, ContentTone, PostType } from '@prisma/client';

export interface PostGenerationProductContext {
  id?: string;
  name: string;
  price?: number;
  category?: string;
  tagline?: string | null;
  features?: string[];
  discount?: string | null;
}

export interface PostGenerationContext {
  storeName: string;
  currency: string;
  products?: PostGenerationProductContext[];
  productName?: string;
  productPrice?: number;
  productCategory?: string;
  productTagline?: string | null;
  productFeatures: string[];
  productDiscount?: string | null;
  tone: ContentToneEnum;
  language?: string;
  customPrompt?: string;
  offerDetails?: string;
  sourceHeadline?: string;
  sourceCaption?: string;
}

const contentInclude = {
  product: {
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      currency: true,
      category: true,
      tagline: true,
      features: true,
      discount: true,
    },
  },
  attachedProducts: {
    orderBy: { order: 'asc' as const },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          currency: true,
          category: true,
          tagline: true,
          features: true,
          discount: true,
        },
      },
    },
  },
};

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generatePost(
    storeId: string,
    dto: GeneratePostDto,
  ): Promise<{ content: Content; aiOutput: SocialPostOutput }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const rawIds = dto.productIds ?? (dto.productId ? [dto.productId] : []);
    const productIds = Array.from(new Set(rawIds.filter(Boolean)));

    const products = productIds.length > 0
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds }, storeId, isArchived: false },
        })
      : [];

    const primaryProduct = products[0] || null;
    const tone = dto.tone || ContentToneEnum.NATURAL;
    const language = dto.language || 'en';

    const productContexts: PostGenerationProductContext[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price ? Number(p.price) : undefined,
      category: p.category,
      tagline: p.tagline,
      features: p.features || [],
      discount: p.discount,
    }));

    // Generate output (via LLM if key present, or via contextual generator)
    const rawOutput = await this.executeGeneration({
      storeName: store.name,
      currency: store.currency,
      products: productContexts,
      productName: primaryProduct?.name,
      productPrice: primaryProduct?.price ? Number(primaryProduct.price) : undefined,
      productCategory: primaryProduct?.category,
      productTagline: primaryProduct?.tagline || undefined,
      productFeatures: primaryProduct?.features || [],
      productDiscount: primaryProduct?.discount,
      tone,
      language,
      customPrompt: dto.customPrompt,
      offerDetails: dto.offerDetails,
      sourceHeadline: dto.sourceHeadline,
      sourceCaption: dto.sourceCaption,
    });

    // Enforce strict Zod schema validation
    const validatedOutput = SocialPostOutputSchema.parse(rawOutput);

    // Persist generated post and attached products to Neon DB
    const content = await this.prisma.$transaction(async (tx) => {
      const newPost = await tx.content.create({
        data: {
          storeId,
          productId: primaryProduct?.id || null,
          headline: validatedOutput.headline,
          caption: validatedOutput.caption,
          hashtags: validatedOutput.hashtags,
          cta: validatedOutput.cta,
          postType: validatedOutput.postType as PostType,
          tone: validatedOutput.tone as ContentTone,
          language,
          status: ContentStatus.READY,
        },
      });

      if (products.length > 0) {
        await tx.contentProduct.createMany({
          data: products.map((p, idx) => ({
            contentId: newPost.id,
            productId: p.id,
            order: idx,
          })),
        });
      }

      return tx.content.findUniqueOrThrow({
        where: { id: newPost.id },
        include: contentInclude,
      });
    });

    return { content, aiOutput: validatedOutput };
  }

  /**
   * Regenerate an AI post preserving the original post type and product context
   */
  async regeneratePost(
    storeId: string,
    contentId: string,
    dto?: RegeneratePostDto,
  ): Promise<{ content: Content; aiOutput: SocialPostOutput }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const existingContent = await this.prisma.content.findFirst({
      where: { id: contentId, storeId },
      include: contentInclude,
    });

    if (!existingContent) {
      throw new NotFoundException(
        `Content with ID '${contentId}' not found in this store`,
      );
    }

    if (existingContent.status === ContentStatus.PUBLISHED) {
      throw new BadRequestException(
        'This post has already been published to Facebook and cannot be regenerated or overwritten.',
      );
    }

    if (existingContent.status === ContentStatus.APPROVED) {
      throw new BadRequestException(
        'This post is already approved and locked. Revert to draft if you wish to regenerate.',
      );
    }

    const attached = existingContent.attachedProducts.map((ap) => ap.product);
    const products = attached.length > 0
      ? attached
      : (existingContent.product ? [existingContent.product] : []);

    const primaryProduct = products[0] || null;
    const tone =
      dto?.tone ||
      (existingContent.tone.toLowerCase() as ContentToneEnum) ||
      ContentToneEnum.NATURAL;
    const language = dto?.language || existingContent.language || 'en';

    const productContexts: PostGenerationProductContext[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price ? Number(p.price) : undefined,
      category: p.category,
      tagline: p.tagline,
      features: p.features || [],
      discount: p.discount,
    }));

    // Execute generation with preserved product context & requested tone
    const rawOutput = await this.executeGeneration({
      storeName: store.name,
      currency: store.currency,
      products: productContexts,
      productName: primaryProduct?.name,
      productPrice: primaryProduct?.price ? Number(primaryProduct.price) : undefined,
      productCategory: primaryProduct?.category,
      productTagline: primaryProduct?.tagline || undefined,
      productFeatures: primaryProduct?.features || [],
      productDiscount: primaryProduct?.discount,
      tone,
      language,
      customPrompt: dto?.customPrompt,
      offerDetails: dto?.offerDetails,
      sourceHeadline: dto?.sourceHeadline || existingContent.headline,
      sourceCaption: dto?.sourceCaption || existingContent.caption,
    });

    // Enforce strict Zod schema validation
    const validatedOutput = SocialPostOutputSchema.parse(rawOutput);

    // CRITICAL CONSTRAINT: Preserve original postType and format
    const preservedPostType = existingContent.postType;

    // Update existing content record without losing identifiers or relations
    const updatedContent = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        headline: validatedOutput.headline,
        caption: validatedOutput.caption,
        hashtags: validatedOutput.hashtags,
        cta: validatedOutput.cta,
        postType: preservedPostType,
        tone: validatedOutput.tone as ContentTone,
        language,
        status: ContentStatus.READY,
      },
      include: contentInclude,
    });

    return {
      content: updatedContent,
      aiOutput: {
        ...validatedOutput,
        postType: preservedPostType,
      },
    };
  }

  private async executeGeneration(
    context: PostGenerationContext,
  ): Promise<SocialPostOutput> {
    // 1. Prioritize Google Gemini API
    const geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');

    if (geminiKey) {
      try {
        return await this.callGemini(geminiKey, context);
      } catch (err) {
        this.logger.warn(
          `Gemini AI call failed, trying secondary providers: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 2. Fallback to AgentRouter API
    const agentRouterKey = this.configService.get<string>('AI_API_KEY');
    if (agentRouterKey) {
      try {
        return await this.callAgentRouter(agentRouterKey, context);
      } catch (err) {
        this.logger.warn(
          `AgentRouter AI call failed, falling back to contextual generator: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 3. Deterministic Category-Aware Generator (Offline / Fallback)
    return this.generateContextualPost(context);
  }

  private async callGemini(
    apiKey: string,
    context: PostGenerationContext,
  ): Promise<SocialPostOutput> {
    const models = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: combinedPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          this.logger.warn(`Gemini (${model}) returned HTTP ${response.status}: ${errText}`);
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const textPart = candidate?.content?.parts?.find((p: any) => p.text)?.text;

        if (!textPart || typeof textPart !== 'string') {
          continue;
        }

        const cleanedJson = textPart
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedJson);
        return SocialPostOutputSchema.parse(parsed);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Gemini (${model}) generation error: ${lastError.message}`);
      }
    }

    throw lastError || new Error('All Gemini model endpoints failed');
  }

  private async callAgentRouter(
    apiKey: string,
    context: PostGenerationContext,
  ): Promise<SocialPostOutput> {
    const baseUrl = (
      this.configService.get<string>('AI_BASE_URL') ||
      'https://agentrouter.org/v1'
    ).replace(/\/+$/, '');
    const model =
      this.configService.get<string>('AI_MODEL') || 'glm-5.3';

    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `AgentRouter API error (${response.status} ${response.statusText}): ${errorText}`,
      );
    }

    const data = await response.json();
    const contentText = data.choices?.[0]?.message?.content;
    if (!contentText || typeof contentText !== 'string') {
      throw new Error('AI provider returned an empty content response');
    }

    const cleanedJson = contentText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);
    return SocialPostOutputSchema.parse(parsed);
  }

  private buildSystemPrompt(context: PostGenerationContext): string {
    const isBangla = context.language === 'bn';
    const cleanStoreTag = context.storeName.replace(/\s+/g, '');
    const hasMultiple = (context.products && context.products.length > 1);
    const hasSingle = Boolean(context.productName);

    if (isBangla) {
      return `You are PostMind's Lead Social Media Copywriter and E-commerce Brand Strategist for the Bangladeshi merchant "${context.storeName}".
Generate an engaging, high-converting social media post tailored for Facebook and Instagram.

CRITICAL TRANSCREATION & COPYWRITING INSTRUCTION (বাংলা ভাবানুবাদ ও দেশীয় আবেগময় মার্কেটিং কপিরাইটিং):
1. ABSOLUTELY NEVER do a direct, literal, or word-for-word translation from English!
2. Write natively in natural, vibrant Bangladeshi Bengali (বাংলা) as used by top-performing Facebook merchant pages and popular F-commerce brands.
3. CONTEXT:
${hasMultiple ? `   - Highlighting a curated collection/bundle of ${context.products?.length} products.` : hasSingle ? `   - Single Product Spotlight: "${context.productName}"` : `   - Brand Campaign / General Engagement for store "${context.storeName}"`}
4. TONE ADAPTATION (${context.tone}):
   - WITTY: Clever, fun, punchy humor, relatable youth culture and banter.
   - PROMO: Authentic urgency, exciting deal/discount, value for money, Cash on Delivery.
   - STORYTELLING: Passion, craft, lifestyle journey, emotional connect.
   - NATURAL: Warm, conversational, friendly recommendation from a trusted friend.
5. BANGLADESH F-COMMERCE BEST PRACTICES:
   - Headline: Catchy Bengali headline with relevant emojis.
   - Caption: Engaging, persuasive copy highlighting strengths. Mention Cash on Delivery across Bangladesh (সারাদেশে ক্যাশ অন ডেলিভারি, পার্সেল চেক করে পেমেন্ট করার সুবিধা) naturally.
   - CTA: Actionable Bengali call-to-action (e.g. "অর্ডার করতে এখনই ইনবক্স করুন 🛒💬").
   - Hashtags: 4-6 authentic, popular hashtags in Bengali & English (e.g. #${cleanStoreTag}, #অনলাইনশপিং, #বাংলাদেশ).
${
  context.sourceCaption
    ? `
PREVIOUS DRAFT CONTENT TO TRANSCREATE (ভাবানুবাদ করুন):
Previous Headline: "${context.sourceHeadline || ''}"
Previous Caption: "${context.sourceCaption || ''}"
-> DO NOT translate word-for-word! TRANSCREATE the essence, excitement, and purpose into natural Bengali.`
    : ''
}

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "headline": string,
  "caption": string,
  "cta": string,
  "hashtags": string[],
  "postType": "${hasMultiple ? 'PRODUCT_SHOWCASE' : hasSingle ? 'PRODUCT_SHOWCASE' : 'ENGAGEMENT'}",
  "tone": "${context.tone}",
  "suggestedPublishTime": "8:30 PM"
}`;
    }

    return `You are PostMind's Lead Social Media Copywriter for online merchant "${context.storeName}".
Generate an engaging, high-converting social media post tailored for Facebook and Instagram in fluent, modern English.
${hasMultiple ? `Highlighting a curated collection of ${context.products?.length} products.` : hasSingle ? `Featuring product: "${context.productName}".` : `Brand campaign / store update for "${context.storeName}".`}
${
  context.sourceCaption
    ? `
SOURCE CONTENT TO REWRITE:
Previous Headline: "${context.sourceHeadline || ''}"
Previous Caption: "${context.sourceCaption || ''}"
-> Rewrite this post maintaining its message, tone, and excitement.`
    : ''
}

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "headline": string,
  "caption": string,
  "cta": string,
  "hashtags": string[],
  "postType": "${hasMultiple ? 'PRODUCT_SHOWCASE' : hasSingle ? 'PRODUCT_SHOWCASE' : 'ENGAGEMENT'}",
  "tone": "${context.tone}",
  "suggestedPublishTime": "8:00 PM"
}`;
  }

  private buildUserPrompt(context: PostGenerationContext): string {
    if (context.products && context.products.length > 1) {
      const itemsDesc = context.products
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} (${p.category || 'General'}) - ${p.price ? `${context.currency} ${p.price}` : 'Price on request'} ${p.discount ? `[${p.discount}]` : ''}`,
        )
        .join('\n');
      return `Products Collection (${context.products.length} items):\n${itemsDesc}\n\nDesired Tone: ${context.tone}\n${context.offerDetails ? `Offer Details: ${context.offerDetails}\n` : ''}${context.customPrompt ? `Special Note/Theme: ${context.customPrompt}\n` : ''}`;
    }

    if (context.productName) {
      return `Product: ${context.productName}
Price: ${context.productPrice ? `${context.currency} ${context.productPrice}` : 'N/A'}
Tagline: ${context.productTagline || 'N/A'}
Category: ${context.productCategory || 'General'}
Features: ${context.productFeatures?.join(', ') || 'N/A'}
Discount: ${context.productDiscount || context.offerDetails || 'N/A'}
Desired Tone: ${context.tone}
${context.customPrompt ? `Special Merchant Note: ${context.customPrompt}` : ''}`;
    }

    return `Store Brand Announcement / Social Post for: "${context.storeName}"
Desired Tone: ${context.tone}
${context.offerDetails ? `Offer / Campaign Details: ${context.offerDetails}\n` : ''}
${context.customPrompt ? `Merchant Note / Instructions: ${context.customPrompt}` : 'Create an engaging social media post to connect with customers, build trust, and drive engagement.'}`;
  }

  private detectCategory(
    category = '',
    name = '',
  ): 'gaming' | 'fashion' | 'footwear' | 'accessories' | 'tech' | 'general' {
    const text = `${category} ${name}`.toLowerCase();
    if (text.match(/gaming|game|gamepad|controller|joystick|console|esports|playstation|xbox/)) {
      return 'gaming';
    }
    if (text.match(/shoe|runner|sneaker|footwear|sandal|boot|heel|loafer/)) {
      return 'footwear';
    }
    if (text.match(/watch|chronograph|jewelry|necklace|bracelet|wallet|belt|accessories/)) {
      return 'accessories';
    }
    if (text.match(/apparel|fashion|panjabi|shirt|t-shirt|jacket|denim|hoodie|pant|kurti|saree|dress|clothing|wear/)) {
      return 'fashion';
    }
    if (text.match(/tech|gadget|phone|headphone|earphone|audio|speaker|charger|powerbank|laptop|keyboard|mouse/)) {
      return 'tech';
    }
    return 'general';
  }

  private generateContextualPost(
    context: PostGenerationContext,
  ): SocialPostOutput {
    const isBangla = context.language === 'bn';
    const cleanStoreTag = context.storeName.replace(/\s+/g, '');

    // Case 1: Multiple products attached (Collection / Bundle)
    if (context.products && context.products.length > 1) {
      const names = context.products.map((p) => p.name).join(', ');
      const minPrice = Math.min(...context.products.map((p) => p.price || 0).filter(Boolean));
      const priceStr = minPrice > 0 ? `${context.currency === 'BDT' ? '৳' : '$'}${minPrice.toLocaleString()}` : '';

      if (isBangla) {
        return {
          headline: `সেরা কালেকশনের দারুণ সমাহার ${context.storeName}-এ! ✨🛍️`,
          caption: `আপনার পছন্দের সেরা আইটেমগুলো নিয়ে এলাম এক সাথে! কালেকশনে রয়েছে ${names}।${priceStr ? ` শুরু মাত্র ${priceStr} থেকে!` : ''} প্রতিটি প্রোডাক্টে নিশ্চিত করছি প্রিমিয়াম কোয়ালিটি ও সেরা ফিনিশিং। সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা!`,
          cta: `পুরো কালেকশন দেখতে এখনই ইনবক্স করুন 🛒💬`,
          hashtags: [`#${cleanStoreTag}`, '#কালেকশন', '#অনলাইনশপিং', '#সেরাডিল', '#বাংলাদেশ'],
          postType: 'PRODUCT_SHOWCASE',
          tone: context.tone as ContentTone,
          suggestedPublishTime: '8:30 PM',
        };
      }

      return {
        headline: `Curated Picks: Discover What's New at ${context.storeName} ✨`,
        caption: `Elevate your lifestyle with our exclusive showcase featuring ${names}! Handpicked for quality and comfort.${priceStr ? ` Starting from ${priceStr}.` : ''} Fast nationwide delivery right to your door.`,
        cta: `Explore the collection — Send us a message today! 🛍️`,
        hashtags: [`#${cleanStoreTag}`, '#NewArrivals', '#ShopOnline', '#CuratedCollection'],
        postType: 'PRODUCT_SHOWCASE',
        tone: context.tone as ContentTone,
        suggestedPublishTime: '8:00 PM',
      };
    }

    // Case 2: Zero products attached (Brand / Announcement / Store post)
    if (!context.productName) {
      if (isBangla) {
        switch (context.tone) {
          case ContentToneEnum.PROMO:
            return {
              headline: `🚨 বিশেষ অফার চলছে ${context.storeName}-এ! 🎁🔥`,
              caption: `আমাদের সম্পূর্ণ স্টোরে উপভোগ করুন আকর্ষণীয় সব ডিল ও স্পেশাল ছাড়! বিশ্বস্ত সার্ভিস, প্রিমিয়াম কোয়ালিটি আর সারাদেশে ক্যাশ অন ডেলিভারির সুবিধা। স্টক শেষ হওয়ার আগেই লুফে নিন!`,
              cta: `অফার সম্পর্কে জানতে এখনই ইনবক্স করুন 💬`,
              hashtags: [`#${cleanStoreTag}`, '#ধামাকাঅফার', '#অনলাইনশপিং', '#ডিসকাউন্ট', '#বাংলাদেশ'],
              postType: 'OFFER',
              tone: 'PROMO',
              suggestedPublishTime: '7:30 PM',
            };
          case ContentToneEnum.WITTY:
            return {
              headline: `শপিংয়ের আনন্দ যখন দ্বিগুণ! 😉🛍️`,
              caption: `দিনের ক্লান্তি দূর করতে ${context.storeName}-এর দারুণ কালেকশন ঘুরে দেখাই যথেষ্ট! সেরা সব ট্রেন্ডি আইটেম বেছে নিন নিজের স্টাইলে।`,
              cta: `দেরি না করে আজই ইনবক্স করুন 💬`,
              hashtags: [`#${cleanStoreTag}`, '#শপিংমুড', '#ট্রেন্ডি', '#অনলাইনশপিং'],
              postType: 'ENGAGEMENT',
              tone: 'WITTY',
              suggestedPublishTime: '8:30 PM',
            };
          case ContentToneEnum.STORYTELLING:
            return {
              headline: `আপনার আস্থাই আমাদের সবচেয়ে বড় শক্তি 🌟`,
              caption: `প্রতিটি পদক্ষেপে আপনাদের কাছে সর্বোচ্চ মানের পণ্য এবং নির্ভরযোগ্য সেবা পৌঁছে দেওয়াই ${context.storeName}-এর একমাত্র অঙ্গীকার। আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ!`,
              cta: `আমাদের সাথে যুক্ত থাকুন ✨`,
              hashtags: [`#${cleanStoreTag}`, '#আস্থা', '#বিশ্বস্ততা', '#আমাদেরগল্প'],
              postType: 'STORY',
              tone: 'STORYTELLING',
              suggestedPublishTime: '9:00 PM',
            };
          case ContentToneEnum.NATURAL:
          default:
            return {
              headline: `${context.storeName}-এ আপনাকে স্বাগতম! ✨`,
              caption: `সেরা মানের পণ্য আর দ্রুত ডেলিভারি সেবায় আমরা আছি সবসময় আপনার পাশে। সারাদেশে ক্যাশ অন ডেলিভারি সুবিধাসহ নিশ্চিন্তে কেনাকাটা করুন।`,
              cta: `যেকোনো তথ্যের জন্য এখনই ইনবক্স করুন 🛒`,
              hashtags: [`#${cleanStoreTag}`, '#অনলাইনশপিং', '#সেরাসেবা', '#বাংলাদেশ'],
              postType: 'ENGAGEMENT',
              tone: 'NATURAL',
              suggestedPublishTime: '8:00 PM',
            };
        }
      }

      return {
        headline: `Welcome to ${context.storeName}! ✨`,
        caption: `Quality, reliability, and style delivered right to your doorstep. We take pride in bringing you the finest experience every single day. Fast delivery nationwide!`,
        cta: `Send us a message to learn more 💬`,
        hashtags: [`#${cleanStoreTag}`, '#StoreUpdate', '#CustomerFirst', '#ShopLocal'],
        postType: 'ENGAGEMENT',
        tone: context.tone as ContentTone,
        suggestedPublishTime: '8:00 PM',
      };
    }

    // Case 3: Single product spotlight
    const product = context.productName;
    const priceStr = context.productPrice
      ? `${context.currency === 'BDT' ? '৳' : '$'}${context.productPrice.toLocaleString()}`
      : '';
    const tagline = context.productTagline || '';
    const discountStr = context.productDiscount || context.offerDetails || '15% OFF';
    const category = this.detectCategory(context.productCategory, context.productName);

    if (isBangla) {
      if (category === 'gaming') {
        switch (context.tone) {
          case ContentToneEnum.WITTY:
            return {
              headline: `${product} — গেমিংয়ে এবার কোনো কম্প্রোমাইজ নয়! 🎮🔥`,
              caption: `ফিফায় গোল মিস বা অ্যাকশন গেমসে ল্যাগ? জয়স্টিক যদি ভাইবই না দেয়, তবে কিসের গেমিং! 😎 বেছে নিন প্রিমিয়াম ${product}। ${tagline ? `${tagline}। ` : ''}নিখুঁত কন্ট্রোল আর চরম ভাইব্রেশন ফিডব্যাকে প্রতিটা ম্যাচ জিতুন নিজের স্টাইলে। বন্ধুদের হারিয়ে দেওয়ার আসল হাতিয়ার আজই সংগ্রহ করুন!`,
              cta: `লেভেল আপ করতে — এখনই ইনবক্স করুন 🛒`,
              hashtags: [`#${cleanStoreTag}`, '#গেমিংবিডি', '#গেমারলাইফ', '#অনলাইনশপিং', '#পোস্টমাইন্ড'],
              postType: 'ENGAGEMENT',
              tone: 'WITTY',
              suggestedPublishTime: '8:30 PM',
            };
          case ContentToneEnum.PROMO:
            return {
              headline: `🚨 গেমারদের জন্য ধামাকা অফার: ${product}-এ পাচ্ছেন ${discountStr}! 🎮`,
              caption: `সীমিত সময়ের স্পেশাল ডিসকাউন্ট অফার! 🏷️ আপনার ফেভারিট ${product} এখন পাচ্ছেন আকর্ষণীয় ${discountStr} ছাড়ে! ${priceStr ? `মূল্য মাত্র ${priceStr}।` : ''} ${tagline ? `${tagline}। ` : ''}সেরা রেসপন্স ও নিখুঁত গ্রিপ। সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা! স্টক সীমিত, অফার হাতছাড়া করবেন না!`,
              cta: `অফারটি উপভোগ করতে — এখনই ইনবক্স করুন 💬`,
              hashtags: [`#${cleanStoreTag}`, '#ধামাকাঅফার', '#গেমিংডিল', '#ডিসকাউন্ট', '#পোস্টমাইন্ড'],
              postType: 'OFFER',
              tone: 'PROMO',
              suggestedPublishTime: '7:00 PM',
            };
          case ContentToneEnum.STORYTELLING:
            return {
              headline: `প্রতিটি গেমারের জয়ের আসল সঙ্গী: ${product} 🕹️✨`,
              caption: `রাত জেগে বন্ধুদের সাথে রুদ্ধশ্বাস ম্যাচ কিংবা কোনো স্টোরিমোডে হারিয়ে যাওয়া—একজন সত্যিকারের গেমারের কাছে কন্ট্রোলার শুধু একটা গ্যাজেট নয়, আবেগের অংশ। ${product} ডিজাইন করা হয়েছে দীর্ঘ গেমিং সেশনেও সর্বোচ্চ আরাম ও নিখুঁত রেসপন্স নিশ্চিত করতে। ${tagline ? `${tagline}। ` : ''}গেমিংয়ের প্রতিটি মুহূর্ত উপভোগ করুন একদম ভেতর থেকে।`,
              cta: `বিস্তারিত জানতে এখানে ক্লিক করুন`,
              hashtags: [`#${cleanStoreTag}`, '#গেমারলাইফ', '#গেমিংপ্যাশন', '#প্রিমিয়ামকোয়ালিটি', '#বাংলাদেশ'],
              postType: 'STORY',
              tone: 'STORYTELLING',
              suggestedPublishTime: '9:00 PM',
            };
          case ContentToneEnum.NATURAL:
          default:
            return {
              headline: `গেমিং হোক আরও প্রাণবন্ত: ${product} ⚡`,
              caption: `আপনার গেমিং সেটআপকে নতুন মাত্রা দিতে নিয়ে এলাম ${product}। ${tagline ? `${tagline}। ` : ''}${priceStr ? `মূল্য মাত্র ${priceStr}। ` : ''}স্মুথ কন্ট্রোল, দীর্ঘস্থায়ী পারফরম্যান্স আর আরামদায়ক গ্রিপ—সবকিছুই পাবেন একসাথে। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা।`,
              cta: `এখনই শপ করুন — ক্যাশ অন ডেলিভারি সুবিধা 🛒`,
              hashtags: [`#${cleanStoreTag}`, '#গেমিংবিডি', '#নতুনকালেকশন', '#অনলাইনশপিং', '#বাংলাদেশ'],
              postType: 'PRODUCT_SHOWCASE',
              tone: 'NATURAL',
              suggestedPublishTime: '8:00 PM',
            };
        }
      }

      // Default Bangla product showcase
      switch (context.tone) {
        case ContentToneEnum.PROMO:
          return {
            headline: `🚨 বিশেষ ছাড়: ${product} এখন আকর্ষণীয় মূল্যে! ✨`,
            caption: `সীমিত সময়ের স্পেশাল অফার! ${product} সংগ্রহ করুন ${discountStr} ছাড়ে। ${priceStr ? `মূল্য মাত্র ${priceStr}। ` : ''}${tagline ? `${tagline}। ` : ''}সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা!`,
            cta: `অর্ডার করতে এখনই ইনবক্স করুন 🛒`,
            hashtags: [`#${cleanStoreTag}`, '#স্পেশালঅফার', '#ডিসকাউন্ট', '#অনলাইনশপিং'],
            postType: 'OFFER',
            tone: 'PROMO',
            suggestedPublishTime: '7:30 PM',
          };
        case ContentToneEnum.WITTY:
          return {
            headline: `স্টাইলে এবার নতুন চমক: ${product} 😎🔥`,
            caption: `চমৎকার লুক আর ট্রেন্ডি ভাইব—${product} আপনার কালেকশনকে করে তুলবে অনন্য! ${tagline ? `${tagline}। ` : ''}নিজের জন্য বেছে নিন সেরাটি।`,
            cta: `ইনবক্স করুন এখনই 💬`,
            hashtags: [`#${cleanStoreTag}`, '#ট্রেন্ডি', '#স্টাইল', '#অনলাইনশপিং'],
            postType: 'ENGAGEMENT',
            tone: 'WITTY',
            suggestedPublishTime: '8:30 PM',
          };
        case ContentToneEnum.STORYTELLING:
          return {
            headline: `সৌন্দর্য ও আস্থার মেলবন্ধন: ${product} ✨`,
            caption: `প্রতিটি সূক্ষ্ম ডিটেইলে নিখুঁত কারুকাজ। ${product} শুধু কোনো সাধারণ আইটেম নয়, এটি আপনার রুচি ও আভিজাত্যের প্রতিফলন।`,
            cta: `সংগ্রহ করতে যোগাযোগ করুন`,
            hashtags: [`#${cleanStoreTag}`, '#আভিজাত্য', '#প্রিমিয়াম', '#বাংলাদেশ'],
            postType: 'STORY',
            tone: 'STORYTELLING',
            suggestedPublishTime: '9:00 PM',
          };
        case ContentToneEnum.NATURAL:
        default:
          return {
            headline: `আপনার পছন্দের তালিকায় যুক্ত করুন: ${product} ✨`,
            caption: `দৈনন্দিন ব্যবহারে চমৎকার অভিজ্ঞতা নিশ্চিত করতে নিয়ে এলাম ${product}। ${tagline ? `${tagline}। ` : ''}${priceStr ? `মূল্য: ${priceStr}। ` : ''}সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা।`,
            cta: `অর্ডার করতে এখনই ইনবক্স করুন 🛒`,
            hashtags: [`#${cleanStoreTag}`, '#নতুনকালেকশন', '#অনলাইনশপিং', '#বাংলাদেশ'],
            postType: 'PRODUCT_SHOWCASE',
            tone: 'NATURAL',
            suggestedPublishTime: '8:00 PM',
          };
      }
    }

    // Default English product showcase
    return {
      headline: `Spotlight on ${product} ✨`,
      caption: `Elevate your everyday experience with ${product}. ${tagline ? `${tagline}. ` : ''}${priceStr ? `Available now for only ${priceStr}. ` : ''}Nationwide delivery with cash on delivery available!`,
      cta: `Shop now — Send us a direct message 🛒`,
      hashtags: [`#${cleanStoreTag}`, '#FeaturedProduct', '#OnlineShopping', '#ShopNow'],
      postType: 'PRODUCT_SHOWCASE',
      tone: context.tone as ContentTone,
      suggestedPublishTime: '8:00 PM',
    };
  }
}
