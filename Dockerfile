# Backend Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and build dependencies
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Compile seed file for production
RUN npx tsc prisma/seed.ts --outDir dist/prisma --moduleResolution node --esModuleInterop --resolveJsonModule --skipLibCheck

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma and curl for healthcheck
RUN apk add --no-cache openssl curl

COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm ci --only=production

# Copy built files, seed script, and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
