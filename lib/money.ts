/**
 * Supported currency codes. v1 ships USD only; widen this union to add more
 * (the schema and seed data are already multi-currency-shaped).
 */
export type CurrencyCode = "USD";

const SUPPORTED: ReadonlySet<CurrencyCode> = new Set(["USD"]);

/** Narrow a runtime string (e.g. from Prisma) to a CurrencyCode, or throw. */
export function asCurrency(value: string): CurrencyCode {
  if ((SUPPORTED as ReadonlySet<string>).has(value)) {
    return value as CurrencyCode;
  }
  throw new Error(`Unsupported currency: ${value}`);
}

export function formatMoney(
  cents: number,
  currency: CurrencyCode = "USD",
): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatMoney expects integer cents, got ${cents}`);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
