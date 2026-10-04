# AI Social Media Manager SaaS — PRD

## 1. Product Overview

A multi-tenant SaaS platform for small online shoppers/merchants who struggle to consistently manage social media marketing.

The merchant provides product information, images, categories, subcategories, offers, and optional content. The platform uses AI to generate, schedule, publish, analyze, and continuously improve social media content.

### Core Value Proposition

> **The merchant provides the products. AI manages the social content.**

The system should reduce the effort required to maintain an active social media presence while helping merchants understand what content performs best.

---

# 2. Target Users

### Primary User

Small and medium-sized online merchants who:

- Sell products online.
- Use Facebook/Instagram or other supported social platforms.
- Do not have a dedicated social media manager.
- Know social media is important but do not post consistently.
- Have difficulty creating captions, creatives, offers, and content ideas.
- Want automation without hiring a marketing employee.

### Secondary User

Small marketing teams managing one or more stores.

---

# 3. Product Goals

1. Make social-media content creation extremely low-effort.
2. Automate consistent posting.
3. Allow merchants to approve content before publication.
4. Analyze post performance.
5. Use historical performance to improve future recommendations.
6. Recommend non-product content such as memes, stories, reviews, educational posts, and engagement posts.
7. Provide merchants with actionable daily/weekly recommendations.
8. Monetize the platform through subscriptions.

---

# 4. Product Versions / Development Roadmap

The product should be developed incrementally.

## Version 0.1 — Foundation / MVP

### Objective

Build the basic SaaS infrastructure and prove the core workflow.

### Features

#### Authentication

- Sign up.
- Login/logout.
- Password reset.
- Email verification.
- User profile.

**Suggested technologies:**
- Next.js
- TypeScript
- Supabase Auth or custom authentication
- PostgreSQL
- Prisma

---

#### Multi-Tenant Store/Workspace

Each user can create/manage a store/workspace.

Basic structure:

```text
User
 └── Store
      ├── Products
      ├── Categories
      ├── Offers
      └── Settings
```

Every store-owned resource must be isolated by `storeId`.

**Suggested technologies:**
- PostgreSQL
- Prisma
- NestJS

---

#### Product Management

Merchant can add:

- Product name
- Description
- Price
- Product URL
- Category
- Subcategory
- Images
- Tags
- Optional features
- Optional offer/discount

Support multiple products.

**Suggested technologies:**
- Next.js
- React
- shadcn/ui
- PostgreSQL
- Prisma
- Supabase Storage

---

#### Basic AI Content Generation

Merchant selects a product and asks AI to generate a social post.

AI generates:

- Caption
- CTA
- Hashtags
- Post type
- Suggested posting time

Merchant can:

- Generate
- Regenerate
- Edit
- Save
- Delete

**Suggested technologies:**
- NestJS
- LLM API
- Structured JSON output
- Zod for validation

---

#### Content Management

Content states:

```text
DRAFT
READY
APPROVED
SCHEDULED
PUBLISHED
FAILED
```

Merchant can manage generated content through the dashboard.

---

### Version 0.1 Success Criteria

A merchant can:

```text
Create account
      ↓
Create store
      ↓
Add product
      ↓
Generate AI post
      ↓
Edit/approve post
      ↓
Save post
```

---

# Version 0.2 — Social Account Integration

### Objective

Connect the SaaS to supported social platforms.

Start with **Meta/Facebook Pages**, subject to the permissions and publishing capabilities available to the application.

Do not assume access to personal Facebook profiles. The integration should use officially supported Meta business/Page capabilities.

### Features

#### Social Account Connection

Merchant can:

- Connect social account.
- View connected accounts.
- Disconnect account.
- Reauthorize expired connection.
- View connection status.

Store credentials/tokens securely.

**Suggested technologies:**
- Meta APIs
- OAuth 2.0
- NestJS
- PostgreSQL
- Prisma
- Encrypted token storage

---

#### Publishing

Merchant can publish an approved post to the connected platform.

Workflow:

```text
Draft
 ↓
Approve
 ↓
Publish
 ↓
Published / Failed
```

