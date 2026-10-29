FROM node:20-slim

WORKDIR /app

# Install required system packages and enable pnpm
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy Prisma configuration and schemas
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma client
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Copy application source & config
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build application
RUN pnpm run build

# Create non-root user and runtime directories
RUN mkdir -p /app/uploads /app/temp /app/logs && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --shell /bin/sh nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]