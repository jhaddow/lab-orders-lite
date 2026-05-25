import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

const LAB_TESTS = [
  { code: "CBC",    name: "Complete Blood Count",        priceCents: 4500, turnaroundDays: 1 },
  { code: "BMP",    name: "Basic Metabolic Panel",       priceCents: 5200, turnaroundDays: 1 },
  { code: "LIPID",  name: "Lipid Panel",                 priceCents: 6800, turnaroundDays: 2 },
  { code: "TSH",    name: "Thyroid Stimulating Hormone", priceCents: 7500, turnaroundDays: 3 },
];

beforeEach(async () => {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.labTest.deleteMany(),
    ...LAB_TESTS.map((t) => prisma.labTest.create({ data: t })),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
