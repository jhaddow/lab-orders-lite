import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { SEED_LAB_TESTS } from "../features/lab-tests/seed-data";
import { SEED_USERS } from "./seed-users";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { name: u.name, email: u.email, role: u.role },
    });
  }

  for (const t of SEED_LAB_TESTS) {
    // Upsert the LabTest, then ensure it has at least one Price.
    // Re-seeding is idempotent for the LabTest row; if a Price already exists
    // we leave history alone (don't append duplicates on every reseed).
    const labTest = await prisma.labTest.upsert({
      where: { code: t.code },
      update: { name: t.name, turnaroundDays: t.turnaroundDays },
      create: { code: t.code, name: t.name, turnaroundDays: t.turnaroundDays },
    });

    const existingPriceCount = await prisma.price.count({
      where: { labTestId: labTest.id },
    });
    if (existingPriceCount === 0) {
      await prisma.price.create({
        data: {
          labTestId: labTest.id,
          priceCents: t.initialPriceCents,
          currency: t.initialCurrency,
        },
      });
    }
  }
  console.log(`Seeded ${SEED_USERS.length} users and ${SEED_LAB_TESTS.length} lab tests.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
