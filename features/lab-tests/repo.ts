import { prisma } from "@/lib/prisma";

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
 * Append a new Price record for a lab test. Prices are immutable — changing
 * a price always means creating a new record so historical orders keep
 * referencing the price that was current when they were placed.
 */
export function setLabTestPrice(
  labTestId: string,
  priceCents: number,
  currency: string = "USD",
) {
  return prisma.price.create({
    data: { labTestId, priceCents, currency },
  });
}
