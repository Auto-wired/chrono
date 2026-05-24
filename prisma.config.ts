// local npx prisma migrate dev용
// import "dotenv/config";
// import { defineConfig } from '@prisma/config';

// export default defineConfig({
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//   },
//   datasource: {
//     url: process.env.DATABASE_URL,
//   },
// });
// 배포용
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
