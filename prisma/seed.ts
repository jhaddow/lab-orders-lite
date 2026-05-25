import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { SEED_LAB_TESTS } from "../features/lab-tests/seed-data";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  for (const test of SEED_LAB_TESTS) {
    await prisma.labTest.upsert({
      where: { code: test.code },
      update: test,
      create: test,
    });
  }
  console.log(`Seeded ${SEED_LAB_TESTS.length} lab tests.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
