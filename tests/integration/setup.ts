import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { SEED_LAB_TESTS } from "@/features/lab-tests/seed-data";

beforeEach(async () => {
  // Order matters: children before parents. Lab tests are reseeded with one
  // initial Price record each (the catalog invariant). Tests that want to
  // exercise price-versioning call setLabTestPrice to append more.
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.price.deleteMany(),
    prisma.labTest.deleteMany(),
    ...SEED_LAB_TESTS.map((t) =>
      prisma.labTest.create({
        data: {
          code: t.code,
          name: t.name,
          turnaroundDays: t.turnaroundDays,
          prices: {
            create: {
              priceCents: t.initialPriceCents,
              currency: t.initialCurrency,
            },
          },
        },
      }),
    ),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
