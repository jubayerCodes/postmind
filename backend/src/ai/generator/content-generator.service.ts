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
    const apiKey =
      this.configService.get<string>('AGENTROUTER_API_KEY') ||
      this.configService.get<string>('AI_API_KEY') ||
      this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      try {
        return await this.callAgentRouter(apiKey, context);
      } catch (err) {
        this.logger.warn(
          `AI API call failed, falling back to contextual generator: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // High-fidelity deterministic generator when API key is not configured
    return this.generateContextualPost(context);
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

    const isBangla = context.language === 'bn';
    const systemPrompt = `You are PostMind's AI Social Media Strategist for online merchant "${context.storeName}".
Generate an engaging, high-converting social media post tailored for Facebook and Instagram.
${
  isBangla
    ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write the headline, caption, hashtags, and CTA in natural, conversational Bangladeshi Bengali (বাংলা) as used by top-performing Facebook merchant pages in Bangladesh.
- Headline: Catchy Bengali headline in Bengali script.
- Caption: Engaging, persuasive Bengali copy tailored for Bangladeshi customers (mentioning COD/delivery/quality naturally).
- CTA: Clear Bengali call to action (e.g. "অর্ডার করতে এখনই ইনবক্স করুন", "বিস্তারিত জানতে ভিজিট করুন").
- Hashtags: Authentic mix of popular Bengali & English hashtags (e.g. #${context.storeName.replace(/\s+/g, '')}, #অনলাইনশপিং, #বাংলাদেশ, #নতুনকালেকশন).`
    : `Language Requirement: Write in fluent, modern English tailored for e-commerce.`
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

    const userPrompt = `Product: ${context.productName || 'Featured Collection'}
Price: ${context.productPrice ? `${context.currency} ${context.productPrice}` : 'N/A'}
Tagline: ${context.productTagline || 'N/A'}
Category: ${context.productCategory || 'General'}
Features: ${context.productFeatures?.join(', ') || 'N/A'}
Discount: ${context.productDiscount || context.offerDetails || 'N/A'}
Desired Tone: ${context.tone}
${context.customPrompt ? `Special Merchant Note: ${context.customPrompt}` : ''}`;

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

    // Strip optional markdown fencing if returned by the model
    const cleanedJson = contentText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);
    return SocialPostOutputSchema.parse(parsed);
  }

  private generateContextualPost(
    context: PostGenerationContext,
  ): SocialPostOutput {
    const product = context.productName || 'Exclusive Drop';
    const priceStr = context.productPrice
      ? `${context.currency === 'BDT' ? '৳' : '$'}${context.productPrice.toLocaleString()}`
      : '';
    const tagline = context.productTagline || 'Engineered for comfort and modern aesthetics.';
    const discountStr = context.productDiscount || context.offerDetails || '15% OFF';
    const cleanStoreTag = context.storeName.replace(/\s+/g, '');
    const isBangla = context.language === 'bn';

    if (isBangla) {
      switch (context.tone) {
        case ContentToneEnum.WITTY:
          return {
            headline: `${product} — ট্রেন্ডে থাকুন সবসময়`,
            caption: `আপনার ওয়াড্রব কি নতুন কিছুর খোঁজে? 🔥 সাধারণ ডিজাইন ছেড়ে বেছে নিন প্রিমিয়াম ${product}। ${tagline} বন্ধুরা জেনে যাওয়ার আগেই আজই নিজের জন্য সংগ্রহ করুন!`,
            cta: `নিজের স্টাইল আপগ্রেড করুন — এখনই অর্ডার করুন`,
            hashtags: [
              `#${cleanStoreTag}`,
              '#ট্রেন্ডিং',
              '#অনলাইনশপিং',
              '#স্টাইলবিডি',
              '#পোস্টমাইন্ড',
            ],
            postType: 'ENGAGEMENT',
            tone: 'WITTY',
            suggestedPublishTime: '8:30 PM',
          };

        case ContentToneEnum.PROMO:
          return {
            headline: `🚨 সীমিত সময়ের অফার: ${product}-এ পাচ্ছেন ${discountStr}`,
            caption: `স্পেশাল ডিসকাউন্ট অফার! 🏷️ আকর্ষণীয় ${discountStr} ছাড়ে আজই পেয়ে যান আপনার পছন্দের ${product}! ${priceStr ? `মূল্য মাত্র ${priceStr}।` : ''} ${tagline} সেরা কোয়ালিটি ও চমৎকার ফিনিশিং। স্টক সীমিত, অফারটি হাতছাড়া করবেন না!`,
            cta: `অফারটি উপভোগ করতে — এখনই ইনবক্স করুন`,
            hashtags: [
              `#${cleanStoreTag}`,
              '#ধামাকাঅফার',
              '#ডিসকাউন্ট',
              '#সেরাডিল',
              '#সীমিতস্টক',
            ],
            postType: 'OFFER',
            tone: 'PROMO',
            suggestedPublishTime: '7:00 PM',
          };

        case ContentToneEnum.STORYTELLING:
          return {
            headline: `${product}-এর পেছনের গল্প`,
            caption: `প্রতিটি অনন্য সৃষ্টির পেছনেই থাকে নিপুণ কারিগরি। ${product} তৈরির সময় আমরা প্রতিটি ডিটেইল ও ফিনিশিংয়ে দিয়েছি সর্বোচ্চ যত্ন। ${tagline} এটি শুধু ব্যবহার করার জিনিস নয়, বরং আপনার ব্যক্তিত্ব ও রুচির চমৎকার প্রতিফলন। ✨`,
            cta: `বিস্তারিত জানতে এখানে ক্লিক করুন`,
            hashtags: [
              `#${cleanStoreTag}`,
              '#ক্রাফটসম্যানশিপ',
              '#রুচিশীলপণ্য',
              '#প্রিমিয়ামকোয়ালিটি',
              '#আস্থারপ্রতীক',
            ],
            postType: 'STORY',
            tone: 'STORYTELLING',
            suggestedPublishTime: '9:00 PM',
          };

        case ContentToneEnum.NATURAL:
        default:
          return {
            headline: `নতুন কালেকশন: ${product}`,
            caption: `সবেমাত্র পৌঁছাল আমাদের ফ্রেশ ড্রপ! ✨ আপনার দৈনন্দিন জীবনকে আরও আরামদায়ক ও আকর্ষণীয় করতে নিয়ে এসেছি ${product}। ${tagline} ${priceStr ? `মূল্য মাত্র ${priceStr}।` : ''} সারাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধাসহ সীমিত স্টক উপলব্ধ।`,
            cta: `এখনই শপ করুন — ক্যাশ অন ডেলিভারি সুবিধা`,
            hashtags: [
              `#${cleanStoreTag}`,
              '#নতুনকালেকশন',
              '#অনলাইনশপিং',
              '#বাংলাদেশ',
              '#পোস্টমাইন্ড',
            ],
            postType: 'PRODUCT_SHOWCASE',
            tone: 'NATURAL',
            suggestedPublishTime: '8:00 PM',
          };
      }
    }

    switch (context.tone) {
      case ContentToneEnum.WITTY:
        return {
          headline: `${product} — Drip Check Approved`,
          caption: `Your wardrobe just called: it's begging for an upgrade. 🔥 Stop settling for basic when the ${product} exists. ${tagline} Grab yours before your friends realize they missed out!`,
          cta: `Upgrade Your Style — Order Today`,
          hashtags: [
            `#${cleanStoreTag}`,
            `#DripCheck`,
            `#StreetwearDaily`,
            `#StyleUpgrade`,
            `#PostMindAI`,
          ],
          postType: 'ENGAGEMENT',
          tone: 'WITTY',
          suggestedPublishTime: '8:30 PM',
        };

      case ContentToneEnum.PROMO:
        return {
          headline: `🚨 Limited Flash Deal: ${discountStr} on ${product}`,
          caption: `FLASH SALE ALERT! 🏷️ Grab the ${product} today with an exclusive ${discountStr}! ${priceStr ? `Only ${priceStr}.` : ''} ${tagline} Built to last, priced to steal. Stock is strictly limited, so don't sleep on this!`,
          cta: `Claim ${discountStr} — Checkout Now`,
          hashtags: [
            `#${cleanStoreTag}`,
            `#FlashSale`,
            `#DiscountAlert`,
            `#LimitedDrop`,
            `#BestDeals`,
          ],
          postType: 'OFFER',
          tone: 'PROMO',
          suggestedPublishTime: '7:00 PM',
        };

      case ContentToneEnum.STORYTELLING:
        return {
          headline: `The Story Behind ${product}`,
          caption: `Every piece has an origin. When we crafted the ${product}, we spent months obsessing over every seam, texture, and contour. ${tagline} Designed not just to be worn, but to be lived in. Experience true craftsmanship. ✨`,
          cta: `Discover the Craftsmanship`,
          hashtags: [
            `#${cleanStoreTag}`,
            `#BehindTheBrand`,
            `#Craftsmanship`,
            `#DesignedWithPassion`,
            `#QualityFirst`,
          ],
          postType: 'STORY',
          tone: 'STORYTELLING',
          suggestedPublishTime: '9:00 PM',
        };

      case ContentToneEnum.NATURAL:
      default:
        return {
          headline: `Introducing ${product}`,
          caption: `Just arrived! ✨ Elevate your everyday rotation with the ${product}. ${tagline} ${priceStr ? `Available now for ${priceStr}.` : ''} Available in limited quantities with fast nationwide delivery.`,
          cta: `Shop Now — Cash on Delivery Available`,
          hashtags: [
            `#${cleanStoreTag}`,
            `#NewArrival`,
            `#OnlineShopping`,
            `#FreshDrop`,
            `#PostMind`,
          ],
          postType: 'PRODUCT_SHOWCASE',
          tone: 'NATURAL',
          suggestedPublishTime: '8:00 PM',
        };
    }
  }
}
