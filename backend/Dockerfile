# -------------------------------------------------------------
# Stage 1: Build the NestJS application and Prisma Client
# -------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Install openssl for Prisma engine generation
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package definitions and prisma schema first for aggressive Docker caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with npm
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code and configurations
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Build NestJS production distribution into /dist
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --production

# -------------------------------------------------------------
# Stage 2: Minimal Production Runner Image
# -------------------------------------------------------------
FROM node:22-slim AS runner

WORKDIR /app

# Install openssl required for Prisma runtime queries
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

# Copy production node_modules (which includes the generated Prisma client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Use built-in unprivileged node user for security
USER node

EXPOSE 5000

CMD ["node", "dist/main.js"]
