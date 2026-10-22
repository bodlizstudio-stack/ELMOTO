import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function databaseUrl() {
  const target = "/tmp/elmoto.db";
  if (!fs.existsSync(target)) {
    fs.copyFileSync(path.join(process.cwd(), "prisma", "catalog.db"), target);
  }
  return `file:${target}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(process.env.VERCEL ? { datasourceUrl: databaseUrl() } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
