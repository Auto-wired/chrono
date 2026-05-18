# Base image for Next.js production build
FROM node:20-alpine AS base

# 1. Install dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.jso[n] ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2. Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# Prisma 클라이언트 생성
RUN npx prisma generate

# 💡 [여기에 추가] 깃허브 가상 컴퓨터가 빌드할 때 DB가 없어도 튕기지 않도록 방어벽을 칩니다.
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# 애플리케이션 빌드
RUN npm run build

# 3. Production image stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]