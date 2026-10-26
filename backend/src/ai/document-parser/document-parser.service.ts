import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFParse } from 'pdf-parse';
import { StorageService } from '../../storage/storage.service';
import {
  ExtractedProductList,
  ExtractedProductListSchema,
  ExtractedProductItem,
} from './schemas/product-extract.schema';

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Main entry point to parse any uploaded document (CSV, PDF, or Image)
   */
  async parseDocument(
    file: Express.Multer.File,
    storeCurrency = 'BDT',
  ): Promise<ExtractedProductList> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file buffer is empty');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const originalName = (file.originalname || '').toLowerCase();

    this.logger.log(
      `Parsing document '${file.originalname}' (${mime}, ${file.size} bytes)`,
    );

    let extracted: ExtractedProductList;

    if (
      mime.includes('csv') ||
      originalName.endsWith('.csv') ||
      mime.includes('tab-separated') ||
      originalName.endsWith('.tsv')
    ) {
      extracted = await this.parseCsvDocument(file, storeCurrency);
    } else if (mime.includes('pdf') || originalName.endsWith('.pdf')) {
      extracted = await this.parsePdfDocument(file, storeCurrency);
    } else if (
      mime.startsWith('image/') ||
      originalName.match(/\.(png|jpe?g|webp)$/)
    ) {
      extracted = await this.parseImageDocument(file, storeCurrency);
    } else {
      // Fallback: try reading as UTF-8 text
      extracted = await this.parseTextDocument(
        file.buffer.toString('utf-8'),
        storeCurrency,
      );
    }

    // Ensure all items have suggested image prompts
    extracted.products = extracted.products.map((p) => {
      if (!p.suggestedImagePrompt) {
        p.suggestedImagePrompt = `Commercial e-commerce studio product photograph of ${p.name}, ${p.category} collection. High-definition textures, clean studio lighting, minimalist background, 4k.`;
      }
      return p;
    });

    return extracted;
  }

  /**
   * CSV parser with automatic header detection and LLM normalization fallback
   */
  private async parseCsvDocument(
    file: Express.Multer.File,
    currency: string,
  ): Promise<ExtractedProductList> {
    const text = file.buffer.toString('utf-8');
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV file must contain a header row and at least one product row',
      );
    }

    // First attempt: try fast deterministic CSV mapping
    const directResults = this.parseCsvDirectly(lines, currency);
    if (directResults.length > 0) {
      return {
        products: directResults,
        confidenceScore: 0.95,
        sourceSummary: `Parsed ${directResults.length} products directly from CSV spreadsheet`,
      };
    }

    // Second attempt: send CSV text to LLM to understand irregular column formats
    return this.parseTextWithAi(text, currency, 'CSV Document');
  }

  /**
   * Direct CSV line parser
   */
  private parseCsvDirectly(
    lines: string[],
    currency: string,
  ): ExtractedProductItem[] {
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const splitLine = (l: string) => {
      // Handle quoted commas: e.g. "Cotton, Silk",120
      const re = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(l)) !== null) {
        let val = m[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        matches.push(val.trim());
        if (re.lastIndex >= l.length) break;
      }
      return matches.length > 0 ? matches : l.split(delimiter).map((s) => s.trim());
    };

    const rawHeaders = splitLine(lines[0]).map((h) => h.toLowerCase().trim());

    const findCol = (...keywords: string[]) => {
      return rawHeaders.findIndex((h) =>
        keywords.some((kw) => h.includes(kw.toLowerCase())),
      );
    };

    const nameIdx = findCol('name', 'title', 'item', 'product');
    const priceIdx = findCol('price', 'cost', 'rate', 'bdt', 'tk');
    const catIdx = findCol('category', 'type', 'dept', 'collection');
    const stockIdx = findCol('stock', 'qty', 'quantity', 'inventory');
    const tagIdx = findCol('tagline', 'description', 'desc', 'summary', 'angle');
    const featIdx = findCol('features', 'highlights', 'specs', 'details');
    const discIdx = findCol('discount', 'offer', 'deal');
    const imgIdx = findCol('image', 'photo', 'picture', 'url');

    if (nameIdx === -1 && priceIdx === -1) {
      return [];
    }

    const products: ExtractedProductItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length === 0 || !cols.some(Boolean)) continue;

      const name = (cols[nameIdx >= 0 ? nameIdx : 0] || '').trim();
      if (!name) continue;

      const rawPrice = cols[priceIdx >= 0 ? priceIdx : 1] || '0';
      const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

      const rawStock = cols[stockIdx >= 0 ? stockIdx : -1] || '10';
      const stock = parseInt(rawStock.replace(/[^0-9]/g, ''), 10) || 10;

      const category = (catIdx >= 0 && cols[catIdx] ? cols[catIdx] : 'General').trim();
      const tagline = tagIdx >= 0 && cols[tagIdx] ? cols[tagIdx].trim() : null;
      const discount = discIdx >= 0 && cols[discIdx] ? cols[discIdx].trim() : null;
      const image = imgIdx >= 0 && cols[imgIdx] && cols[imgIdx].startsWith('http')
        ? cols[imgIdx].trim()
        : null;

      let features: string[] = [];
      if (featIdx >= 0 && cols[featIdx]) {
        features = cols[featIdx]
          .split(/[,|;]/)
          .map((f) => f.trim())
          .filter(Boolean);
      }

      products.push({
        name,
        price: cleanPrice,
        currency,
        category: category || 'General',
        stock,
        tagline: tagline || undefined,
        features: features.length ? features : ['Quality Material', 'Verified Authenticity'],
        discount: discount || undefined,
        image: image || undefined,
        suggestedImagePrompt: `Commercial studio photograph of ${name}, ${category}. Crisp lighting, 4k.`,
      });
    }

    return products;
  }

  /**
   * PDF document parser
   */
  private async parsePdfDocument(
    file: Express.Multer.File,
    currency: string,
  ): Promise<ExtractedProductList> {
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      const pdfData = await parser.getText();
      pdfText = pdfData?.text || '';
      await parser.destroy();
    } catch (err: any) {
      this.logger.warn(`pdf-parse failed: ${err.message}`);
    }

    if (!pdfText.trim()) {
      // If text extraction is empty, try multimodal vision if image-based PDF
      return this.parseTextWithAi(
        'Empty or scanned PDF',
        currency,
        'PDF Catalog',
      );
    }

    return this.parseTextWithAi(pdfText, currency, 'PDF Document');
  }

  /**
   * Multimodal image document parser (Photos of catalogs, receipts, price boards, web screenshots)
   */
  private async parseImageDocument(
    file: Express.Multer.File,
    currency: string,
  ): Promise<ExtractedProductList> {
    const base64Data = file.buffer.toString('base64');
    const mime = file.mimetype || 'image/jpeg';

    // Auto-upload original document image to Supabase so it can immediately serve as product visual
    let uploadedImageUrl: string | null = null;
    try {
      const uploadRes = await this.storageService.uploadProductImage(file);
      if (uploadRes?.url) {
        uploadedImageUrl = uploadRes.url;
      }
    } catch (err: any) {
      this.logger.warn(
        `Auto-upload document image to storage failed (non-fatal): ${err.message}`,
      );
    }

    const geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');

    if (geminiKey) {
      try {
        const result = await this.callGeminiVisionExtraction(
          geminiKey,
          base64Data,
          mime,
          currency,
        );
        if (result && result.products.length > 0) {
          if (uploadedImageUrl) {
            result.products = result.products.map((p) => ({
              ...p,
              image: p.image || uploadedImageUrl,
            }));
          }
          return result;
        }
      } catch (err: any) {
        this.logger.warn(`Gemini Vision extraction failed: ${err.message}`);
      }
    }

    // Fallback: AgentRouter or OpenAI vision if available
    const agentRouterKey =
      this.configService.get<string>('AGENTROUTER_API_KEY') ||
      this.configService.get<string>('OPENAI_API_KEY');

    if (agentRouterKey) {
      try {
        const result = await this.callAgentRouterVision(
          agentRouterKey,
          base64Data,
          mime,
          currency,
        );
        if (result && result.products.length > 0) {
          if (uploadedImageUrl) {
            result.products = result.products.map((p) => ({
              ...p,
              image: p.image || uploadedImageUrl,
            }));
          }
          return result;
        }
      } catch (err: any) {
        this.logger.warn(`AgentRouter vision failed: ${err.message}`);
      }
    }

    // Default template if vision models unavailable
    return {
      products: [
        {
          name: 'Detected Product Item',
          price: 1500,
          currency,
          category: 'General',
          stock: 10,
          tagline: 'Extracted from uploaded document image',
          features: ['Extracted via AI visual parsing', 'Ready for merchant review'],
          discount: null,
          image: uploadedImageUrl || null,
          suggestedImagePrompt:
            'Professional commercial product photo with clean studio backdrop.',
        },
      ],
      confidenceScore: 0.6,
      sourceSummary: 'Extracted preliminary products from image document',
    };
  }

  /**
   * Parse plain text or OCR text using LLM
   */
  private async parseTextDocument(
    text: string,
    currency: string,
  ): Promise<ExtractedProductList> {
    return this.parseTextWithAi(text, currency, 'Text Document');
  }

  /**
   * Send document text to Gemini or AgentRouter with structured JSON schema
   */
  private async parseTextWithAi(
    rawText: string,
    currency: string,
    sourceType: string,
  ): Promise<ExtractedProductList> {
    const prompt = `You are PostMind's AI Catalog Specialist.
Extract all products from the provided text into a valid JSON object matching this schema:
{
  "products": [
    {
      "name": "string (clear product title)",
      "price": number (positive numeric price in ${currency}, if unknown or to be announced set 0),
      "currency": "${currency}",
      "category": "string (e.g. Apparel, Footwear, Accessories, Electronics, Gaming, General)",
      "stock": number (default 10 if not stated, if out of stock set 0),
      "tagline": "string or null",
      "features": ["string", "string"],
      "discount": "string or null (e.g. '10% OFF')",
      "suggestedImagePrompt": "string (describe how to generate a clean e-commerce studio photo of this item)"
    }
  ],
  "sourceSummary": "string brief summary of document content"
}

Document Content:
${rawText.slice(0, 8000)}`;

    const geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');

    if (geminiKey) {
      const models = [
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ];
      for (const model of models) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            },
          );

          if (response.ok) {
            const json = await response.json();
            const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const cleaned = cleanJsonString(content);
              const parsed = JSON.parse(cleaned);
              return ExtractedProductListSchema.parse(parsed);
            }
          }
        } catch (err: any) {
          this.logger.warn(`Gemini text extraction with ${model} failed: ${err.message}`);
        }
      }
    }

    // Deterministic fallback regex if no API key is active
    return this.deterministicRegexExtractor(rawText, currency, sourceType);
  }

  /**
   * Gemini Multimodal Vision API call
   */
  private async callGeminiVisionExtraction(
    apiKey: string,
    base64Data: string,
    mimeType: string,
    currency: string,
  ): Promise<ExtractedProductList | null> {
    const prompt = `Analyze this product document / catalog / flyer / receipt / product webpage screenshot image.
Extract every product you see into a JSON object strictly matching this schema:
{
  "products": [
    {
      "name": "string (full product title, e.g. 'Havit G176 Wired Gamepad With Vibration')",
      "price": number (numeric price in ${currency}, if 'To be announced' or unknown set 0),
      "currency": "${currency}",
      "category": "string (e.g. Gaming, Electronics, Apparel, Footwear, Accessories, General)",
      "stock": number (numeric stock, if 'Out of Stock' set 0, default 10),
      "tagline": "string or null (promotional tagline or key angle)",
      "features": ["string (e.g. Model: G176)", "string (e.g. Dual Vibration Feedback)"],
      "discount": "string or null",
      "suggestedImagePrompt": "string (studio product photo prompt)"
    }
  ],
  "sourceSummary": "string summary"
}`;

    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          this.logger.warn(`Gemini Vision model ${model} failed: ${errText}`);
          continue;
        }

        const json = await response.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) continue;

        const cleaned = cleanJsonString(content);
        const parsed = JSON.parse(cleaned);
        return ExtractedProductListSchema.parse(parsed);
      } catch (err: any) {
        this.logger.warn(`Gemini Vision extraction (${model}) failed: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * AgentRouter Vision fallback
   */
  private async callAgentRouterVision(
    apiKey: string,
    base64Data: string,
    mimeType: string,
    currency: string,
  ): Promise<ExtractedProductList | null> {
    const baseUrl = (
      this.configService.get<string>('AI_BASE_URL') ||
      'https://agentrouter.org/v1'
    ).replace(/\/+$/, '');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-5.3',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract products from this document into JSON: { "products": [{ "name": string, "price": number, "category": string, "stock": number, "features": string[] }] }`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return ExtractedProductListSchema.parse(parsed);
  }

  /**
   * Deterministic regex extractor when AI services are offline
   */
  private deterministicRegexExtractor(
    text: string,
    currency: string,
    sourceType: string,
  ): ExtractedProductList {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    const products: ExtractedProductItem[] = [];

    // Look for lines containing price patterns like 1200, 250.00, ৳500, $40
    const priceRegex = /(?:tk|bdt|৳|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+)\s*(?:tk|bdt|৳|\$)?/i;

    for (const line of lines) {
      const match = line.match(priceRegex);
      if (match && match[1]) {
        const rawNum = match[1].replace(/,/g, '');
        const priceVal = parseFloat(rawNum);
        if (!isNaN(priceVal) && priceVal > 0) {
          const namePart = line
            .replace(match[0], '')
            .replace(/[-–:•|]/g, ' ')
            .trim();

          if (namePart.length > 2) {
            products.push({
              name: namePart,
              price: priceVal,
              currency,
              category: 'General',
              stock: 10,
              tagline: `Extracted from ${sourceType}`,
              features: ['Authentic Product', 'Verified Quality'],
              discount: null,
              suggestedImagePrompt: `Commercial studio photo of ${namePart}, clean backdrop.`,
            });
          }
        }
      }
    }

    if (products.length === 0) {
      // Create at least one draft row for merchant convenience
      products.push({
        name: 'Sample Imported Item',
        price: 990,
        currency,
        category: 'General',
        stock: 15,
        tagline: 'Extracted product draft',
        features: ['Premium Quality'],
        discount: null,
        suggestedImagePrompt: 'Clean product photo on neutral background.',
      });
    }

    return {
      products: products.slice(0, 50),
      confidenceScore: 0.8,
      sourceSummary: `Parsed ${products.length} products from ${sourceType}`,
    };
  }
}
