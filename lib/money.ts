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

export function formatMoney(cents: number, currency: CurrencyCode = "USD"): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatMoney expects integer cents, got ${cents}`);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Parse a user-entered dollar amount (e.g. "45", "45.5", "45.50") into integer
 * cents. No floating-point math — we split on the decimal and combine the
 * halves as integers, so 0.10 + 0.20 round-trips exactly. Throws on any input
 * that doesn't match `^\d+(\.\d{1,2})?$`.
 */
export function parseDollars(input: string): number {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new Error(`Invalid dollar amount: ${input}`);
  }
  const wholeStr = match[1]!;
  const fracStr = (match[2] ?? "").padEnd(2, "0");
  const whole = Number.parseInt(wholeStr, 10);
  const frac = Number.parseInt(fracStr, 10);
  return whole * 100 + frac;
}
