---
name: nestjs-modular-patterns
description: "Guidelines and best practices for building PostMind's domain-isolated NestJS modular monolith. Defines module boundaries, service contracts, DTO validation, and service extractability rules."
---

# NestJS Modular Monolith Patterns for PostMind

## 1. Domain Boundary Architecture

Every business capability in PostMind must live in its own isolated module under `backend/src/<domain>/`:

```text
backend/src/
├── auth/                 # Authentication, JWT, sessions
├── users/                # User accounts & profiles
├── stores/               # Multi-tenant store/workspace management
├── products/             # Product catalog, categories, offers
├── content/              # Post drafts, approved posts, content state
├── ai/                   # AI generators, vision, strategist, analyst
├── social/               # Meta Provider & OAuth integrations
├── scheduling/           # Calendar & BullMQ queue dispatcher
├── analytics/            # Post metrics & engagement
├── billing/              # Stripe & SSLCommerz billing engines
├── notifications/        # Email (Resend) & transactional alerts
├── workers/              # BullMQ queue processors
└── common/               # Shared guards, decorators, PrismaService
```

## 2. Module Rules

1. **Explicit Exports**: A module must only export its public service(s). Internal helpers, repositories, and private services must stay internal.
2. **No Direct Cross-Module DB Mutations**:
   - Module A must NEVER mutate Module B's database models directly.
   - It must call Module B's exported public service or emit a domain event.
3. **DTO & Schema Validation**:
   - Every incoming request payload must be validated via `class-validator` / `class-transformer` or Zod DTOs.
   - Use strict whitelist validation (`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`).
4. **Service Extractability**:
   - Write clean, decoupled interfaces so that any heavy module (e.g., `ai`, `workers`, `billing`) can later be extracted into an independent microservice if scale requires it.
