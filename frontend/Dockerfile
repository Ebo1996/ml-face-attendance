# ========================================
# Frontend Dockerfile - React + Vite (Multi-stage build)
# ========================================

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time env vars for Vite (baked into the bundle at build time)
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copy package files
COPY package*.json ./

# Install dependencies (uses package-lock.json for reproducible builds)
RUN npm ci --silent

# Copy source files
COPY . .

# Build the production bundle (tsc + vite build)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
