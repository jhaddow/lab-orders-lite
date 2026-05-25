import { prisma } from "@/lib/prisma";

export function getLabTests() {
  return prisma.labTest.findMany({ orderBy: { name: "asc" } });
}
