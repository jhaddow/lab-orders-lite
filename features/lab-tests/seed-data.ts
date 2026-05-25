export type SeedLabTest = {
  code: string;
  name: string;
  turnaroundDays: number;
  initialPriceCents: number;
  initialCurrency: string;
};

/**
 * Canonical lab-test catalog seeded into both production (via `pnpm db:seed`)
 * and the integration test database (via `tests/integration/setup.ts`).
 * Each entry seeds one LabTest plus an initial Price record — every lab test
 * must always have at least one Price to be orderable.
 */
export const SEED_LAB_TESTS: readonly SeedLabTest[] = [
  { code: "CBC",   name: "Complete Blood Count",        turnaroundDays: 1, initialPriceCents: 4500, initialCurrency: "USD" },
  { code: "BMP",   name: "Basic Metabolic Panel",       turnaroundDays: 1, initialPriceCents: 5200, initialCurrency: "USD" },
  { code: "LIPID", name: "Lipid Panel",                 turnaroundDays: 2, initialPriceCents: 6800, initialCurrency: "USD" },
  { code: "TSH",   name: "Thyroid Stimulating Hormone", turnaroundDays: 3, initialPriceCents: 7500, initialCurrency: "USD" },
  { code: "HBA1C", name: "Hemoglobin A1c",              turnaroundDays: 2, initialPriceCents: 5500, initialCurrency: "USD" },
  { code: "UA",    name: "Urinalysis",                  turnaroundDays: 1, initialPriceCents: 3200, initialCurrency: "USD" },
];
