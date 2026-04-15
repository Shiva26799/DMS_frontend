# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code and other necessary files
COPY . .

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy built dependencies and source from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/*.pem ./

# Expose the backend port
EXPOSE 5000

# Start command
CMD ["node", "src/server.js"]
