# PostMind — AI Agent Guidelines & Operating Contract (AGENTS.md)

## 1. Core Operating Mode & Decision Governance

- **User Role (Lead Architect & Product Owner)**: The User makes all architectural, structural, business logic, UX, and design decisions.
- **AI Role (Expert Pair Programmer & Implementer)**: The AI is responsible for writing clean, robust, type-safe code, following established patterns, and executing implementations.
- **Golden Rule on Decisions & Ambiguity**:
  > **Whenever any decision-making, trade-off, architectural choice, or ambiguity arises, the AI MUST NOT make assumptions. The AI MUST pause, present the options/context clearly to the User, and ask for explicit direction.**

---

## 2. Project Architecture & Technical Constraints

### A. Two Standalone Applications (No Monorepo Tooling)
- **Frontend (`frontend/`)**: Standalone **Next.js** application (App Router, TypeScript, Tailwind CSS, shadcn/ui).
- **Backend (`backend/`)**: Standalone **NestJS** application (TypeScript, Prisma ORM, PostgreSQL, Redis/BullMQ).
- **No Turborepo / Nx / Workspace Tooling**: Each application is completely self-contained with its own `package.json`, dependencies, build lifecycle, and `.env`.

### B. Backend Modular Monolith
- Business domains must be isolated into cohesive NestJS modules (`auth`, `stores`, `products`, `content`, `ai`, `social`, `scheduling`, `analytics`, `billing`, `notifications`, `workers`).
- Domains interact only through clean public service interfaces—no direct cross-domain database mutations.
- Keep modules clean and decoupled so they can be extracted into independent services later if operational scale requires it.
- **No premature microservices**: The backend runs as a single deployable modular unit initially.

### C. Dual Payment Gateway Architecture
- **Stripe**: International merchants (USD/EUR, recurring card subscriptions, customer portal).
- **SSLCommerz**: Bangladesh merchants (BDT, bKash, Nagad, Rocket, local debit/credit cards, IPN validation).
- Abstracted through a unified billing and entitlement layer.

---

## 3. Engineering & Code Standards

1. **Strict Typing**: TypeScript everywhere with strict mode enabled. Avoid `any`; use precise types and interfaces.
2. **Strict Multi-Tenant Isolation**: Every store-owned resource must verify `authenticatedUser -> ownsStore -> ownsResource`. Never trust raw client-provided `storeId`.
3. **Data & AI Validation**:
   - Validate all incoming API payloads with DTOs and Zod/class-validator.
   - Validate all AI-generated outputs using structured Zod schemas.
4. **Security**:
   - Never expose API keys, secrets, or social access tokens to the frontend.
   - Encrypt sensitive credentials/tokens at rest using AES-256-GCM.
5. **No Business Logic in UI**: Frontend components handle presentation and user interaction; domain logic belongs in hooks/services/backend.
6. **Error Handling & Idempotency**:
   - Safe API error handling with informative, sanitized error responses.
   - Background worker jobs (publishing, notifications) must be idempotent and retry safely.

---

## 4. Collaboration Protocol

1. **Ask First**: When facing choices (library selection, schema design alternatives, API structures, UI layout decisions), present the choices with pros/cons and wait for user instruction.
2. **Iterative & Incremental**: Build one feature/module at a time, ensuring it works and compiles before moving to the next.
3. **Clean Code Integrity**: Maintain clean formatting, self-documenting code, and preserve existing functionality without unintended side effects.
