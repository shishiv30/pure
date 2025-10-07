FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (including .env file)
COPY . .

# Expose ports
EXPOSE 3000 8080

# Run build:dev command
CMD ["npm", "run", "build:dev"]