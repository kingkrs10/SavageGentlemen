# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# Stage 1: Build Frontend (Vite) and Backend (esbuild)
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies needed for node-gyp / native bindings if any
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code and config
COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.ts components.json ./
COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# Build Vite SPA (to dist/public) and server (to dist/index.js)
RUN npm run build

# Prune devDependencies for clean runtime
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────
# Stage 2: Production Runtime
# ─────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install system dependencies:
# - ffmpeg / ffprobe for Island Lyric & Ad Video generators
# - fonts-dejavu-core for ffmpeg drawtext filter (text-on-video)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled bundles
COPY --from=builder /app/dist ./dist

# Copy static assets and sub-apps
COPY client/public/ ./client/public/
COPY samples/ ./samples/

# Create uploads directory (will be mapped to a persistent volume)
RUN mkdir -p /app/uploads/videos /app/uploads/mixes /app/uploads/lyric-videos

EXPOSE 5000

CMD ["node", "dist/index.js"]
