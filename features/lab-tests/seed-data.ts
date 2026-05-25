export type SeedLabTest = {
  code: string;
  name: string;
  priceCents: number;
  turnaroundDays: number;
};

/**
 * Canonical lab-test catalog seeded into both production (via `pnpm db:seed`)
 * and the integration test database (via `tests/integration/setup.ts`).
 * Keeping a single source prevents test/prod drift.
 */
export const SEED_LAB_TESTS: readonly SeedLabTest[] = [
  { code: "CBC",   name: "Complete Blood Count",        priceCents: 4500, turnaroundDays: 1 },
  { code: "BMP",   name: "Basic Metabolic Panel",       priceCents: 5200, turnaroundDays: 1 },
  { code: "LIPID", name: "Lipid Panel",                 priceCents: 6800, turnaroundDays: 2 },
  { code: "TSH",   name: "Thyroid Stimulating Hormone", priceCents: 7500, turnaroundDays: 3 },
  { code: "HBA1C", name: "Hemoglobin A1c",              priceCents: 5500, turnaroundDays: 2 },
  { code: "UA",    name: "Urinalysis",                  priceCents: 3200, turnaroundDays: 1 },
];
