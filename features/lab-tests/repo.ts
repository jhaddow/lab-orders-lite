import { prisma } from "@/lib/prisma";

export type CreateLabTestInput = {
  code: string;
  name: string;
  turnaroundDays: number;
  initialPriceCents: number;
  initialCurrency?: string;
};

export class LabTestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabTestValidationError";
    Error.captureStackTrace?.(this, LabTestValidationError);
  }
}

/**
 * Returns every lab test with only its latest price attached as `prices[0]`.
 * The catalog uses this directly; orders read from here at creation time.
 */
export function getLabTests() {
  return prisma.labTest.findMany({
    orderBy: { name: "asc" },
    include: {
      prices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

/**
 * Returns one lab test with its full price history (newest first), or null.
 * Used by the admin detail page to show the audit trail.
 */
export function getLabTest(id: string) {
  return prisma.labTest.findUnique({
    where: { id },
    include: {
      prices: { orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Create a new lab test with its initial Price in a single transaction.
 * Rejects case-insensitive name duplicates and code duplicates at the
 * application layer for friendly errors; the DB has unique constraints on
 * both as a safety net.
 */
export async function createLabTest(input: CreateLabTestInput) {
  const trimmedName = input.name.trim();
  const trimmedCode = input.code.trim();

  if (input.initialPriceCents <= 0) {
    throw new LabTestValidationError("Initial price must be greater than zero");
  }
  if (input.turnaroundDays < 1) {
    throw new LabTestValidationError("Turnaround must be at least 1 day");
  }

  const existingByName = await prisma.labTest.findFirst({
    where: { name: { equals: trimmedName, mode: "insensitive" } },
  });
  if (existingByName) {
    throw new LabTestValidationError(
      `A lab test named "${existingByName.name}" already exists`,
    );
  }

  const existingByCode = await prisma.labTest.findUnique({
    where: { code: trimmedCode },
  });
  if (existingByCode) {
    throw new LabTestValidationError(
      `A lab test with code "${trimmedCode}" already exists`,
    );
  }

  return prisma.labTest.create({
    data: {
      code: trimmedCode,
      name: trimmedName,
      turnaroundDays: input.turnaroundDays,
      prices: {
        create: {
          priceCents: input.initialPriceCents,
          currency: input.initialCurrency ?? "USD",
        },
      },
    },
    include: {
      prices: { orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Append a new Price record for a lab test. Prices are immutable — changing
 * a price always means creating a new record so historical orders keep
 * referencing the price that was current when they were placed.
 *
 * Rejects no-op changes (same priceCents + currency as the current latest)
 * to keep the price-history table free of noise.
 */
export async function setLabTestPrice(
  labTestId: string,
  priceCents: number,
  currency: string = "USD",
) {
  if (priceCents <= 0) {
    throw new LabTestValidationError("Price must be greater than zero");
  }

  const latest = await prisma.price.findFirst({
    where: { labTestId },
    orderBy: { createdAt: "desc" },
  });
  if (latest && latest.priceCents === priceCents && latest.currency === currency) {
    throw new LabTestValidationError(
      "New price is the same as the current price",
    );
  }

  return prisma.price.create({
    data: { labTestId, priceCents, currency },
  });
}
