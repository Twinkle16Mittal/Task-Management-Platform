# ── Frontend Dockerfile (multi-stage) ───────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# When running in Docker the frontend is served via nginx proxy,
# so /api/* requests go to the same host (no need for full URL).
ENV VITE_API_URL=""

RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
