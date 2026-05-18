import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_URL,
  port: 3306,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };