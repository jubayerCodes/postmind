<div align="center">

# 🧠 PostMind

### AI-Powered Social Media Manager & Automation SaaS for Online Merchants

[![Live Demo](https://img.shields.io/badge/Demo-postmind--psi.vercel.app-blue?style=for-the-badge&logo=vercel)](https://postmind-psi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

<p align="center">
  <b>"The merchant provides the products. AI manages the social content."</b>
</p>

[Live Application](https://postmind-psi.vercel.app) • [Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Architecture](#-system-architecture) • [Environment Variables](#-environment-variable-guidelines) • [Local Setup](#-getting-started) • [Docker Setup](#-docker-setup)

---

</div>

## 📌 Overview

**PostMind** is a production-grade, multi-tenant SaaS platform built for small-to-medium e-commerce merchants and online stores who struggle to maintain a consistent, high-converting social media marketing presence.

Instead of spending hours writing captions, brainstorming hashtags, designing creatives, and manually posting across social networks, merchants simply add or import their product catalog. PostMind's AI suite automatically parses product attributes, writes targeted marketing copy across multiple tones, generates engaging creatives, schedules posts onto a visual calendar, publishes directly to Meta (Facebook Pages & Instagram), and syncs real-time engagement analytics.

---

## ✨ Key Features

### 🏢 Multi-Tenant Workspaces
- Isolated workspace environments per store with strict multi-tenant authorization (`authenticatedUser -> ownsStore -> ownsResource`).
- Customized store currency (`BDT`, `USD`, etc.), timezones (`Asia/Dhaka`, etc.), and brand preferences.

### 📦 Product Catalog Management & Ingestion
- Full catalog CRUD with pricing, stock levels, categories, tags, features, and discount flags.
- **AI Document & Catalog Parser**: Upload product catalogs or documents (PDF, Excel, text) to automatically extract, structure, and ingest product inventories using LLM extraction validated against Zod schemas.

### ✍️ Intelligent AI Content Studio
- Generates high-converting social media posts based on single or bundled products.
- **4 Distinct Post Types**: *Product Showcase*, *Special Offer*, *Community Engagement*, and *Behind-the-Scenes Story*.
- **4 Brand Tones**: *Natural*, *Witty*, *Promo*, and *Storytelling*.
- Complete merchant control: Instant regenerate, granular edit, save drafts, or one-click approval.

### 🎨 AI Creative & Image Generation
- Integrated AI image generation powered by **Cloudflare Workers AI** (Stable Diffusion / FLUX) and **Google Gemini** for instant high-definition promotional banners and product marketing creatives.

### 📱 Native Meta & Social Integration
- Direct OAuth 2.0 integration with **Facebook Pages** and **Instagram Business**.
- AES-256-GCM encrypted token storage at rest for social platform credentials.
- Instant publishing or scheduled queue delivery directly to live Facebook pages.

### 🗓️ Visual Calendar & Automated Scheduling
- Drag-and-drop interactive social media calendar.
- Automated background worker utilizing NestJS cron jobs with idempotent execution and retry safety.
- Dynamic post scheduling based on recommended peak audience engagement hours.

### 📊 Real-Time Analytics & Metrics Sync
- Synchronizes post performance (likes, comments, shares, reach) from connected social channels.
- Helps merchants understand what creative formats and copy perform best.

### 🌓 Modern, Accessible UI/UX
- Built with **Next.js 16 App Router**, **React 19**, and **Tailwind CSS v4**.
- Fast client-side state management powered exclusively by **Zustand**.
- Seamless Dark/Light mode theme toggle and custom brand color theming.

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) | Server-side rendering, client routing, and API proxy layer |
| **Styling & Icons** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) | Responsive utility-first styling and iconography |
| **Frontend State** | [Zustand](https://github.com/pmndrs/zustand), [TanStack React Query](https://tanstack.com/query) | Client-side reactive stores and server-state caching |
| **Backend Framework** | [NestJS 11](https://nestjs.com/) | Enterprise-grade modular monolith REST API |
| **Language & Typing** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict end-to-end typing across frontend and backend |
| **Database & ORM** | [Neon Serverless PostgreSQL](https://neon.tech/), [Prisma ORM 6](https://www.prisma.io/) | Relational database with pooled connection strings and typed migrations |
| **Auth & Object Storage** | [Supabase](https://supabase.com/) | Authentication (JWT validation), user profiles, and image asset storage |
| **AI Providers** | [Google Gemini](https://ai.google.dev/), [AgentRouter](https://agentrouter.org/) (`glm-5.3`) | Copywriting, content ideation, document catalog extraction |
| **Image Generation** | [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) | Serverless promotional creative generation |
| **Social API** | [Meta Graph API](https://developers.facebook.com/) | Facebook Pages & Instagram OAuth and publishing |
| **Security** | `crypto` (AES-256-GCM) | Encrypting sensitive access tokens at rest |
| **Containers & DevOps** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/) | Containerized multi-service development and deployment |

---

## 🏛️ System Architecture

PostMind is structured as **two standalone applications** (Frontend & Backend) without monorepo tooling complexities, ensuring clean decoupling and independent deployment lifecycles.

```text
                               ┌────────────────────────────────────────┐
                               │           Client Browser               │
                               └──────────────────┬─────────────────────┘
                                                  │
                                                  ▼
                       ┌────────────────────────────────────────────────────────┐
                       │             Next.js 16 Frontend (Port 3000)            │
                       │   App Router · Zustand Stores · Tailwind CSS v4        │
                       └──────────────────┬───────────────────┬─────────────────┘
                                          │                   │
                  Client Auth (JWT)       │                   │ Internal API Proxy
                                          ▼                   ▼ (/api/backend/*)
                 ┌─────────────────────────────┐    ┌───────────────────────────────────┐
                 │       Supabase Auth         │    │   NestJS 11 Backend (Port 5000)   │
                 └─────────────────────────────┘    │   Modular Monolith Architecture   │
                                                    └─┬───────┬───────┬───────┬───────┬─┘
                                                      │       │       │       │       │
             ┌────────────────────────────────────────┘       │       │       │       └───────────────────────────┐
             ▼                                                ▼       ▼       ▼                                   ▼
┌─────────────────────────┐                     ┌──────────────────┐ ┌──────────────────────┐           ┌───────────────────┐
│     Neon PostgreSQL     │                     │  AgentRouter /   │ │ Cloudflare Workers AI│           │  Meta Graph API   │
│   (Prisma ORM Layer)    │                     │  Google Gemini   │ │ (Image Generation)   │           │ (Pages/Instagram) │
└─────────────────────────┘                     └──────────────────┘ └──────────────────────┘           └───────────────────┘
```

### Backend Domain Modules (`backend/src/`)
- `auth/`: Supabase JWT authentication strategy, user provisioning, and authorization guards.
- `stores/`: Multi-tenant workspace management, slug resolution, and store configuration.
- `products/`: Product catalog management, inventory tracking, and category filtering.
- `content/`: Social content generation records, drafts, approvals, and content products.
- `ai/`: AI copywriting generator, document parser (PDF/Excel), and image generation services.
- `social/`: Meta Graph API integration, OAuth exchange, and AES-256 token encryption.
- `scheduling/`: Calendar scheduling query endpoints and automated publishing cron worker.
- `storage/`: Supabase object storage service for media assets and product images.

---

## 📁 Repository Structure

```text
PostMind/
├── backend/                       # NestJS Standalone API
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (Neon PostgreSQL)
│   │   └── migrations/            # SQL migration history
│   ├── src/
│   │   ├── ai/                    # Copywriting, document parsing, AI image generation
│   │   ├── auth/                  # Supabase JWT authentication & user sync
│   │   ├── common/                # Filters, interceptors, encryption utilities
│   │   ├── content/               # Social content domain
│   │   ├── products/              # Product catalog domain
│   │   ├── scheduling/            # Calendar & background cron workers
│   │   ├── social/                # Meta Graph API integration & publishing
│   │   ├── storage/               # Supabase storage service
│   │   ├── stores/                # Store/Workspace multi-tenant domain
│   │   ├── users/                 # User profiles
│   │   ├── app.module.ts          # Main application module
│   │   └── main.ts                # Application entrypoint & CORS configuration
│   ├── Dockerfile                 # Production backend Docker container
│   ├── Dockerfile.dev             # Development backend container
│   ├── package.json
│   └── .env.example               # Backend environment template
│
├── frontend/                      # Next.js 16 Standalone Web App
│   ├── public/                    # Static assets & brand graphics
│   ├── src/
│   │   ├── app/                   # Next.js App Router (pages & API proxy)
│   │   │   ├── api/backend/       # Server-side reverse proxy to backend
│   │   │   ├── calendar/          # Scheduling calendar view
│   │   │   ├── products/          # Product catalog & bulk import UI
│   │   │   ├── settings/          # Store settings & integrations
│   │   │   ├── stories/           # Content studio & social feed
│   │   │   ├── login/ & signup/   # Supabase authentication screens
│   │   │   └── page.tsx           # Dashboard overview
│   │   ├── components/            # UI components (navigation, modals, dialogs)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # API client, Supabase client, utilities
│   │   └── stores/                # Zustand client state stores
│   ├── Dockerfile                 # Production frontend Docker container
│   ├── Dockerfile.dev             # Development frontend container
│   ├── package.json
│   └── .env.example               # Frontend environment template
│
├── docker-compose.yml             # Local multi-service orchestration
└── README.md
```

---

## 🔐 Environment Variable Guidelines

Both `backend` and `frontend` require their own environment configuration files. Copy the example templates to begin:

```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env.local
```

### 1. Backend (`backend/.env`)

| Variable | Required | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port on which the NestJS API listens |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development` or `production`) |
| `FRONTEND_URL` | **Yes** | `http://localhost:3000` | Frontend origin permitted by CORS |
| `DATABASE_URL` | **Yes** | `postgresql://...-pooler.neon.tech/neondb` | Neon pooled connection string for runtime queries |
| `DIRECT_URL` | **Yes** | `postgresql://....neon.tech/neondb` | Neon direct connection string for Prisma migrations |
| `SUPABASE_URL` | **Yes** | `https://xyz.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | `eyJhbGci...` | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | `eyJhbGci...` | Supabase administrative service role key |
| `SUPABASE_JWT_SECRET` | **Yes** | `your-jwt-secret` | Supabase JWT secret used to verify incoming user bearer tokens |
| `APP_ENCRYPTION_KEY` | **Yes** | `64-character hex string` | 32-byte hex key for AES-256-GCM encryption of social access tokens |
| `AGENTROUTER_API_KEY` | Optional | `sk-...` | AgentRouter / OpenAI API key for copywriting & document parsing |
| `AI_BASE_URL` | Optional | `https://agentrouter.org/v1` | Custom AI API endpoint |
| `AI_MODEL` | Optional | `glm-5.3` | Model identifier for text generation |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Google Gemini API key for multimodal operations |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | `your-account-id` | Cloudflare account ID for Workers AI image generation |
| `CLOUDFLARE_API_TOKEN` | Optional | `cfat_...` | Cloudflare API token with Workers AI permissions |
| `META_APP_ID` | Optional | `your-app-id` | Meta / Facebook Developer App ID |
| `META_APP_SECRET` | Optional | `your-app-secret` | Meta / Facebook Developer App Secret |
| `META_REDIRECT_URI` | Optional | `http://localhost:5000/auth/callback/facebook` | Meta OAuth callback redirect URI |

> [!TIP]
> **Generating the Encryption Key**: You can generate a cryptographically secure 32-byte hex key for `APP_ENCRYPTION_KEY` by running:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 2. Frontend (`frontend/.env.local`)

| Variable | Required | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `/api/backend` | Relative path for Next.js proxy route or direct backend URL |
| `BACKEND_INTERNAL_URL` | **Yes** | `http://localhost:5000` | Target URL used by the server-side proxy route to reach NestJS |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://xyz.supabase.co` | Supabase project URL for client-side authentication |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGci...` | Supabase public anonymous key |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- A [PostgreSQL](https://www.postgresql.org/) database or free [Neon DB](https://neon.tech/) instance
- A [Supabase](https://supabase.com/) project (Authentication & Storage)
- *(Optional)* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### Method A: Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/jubayerCodes/postmind.git
cd postmind
```

#### 2. Configure Backend
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Neon DB and Supabase credentials

# Generate Prisma Client & apply database migrations
npm run prisma:generate
npm run prisma:migrate

# Start the NestJS backend in development watch mode
npm run start:dev
```
The backend will boot up at **`http://localhost:5000`**.

#### 3. Configure Frontend (in a new terminal)
```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the Next.js frontend in development mode
npm run dev
```
Open **`http://localhost:3000`** in your browser to access PostMind.

---

### Method B: Docker Setup

You can run both the NestJS backend and Next.js frontend simultaneously inside Docker containers:

```bash
# From the project root
docker compose up --build
```

- **Frontend**: Available at `http://localhost:3000`
- **Backend API**: Available at `http://localhost:5000`
- Source code directories are volume-mounted for live code reloading.

To run in detached background mode:
```bash
docker compose up -d
```

To stop containers:
```bash
docker compose down
```

---

## 🌐 Meta / Facebook OAuth Local Testing

To test Facebook Page connection and Meta OAuth locally, Meta requires HTTPS redirect URIs:

1. Start your local backend on port `5000`.
2. Start an HTTPS tunnel via ngrok or untun:
   ```bash
   cd backend
   npm run tunnel:cf     # Using Cloudflare untun tunnel
   # OR
   npm run tunnel        # Using ngrok
   ```
3. Update `META_REDIRECT_URI` in `backend/.env` with your tunnel URL (e.g. `https://your-tunnel.ngrok-free.app/auth/callback/facebook`).
4. Add the same redirect URL to your **Meta App Dashboard** under **Facebook Login → Settings → Valid OAuth Redirect URIs**.

---

## 🗄️ Database Management with Prisma

The backend includes convenient Prisma scripts:

```bash
cd backend

# Run pending database migrations
npm run prisma:migrate

# Regenerate Prisma Client types after schema modifications
npm run prisma:generate

# Open interactive visual Prisma database GUI
npm run prisma:studio
```

---

## 📋 Available NPM Scripts

### Backend (`backend/`)
| Command | Description |
| :--- | :--- |
| `npm run start:dev` | Starts NestJS API with hot-reload watch mode |
| `npm run build` | Compiles TypeScript code to `dist/` |
| `npm run start:prod` | Runs compiled production server |
| `npm run prisma:migrate` | Applies Prisma migrations to the database |
| `npm run prisma:generate`| Generates Prisma ORM client |
| `npm run prisma:studio` | Launches Prisma Studio database browser on port 5555 |
| `npm run tunnel` | Starts an ngrok HTTP tunnel to port 5000 |
| `npm run tunnel:cf` | Starts a Cloudflare tunnel to port 5000 |

### Frontend (`frontend/`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Next.js dev server with Turbopack on port 3000 |
| `npm run build` | Builds optimized Next.js production bundle |
| `npm run start` | Runs Next.js production server |
| `npm run lint` | Runs ESLint analysis across the frontend codebase |
| `npm run tunnel` | Starts an ngrok HTTP tunnel to port 3000 |

---

## 🛡️ Security & Multi-Tenancy

- **Strict Multi-Tenant Verification**: All endpoints requiring a store resource explicitly enforce `userId -> ownsStore -> ownsResource` relationship checks. No user can access or modify another merchant's catalog or social assets.
- **AES-256-GCM Token Encryption**: Long-lived social access tokens for Facebook Pages are encrypted using an initialization vector (IV) and authenticated tag before storage in PostgreSQL.
- **Input Validation**: All inbound network payloads pass through class-validator DTOs and Zod schemas with strict stripping of non-whitelisted attributes.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "feat: add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/jubayerCodes">Jubayer Codes</a></sub>
</div>
