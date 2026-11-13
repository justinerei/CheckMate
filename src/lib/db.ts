import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { isCurrentClient } from "@/lib/prisma-client-cache";

const globalForDb = globalThis as unknown as { prisma?: PrismaClient };
export const db = isCurrentClient(globalForDb.prisma) ? globalForDb.prisma! : new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;
