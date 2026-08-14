---
name: ai-structured-output
description: "Standards and patterns for PostMind's modular AI services, prompt engineering, structured output validation using Zod, and error recovery."
---

# AI Structured Output Standards for PostMind

## 1. Modular AI Architecture

AI responsibilities are split into distinct service modules:
- **`ContentGeneratorService`**: Captions, CTAs, hooks, and hashtags for social posts.
- **`ContentStrategistService`**: Proactive daily/weekly posting recommendations and content mix balancing.
- **`CreativeAdvisorService`**: Vision/image feedback and suggested composition improvements.
- **`PerformanceAnalystService`**: Analytical takeaways based on engagement metrics.

## 2. Structured Output Enforcement

- Every AI prompt must output strict JSON matching a validated **Zod schema**.
- Always use typed output schemas:
  ```typescript
  import { z } from 'zod';

  export const SocialPostOutputSchema = z.object({
    headline: z.string(),
    caption: z.string(),
    cta: z.string(),
    hashtags: z.array(z.string()),
    postType: z.enum(['PRODUCT_SHOWCASE', 'OFFER', 'ENGAGEMENT', 'EDUCATIONAL', 'STORY']),
    suggestedPublishTime: z.string().datetime().optional(),
  });

  export type SocialPostOutput = z.infer<typeof SocialPostOutputSchema>;
  ```

## 3. Resilience & Fallbacks

- If structured parsing fails, trigger a 1-shot repair pass with schema feedback or fallback to a deterministic template.
- Log token consumption, latency, and model versions for observability.
