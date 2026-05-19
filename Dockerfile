FROM node:20-alpine AS base

# 1. Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# 💡 넥스트 빌드 봇이 프리즈마를 실행할 때 "나 DB 주소 있으니까 헛짓마"라고 속이는 마법의 한 줄
ENV DATABASE_URL="mysql://root:mock@localhost:3306/chrono_mock"

RUN npx prisma generate
RUN npm run build

# 3. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 💡 [여기에 코드가 추가되었습니다!]
# 배포본(standalone) 내부로 prisma 스키마 파일과 생성된 엔진을 강제로 심어줍니다.
# 실행 권한 오류를 방지하기 위해 소유자(nextjs:nodejs)도 함께 지정합니다.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]