Store:

- Platform
- Platform post ID
- Published time
- Status
- Error information

---

# Version 0.3 — Content Calendar & Scheduling

### Objective

Allow merchants to automate their posting schedule.

### Features

#### Content Calendar

Calendar views:

- Day
- Week
- Month

Display:

- Scheduled posts
- Published posts
- Drafts
- Failed posts

---

#### Scheduling

Merchant can select:

- Date
- Time
- Platform
- Post

Support recurring posting preferences.

Example:

```text
Monday → 7:00 PM
Wednesday → 7:00 PM
Friday → 8:00 PM
```

---

#### Background Jobs

Scheduled posts must execute without the merchant keeping the website open.

**Suggested technologies:**
- Redis
- BullMQ
- NestJS workers
- PostgreSQL
- Cron only for simple periodic tasks

Prefer a proper job queue for production scheduling.

---

# Version 0.4 — Automated Daily Content

### Objective

Move from "AI generates when requested" to "AI proactively recommends content."

### Features

The system analyzes:

- Available products
- Categories
- Subcategories
- Offers
- Previous posts
- Posting frequency
- Recent content types

Then generates a daily recommendation.

Example:

> Recommended today: Product + limited-time offer

Merchant receives:

> **Today's social post is ready**

Actions:

- Approve
- Edit
- Regenerate
- Skip

---

### Merchant Preferences

Allow configuration of:

- Posting frequency
- Preferred posting days
- Preferred posting time
- Content categories
- Promotional frequency
- AI automation level

Example automation modes:

```text
Manual
Approval Required
Mostly Automatic
```

Initially, **Approval Required** should be the default.

---

# Version 0.5 — Email Notification System

### Objective

Keep merchants informed without requiring them to constantly open the dashboard.

### Features

Daily email containing:

- Today's recommended post
- Post preview
- Product
- Content type
- Suggested publishing time
- Approval link
- Dashboard link

Merchant can configure:

- Email frequency
- Preferred delivery time
- Enable/disable notifications

Future notifications:

- Weekly performance report
- Failed publication
- Important recommendation
- Subscription/billing events

**Suggested technologies:**
- Resend / Postmark / SendGrid
- React Email
- NestJS background workers

---

# Version 0.6 — Performance Analytics

### Objective

Show merchants how their posts perform.

### Metrics

Depending on the capabilities of each platform:

- Reach
- Impressions
- Reactions
- Comments
- Shares
- Clicks
- Engagement
- Engagement rate
- Post performance over time

Store historical metrics.

```text
Post
 └── PostMetric
      ├── impressions
      ├── reactions
      ├── comments
      ├── shares
      └── clicks
```

### Dashboard

Display:

- Best-performing posts
- Worst-performing posts
- Best content types
- Best products
- Best posting times
- Engagement trends

**Suggested technologies:**
- PostgreSQL
- Prisma
- Recharts
- Next.js

---

# Version 0.7 — AI Performance Analyst

### Objective

Turn analytics into actionable recommendations.

The AI analyzes historical performance and tells the merchant:

> "Product demonstration posts are performing better than simple product posts."

> "Your audience is responding strongly to customer-review content."

> "You have published several promotional posts recently. Consider an educational post next."

### AI Inputs

```text
Post
+
Content Type
+
Product
+
Image Metadata
+
Posting Time
+
Performance
+
Frequency
```

### AI Outputs

- Performance summary
- Content recommendations
- Posting recommendations
- Content-type recommendations
- Image recommendations
- Product recommendations

---

# Version 0.8 — AI Creative/Image Advisor

### Objective

Help merchants improve the visual presentation of their products.

AI evaluates uploaded product images and recommends improvements.

Examples:

- Product should occupy more of the image.
- Background could be cleaner.
- Product-in-use image may perform better.
- Add a visual benefit.
- Use a different composition.
- Create a lifestyle-oriented presentation.

The system should provide **recommendations**, not automatically make destructive changes to the merchant's original image.

Future capability:

