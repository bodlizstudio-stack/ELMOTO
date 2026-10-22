import "server-only";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const user = await readSession();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

export async function audit(userId: string, action: string, entity: string, entityId = "", detail = "") {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, detail: detail.slice(0, 500) },
  });
}
