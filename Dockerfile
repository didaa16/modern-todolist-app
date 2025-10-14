# Multi-stage build for React + Node.js app
FROM node:18-alpine AS client-builder

# Set working directory for client
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy server source code
COPY server/ ./

# Copy built React app from client-builder stage
COPY --from=client-builder /app/client/build ./public

# Create data directory for persistent storage
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "index.js"]
