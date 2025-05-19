# Build stage
FROM oven/bun:latest AS builder
WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy only what's needed for dependencies
COPY package.json tsconfig.json ./
COPY prisma ./prisma

# Install dependencies
RUN bun pm cache rm --all
RUN bun install

# Copy and build application
COPY . .
RUN bun run build
RUN bun run db:generate

# Production stage
FROM oven/bun:latest
WORKDIR /app

# Install only required runtime dependencies
RUN apt-get update -y && apt-get install -y openssl

# Copy only what's needed to run the application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Expose the port
EXPOSE 3015

# Start command
CMD ["bun", "run", "start"]
