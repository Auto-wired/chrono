FROM node:20-alpine AS base

# 1. Dependencies (의존성 설치 단계)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2. Build (빌드 단계)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# 💡 넥스트 빌드 봇이 프리즈마를 실행할 때 "나 DB 주소 있으니까 헛짓마"라고 속이는 마법의 한 줄
#ENV DATABASE_URL="mysql://root:mock@localhost:3306/chrono_mock"

RUN npx prisma generate
RUN npm run build

# 3. Runner (최종 실행 환경)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 정적 파일들은 원래 기본 위치인 /app에 그대로 복사합니다.
COPY --from=builder /app/public ./public

# 💡 [핵심 변경 구간]
# 프리즈마가 기본 경로를 찾기 쉽도록 작업 디렉토리를 standalone 폴더 내부로 이동합니다.
WORKDIR /app/.next/standalone

# standalone 빌드 결과물과 static 파일들을 새 작업 디렉토리에 맞게 복사합니다.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 이제 현재 위치(./)에 prisma 폴더를 꽂아두면 프리즈마가 인자 없이도 찰떡같이 스키마를 찾아냅니다.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 현재 디렉토리가 standalone 안쪽이므로 바로 server.js를 안정적으로 구동합니다.
CMD ["node", "server.js"]