```text
Original Product Image
        ↓
AI Creative Suggestions
        ↓
Alternative Creative
```

**Suggested technologies:**
- Vision-capable AI model
- Image-generation/editing API
- Supabase Storage
- Sharp for basic server-side image processing

---

# Version 0.9 — Beyond-Product Content Engine

### Objective

Prevent the merchant's social feed from becoming only advertisements.

The AI should recommend content such as:

### Product Content

- New product
- Product showcase
- Product benefits
- Product comparison
- Offer
- Bundle
- Seasonal promotion

### Social Content

- Meme
- Story
- Question
- Poll concept
- Educational post
- Customer review
- Testimonial
- FAQ
- Behind-the-scenes
- Industry-related content

The AI should consider the merchant's recent posting flow.

Example:

```text
Post 1 → Product
Post 2 → Product
Post 3 → Offer
Post 4 → Offer

AI Recommendation
        ↓
Educational / Engagement content
```

---

# Version 1.0 — Autonomous AI Social Media Manager

### Objective

Turn the platform into a complete AI social media manager.

The AI continuously manages:

```text
Products
   ↓
Content Strategy
   ↓
Content Creation
   ↓
Scheduling
   ↓
Publishing
   ↓
Performance
   ↓
Analysis
   ↓
Learning
   ↓
New Strategy
```

### Autonomous capabilities

The AI can:

- Decide what should be posted.
- Select appropriate products.
- Select content types.
- Recommend posting times.
- Generate captions.
- Recommend creatives.
- Balance promotional/non-promotional content.
- Analyze previous performance.
- Adjust future content strategy.
- Notify merchants about important decisions.

Merchant remains in control through configurable automation settings.

---

# Version 1.1 — Subscription & Billing

### Objective

Convert the application into a production SaaS supporting both international and domestic (Bangladesh) merchants.

### Dual Payment Gateway Architecture

To support both global and local merchants seamlessly, the payment system uses a unified payment abstraction layer:

```text
SubscriptionService / BillingService
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
StripeProvider      SSLCommerzProvider
 (International)       (Bangladesh)
  • Cards (USD/EUR)     • bKash, Nagad, Rocket
  • Recurring billing   • Local Debit/Credit Cards
  • Stripe Webhooks     • IPN (Instant Payment Notification)
```

- **Stripe**: Handles international subscriptions with automated recurring billing, customer portal, and proration.
- **SSLCommerz**: Handles Bangladesh-based transactions supporting bKash, Nagad, Rocket, Upay, and local Visa/Mastercard cards in BDT, with IPN listener and subscription validation/renewal reminders.

### Subscription Features

- Free trial
- Monthly subscription
- Annual subscription
- Upgrade / Downgrade
- Cancellation & pause
- Billing history & invoices
- Usage limits & quota tracking
- Subscription status (ACTIVE, TRIALING, PAST_DUE, CANCELLED)
- Currency localization (USD for International via Stripe, BDT for Bangladesh via SSLCommerz)

### Potential Usage Limits

Plans can limit:

- Number of stores
- Number of products
- Number of social accounts
- Monthly AI generations
- Monthly posts
- Image generations
- Analytics history
- AI recommendations

**Suggested technologies:**
- Stripe & Stripe Webhooks (International)
- SSLCommerz & IPN Webhook (Bangladesh)
- PostgreSQL
- Prisma
- NestJS

Do not hard-code subscription permissions throughout the application. Create a centralized entitlement/feature system.

---

# Version 1.2 — Production SaaS Improvements

### Objective

Prepare the platform for real customers at scale.

### Features

- Error monitoring
- Audit logs
- Rate limiting
- API logging
- Retry mechanisms
- Failed-job handling
- Token expiration handling
- Social API error recovery
- Database backups
- Usage monitoring
- Admin dashboard
- Customer support tools

**Suggested technologies:**

- Sentry
- Redis
- BullMQ
- Docker
- GitHub Actions
- Vercel
- Supabase
- Cloudflare
- OpenTelemetry if needed later

---

# 5. Recommended Technology Stack

