# Base image for Next.js production build
FROM node:20-alpine AS base

# 1. Install dependencies stage
FROM base AS deps
WORKDIR /app

# npm 환경이므로 package.json과 package-lock.json을 복사합니다.
COPY package.json package-lock.jso[n] ./

# package-lock.json이 있으면 엄격 모드(ci)로, 없으면 일반 install로 유연하게 처리
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# 2. Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# Prisma 클라이언트 생성 및 Next.js 애플리케이션 빌드
RUN npx prisma generate
RUN npm run build

# 3. Production image stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Next.js 캐싱을 위한 올바른 권한 설정
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