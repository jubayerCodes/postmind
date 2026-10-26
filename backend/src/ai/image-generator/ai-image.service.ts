import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { StorageService } from '../../storage/storage.service';

export interface GenerateImageOptions {
  prompt: string;
  productName?: string;
  category?: string;
  features?: string[];
  aspectRatio?: '1:1' | '4:3' | '16:9';
}

export type ImageEngineType =
  | 'cloudflare-workers-ai'
  | 'nano-banana'
  | 'flux-pollinations';

export interface GeneratedImageResult {
  imageUrl: string;
  engine: ImageEngineType;
  promptUsed: string;
}

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Craft an enhanced, photorealistic e-commerce studio prompt
   */
  craftPrompt(options: GenerateImageOptions): string {
    const raw = options.prompt?.trim();
    if (raw && raw.length > 25) {
      return raw;
    }

    const title = options.productName || raw || 'Exclusive Product';
    const cat = options.category || 'Apparel';
    const feats = options.features?.length
      ? options.features.slice(0, 3).join(', ')
      : '';

    return `Commercial studio product photography of ${title}, ${cat} collection${feats ? `, ${feats}` : ''}. Centered product shot isolated on solid clean neutral studio backdrop, high-definition textures, studio softbox rim lighting, sharp focus, 8k commercial catalogue photo.`;
  }

  /**
   * Helper to persist base64 data URIs to Supabase CDN storage
   */
  private async persistImage(
    rawUrl: string,
    productName = 'product',
  ): Promise<string> {
    if (rawUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await this.storageService.uploadBase64Image(
          rawUrl,
          `${productName}.jpg`,
        );
        return uploadRes.url;
      } catch (err: any) {
        this.logger.warn(
          `Could not persist generated image to Supabase Storage: ${err.message}`,
        );
      }
    }
    return rawUrl;
  }

  /**
   * Generate product image using Cloudflare Workers AI (100% Free ~100/day HD),
   * Nano Banana (Google AI Studio), or Flux fallback
   */
  async generateProductImage(
    options: GenerateImageOptions,
  ): Promise<GeneratedImageResult> {
    const enhancedPrompt = this.craftPrompt(options);

    // 1. Check Cloudflare Workers AI (Free 10,000 neurons/day ~100+ HD images/day)
    const cfAccountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const cfApiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');

    if (cfAccountId && cfApiToken) {
      try {
        const cfUrl = await this.callCloudflareWorkersAiApi(
          cfAccountId,
          cfApiToken,
          enhancedPrompt,
        );
        if (cfUrl) {
          const finalUrl = await this.persistImage(
            cfUrl,
            options.productName,
          );
          return {
            imageUrl: finalUrl,
            engine: 'cloudflare-workers-ai',
            promptUsed: enhancedPrompt,
          };
        }
      } catch (err: any) {
        this.logger.warn(
          `Cloudflare Workers AI call failed (${err.message}), trying next engine...`,
        );
      }
    }

    // 2. Check Google Nano Banana / Gemini Pro Image
    const geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY') ||
      this.configService.get<string>('NANO_BANANA_API_KEY');

    if (geminiKey) {
      try {
        const nanoUrl = await this.callNanoBananaApi(geminiKey, enhancedPrompt);
        if (nanoUrl) {
          const finalUrl = await this.persistImage(
            nanoUrl,
            options.productName,
          );
          return {
            imageUrl: finalUrl,
            engine: 'nano-banana',
            promptUsed: enhancedPrompt,
          };
        }
      } catch (err: any) {
        this.logger.warn(
          `Nano Banana API call failed (${err.message}), falling back to Flux engine`,
        );
      }
    }

    // 3. Default fast zero-config Flux engine
    const fluxUrl = this.generateFluxUrl(enhancedPrompt);
    return {
      imageUrl: fluxUrl,
      engine: 'flux-pollinations',
      promptUsed: enhancedPrompt,
    };
  }

  /**
   * Cloudflare Workers AI (100% Free Tier - 10,000 neurons/day ~100+ HD images/day)
   */
  private async callCloudflareWorkersAiApi(
    accountId: string,
    apiToken: string,
    prompt: string,
  ): Promise<string | null> {
    const candidateModels = [
      '@cf/black-forest-labs/flux-1-schnell',
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    ];

    for (const model of candidateModels) {
      try {
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          this.logger.warn(
            `Cloudflare model ${model} HTTP ${response.status}: ${errText.slice(0, 150)}`,
          );
          continue;
        }

        const contentType = response.headers.get('content-type') || '';

        // Binary response (image/jpeg, image/png, application/octet-stream)
        if (
          contentType.includes('image/') ||
          contentType.includes('application/octet-stream')
        ) {
          const arrayBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const mime = contentType.includes('png') ? 'image/png' : 'image/jpeg';
          return `data:${mime};base64,${base64}`;
        }

        // JSON response with base64 image
        const data = await response.json();
        if (data.result?.image) {
          return `data:image/jpeg;base64,${data.result.image}`;
        }
      } catch (err: any) {
        this.logger.warn(
          `Cloudflare Workers AI model ${model} error: ${err.message}`,
        );
      }
    }

    return null;
  }

  /**
   * Google Nano Banana / Gemini multimodal image generation via Google AI Studio (@google/genai Interactions API)
   */
  private async callNanoBananaApi(
    apiKey: string,
    prompt: string,
  ): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = [
      'models/gemini-3-pro-image',
      'models/gemini-3.1-flash-image',
      'gemini-3.1-flash-image',
    ];

    for (const model of candidateModels) {
      try {
        const interaction = await ai.interactions.create({
          model,
          input: prompt,
          tools: [{ type: 'google_search' }],
          generation_config: {
            temperature: 1,
            max_output_tokens: 32768,
            top_p: 0.95,
            image_config: {
              image_size: '1K',
            },
          },
          response_modalities: ['image', 'text'],
        });

        const imageStr = this.extractImageFromInteraction(interaction);
        if (imageStr) {
          return imageStr;
        }
      } catch (err: any) {
        this.logger.warn(
          `Nano Banana (${model}) failed: ${err.message || err.error?.message || err}`,
        );
      }
    }

    return null;
  }

  private extractImageFromInteraction(interaction: any): string | null {
    if (!interaction?.steps || !Array.isArray(interaction.steps)) return null;

    for (const step of interaction.steps) {
      // 1. Check step.content (Interactions API ImageContent format)
      if (Array.isArray(step.content)) {
        for (const item of step.content) {
          if (item?.type === 'image' || item?.data) {
            if (item.data) {
              const mime = item.mime_type || 'image/jpeg';
              return `data:${mime};base64,${item.data}`;
            }
            if (item.uri) {
              return item.uri;
            }
          }
        }
      }

      // 2. Check parts if returned in candidate content
      const parts =
        step.parts ||
        step.contents?.[0]?.parts ||
        step.output?.parts ||
        [];
      for (const part of parts) {
        if (part?.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/jpeg';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
        if (part?.image?.imageBytes) {
          return `data:image/jpeg;base64,${part.image.imageBytes}`;
        }
        if (part?.fileData?.fileUri) {
          return part.fileData.fileUri;
        }
      }
    }

    return null;
  }

  /**
   * High-fidelity zero-config Flux product generation
   */
  private generateFluxUrl(prompt: string): string {
    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&seed=${seed}&model=flux&nologo=true`;
  }
}
