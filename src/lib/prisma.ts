import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const db = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: db.hostname,
  port: Number(db.port),
  user: db.username,
  password: db.password,
  database: db.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };