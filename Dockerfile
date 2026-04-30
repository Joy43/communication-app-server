FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy Prisma configuration
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma client
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Copy application source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build application
RUN npm run build

# Create user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --shell /bin/sh nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]