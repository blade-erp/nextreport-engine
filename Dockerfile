# ============================================
# NextReport Engine — Production Dockerfile
# Multi-stage build: deps → build → runner
# ============================================
# Base: Debian slim (NOT Alpine) — required for Puppeteer/Chromium
# Usage:
#   docker build -t nextreport-engine .
#   docker run -p 3000:3000 nextreport-engine

ARG NODE_VERSION=24-slim

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable pnpm

# Copy workspace config + all package.json files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schema/package.json ./packages/schema/
COPY packages/engine-core/package.json ./packages/engine-core/
COPY packages/renderer-html/package.json ./packages/renderer-html/
COPY packages/renderer-pdf/package.json ./packages/renderer-pdf/
COPY packages/canvas/package.json ./packages/canvas/
COPY packages/ui-designer/package.json ./packages/ui-designer/
COPY packages/ui-viewer/package.json ./packages/ui-viewer/
COPY packages/nextreport-engine/package.json ./packages/nextreport-engine/
COPY apps/web/package.json ./apps/web/

# Install all dependencies with frozen lockfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build application
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

RUN corepack enable pnpm

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/schema/node_modules ./packages/schema/node_modules
COPY --from=deps /app/packages/engine-core/node_modules ./packages/engine-core/node_modules
COPY --from=deps /app/packages/renderer-html/node_modules ./packages/renderer-html/node_modules
COPY --from=deps /app/packages/renderer-pdf/node_modules ./packages/renderer-pdf/node_modules
COPY --from=deps /app/packages/canvas/node_modules ./packages/canvas/node_modules
COPY --from=deps /app/packages/ui-designer/node_modules ./packages/ui-designer/node_modules
COPY --from=deps /app/packages/ui-viewer/node_modules ./packages/ui-viewer/node_modules
COPY --from=deps /app/packages/nextreport-engine/node_modules ./packages/nextreport-engine/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy all source code
COPY . .

# Build all packages + Next.js app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Install Chromium and fonts for Puppeteer PDF rendering
# chromium package pulls in all required dependencies automatically
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create non-root user
RUN groupadd --gid 1001 nextreport && \
    useradd --uid 1001 --gid nextreport --shell /bin/bash --create-home nextreport

# Copy Next.js standalone output
COPY --from=builder --chown=nextreport:nextreport /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextreport:nextreport /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets
COPY --from=builder --chown=nextreport:nextreport /app/apps/web/public ./apps/web/public

# Copy report templates
COPY --from=builder --chown=nextreport:nextreport /app/apps/web/templates ./apps/web/templates

# Set correct permissions for Next.js cache
RUN mkdir -p apps/web/.next && chown nextreport:nextreport apps/web/.next

USER nextreport

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/validate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template:{type:'report',dataSource:{type:'json'},bands:[]}})}).then(r=>{if(!r.ok)throw new Error();process.exit(0)}).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
