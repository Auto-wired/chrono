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

# 💡 [위치 수정] Prisma가 코드를 굽기 전에 "넌 무조건 백엔드 서버용이야" 라고 뇌를 개조해 줍니다.
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# 이제 올바른 엔진 모드로 클라이언트 코드가 생성됩니다.
RUN npx prisma generate
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