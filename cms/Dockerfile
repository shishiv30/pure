FROM node:25.6-alpine AS base

# Upgrade Alpine packages
RUN apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3003

# Development stage
FROM base AS development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
CMD ["npm", "run", "start"]
