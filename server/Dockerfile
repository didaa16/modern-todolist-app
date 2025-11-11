# Multi-stage build for Node.js server
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create data directory for persistence
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "index.js"]