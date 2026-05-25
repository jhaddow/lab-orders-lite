import { prisma } from "@/lib/prisma";

export function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