## Frontend

### Primary

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Recharts
- GSAP
- Zustand (Exclusive client state store — React Context is strictly forbidden)

---

## Backend

### Recommended

**NestJS + TypeScript**

Reason:

The application will contain many business domains and background processes. NestJS provides a structured architecture that should scale better organizationally than a large Express application.

### Alternative

Express.js + TypeScript is acceptable for the MVP if development speed is the priority.

---

## Database

**PostgreSQL**

Recommended because the application contains many relationships between:

- Users
- Stores
- Products
- Categories
- Posts
- Social accounts
- Analytics
- Subscriptions
- AI recommendations

---

## ORM

**Prisma**

Use Prisma for:

- Schema management
- Type-safe queries
- Migrations
- Relations
- Transactions

---

## Backend Infrastructure

### Supabase

Use for:

- PostgreSQL hosting
- Object storage
- Potential authentication
- Optional realtime functionality

Avoid unnecessarily using every Supabase feature. Use each service only where it provides value.

---

# 6. Suggested Backend Architecture

The backend will be structured as a **NestJS Modular Monolith**, where business domains are isolated into cohesive, independent modules.

```text
src/
├── auth/                 # Authentication, JWT, session, password reset
├── users/                # User profiles, accounts
├── stores/               # Multi-tenant store/workspace isolation
├── products/             # Product catalog, images, pricing, tags
├── categories/           # Category & subcategory taxonomy
├── offers/               # Discounts, promotions, flash deals
├── social/               # Social platform integration & OAuth
│   ├── meta/             # Meta / Facebook Pages provider
│   └── common/           # Pluggable SocialPlatform abstraction
├── content/              # Post drafts, approved content, assets
├── ai/                   # AI generation, strategy, and orchestration
│   ├── generator/        # Caption & hashtag generator
│   ├── strategist/       # Content calendar & posting strategy
│   ├── vision/           # Creative & image advisor
│   └── analyst/          # Performance feedback loop
├── scheduling/           # Content calendar & post dispatcher
├── analytics/            # Post metrics, engagement aggregation
├── notifications/        # Email (Resend) & in-app alerts
├── billing/              # Unified billing & subscriptions
│   ├── stripe/           # Stripe provider (International / USD)
│   ├── sslcommerz/       # SSLCommerz provider (Bangladesh / BDT)
│   └── entitlements/     # Centralized plan feature checks
├── workers/              # BullMQ queue processors & background jobs
└── common/               # Guards, interceptors, filters, decorators, Prisma
```

### Domain Isolation & Extraction Principles

1. **Explicit Module Boundaries**: Each domain exports only its public service interface through its `*.module.ts`. Internal domain helpers, repositories, and entities stay encapsulated.
2. **No Direct Cross-Domain Database Coupling**: A domain module must not perform raw mutations on another domain's database models directly; it interacts through public service methods or domain events.
3. **Designed for Future Extraction**: By keeping domain interfaces clean and decoupled, any high-traffic module (such as the AI generation engine, image processor, or worker dispatcher) can later be extracted into an independent microservice if scaling or operational requirements justify it—without requiring a rewrite.
4. **No Premature Microservices**: The entire system runs as a single deployable NestJS modular monolith initially for rapid development, simplified transactions, unified CI/CD, and lower operational overhead.

---

# 7. AI Architecture

The AI system should not be one giant prompt.

Use separate services/modules.

```text
AI Service
│
├── Product Research
├── Content Generator
├── Content Strategist
├── Performance Analyst
├── Image Advisor
├── Content Planner
└── Recommendation Engine
```

Each service should have structured input/output.

Example:

```text
ContentGeneratorInput
        ↓
       LLM
        ↓
ContentGeneratorOutput
```

Validate AI responses using Zod or equivalent schema validation.

---

# 8. Product Research / Internet Information

When merchant information is insufficient, the AI may research additional public information about a product.

Workflow:

```text
Merchant Product Data
        ↓
Is information sufficient?
      /   \
    Yes    No
     │      │
     │    Research
     │      │
     └──┬───┘
        ↓
Verified/Available Information
        ↓
Content Generation
```

