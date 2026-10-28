import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeneratePostDto, ContentToneEnum } from './dto/generate-post.dto';
import { RegeneratePostDto } from './dto/regenerate-post.dto';
import {
  SocialPostOutput,
  SocialPostOutputSchema,
} from './schemas/social-post-output.schema';
import { Content, ContentStatus, ContentTone, PostType } from '@prisma/client';

export interface PostGenerationContext {
  storeName: string;
  currency: string;
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

    let product = null;
    if (dto.productId) {
      product = await this.prisma.product.findFirst({
        where: { id: dto.productId, storeId, isArchived: false },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID '${dto.productId}' not found in this store`,
        );
      }
    }

    const tone = dto.tone || ContentToneEnum.NATURAL;
    const language = dto.language || 'en';

    // Generate output (via LLM if key present, or via contextual generator)
    const rawOutput = await this.executeGeneration({
      storeName: store.name,
      currency: store.currency,
      productName: product?.name,
      productPrice: product?.price ? Number(product.price) : undefined,
      productCategory: product?.category,
      productTagline: product?.tagline || undefined,
      productFeatures: product?.features || [],
      productDiscount: product?.discount,
      tone,
      language,
      customPrompt: dto.customPrompt,
      offerDetails: dto.offerDetails,
      sourceHeadline: dto.sourceHeadline,
      sourceCaption: dto.sourceCaption,
    });

    // Enforce strict Zod schema validation
    const validatedOutput = SocialPostOutputSchema.parse(rawOutput);

    // Persist generated post to Neon DB
    const content = await this.prisma.content.create({
      data: {
        storeId,
        productId: product?.id || null,
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
      include: { product: true },
    });

    if (!existingContent) {
      throw new NotFoundException(
        `Content with ID '${contentId}' not found in this store`,
      );
    }

    const product = existingContent.product;
    const tone =
      dto?.tone ||
      (existingContent.tone.toLowerCase() as ContentToneEnum) ||
      ContentToneEnum.NATURAL;
    const language = dto?.language || existingContent.language || 'en';

    // Execute generation with preserved product context & requested tone
    const rawOutput = await this.executeGeneration({
      storeName: store.name,
      currency: store.currency,
      productName: product?.name,
      productPrice: product?.price ? Number(product.price) : undefined,
      productCategory: product?.category,
      productTagline: product?.tagline || undefined,
      productFeatures: product?.features || [],
      productDiscount: product?.discount,
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
        postType: preservedPostType, // explicitly preserved original format
        tone: validatedOutput.tone as ContentTone,
        language,
        status: ContentStatus.READY,
      },
      include: {
        product: true,
      },
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
    // 1. Prioritize Google Gemini API (verified high-quality & native Bengali transcreation)
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

    // 2. Secondary fallback: AgentRouter / OpenAI if configured
    const agentRouterKey =
      this.configService.get<string>('AGENTROUTER_API_KEY') ||
      this.configService.get<string>('AI_API_KEY') ||
      this.configService.get<string>('OPENAI_API_KEY');

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
    const category = context.productCategory || 'General';

    if (isBangla) {
      return `You are PostMind's Lead Social Media Copywriter and E-commerce Brand Strategist for the Bangladeshi online merchant "${context.storeName}".
Generate an engaging, high-converting social media post tailored for Facebook and Instagram.

CRITICAL TRANSCREATION & COPYWRITING INSTRUCTION (বাংলা ভাবানুবাদ ও দেশীয় আবেগময় মার্কেটিং কপিরাইটিং):
1. ABSOLUTELY NEVER do a direct, literal, or word-for-word translation from English! Mechanical translations sound robotic, awkward, and completely disconnect from Bangladeshi social media users.
2. EMOTIONAL & CULTURAL RESONANCE (দেশীয় আবেগময় সংযোগ):
   Write natively from the heart in natural, vibrant Bangladeshi Bengali (বাংলা) as used by top-performing Facebook merchant pages and popular F-commerce brands in Bangladesh.
3. PRODUCT CONTEXT & CATEGORY SPECIFICITY:
   - Product: "${context.productName || 'Featured Product'}"
   - Category: "${category}"
   - NEVER use clothing/fashion metaphors (like "ওয়ারড্রোব", "পোশাক", "ড্রেসিং") for gaming, tech, or electronic gear!
   - Gaming Gear: Speak to gaming thrill, FIFA/FPS adrenaline, precision, vibration feedback, beating friends, long gaming sessions without hand fatigue.
   - Fashion/Apparel: Speak to elegance, festive vibes, luxury fabric feel, personal confidence, styling.
   - Footwear/Sneakers: Speak to all-day comfort, agility, style on the move, endurance.
   - Accessories/Watches: Speak to sophistication, timeless luxury, personality, statement piece.
   - Tech/Gadgets: Speak to productivity, smart living, seamless connectivity, durability.
4. TONE ADAPTATION (${context.tone}):
   - WITTY: Clever, fun, punchy humor, relatable youth culture and banter.
   - PROMO: Authentic urgency, exciting deal/discount, value for money, Cash on Delivery.
   - STORYTELLING: Passion, craft, deep appreciation, lifestyle journey, emotional connect.
   - NATURAL: Warm, conversational, friendly recommendation from a trusted friend.
5. BANGLADESH F-COMMERCE BEST PRACTICES:
   - Headline: Catchy Bengali headline with relevant emojis in Bengali script.
   - Caption: Engaging, persuasive copy highlighting product strengths and buyer excitement. Mention Cash on Delivery across Bangladesh (সারাদেশে ক্যাশ অন ডেলিভারি, পার্সেল চেক করে পেমেন্ট করার সুবিধা) naturally.
   - CTA: Actionable Bengali call-to-action (e.g. "অর্ডার করতে এখনই ইনবক্স করুন 🛒💬", "আজই নিজের জন্য সংগ্রহ করুন!").
   - Hashtags: 4-6 authentic, popular hashtags in Bengali & English (e.g. #${cleanStoreTag}, #অনলাইনশপিং, #বাংলাদেশ, #${category.replace(/\s+/g, '')}BD).
${
  context.sourceCaption
    ? `
PREVIOUS DRAFT CONTENT TO TRANSCREATE (ভাবানুবাদ করুন):
Previous Headline: "${context.sourceHeadline || ''}"
Previous Caption: "${context.sourceCaption || ''}"
-> DO NOT translate word-for-word! TRANSCREATE the essence, excitement, and purpose into passionate, natural Bengali tailored for Bangladeshi buyers.`
    : ''
}

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "headline": string,
  "caption": string,
  "cta": string,
  "hashtags": string[],
  "postType": "PRODUCT_SHOWCASE" | "OFFER" | "ENGAGEMENT" | "STORY",
  "tone": "${context.tone}",
  "suggestedPublishTime": "8:30 PM"
}`;
    }

    return `You are PostMind's Lead Social Media Copywriter for online merchant "${context.storeName}".
Generate an engaging, high-converting social media post tailored for Facebook and Instagram in fluent, modern English.
Strictly tailor the tone and metaphors to the product category: "${category}".
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
  "postType": "PRODUCT_SHOWCASE" | "OFFER" | "ENGAGEMENT" | "STORY",
  "tone": "${context.tone}",
  "suggestedPublishTime": "8:00 PM"
}`;
  }

  private buildUserPrompt(context: PostGenerationContext): string {
    return `Product: ${context.productName || 'Featured Collection'}
Price: ${context.productPrice ? `${context.currency} ${context.productPrice}` : 'N/A'}
Tagline: ${context.productTagline || 'N/A'}
Category: ${context.productCategory || 'General'}
Features: ${context.productFeatures?.join(', ') || 'N/A'}
Discount: ${context.productDiscount || context.offerDetails || 'N/A'}
Desired Tone: ${context.tone}
${context.customPrompt ? `Special Merchant Note: ${context.customPrompt}` : ''}`;
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
    const product = context.productName || 'Exclusive Drop';
    const priceStr = context.productPrice
      ? `${context.currency === 'BDT' ? '৳' : '$'}${context.productPrice.toLocaleString()}`
      : '';
    const tagline = context.productTagline || '';
    const discountStr = context.productDiscount || context.offerDetails || '15% OFF';
    const cleanStoreTag = context.storeName.replace(/\s+/g, '');
    const isBangla = context.language === 'bn';
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

      if (category === 'fashion') {
        switch (context.tone) {
          case ContentToneEnum.WITTY:
            return {
              headline: `${product} — স্টাইল যখন ১০০ তে ১০০! ✨`,
              caption: `সবার ভিড়ে নিজেকে আলাদা দেখাতে আর কত ভাববেন? 🔥 বোরিং ডিজাইন ছেড়ে বেছে নিন ট্রেন্ডি ${product}। ${tagline ? `${tagline}। ` : ''}লুক হবে একদম অন-পয়েন্ট আর কনফিডেন্স থাকবে তুঙ্গে! বন্ধুরা জিজ্ঞেস করার আগেই নিজের জন্য সংগ্রহ করুন।`,
              cta: `নিজের লুক আপগ্রেড করুন — এখনই অর্ডার করুন 🛍️`,
              hashtags: [`#${cleanStoreTag}`, '#ফ্যাশনবিডি', '#ট্রেন্ডিংলুক', '#অনলাইনশপিং', '#পোস্টমাইন্ড'],
              postType: 'ENGAGEMENT',
              tone: 'WITTY',
              suggestedPublishTime: '8:30 PM',
            };
          case ContentToneEnum.PROMO:
            return {
              headline: `🚨 ফ্যাশন ড্রপ অফার: ${product}-এ পাচ্ছেন ${discountStr}`,
              caption: `স্পেশাল ফ্যাশন ডিল! 🏷️ আকর্ষণীয় ${discountStr} ছাড়ে আজই পেয়ে যান আপনার পছন্দের ${product}! ${priceStr ? `মূল্য মাত্র ${priceStr}।` : ''} ${tagline ? `${tagline}। ` : ''}প্রিমিয়াম ফেব্রিক ও চমৎকার ফিনিশিং। সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা!`,
              cta: `অফারটি লুফে নিতে — এখনই ইনবক্স করুন`,
              hashtags: [`#${cleanStoreTag}`, '#ধামাকাঅফার', '#ফ্যাশনডিল', '#ডিসকাউন্ট', '#পোস্টমাইন্ড'],
              postType: 'OFFER',
              tone: 'PROMO',
              suggestedPublishTime: '7:00 PM',
            };
          case ContentToneEnum.STORYTELLING:
            return {
              headline: `${product}-এর পেছনের গল্প ও আভিজাত্য`,
              caption: `প্রতিটি অনন্য পোশাকের পেছনে থাকে নিপুণ কারিগরি আর ভালোবাসার ছোঁয়া। ${product} তৈরির সময় আমরা প্রতিটি সুতো ও ফিনিশিংয়ে দিয়েছি সর্বোচ্চ যত্ন। ${tagline ? `${tagline}। ` : ''}এটি কেবল একটি পোশাক নয়, বরং আপনার ব্যক্তিত্ব ও রুচির চমৎকার প্রতিফলন। ✨`,
              cta: `বিস্তারিত জানতে ইনবক্স করুন`,
              hashtags: [`#${cleanStoreTag}`, '#ক্রাফটসম্যানশিপ', '#রুচিশীলপোশাক', '#আভিজাত্য', '#বাংলাদেশ'],
              postType: 'STORY',
              tone: 'STORYTELLING',
              suggestedPublishTime: '9:00 PM',
            };
          case ContentToneEnum.NATURAL:
          default:
            return {
              headline: `নতুন কালেকশন: ${product}`,
              caption: `সবেমাত্র পৌঁছাল আমাদের নতুন ফ্যাশন ড্রপ! ✨ আপনার দৈনন্দিন ও উৎসবের সাজকে আরও আকর্ষণীয় করতে নিয়ে এসেছি ${product}। ${tagline ? `${tagline}। ` : ''}${priceStr ? `মূল্য মাত্র ${priceStr}। ` : ''}সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধাসহ সীমিত স্টক উপলব্ধ।`,
              cta: `এখনই শপ করুন — ক্যাশ অন ডেলিভারি সুবিধা 🛍️`,
              hashtags: [`#${cleanStoreTag}`, '#নতুনকালেকশন', '#অনলাইনশপিং', '#বাংলাদেশ', '#পোস্টমাইন্ড'],
              postType: 'PRODUCT_SHOWCASE',
              tone: 'NATURAL',
              suggestedPublishTime: '8:00 PM',
            };
        }
      }

      // Default / Tech / Footwear / Accessories general fallback in natural Bengali
      switch (context.tone) {
        case ContentToneEnum.WITTY:
          return {
            headline: `${product} — সবসময় এগিয়ে থাকুন ট্রেন্ডে 🔥`,
            caption: `সাধারণ কিছু ব্যবহার করে আর কতদিন? বেছে নিন সুপার ট্রেন্ডি ও প্রিমিয়াম ${product}! ${tagline ? `${tagline}। ` : ''}আপনার প্রয়োজন আর স্টাইল দুটোই মিটবে এক নিমেষে। বন্ধুরা জেনে যাওয়ার আগেই আজই নিজের করে নিন!`,
            cta: `দেরি না করে — এখনই অর্ডার করুন 🛒`,
            hashtags: [`#${cleanStoreTag}`, '#ট্রেন্ডিং', '#অনলাইনশপিং', '#সেরাডিল', '#বাংলাদেশ'],
            postType: 'ENGAGEMENT',
            tone: 'WITTY',
            suggestedPublishTime: '8:30 PM',
          };
        case ContentToneEnum.PROMO:
          return {
            headline: `🚨 মেগা অফার: ${product}-এ পাচ্ছেন ${discountStr}`,
            caption: `স্পেশাল ধামাকা ডিসকাউন্ট! 🏷️ আপনার পছন্দের ${product} এখন পাচ্ছেন লোভনীয় ${discountStr} ছাড়ে! ${priceStr ? `মূল্য মাত্র ${priceStr}।` : ''} ${tagline ? `${tagline}। ` : ''}সেরা কোয়ালিটি ও দীর্ঘস্থায়িত্ব। সারা দেশে ক্যাশ অন ডেলিভারিতে চেক করে নেওয়ার সুবিধা!`,
            cta: `অফারটি উপভোগ করতে — এখনই ইনবক্স করুন 💬`,
            hashtags: [`#${cleanStoreTag}`, '#ধামাকাঅফার', '#ডিসকাউন্ট', '#সেরাডিল', '#সীমিতস্টক'],
            postType: 'OFFER',
            tone: 'PROMO',
            suggestedPublishTime: '7:00 PM',
          };
        case ContentToneEnum.STORYTELLING:
          return {
            headline: `${product}-এর পেছনের নিখুঁত যত্ন ও গল্প ✨`,
            caption: `প্রতিটি অনন্য পণ্যের পেছনে থাকে গভীর নিষ্ঠা আর নিখুঁত কারিগরি। ${product} তৈরি করার প্রতিটি ধাপে আমরা নিশ্চিত করেছি সর্বোচ্চ মান। ${tagline ? `${tagline}। ` : ''}এটি আপনার প্রতিদিনের অভিজ্ঞতায় নিয়ে আসবে চমৎকার পরিবর্তন ও স্বাচ্ছন্দ্য।`,
            cta: `বিস্তারিত জেনে নিন — এখনই মেসেজ দিন`,
            hashtags: [`#${cleanStoreTag}`, '#কোয়ালিটিফার্স্ট', '#আস্থারপ্রতীক', '#বাংলাদেশ', '#পোস্টমাইন্ড'],
            postType: 'STORY',
            tone: 'STORYTELLING',
            suggestedPublishTime: '9:00 PM',
          };
        case ContentToneEnum.NATURAL:
        default:
          return {
            headline: `নতুন ড্রপ: ${product}`,
            caption: `সবেমাত্র হাজির হলো আমাদের ফ্রেশ কালেকশন! ✨ আপনার প্রতিদিনের অভিজ্ঞতা আরও সহজ ও আকর্ষণীয় করতে নিয়ে এসেছি ${product}। ${tagline ? `${tagline}। ` : ''}${priceStr ? `মূল্য মাত্র ${priceStr}। ` : ''}সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধাসহ সীমিত স্টক উপলব্ধ।`,
            cta: `এখনই অর্ডার করুন — ক্যাশ অন ডেলিভারি 🛒`,
            hashtags: [`#${cleanStoreTag}`, '#নতুনকালেকশন', '#অনলাইনশপিং', '#বাংলাদেশ', '#পোস্টমাইন্ড'],
            postType: 'PRODUCT_SHOWCASE',
            tone: 'NATURAL',
            suggestedPublishTime: '8:00 PM',
          };
      }
    }

    // English contextual generator
    if (category === 'gaming') {
      switch (context.tone) {
        case ContentToneEnum.WITTY:
          return {
            headline: `${product} — No More Blaming The Lag! 🎮🔥`,
            caption: `Your gaming setup called: it's begging for an upgrade. 🔥 Stop letting a bad controller cost you the match when the ${product} exists. ${tagline ? `${tagline} ` : ''}Get that precision grip and vibration feedback before your squad leaves you behind!`,
            cta: `Level Up Your Game — Order Today`,
            hashtags: [`#${cleanStoreTag}`, '#GamingSetup', '#GamerLife', '#ProGamer', '#PostMindAI'],
            postType: 'ENGAGEMENT',
            tone: 'WITTY',
            suggestedPublishTime: '8:30 PM',
          };
        case ContentToneEnum.PROMO:
          return {
            headline: `🚨 Gamer Deal: Save ${discountStr} on ${product}`,
            caption: `FLASH GAMING SALE! 🏷️ Grab the ${product} today with an exclusive ${discountStr}! ${priceStr ? `Now only ${priceStr}. ` : ''}${tagline ? `${tagline} ` : ''}Crisp response, zero fatigue, pure performance. Stock is moving fast!`,
            cta: `Claim ${discountStr} — Checkout Now`,
            hashtags: [`#${cleanStoreTag}`, '#GamingSale', '#GamerDeals', '#SaveBig', '#PostMind'],
            postType: 'OFFER',
            tone: 'PROMO',
            suggestedPublishTime: '7:00 PM',
          };
        case ContentToneEnum.STORYTELLING:
          return {
            headline: `Engineered for the Win: Inside ${product}`,
            caption: `Late night matches, clutch moments, and the adrenaline of victory. When we engineered the ${product}, every ergonomic contour and vibration motor was tuned for pure immersion. ${tagline ? `${tagline} ` : ''}Gear up for the next chapter of your gaming journey. ✨`,
            cta: `Explore the Tech`,
            hashtags: [`#${cleanStoreTag}`, '#GamerPassion', '#EngineeringVictory', '#Immersion', '#GamingBD'],
            postType: 'STORY',
            tone: 'STORYTELLING',
            suggestedPublishTime: '9:00 PM',
          };
        case ContentToneEnum.NATURAL:
        default:
          return {
            headline: `Elevate Your Gameplay: ${product}`,
            caption: `Just arrived in stock! 🎮 Take your gaming setup to the next level with the ${product}. ${tagline ? `${tagline} ` : ''}${priceStr ? `Available now for ${priceStr}. ` : ''}Fast nationwide shipping with Cash on Delivery available.`,
            cta: `Shop Now — Fast Delivery`,
            hashtags: [`#${cleanStoreTag}`, '#NewArrival', '#GamingGear', '#OnlineShopping', '#PostMind'],
            postType: 'PRODUCT_SHOWCASE',
            tone: 'NATURAL',
            suggestedPublishTime: '8:00 PM',
          };
      }
    }

    // English Fashion & General fallback
    switch (context.tone) {
      case ContentToneEnum.WITTY:
        return {
          headline: `${product} — Drip Check Approved`,
          caption: `Stop settling for basic when the ${product} exists. 🔥 ${tagline ? `${tagline} ` : ''}Upgrade your everyday rotation and stand out from the crowd before your friends realize they missed out!`,
          cta: `Upgrade Your Style — Order Today`,
          hashtags: [`#${cleanStoreTag}`, '#StyleUpgrade', '#DripCheck', '#FashionDaily', '#PostMindAI'],
          postType: 'ENGAGEMENT',
          tone: 'WITTY',
          suggestedPublishTime: '8:30 PM',
        };
      case ContentToneEnum.PROMO:
        return {
          headline: `🚨 Limited Flash Deal: ${discountStr} on ${product}`,
          caption: `FLASH SALE ALERT! 🏷️ Grab the ${product} today with an exclusive ${discountStr}! ${priceStr ? `Only ${priceStr}. ` : ''}${tagline ? `${tagline} ` : ''}Built to last, priced to steal. Stock is strictly limited!`,
          cta: `Claim ${discountStr} — Checkout Now`,
          hashtags: [`#${cleanStoreTag}`, '#FlashSale', '#DiscountAlert', '#LimitedDrop', '#BestDeals'],
          postType: 'OFFER',
          tone: 'PROMO',
          suggestedPublishTime: '7:00 PM',
        };
      case ContentToneEnum.STORYTELLING:
        return {
          headline: `The Story Behind ${product}`,
          caption: `Every piece has an origin. When we crafted the ${product}, we spent months obsessing over every detail, texture, and contour. ${tagline ? `${tagline} ` : ''}Experience true craftsmanship and elevated quality. ✨`,
          cta: `Discover the Craftsmanship`,
          hashtags: [`#${cleanStoreTag}`, '#BehindTheBrand', '#Craftsmanship', '#DesignedWithPassion', '#QualityFirst'],
          postType: 'STORY',
          tone: 'STORYTELLING',
          suggestedPublishTime: '9:00 PM',
        };
      case ContentToneEnum.NATURAL:
      default:
        return {
          headline: `Introducing ${product}`,
          caption: `Just arrived! ✨ Elevate your everyday with the ${product}. ${tagline ? `${tagline} ` : ''}${priceStr ? `Available now for ${priceStr}. ` : ''}Available in limited quantities with fast nationwide delivery.`,
          cta: `Shop Now — Cash on Delivery Available`,
          hashtags: [`#${cleanStoreTag}`, '#NewArrival', '#OnlineShopping', '#FreshDrop', '#PostMind'],
          postType: 'PRODUCT_SHOWCASE',
          tone: 'NATURAL',
          suggestedPublishTime: '8:00 PM',
        };
    }
  }
}
