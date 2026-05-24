import { prisma } from "./client";

export function getLabTests() {
  return prisma.labTest.findMany({ orderBy: { name: "asc" } });
}

export function getLabTestsByIds(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return prisma.labTest.findMany({ where: { id: { in: ids } } });
}