Important requirements:

- Do not blindly trust generated information.
- Prefer authoritative sources.
- Avoid inventing product specifications.
- Keep source information available internally where appropriate.
- Clearly distinguish merchant-provided information from externally researched information.

---

# 9. Social Media Integration Architecture

Do not tightly couple the entire application to one platform.

Create an abstraction:

```text
SocialPlatform
│
├── connect()
├── disconnect()
├── publishPost()
├── schedulePost()
├── getPostMetrics()
└── refreshConnection()
```

Then implement:

```text
MetaProvider
FutureProvider
FutureProvider
```

This makes it easier to add additional platforms later.

---

# 10. Security Requirements

### Authentication

- Secure password handling.
- Email verification.
- Password reset.
- Session management.

### Tenant Isolation

Every store-owned resource must verify:

```text
authenticatedUser → ownsStore → ownsResource
```

Never trust a client-provided `storeId`.

### Social Tokens

- Never expose access tokens to the frontend.
- Encrypt sensitive credentials where appropriate.
- Store only necessary tokens/data.
- Handle token expiration and revocation.

### API Security

- Rate limiting.
- Input validation.
- Authorization.
- CORS configuration.
- Secure HTTP headers.
- Request logging.

---

# 11. Core Database Entities

Initial entities:

```text
User
Store
Product
Category
Subcategory
Offer

SocialAccount

Content
ContentAsset
ContentSchedule

Post
PostMetric

AIRecommendation
AIAnalysis

Notification

Subscription
Plan
UsageRecord
```

Later:

```text
ContentExperiment
CreativeVariant
AuditLog
TeamMember
Workspace
```

---

# 12. Dashboard Structure

Recommended initial navigation:

```text
Dashboard
│
├── Overview
├── Products
├── Content
│   ├── Calendar
│   ├── Drafts
│   └── Published
├── AI Recommendations
├── Analytics
├── Social Accounts
├── Notifications
└── Settings
     ├── Store
     ├── Posting Preferences
     ├── AI Preferences
     └── Subscription
```

---

# 13. Main User Journey

```text
Sign Up
   ↓
Create Store
   ↓
Connect Social Account
   ↓
Add Products
   ↓
Set Posting Preferences
   ↓
AI Generates Content Plan
   ↓
Merchant Reviews
   ↓
Approve
   ↓
Schedule
   ↓
Publish
   ↓
Collect Performance
   ↓
AI Analyzes Results
   ↓
AI Improves Next Content Plan
```

---

# 14. Important Product Principle

The platform should progressively reduce the merchant's workload.

### Version 0.1

> "Tell me what to write."

### Version 0.4

> "Recommend what I should post today."

### Version 0.7

> "Tell me what is working."

### Version 0.9

> "Tell me what else I should post."

### Version 1.0

> **"Manage my social media strategy for me."**

That progression should guide the entire product.

---

# 15. What NOT to Build Initially

Avoid building these in the first MVP:

- Multiple social platforms.
- Advanced team collaboration.
- Complex video generation.
- Fully autonomous posting.
- Sophisticated AI image generation.
- Advanced competitor analysis.
- Mobile applications.
- Complex CRM.
- Marketplace functionality.
- Full marketing automation suite.

First prove:

```text
Merchant
  ↓
Products
  ↓
AI Content
  ↓
Approval
  ↓
Publishing
  ↓
Performance
```

Then expand.

---

# 16. Recommended Development Order

```text
Phase 1
Authentication + Multi-tenancy
        ↓
Phase 2
Product Management
        ↓
Phase 3
AI Content Generation
        ↓
Phase 4
Meta Integration
        ↓
Phase 5
Scheduling + Background Jobs
        ↓
Phase 6
Email Notifications
        ↓
Phase 7
Analytics
        ↓
Phase 8
AI Performance Analysis
        ↓
Phase 9
AI Content Strategy
        ↓
Phase 10
Image/Creative Intelligence
        ↓
Phase 11
Subscriptions
        ↓
Phase 12
Production Scaling
```

