import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const LAB_TESTS = [
  { code: "CBC",    name: "Complete Blood Count",        priceCents: 4500, turnaroundDays: 1 },
  { code: "BMP",    name: "Basic Metabolic Panel",       priceCents: 5200, turnaroundDays: 1 },
  { code: "LIPID",  name: "Lipid Panel",                 priceCents: 6800, turnaroundDays: 2 },
  { code: "TSH",    name: "Thyroid Stimulating Hormone", priceCents: 7500, turnaroundDays: 3 },
  { code: "HBA1C",  name: "Hemoglobin A1c",              priceCents: 5500, turnaroundDays: 2 },
  { code: "UA",     name: "Urinalysis",                  priceCents: 3200, turnaroundDays: 1 },
];

async function main() {
  for (const test of LAB_TESTS) {
    await prisma.labTest.upsert({
      where: { code: test.code },
      update: test,
      create: test,
    });
  }
  console.log(`Seeded ${LAB_TESTS.length} lab tests.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
