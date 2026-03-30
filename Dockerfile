# ============================================
# LOOM — Multi-stage Docker Build
# ============================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build server and client
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built server
COPY --from=builder /app/packages/server/dist packages/server/dist

# Copy built client (served as static files)
COPY --from=builder /app/packages/client/dist packages/client/dist

# Copy necessary configs
COPY packages/server/tsconfig.json packages/server/

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start server (which also serves client static files in production)
CMD ["node", "packages/server/dist/index.js"]
