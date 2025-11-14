# ============================================
# Multi-stage Dockerfile for WealthFlow
# Single Image: Frontend + Backend
# Optimized for Google Cloud Run
# ============================================

# ============================================
# STAGE 1: Build React Frontend
# ============================================
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY client/ ./

# Build frontend (creates /app/client/dist)
RUN npm run build

# ============================================
# STAGE 2: Build Backend
# ============================================
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy backend source
COPY server/ ./server/
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npx tsc --project tsconfig.json

# ============================================
# STAGE 3: Production Image
# ============================================
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled backend from builder
COPY --from=backend-builder /app/server ./server

# Copy built frontend from builder
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy additional necessary files
COPY tsconfig.json ./

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/auth/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/app/data/database.db

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server/server.js"]

