/**
 * Docker/배포 기본 설정 — import 없음 (standalone 런타임에서 prisma CLI가 config를 로드할 때 필요).
 * 로컬 migrate dev: npm run db:migrate (prisma.config.local.ts 사용)
 * Prisma는 프로젝트 루트의 .env도 자동 로드합니다.
 */
export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
