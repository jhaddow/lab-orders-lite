import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { SEED_LAB_TESTS } from "@/features/lab-tests/seed-data";
import { SEED_USERS } from "../../prisma/seed-users";

beforeEach(async () => {
  // Order matters: children before parents. Lab tests are reseeded with one
  // initial Price record each (the catalog invariant). Tests that want to
  // exercise price-versioning call setLabTestPrice to append more.
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.price.deleteMany(),
    prisma.labTest.deleteMany(),
    prisma.user.deleteMany(),
    ...SEED_USERS.map((u) =>
      prisma.user.create({
        data: { name: u.name, email: u.email, role: u.role },
      }),
    ),
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

/** Test helper: fetch the seeded admin or clinician for tests that need an actor. */
export async function getSeedAdmin() {
  const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!user) throw new Error("No seeded ADMIN user found");
  return user;
}

export async function getSeedClinician() {
  const user = await prisma.user.findFirst({ where: { role: "CLINICIAN" } });
  if (!user) throw new Error("No seeded CLINICIAN user found");
  return user;
}
