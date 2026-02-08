FROM node:25.6-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (including .env file)
COPY . .

EXPOSE 3000 8080

# Development: build and run dev server
FROM base AS development
CMD ["npm", "run", "build:dev"]

# Production: build assets at image build time, then run server
FROM base AS production
RUN npm run build:prod
CMD ["npm", "run", "start"]