---

# 17. Code-Agent Development Rules

AI/code agents working on this project should follow these principles:

1. Use TypeScript throughout the application.
2. Use strict typing.
3. Do not put business logic inside UI components.
4. Keep frontend and backend responsibilities separate.
5. Use Prisma for database access.
6. Validate API input using schemas.
7. Validate AI-generated structured output.
8. Never expose secrets to the client.
9. Never trust `storeId` supplied by the frontend without authorization checks.
10. Use service/module boundaries for major domains.
11. Use background jobs for long-running or scheduled tasks.
12. Make external API integrations replaceable through service abstractions.
13. Use database transactions for operations that require atomicity.
14. Make background jobs idempotent where possible.
15. Log external API failures and retry safely.
16. Keep environment-specific configuration in environment variables.
17. Write reusable components instead of duplicating UI/business logic.
18. Build features incrementally; do not implement future-version functionality prematurely.
19. Client-Side State Management: Use Zustand exclusively for storing and managing data on the client. Do NOT use React Context anywhere.

---

# 18. MVP Definition

The first public MVP is successful when a real merchant can:

```text
1. Create an account
2. Create a store
3. Add multiple products
4. Connect a supported Meta account
5. Generate AI social posts
6. Edit/approve posts
7. Schedule posts
8. Publish posts
9. Receive daily notifications
10. View basic post performance
```

After this workflow works reliably, development should shift toward the **AI learning loop** rather than simply adding more CRUD features.

---

# 19. Long-Term Product Vision

The ultimate product is not an AI caption generator.

It is an:

> **AI Social Media Manager for Online Merchants**

The long-term system should continuously learn:

```text
Merchant
   ↓
Products / Offers
   ↓
AI Strategy
   ↓
Content
   ↓
Publishing
   ↓
Audience Response
   ↓
Analytics
   ↓
AI Learning
   ↓
Improved Strategy
   ↓
Better Content
```

The competitive advantage should therefore come from the **merchant-specific learning loop**, not simply from having access to an LLM.

# 20. Initial Recommended Stack Summary

| Area | Recommended Technology |
|---|---|
| **Frontend Application** | Next.js (App Router) + React + TypeScript |
| **UI System** | Tailwind CSS + shadcn/ui + Lucide Icons |
| **Backend Application** | NestJS + TypeScript (Domain-Isolated Modular Monolith) |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **DB/Storage Platform** | Supabase (PostgreSQL hosting & S3 Object Storage) |
| **Authentication** | Supabase Auth or Custom JWT with Refresh Tokens |
| **AI Orchestration** | LLM API with structured output / Vercel AI SDK Core |
| **Image & Creative AI** | Vision API + Sharp / Satori dynamic templates |
| **Queue & Scheduling** | Redis + BullMQ |
| **Email Service** | Resend / Postmark + React Email |
| **Payments (International)** | Stripe (USD, recurring card subscriptions, customer portal) |
| **Payments (Bangladesh)** | SSLCommerz (BDT, bKash, Nagad, Rocket, local cards, IPN) |
| **Charts & Visuals** | Recharts |
| **Client State Management** | Zustand (Strict requirement: do NOT use React Context anywhere) |
| **Schema Validation** | Zod |
| **Testing** | Vitest + Playwright |
| **Error Monitoring** | Sentry |
| **Containers & CI/CD** | Docker + GitHub Actions |
| **Hosting** | Vercel (Frontend) + Container Cloud Platform (Backend) |

**Architecture Summary:**
- **Two Primary Applications**: `Next.js` frontend (rich merchant dashboard) and `NestJS` backend (API, workers, domain services).
- **Strict Modular Monolith**: Domains are isolated into independent modules with clean service interfaces. They run as a unified monolithic deployment initially, but can be extracted into standalone microservices whenever operational scale demands it.
- **Dual Payment Gateways**: Pluggable billing engine supporting **Stripe** for foreign customers and **SSLCommerz** for domestic Bangladesh merchants.