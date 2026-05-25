import 'dotenv/config';
import { defineConfig } from '@prisma/config';

/** 로컬 CLI 전용 (npx prisma migrate dev 등). Docker/배포는 prisma.config.ts 사용 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
