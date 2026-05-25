import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { SEED_LAB_TESTS } from "@/features/lab-tests/seed-data";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.labTest.deleteMany(),
    ...SEED_LAB_TESTS.map((t) => prisma.labTest.create({ data: t })),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
